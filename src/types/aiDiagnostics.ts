/**
 * AI診断・データチェック機能 共通型定義
 *
 * バックエンド（API Route）とフロントエンド（UIコンポーネント / フック）で共有します。
 */

// ─── 診断レベル ────────────────────────────────────────────────────────────────
/** critical: 不許可リスク大。要対応。warning: 懸念あり。要確認。suggestion: 改善提案 */
export type DiagnosticLevel = 'critical' | 'warning' | 'suggestion';

// ─── 診断カテゴリ ──────────────────────────────────────────────────────────────
/** input: 入力不備。consistency: データ間の整合性。legal: 法的・審査上のリスク */
export type DiagnosticCategory = 'input' | 'consistency' | 'legal';

// ─── 診断アイテム ──────────────────────────────────────────────────────────────
export interface DiagnosticItem {
  /** 重大度 */
  level: DiagnosticLevel;
  /** カテゴリ */
  category: DiagnosticCategory;
  /** 対象フィールド名（例: foreignerInfo.passportExpiryDate） */
  field: string;
  /** ユーザーへの具体的な指摘・提案メッセージ */
  message: string;
}

// ─── APIレスポンス ─────────────────────────────────────────────────────────────
export interface AiCheckResponse {
  diagnostics: DiagnosticItem[];
}

// ─── API エラーレスポンス ──────────────────────────────────────────────────────
export interface AiCheckErrorResponse {
  error: string;
}

// ─── フロントエンド状態 ────────────────────────────────────────────────────────
export type AiDiagnosticsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AiDiagnosticsState {
  status: AiDiagnosticsStatus;
  diagnostics: DiagnosticItem[];
  errorMessage?: string;
  /** レベル別カウント（バッジ表示用） */
  counts: {
    critical: number;
    warning: number;
    suggestion: number;
  };
}
