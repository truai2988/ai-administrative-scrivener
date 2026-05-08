"""
Pydantic レスポンスモデル

Gemini APIから返却されるJSONスキーマと、
FastAPIのレスポンス構造を定義する。
"""

from pydantic import BaseModel, Field
from typing import Optional


class FieldDefinition(BaseModel):
    """個々の入力フィールドの定義"""
    field_id: str = Field(..., description="フィールドの一意識別子 (例: 'applicant_name')")
    label_ja: str = Field(..., description="日本語ラベル (例: '申請人の氏名')")
    label_en: str = Field("", description="英語ラベル (例: 'Applicant Name')")
    field_type: str = Field("text", description="入力タイプ: text, number, date, select, checkbox, radio")
    required: bool = Field(False, description="必須項目かどうか")
    options: list[str] = Field(default_factory=list, description="select/radio の選択肢")
    source_file: str = Field("", description="このフィールドが出現した元ファイル名")
    notes: str = Field("", description="補足説明 (記入例、制約事項等)")


class SchemaCategory(BaseModel):
    """スキーマのカテゴリ (例: applicant, organization)"""
    category_id: str = Field(..., description="カテゴリID (例: 'applicant')")
    category_label: str = Field(..., description="カテゴリ名 (例: '申請人情報')")
    fields: list[FieldDefinition] = Field(default_factory=list, description="カテゴリに属するフィールド一覧")


class AnalysisResponse(BaseModel):
    """解析結果のレスポンス"""
    success: bool = Field(True)
    message: str = Field("解析が完了しました")
    source_files: list[str] = Field(default_factory=list, description="解析したファイル名一覧")
    total_fields: int = Field(0, description="抽出されたフィールドの総数")
    categories: list[SchemaCategory] = Field(default_factory=list, description="カテゴリ別スキーマ")
    raw_json: Optional[dict] = Field(None, description="Geminiが返した生のJSON (デバッグ用)")


class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    success: bool = Field(False)
    message: str
    detail: Optional[str] = None
