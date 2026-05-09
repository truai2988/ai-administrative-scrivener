"""
FastAPI メインアプリケーション

複数の行政書類（Excel/Word）を受け取り、
Gemini APIで横断解析して共通JSONマスタースキーマを生成する。
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import AnalysisResponse, ErrorResponse
from parsers.excel_parser import extract_excel_text
from parsers.word_parser import extract_word_text
from services.gemini_service import analyze_documents, configure_gemini

# ── ログ設定 ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── 環境変数読み込み ──
load_dotenv()

# 許可するファイル拡張子
ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".docx"}
# アップロードサイズ上限（50MB）
MAX_FILE_SIZE = 50 * 1024 * 1024


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
    title="行政書類横断解析API",
    description="複数のExcel/Word行政書類をGemini AIで解析し、共通JSONスキーマを生成します",
    version="1.0.0",
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


@app.get("/health")
async def health_check() -> dict[str, str]:
    """ヘルスチェックエンドポイント"""
    return {"status": "ok", "service": "document-analyzer"}


@app.post(
    "/analyze",
    response_model=AnalysisResponse,
    responses={
        400: {"model": ErrorResponse, "description": "不正なリクエスト"},
        500: {"model": ErrorResponse, "description": "サーバーエラー"},
    },
)
async def analyze_files(files: list[UploadFile] = File(...)) -> AnalysisResponse:
    """
    複数のExcel/Wordファイルを受け取り、Gemini APIで横断解析する。

    - 各ファイルからテキストを抽出
    - 全テキストを結合してGemini APIに送信
    - 構造化されたJSONスキーマを返却
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
                detail=f"非対応のファイル形式です: {f.filename} (対応: {', '.join(ALLOWED_EXTENSIONS)})",
            )

    # ── ファイル読み込み & テキスト抽出 ──
    extracted_texts: list[str] = []
    filenames: list[str] = []

    for f in files:
        assert f.filename is not None  # バリデーション済み
        try:
            content = await f.read()

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"ファイルサイズが上限を超えています: {f.filename} ({len(content) // 1024 // 1024}MB > 50MB)",
                )

            ext = os.path.splitext(f.filename)[1].lower()
            logger.info(f"📄 ファイル解析中: {f.filename} ({len(content)} bytes)")

            if ext in {".xlsx", ".xls"}:
                text = extract_excel_text(content, f.filename)
            elif ext == ".docx":
                text = extract_word_text(content, f.filename)
            else:
                continue

            extracted_texts.append(text)
            filenames.append(f.filename)
            logger.info(f"  → 抽出テキスト長: {len(text)} 文字")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"ファイル処理エラー: {f.filename} - {e}")
            raise HTTPException(
                status_code=500,
                detail=f"ファイルの処理中にエラーが発生しました: {f.filename} - {str(e)}",
            )

    if not extracted_texts:
        raise HTTPException(status_code=400, detail="有効なテキストを抽出できませんでした")

    # ── Gemini API で解析 ──
    combined_text = "\n\n".join(extracted_texts)
    logger.info(f"🤖 Gemini API に送信 (結合テキスト: {len(combined_text)} 文字, ファイル数: {len(filenames)})")

    # 各ファイルのテキスト長をデバッグ出力
    for fname, text in zip(filenames, extracted_texts):
        logger.info(f"  📊 {fname}: {len(text)} 文字")

    try:
        result = await analyze_documents(combined_text, filenames)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ── レスポンス構築 ──
    categories = result.get("categories", [])
    total_fields = sum(len(cat.get("fields", [])) for cat in categories)

    return AnalysisResponse(
        success=True,
        message=f"{len(filenames)}件のファイルから{total_fields}個のフィールドを抽出しました",
        source_files=filenames,
        total_fields=total_fields,
        categories=categories,
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
        timeout_keep_alive=600,  # 長時間のGemini API処理に対応（10分）
    )

