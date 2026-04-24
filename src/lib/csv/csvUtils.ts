import * as encoding from 'encoding-japanese';

/**
 * 真偽値または文字列を '有' / '無' に変換します。
 * @param val - 変換する値
 * @returns '有' | '無' | ''
 */
export const boolToYesNo = (val?: boolean | string): string => {
  if (val === true || val === '有') return '有';
  if (val === false || val === '無') return '無';
  return '';
};

/**
 * 日付文字列 (YYYY-MM-DD) を CSVフォーマット (YYYYMMDD) に変換します。
 * @param dateStr - YYYY-MM-DD 形式の文字列
 * @returns YYYYMMDD 形式の文字列、無効な場合は空文字
 */
export const formatDateToYYYYMMDD = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '');
};

/**
 * 郵便番号 (123-4567) からハイフンを除去 (1234567) します。
 * @param zip - 郵便番号文字列
 * @returns ハイフンなしの文字列
 */
export const formatZipCode = (zip?: string | null): string => {
  if (!zip) return '';
  return zip.replace(/-/g, '');
};

/**
 * 電話番号からハイフンを除去します（CSV仕様でハイフンなしが求められる場合）。
 * @param phone - 電話番号文字列
 * @returns ハイフンなしの文字列
 */
export const formatPhoneNumber = (phone?: string | null): string => {
  if (!phone) return '';
  return phone.replace(/-/g, '');
};

/**
 * 文字列をCSVのセル仕様に合わせてエスケープします。
 * （ダブルクォーテーション、カンマ、改行が含まれる場合は全体をダブルクォーテーションで囲み、
 *  内部のダブルクォーテーションを2重化する）
 * @param str - 対象の文字列
 * @returns エスケープ済みの文字列
 */
export const escapeCsv = (str: string | number | boolean | undefined | null): string => {
  if (str === undefined || str === null) return '';
  const s = String(str);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

/**
 * ヘッダー配列と値配列からCSV文字列 (1行目:ヘッダー, 2行目:データ) を生成します。
 * @param headersArr - ヘッダーの配列
 * @param valuesArr - 値の配列
 * @returns 生成されたCSV文字列
 */
export const createCsvString = (headersArr: string[], valuesArr: string[]): string => {
  const hLine = headersArr.map(escapeCsv).join(',');
  const vLine = valuesArr.map(escapeCsv).join(',');
  return hLine + '\r\n' + vLine + '\r\n';
};

/**
 * Unicode文字列を Shift_JIS (cp932) のBlobに変換します。
 * Excel等で文字化けせずに開けるようにするための処理です。
 * @param str - 変換対象のUnicode文字列
 * @returns Shift_JIS でエンコードされたBlobオブジェクト
 */
export const strToShiftJISBlob = (str: string): Blob => {
  // Unicodeの文字列を配列に変換
  const unicodeArray = encoding.stringToCode(str);
  // Shift_JISに変換
  const sjisArray = encoding.convert(unicodeArray, {
    to: 'SJIS',
    from: 'UNICODE'
  });
  // Blobとして返す
  return new Blob([new Uint8Array(sjisArray)], { type: 'text/csv;charset=Shift_JIS' });
};
