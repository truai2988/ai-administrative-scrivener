/**
 * addressNormalizer.ts
 *
 * 住所文字列から都道府県、市区町村、それ以降の番地等に分割・正規化するユーティリティ。
 * Document AI 等から抽出された1行住所を、フォームの各項目に適切に割り振る。
 */

export interface ParsedJapanAddress {
  zipCode?: string;
  prefecture?: string;
  city?: string;
  addressLines?: string;
}

/**
 * 日本の住所文字列（例: "〒123-4567 東京都渋谷区代々木1-2-3"）をパースし、
 * 郵便番号、都道府県、市区町村、以降の住所に分割する。
 */
export function splitJapanAddress(rawAddress: string): ParsedJapanAddress {
  let address = rawAddress.trim();
  const parsed: ParsedJapanAddress = {};

  // 1. 郵便番号の抽出と除去
  // "〒"マーク、ハイフン、空白を考慮。「123-4567」または「1234567」を抽出。
  const zipMatch = address.match(/(?:〒\s*)?(\d{3})\s*[-ー]?\s*(\d{4})/);
  if (zipMatch) {
    parsed.zipCode = zipMatch[1] + zipMatch[2]; // ハイフンなしの7桁形式にする
    // 住所本文から郵便番号部分を削除
    address = address.replace(zipMatch[0], '').trim();
  }

  // 2. 都道府県の抽出
  const prefMatch = address.match(/^(東京都|北海道|京都府|大阪府|[^\s]{2,3}県)/);
  if (prefMatch) {
    parsed.prefecture = prefMatch[1];
    address = address.substring(prefMatch[1].length).trim();
  } else {
    // スペース区切りの場合などに備える（例: "東京 渋谷区"）
    const spacePrefMatch = address.match(/^([^\s]+(?:都|道|府|県))\s+/);
    if (spacePrefMatch) {
      parsed.prefecture = spacePrefMatch[1];
      address = address.substring(spacePrefMatch[0].length).trim();
    }
  }

  // 3. 市区町村の抽出
  // "郡", "市", "区", "町", "村" などのサフィックスを持つブロックを抽出。
  // 特別区や政令指定都市の区など、入れ子になった地名に注意する（例: 横浜市西区）
  const cityMatch = address.match(/^([^0-9\s]+?(市|区|町|村|郡[^\s]+?(町|村)))/);
  if (cityMatch) {
    parsed.city = cityMatch[1];
    address = address.substring(cityMatch[1].length).trim();
  }

  // 残りを番地等とする
  if (address.length > 0) {
    parsed.addressLines = address;
  }

  return parsed;
}
