"""
Gemini API サービス

google-generativeai を使用して、抽出した書類テキストから
共通JSONマスタースキーマを生成する。
"""

import json
import logging
import os
from typing import Any

import google.generativeai as genai

logger = logging.getLogger(__name__)

# Gemini API の設定
_MODEL_NAME = "gemini-1.5-pro"
_TIMEOUT_SECONDS = 120

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
    prompt = f"""あなたは日本の行政書類（ビザ申請書、在留資格関連書類など）の専門家です。

以下は、複数の行政書類（Excel/Word形式）から抽出したテキストデータです。
これらの書類を横断的に解析し、申請に必要な**全ての入力項目**を洗い出してください。

【解析対象ファイル】
{chr(10).join(f'- {name}' for name in filenames)}

【抽出テキスト】
{combined_text}

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

    try:
        model = genai.GenerativeModel(
            model_name=_MODEL_NAME,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
                temperature=0.1,  # 安定した出力のため低めに設定
            ),
        )

        logger.info(f"Gemini API にリクエスト送信中... (テキスト長: {len(combined_text)} 文字)")
        response = model.generate_content(
            prompt,
            request_options={"timeout": _TIMEOUT_SECONDS},
        )

        if not response.text:
            raise RuntimeError("Gemini API から空のレスポンスが返されました")

        result = json.loads(response.text)
        logger.info(f"Gemini API レスポンス受信完了 (カテゴリ数: {len(result.get('categories', []))})")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Gemini レスポンスのJSONパースに失敗: {e}")
        raise RuntimeError(f"AIレスポンスの解析に失敗しました: {e}")
    except Exception as e:
        logger.error(f"Gemini API 呼び出しエラー: {e}")
        raise RuntimeError(f"AI解析中にエラーが発生しました: {e}")
