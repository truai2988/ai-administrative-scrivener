"""
Gemini API サービス

google-generativeai を使用して、抽出した書類テキストから
共通JSONマスタースキーマを生成する。
"""

import asyncio
import json
import logging
import os
import re
from typing import Any

import google.generativeai as genai

logger = logging.getLogger(__name__)

# Gemini API の設定
_MODEL_NAME = "gemini-2.5-flash"
_TIMEOUT_SECONDS = 600  # タイムアウトを10分に延長
_MAX_RETRIES = 3  # リトライ回数
_RETRY_BASE_DELAY = 5  # リトライ間隔の基本秒数
_MAX_TEXT_LENGTH = 80000  # プロンプトに含めるテキストの最大文字数

# JSON出力を強制するためのスキーマ定義
_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "categories": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category_id": {"type": "string"},
                    "category_label": {"type": "string"},
                    "fields": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "field_id": {"type": "string"},
                                "label_ja": {"type": "string"},
                                "label_en": {"type": "string"},
                                "field_type": {"type": "string"},
                                "required": {"type": "boolean"},
                                "options": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                                "source_file": {"type": "string"},
                                "notes": {"type": "string"},
                            },
                            "required": ["field_id", "label_ja", "field_type"],
                        },
                    },
                },
                "required": ["category_id", "category_label", "fields"],
            },
        }
    },
    "required": ["categories"],
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


def _truncate_text(text: str, max_length: int = _MAX_TEXT_LENGTH) -> str:
    """
    テキストが長すぎる場合に、先頭と末尾を優先して切り詰める。
    
    行政書類の場合、冒頭（タイトル・ヘッダー）と末尾（署名欄・注記）に
    重要な情報が含まれることが多いため、中央部分を省略する。
    """
    if len(text) <= max_length:
        return text

    # 先頭60%、末尾40%を残す
    head_size = int(max_length * 0.6)
    tail_size = max_length - head_size
    omitted = len(text) - max_length

    logger.warning(
        f"テキストが上限を超過しています ({len(text)} > {max_length} 文字)。"
        f"中央部分 {omitted} 文字を省略します。"
    )

    return (
        text[:head_size]
        + f"\n\n... (省略: {omitted} 文字) ...\n\n"
        + text[-tail_size:]
    )


async def analyze_documents(combined_text: str, filenames: list[str]) -> dict[str, Any]:
    """
    結合済みテキストを Gemini API に送信し、JSONマスタースキーマを生成する。

    Args:
        combined_text: 全ファイルから抽出・結合したテキスト
        filenames: 解析対象のファイル名リスト

    Returns:
        Geminiが生成したJSONスキーマ (dict)

    Raises:
        RuntimeError: API呼び出しに失敗した場合
    """
    # テキスト長を制限
    truncated_text = _truncate_text(combined_text)
    logger.info(
        f"テキスト長: 元={len(combined_text)} → 送信={len(truncated_text)} 文字"
    )

    prompt = f"""あなたは日本の行政書類（ビザ申請書、在留資格関連書類など）の専門家です。

以下は、複数の行政書類（Excel/Word形式）から抽出したテキストデータです。
これらの書類を横断的に解析し、申請に必要な**全ての入力項目**を洗い出してください。

【解析対象ファイル】
{chr(10).join(f'- {name}' for name in filenames)}

【抽出テキスト】
{truncated_text}

【タスク】
上記のテキストから、以下のカテゴリに分類された入力フィールド定義のJSONを生成してください。

カテゴリの例（必要に応じて追加・変更してください）:
- applicant: 申請人情報（氏名、生年月日、国籍、住所など）
- organization: 所属機関・受入機関情報
- job_terms: 就労条件・雇用契約情報
- qualification: 資格・技能情報
- family: 家族情報
- history: 経歴情報（職歴、学歴）
- documents: 添付書類情報
- other: その他

各フィールドには以下の情報を含めてください:
- field_id: 英語のスネークケースID（一意）
- label_ja: 日本語のラベル
- label_en: 英語のラベル
- field_type: "text", "number", "date", "select", "checkbox", "radio" のいずれか
- required: 必須項目かどうか (true/false)
- options: select/radioの場合の選択肢リスト
- source_file: このフィールドが見つかった元ファイル名
- notes: 記入例や制約事項（あれば）

重複する項目は統合し、共通のマスタースキーマとして出力してください。
"""

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
                f"Gemini API にリクエスト送信中... "
                f"(試行 {attempt}/{_MAX_RETRIES}, テキスト長: {len(truncated_text)} 文字)"
            )
            response = await model.generate_content_async(
                prompt,
                request_options={"timeout": _TIMEOUT_SECONDS},
            )

            if not response.text:
                raise RuntimeError("Gemini API から空のレスポンスが返されました")

            logger.info(f"Gemini レスポンス受信 (テキスト長: {len(response.text)} 文字)")

            result = _parse_json_safe(response.text)
            if result is not None:
                logger.info(
                    f"Gemini API レスポンス解析完了 "
                    f"(カテゴリ数: {len(result.get('categories', []))}, 試行: {attempt}回目)"
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
