"""
Pydantic レスポンスモデル

Gemini APIから返却されるリーガルチェック結果と、
FastAPIのレスポンス構造を定義する。
"""

from pydantic import BaseModel, Field
from typing import Optional


class RiskItem(BaseModel):
    """個々のリスク項目"""
    type: str = Field(..., description="リスク種別: '整合性エラー' | '要件未達' | '合理性'")
    issue: str = Field(..., description="発見された問題点")
    reason: str = Field(..., description="不許可になり得る理由")
    suggestion: str = Field(..., description="推奨されるリカバリー案")


class LegalCheckResponse(BaseModel):
    """リーガルチェック結果のレスポンス"""
    success: bool = Field(True)
    message: str = Field("リーガルチェックが完了しました")
    source_files: list[str] = Field(default_factory=list, description="解析したファイル名一覧")
    overall_risk_level: str = Field("Low", description="総合リスクレベル: 'High' | 'Medium' | 'Low'")
    summary: str = Field("", description="審査官視点での総合評価の要約")
    risks: list[RiskItem] = Field(default_factory=list, description="検出されたリスク一覧")
    raw_json: Optional[dict] = Field(None, description="Geminiが返した生のJSON (デバッグ用)")


class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    success: bool = Field(False)
    message: str
    detail: Optional[str] = None
