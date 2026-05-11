"""
FastAPI メインアプリケーション

複数の行政書類（PDF）を受け取り、ページ画像に変換後
Gemini APIのマルチモーダル機能で入管審査官視点のリーガルチェック（リスク判定）を実行する。
"""

import logging
import os
import platform
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pdf2image import convert_from_bytes
from PIL import Image

from models.schemas import LegalCheckResponse, ErrorResponse
from services.gemini_service import legal_check_documents, configure_gemini

# ── ログ設定 ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── 環境変数読み込み ──
load_dotenv()

# 許可するファイル拡張子
ALLOWED_EXTENSIONS = {".pdf"}
# アップロードサイズ上限（50MB）
MAX_FILE_SIZE = 50 * 1024 * 1024
# PDF → 画像変換のDPI（解像度とファイルサイズのバランス）
PDF_DPI = 200
# 1ファイルあたりの最大ページ数
MAX_PAGES_PER_FILE = 30

# ── Poppler パス自動検出（Windows用） ──
def _detect_poppler_path() -> str | None:
    """
    Windows環境でPoppler binディレクトリを自動検出する。
    プロジェクト内の backend/poppler/ を優先的に探す。
    Linux/Dockerではシステムにインストール済みなのでNoneを返す。
    """
    if platform.system() != "Windows":
        return None

    # プロジェクト内の poppler を探す
    backend_dir = Path(__file__).resolve().parent
    poppler_candidates = list(backend_dir.glob("poppler/*/Library/bin"))
    if poppler_candidates:
        poppler_bin = str(poppler_candidates[0])
        logger.info(f"Poppler 検出: {poppler_bin}")
        return poppler_bin

    # 環境変数で指定されている場合
    env_path = os.getenv("POPPLER_PATH")
    if env_path and Path(env_path).exists():
        logger.info(f"Poppler (環境変数): {env_path}")
        return env_path

    logger.warning(
        "Poppler が見つかりません。PDF変換でエラーが発生する可能性があります。"
    )
    return None

POPPLER_PATH = _detect_poppler_path()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """アプリケーション起動時の初期化処理"""
    logger.info("🚀 FastAPI サーバーを起動中...")
    configure_gemini()
    logger.info("✅ 初期化完了")
    yield
    logger.info("🛑 FastAPI サーバーを停止中...")


# ── FastAPI インスタンス ──
app = FastAPI(
    title="AI審査官リーガルチェックAPI",
    description="複数のPDF行政書類をGemini AIのマルチモーダル機能で解析し、入管審査官視点でリスク判定を行います",
    version="3.0.0",
    lifespan=lifespan,
)

# ── CORS設定 ──
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _pdf_to_images(file_bytes: bytes, filename: str) -> list[Image.Image]:
    """
    PDFバイト列をページ単位のPIL Imageリストに変換する。

    Args:
        file_bytes: PDFファイルのバイト列
        filename: ファイル名（ログ用）

    Returns:
        PIL Imageのリスト（1ページ1画像）
    """
    try:
        convert_kwargs: dict[str, object] = {
            "pdf_file": file_bytes,
            "dpi": PDF_DPI,
            "fmt": "jpeg",
        }
        if POPPLER_PATH is not None:
            convert_kwargs["poppler_path"] = POPPLER_PATH
        images = convert_from_bytes(**convert_kwargs)  # type: ignore[arg-type]
    except Exception as e:
        logger.error(f"PDF→画像変換エラー: {filename} - {e}")
        raise RuntimeError(f"PDFの画像変換に失敗しました: {filename} - {str(e)}")

    # ページ数制限
    if len(images) > MAX_PAGES_PER_FILE:
        logger.warning(
            f"ページ数制限: {filename} ({len(images)}ページ → {MAX_PAGES_PER_FILE}ページに制限)"
        )
        images = images[:MAX_PAGES_PER_FILE]

    logger.info(f"  → PDF変換完了: {len(images)}ページ")
    return images


@app.get("/health")
async def health_check() -> dict[str, str]:
    """ヘルスチェックエンドポイント"""
    return {"status": "ok", "service": "legal-check"}


@app.post(
    "/legal-check",
    response_model=LegalCheckResponse,
    responses={
        400: {"model": ErrorResponse, "description": "不正なリクエスト"},
        500: {"model": ErrorResponse, "description": "サーバーエラー"},
    },
)
async def legal_check(files: list[UploadFile] = File(...)) -> LegalCheckResponse:
    """
    複数のPDFファイルを受け取り、ページ画像に変換後
    Gemini APIのマルチモーダル機能でリーガルチェックを実行する。
    """
    if not files:
        raise HTTPException(status_code=400, detail="ファイルが選択されていません")

    # ── バリデーション ──
    for f in files:
        if not f.filename:
            raise HTTPException(status_code=400, detail="ファイル名が不明です")
        ext = os.path.splitext(f.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"非対応のファイル形式です: {f.filename} (対応: PDF のみ)",
            )

    # ── ファイル読み込み & PDF→画像変換 ──
    # file_images: [(filename, [PIL Image, ...])]
    file_images: list[tuple[str, list[Image.Image]]] = []
    filenames: list[str] = []
    total_pages = 0

    for f in files:
        assert f.filename is not None
        try:
            content = await f.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"ファイルサイズが上限を超えています: {f.filename}",
                )
            logger.info(f"📄 PDF解析中: {f.filename} ({len(content)} bytes)")

            images = _pdf_to_images(content, f.filename)
            file_images.append((f.filename, images))
            filenames.append(f.filename)
            total_pages += len(images)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"ファイル処理エラー: {f.filename} - {e}")
            raise HTTPException(
                status_code=500,
                detail=f"ファイルの処理中にエラーが発生しました: {f.filename} - {str(e)}",
            )

    if not file_images:
        raise HTTPException(status_code=400, detail="有効な画像を抽出できませんでした")

    # ── Gemini API でマルチモーダル・リーガルチェック ──
    logger.info(
        f"🤖 Gemini API に送信 "
        f"(ファイル数: {len(filenames)}, 合計ページ数: {total_pages})"
    )

    try:
        result = await legal_check_documents(file_images)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ── レスポンス構築 ──
    return LegalCheckResponse(
        success=True,
        message=f"{len(filenames)}件のPDF（計{total_pages}ページ）をリーガルチェックしました（リスク{len(result.get('risks', []))}件検出）",
        source_files=filenames,
        overall_risk_level=result.get("overall_risk_level", "Low"),
        summary=result.get("summary", ""),
        risks=result.get("risks", []),
        raw_json=result,
    )


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        timeout_keep_alive=600,
    )
