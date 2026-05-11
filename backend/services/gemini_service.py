"""
Gemini API サービス（マルチモーダル対応版）

google-generativeai を使用して、PDFから変換したページ画像を
Gemini 1.5 Pro のマルチモーダル機能で解析し、
入管審査官視点でのリーガルチェック（リスク判定）を実行する。
"""

import asyncio
import json
import logging
import os
import re
from typing import Any

import google.generativeai as genai
from PIL import Image

logger = logging.getLogger(__name__)

# Gemini API の設定
_MODEL_NAME = "gemini-2.5-flash"
_TIMEOUT_SECONDS = 600  # タイムアウトを10分に延長
_MAX_RETRIES = 3  # リトライ回数
_RETRY_BASE_DELAY = 5  # リトライ間隔の基本秒数

# JSON出力を強制するためのスキーマ定義（リーガルチェック用）
_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "overall_risk_level": {
            "type": "string",
            "description": "総合リスクレベル: High, Medium, Low のいずれか",
        },
        "summary": {
            "type": "string",
            "description": "審査官視点での総合評価の要約",
        },
        "risks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "description": "リスク種別: '整合性エラー', '要件未達', '合理性' のいずれか",
                    },
                    "issue": {
                        "type": "string",
                        "description": "発見された問題点",
                    },
                    "reason": {
                        "type": "string",
                        "description": "不許可になり得る理由",
                    },
                    "suggestion": {
                        "type": "string",
                        "description": "推奨されるリカバリー案",
                    },
                },
                "required": ["type", "issue", "reason", "suggestion"],
            },
        },
    },
    "required": ["overall_risk_level", "summary", "risks"],
}


def configure_gemini() -> None:
    """Gemini APIの初期設定を行う"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY が設定されていません。backend/.env を確認してください。")
    genai.configure(api_key=api_key)
    logger.info("Gemini API の設定が完了しました")


def _repair_json(text: str) -> str:
    """
    Gemini が返す不正なJSONを修復する。

    よくある問題:
    - トレーリングカンマ ( {"a": 1,} )
    - 閉じ括弧の不足
    - 文字列内の改行・制御文字
    """
    logger.info(f"JSON修復を試行中... (元テキスト長: {len(text)} 文字)")

    # 1. BOM除去
    text = text.strip().lstrip("\ufeff")

    # 2. markdownコードブロック除去 (```json ... ```)
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    # 3. トレーリングカンマの除去 ( ,] → ] , ,} → } )
    text = re.sub(r",\s*([\]\}])", r"\1", text)

    # 4. 閉じ括弧の補完
    open_braces = text.count("{") - text.count("}")
    open_brackets = text.count("[") - text.count("]")
    if open_braces > 0 or open_brackets > 0:
        logger.warning(
            f"括弧の不一致を検出: {{ +{open_braces}, [ +{open_brackets} → 自動補完"
        )
        text += "]" * open_brackets + "}" * open_braces

    # 5. 文字列値内の制御文字をエスケープ
    text = text.replace("\t", "\\t")

    return text


def _parse_json_safe(raw_text: str) -> dict[str, Any] | None:
    """
    JSONパースを試み、失敗したら修復して再試行する。
    成功したらdictを返し、失敗したらNoneを返す。
    """
    # まず直接パース
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        logger.warning(f"直接パース失敗 (位置 {e.pos}): {e.msg}")

    # 修復して再パース
    repaired = _repair_json(raw_text)
    try:
        result = json.loads(repaired)
        logger.info("JSON修復後のパースに成功しました")
        return result
    except json.JSONDecodeError as e:
        logger.error(
            f"修復後もパース失敗 (位置 {e.pos}): {e.msg}\n"
            f"先頭200文字: {repaired[:200]}\n"
            f"末尾200文字: {repaired[-200:]}"
        )

    return None


def _build_multimodal_content(
    file_images: list[tuple[str, list[Image.Image]]],
) -> list[str | Image.Image]:
    """
    ファイル名とページ画像のペアからGeminiに送信するマルチモーダルコンテンツ配列を構築する。

    構成イメージ:
      [
        "以下の書類を審査してください。",
        "ファイル: 01_履歴書.pdf",
        <PIL Image (p1)>, <PIL Image (p2)>,
        "ファイル: 02_雇用契約書.pdf",
        <PIL Image (p1)>, ...
      ]

    Args:
        file_images: (ファイル名, [PIL Image, ...]) のリスト

    Returns:
        Gemini API に渡すコンテンツ配列
    """
    content_parts: list[str | Image.Image] = []

    # 先頭に審査指示テキスト
    content_parts.append("以下の書類を審査してください。")

    total_pages = 0
    for filename, images in file_images:
        # ファイル名ラベル（名札）を挿入
        content_parts.append(f"ファイル: {filename}")
        for img in images:
            content_parts.append(img)
            total_pages += 1

    logger.info(
        f"マルチモーダルコンテンツ構築完了: "
        f"{len(file_images)}ファイル, {total_pages}ページ, "
        f"{len(content_parts)}パーツ"
    )
    return content_parts


async def legal_check_documents(
    file_images: list[tuple[str, list[Image.Image]]],
    custom_rules_text: str = "",
) -> dict[str, Any]:
    """
    PDFから変換したページ画像群を Gemini API にマルチモーダルで送信し、
    入管審査官視点のリーガルチェックを実行する。

    Args:
        file_images: (ファイル名, [PIL Image, ...]) のリスト
        custom_rules_text: AI診断ルール管理で登録されたカスタムルールのテキスト（空文字の場合は無視）

    Returns:
        Geminiが生成したリーガルチェック結果 (dict)

    Raises:
        RuntimeError: API呼び出しに失敗した場合
    """
    filenames = [name for name, _ in file_images]
    total_pages = sum(len(imgs) for _, imgs in file_images)

    logger.info(
        f"リーガルチェック開始: {len(filenames)}ファイル, {total_pages}ページ"
        + (f", カスタムルール: {len(custom_rules_text)}文字" if custom_rules_text else "")
    )

    # ── マルチモーダルコンテンツ配列を構築 ──
    multimodal_content = _build_multimodal_content(file_images)

    # ── 審査プロンプト（テキスト部分）を末尾に追加 ──
    prompt_text = f"""あなたは出入国在留管理庁（入管）のベテラン審査官です。
上記にアップロードされた行政書類（ビザ申請書、在留資格関連書類など）の各ページ画像を精査し、
申請が不許可になり得るリスクポイントを網羅的に洗い出してください。

【審査の観点】
1. **整合性エラー**: 書類間の矛盾（氏名・生年月日・住所の不一致、日付の前後関係の誤り、雇用条件の齟齬など）
2. **要件未達**: 在留資格の許可要件を満たしていない項目（学歴・職歴の不足、報酬額の基準未満、必要書類の欠落など）
3. **合理性**: 申請内容の合理性に疑問がある点（業務内容と資格の不整合、転職理由の不自然さ、収入と生活費のバランスなど）

【解析対象ファイル】
{chr(10).join(f'- {name}' for name in filenames)}

【出力指示】
上記の書類を審査官の目線で精査し、以下の形式でリスク分析結果を出力してください。

- overall_risk_level: 総合リスクレベルを "High"（不許可の可能性が高い）、"Medium"（要修正項目あり）、"Low"（重大なリスクなし）のいずれかで判定してください。
- summary: 審査官としての総合所見を200文字程度で記述してください。申請の強み・弱みを踏まえた実務的なコメントにしてください。
- risks: 検出された各リスクを配列で出力してください。各リスクには以下を含めてください：
  - type: "整合性エラー"、"要件未達"、"合理性" のいずれか
  - issue: 具体的な問題点（どの書類のどの箇所に問題があるか）
  - reason: なぜその問題が不許可に繋がり得るのか（入管法や審査基準に基づく根拠）
  - suggestion: 申請者・行政書士が取るべき具体的なリカバリー案

リスクが見つからない場合でも、risks は空配列 [] として出力してください。
些細な問題も見逃さず、審査官として厳格に審査してください。
"""

    # ── カスタムルール（AI診断ルール管理から取得）をプロンプトに結合 ──
    if custom_rules_text.strip():
        prompt_text += f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【追加カスタムルール（事務所独自の基準）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

以下は事務所固有の追加チェック基準です。上記の基本審査基準と同等の厳密さで適用し、
該当するリスクがあれば risks 配列に含めてください。

{custom_rules_text.strip()}
"""
        logger.info("カスタムルールをプロンプトに結合しました")

    multimodal_content.append(prompt_text)

    # ── Gemini モデル設定 ──
    model = genai.GenerativeModel(
        model_name=_MODEL_NAME,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=_RESPONSE_SCHEMA,
            temperature=0.1,  # 安定した出力のため低めに設定
        ),
    )

    last_error: Exception | None = None

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            logger.info(
                f"Gemini API にマルチモーダルリクエスト送信中... "
                f"(試行 {attempt}/{_MAX_RETRIES}, "
                f"ファイル数: {len(filenames)}, ページ数: {total_pages})"
            )
            response = await model.generate_content_async(
                multimodal_content,
                request_options={"timeout": _TIMEOUT_SECONDS},
            )

            if not response.text:
                raise RuntimeError("Gemini API から空のレスポンスが返されました")

            logger.info(f"Gemini レスポンス受信 (テキスト長: {len(response.text)} 文字)")

            result = _parse_json_safe(response.text)
            if result is not None:
                risk_count = len(result.get("risks", []))
                risk_level = result.get("overall_risk_level", "Unknown")
                logger.info(
                    f"リーガルチェック完了 "
                    f"(リスクレベル: {risk_level}, リスク数: {risk_count}, 試行: {attempt}回目)"
                )
                return result

            # JSONパース失敗 → リトライ対象とする
            if attempt < _MAX_RETRIES:
                delay = _RETRY_BASE_DELAY * (2 ** (attempt - 1))
                logger.warning(
                    f"JSONパース失敗 (試行 {attempt}/{_MAX_RETRIES})。"
                    f"{delay}秒後にリトライします..."
                )
                await asyncio.sleep(delay)
                continue
            else:
                raise RuntimeError(
                    "AIレスポンスのJSON解析に失敗しました。"
                    "Gemini APIが不正なJSONを返しました。再度お試しください。"
                )

        except Exception as e:
            last_error = e
            error_msg = str(e)
            is_timeout = "timed out" in error_msg.lower() or "504" in error_msg or "deadline" in error_msg.lower()

            if is_timeout and attempt < _MAX_RETRIES:
                delay = _RETRY_BASE_DELAY * (2 ** (attempt - 1))  # 指数バックオフ: 5s, 10s, 20s
                logger.warning(
                    f"Gemini API タイムアウト (試行 {attempt}/{_MAX_RETRIES})。"
                    f"{delay}秒後にリトライします... エラー: {error_msg}"
                )
                await asyncio.sleep(delay)
                continue
            elif not is_timeout:
                # タイムアウト以外のエラーは即座にfail
                logger.error(f"Gemini API 呼び出しエラー (試行 {attempt}): {e}")
                raise RuntimeError(f"AI解析中にエラーが発生しました: {e}")

    # 全リトライ失敗
    logger.error(f"Gemini API 全 {_MAX_RETRIES} 回の試行が失敗しました: {last_error}")
    raise RuntimeError(
        f"AI解析がタイムアウトしました。{_MAX_RETRIES}回リトライしましたが成功しませんでした。"
        f"ファイルサイズを小さくするか、ファイル数を減らしてお試しください。"
    )
