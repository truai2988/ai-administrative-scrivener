/**
 * firestoreUtils.ts
 * Firestore保存処理に関する共通ユーティリティ関数
 *
 * 複数のサービスファイルで重複していたロジックをここに集約し、
 * DRY原則を維持する。
 */

// ─── Firestore保存前のデータサニタイズ ────────────────────────────────────────

/**
 * Firestoreは undefined 値を受け付けないため、保存前に除去する。
 * JSON.stringify は undefined を自動的に取り除くため、
 * ネストの深さに関わらず確実に動作する。
 * （フォームデータはDate/Symbolを含まないため安全）
 */
export function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// ─── ステータスのマッピング ───────────────────────────────────────────────────

/**
 * アプリケーションステータス文字列を Foreigner.approvalStatus に変換する。
 *
 * - 'editing' は「まだ確認待ちでない」ため 'draft' に戻す（意図的な設計）
 * - 不明なステータスはすべて 'draft' にフォールバックする
 *
 * @param appStatus - APPLICATION_STATUS の値（例: 'editing', 'pending_review'）
 * @returns Foreigner.approvalStatus に設定すべき文字列
 */
export function mapApplicationStatusToApprovalStatus(appStatus: string): string {
  switch (appStatus) {
    case 'pending_review': return 'pending_review';
    case 'approved':       return 'approved';
    case 'returned':       return 'returned';
    // 'draft' / 'editing' / その他はすべて下書き扱い
    default:               return 'draft';
  }
}

// ─── 名前文字列の有効性チェック ──────────────────────────────────────────────

/** '名称未設定' や空文字など「実質的に無効な名前」を判定するガード */
const INVALID_NAME_PLACEHOLDER = '名称未設定';

/**
 * 入力された名前文字列が「有効な人名」かどうかを判定する。
 * 空文字・空白のみ・プレースホルダー文字列はすべて false を返す。
 */
export function isValidPersonName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  if (trimmed === INVALID_NAME_PLACEHOLDER) return false;
  return true;
}
