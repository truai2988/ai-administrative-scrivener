/**
 * firestoreUtils.ts
 * Firestore保存処理に関する共通ユーティリティ関数
 *
 * 複数のサービスファイルで重複していたロジックをここに集約し、
 * DRY原則を維持する。
 */

// ─── Firestore保存前のデータサニタイズ ────────────────────────────────────────

/**
 * 指定された値が「空」であるかを判定します。
 * （undefined, null, 空文字, 空の配列, 空のオブジェクト）
 */
function isEmptyValue(val: unknown): boolean {
  if (val === undefined || val === null || val === '') return true;
  if (Array.isArray(val) && val.length === 0) return true;
  if (typeof val === 'object' && Object.keys(val as Record<string, unknown>).length === 0) {
    // Dateオブジェクトなどはそのまま保持する安全策
    if (val instanceof Date) return false;
    return true;
  }
  return false;
}

/**
 * オブジェクトから空文字 ("")、null、undefined、空の配列 ([])、空のオブジェクト ({}) を再帰的に削除します。
 */
export function removeEmptyValues<T>(obj: T): T | undefined {
  if (isEmptyValue(obj)) return undefined;

  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map(item => removeEmptyValues(item))
      .filter(item => item !== undefined);
      
    return cleanedArray.length > 0 ? (cleanedArray as unknown as T) : undefined;
  }

  if (typeof obj === 'object') {
    if (obj instanceof Date) return obj;

    const cleanedObj: Record<string, unknown> = {};
    let hasKeys = false;

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const cleanedValue = removeEmptyValues(value);
      if (cleanedValue !== undefined) {
        cleanedObj[key] = cleanedValue;
        hasKeys = true;
      }
    }

    return hasKeys ? (cleanedObj as T) : undefined;
  }

  return obj;
}

/**
 * Firestoreは undefined 値を受け付けないため、保存前に除去する。
 * さらに、コスト削減・ペイロード最小化のため null や ""（空文字）、空の配列・オブジェクトも再帰的に削除します。
 */
export function sanitizeForFirestore<T>(obj: T): T {
  const cleaned = removeEmptyValues(obj);
  return cleaned !== undefined ? cleaned : ({} as T);
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
