/**
 * dateNormalizer.ts
 *
 * 日付・識別番号の正規化ユーティリティ。
 * どのエクストラクターからも参照できる純粋関数群。
 *
 * ■ 責務
 *   - 和暦 / 西暦 / 各種フォーマットを YYYY-MM-DD に統一する
 *   - 在留カード番号・旅券番号のクリーニング
 *
 * ■ 拡張方針
 *   正規化ロジックの追加はすべてここに集約すること。
 *   エクストラクター側には正規化ロジックを書かない。
 */

// ─── 和暦 → 西暦 変換テーブル ──────────────────────────────────────────────
const ERA_TABLE: Record<string, number> = {
  令和: 2018,
  平成: 1988,
  昭和: 1925,
  大正: 1911,
  明治: 1867,
};

/**
 * 様々な形式の日付文字列を YYYY-MM-DD に正規化する。
 * 変換できない場合は空文字を返す。
 *
 * 対応フォーマット:
 *   - YYYY-MM-DD          (そのまま返す)
 *   - YYYY/MM/DD
 *   - YYYY.MM.DD
 *   - 令和X年X月X日  / 平成X年X月X日 etc.
 *   - YYYY 年 X 月 X 日  (スペース混在)
 *   - new Date() でパース可能な英語表記
 */
export function normalizeDate(raw: string | null | undefined): string {
  if (!raw) return '';

  // すでに YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // YYYY/MM/DD
  const slashMatch = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slashMatch) {
    return `${slashMatch[1]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[3].padStart(2, '0')}`;
  }

  // YYYY.MM.DD
  const dotMatch = raw.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (dotMatch) {
    return `${dotMatch[1]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[3].padStart(2, '0')}`;
  }

  // 和暦: 令和6年3月15日 など
  const wareki = raw.match(/^(令和|平成|昭和|大正|明治)(\d{1,2})年(\d{1,2})月(\d{1,2})日$/);
  if (wareki) {
    const base = ERA_TABLE[wareki[1]];
    const year = base + parseInt(wareki[2], 10);
    return `${year}-${wareki[3].padStart(2, '0')}-${wareki[4].padStart(2, '0')}`;
  }

  // 西暦年月日（スペース・年月日混在）: "2028 年12月1日" など
  const jpDateMixed = raw.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (jpDateMixed) {
    return `${jpDateMixed[1]}-${jpDateMixed[2].padStart(2, '0')}-${jpDateMixed[3].padStart(2, '0')}`;
  }

  // Date() 経由のフォールバック（英語表記など）
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return '';
}

/**
 * 在留カード番号を正規化する（スペース除去・大文字化）。
 * 形式: AB12345678CD (英2+数8+英2 = 12文字)
 *
 * NOTE: 末尾2桁が欠けている場合はそのまま渡す（UIでエラー表示）。
 */
export function normalizeResidenceCardNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/[\s\-]/g, '').toUpperCase();
}

/**
 * 旅券番号を正規化する（スペース除去・大文字化）。
 * 形式: AA1234567 など英数7〜9桁
 */
export function normalizePassportNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/\s/g, '').toUpperCase();
}
