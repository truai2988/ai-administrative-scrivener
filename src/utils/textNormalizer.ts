/**
 * textNormalizer.ts
 *
 * Click-to-Fill でフォームフィールドへ代入する前に、
 * AI 抽出テキストをフィールドの命名規則に基づいて自動整形する正規化レイヤー。
 *
 * Zod スキーマが .regex() で厳格な文字種・フォーマットを要求しているため、
 * OCR が返す「人間に読みやすい形式」を「バリデーション通過形式」に変換する。
 *
 * 例:
 *   "1990-03-15"  → "19900315"  （日付フィールド）
 *   "106-0032"    → "1060032"   （郵便番号フィールド）
 *   "¥250,000"    → "250000"    （金額フィールド）
 *   "Ｊｏｈｎ"    → "John"       （全角→半角変換）
 *   "john doe"    → "JOHN DOE"  （英字名フィールド → 大文字化）
 */

// ============================================================
// 基礎変換: 全角 → 半角
// ============================================================

/**
 * 全角英数字・記号を半角に変換する。
 * Unicode の Fullwidth Latin (FF01-FF5E) を対応する ASCII (0021-007E) に変換。
 * 全角スペース (U+3000) も半角スペースに変換。
 */
function toHalfWidth(str: string): string {
  return str
    .replace(/[\uff01-\uff5e]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/\u3000/g, ' ');
}

// ============================================================
// フィールド名パターンマッチング
// ============================================================

/** フィールドパスの末端セグメント（最後の . 以降）を取得 */
function getFieldSegment(fieldName: string): string {
  const parts = fieldName.split('.');
  return parts[parts.length - 1];
}

/** 大文字小文字を無視してキーワードがフィールド名に含まれるか判定 */
function fieldMatches(fieldName: string, keywords: string[]): boolean {
  const segment = getFieldSegment(fieldName).toLowerCase();
  return keywords.some((kw) => segment.includes(kw.toLowerCase()));
}

// ============================================================
// 個別正規化ルール
// ============================================================

/**
 * 日付正規化: 数字以外をすべて除去し、8桁の YYYYMMDD に変換。
 *
 * 対応パターン:
 *   "1990-03-15" → "19900315"
 *   "1990/03/15" → "19900315"
 *   "1990年3月15日" → "19900315"
 *   "March 15, 1990" → そのまま（数字だけ取ると意味が壊れるため非介入）
 *
 * 6桁日付 (YYYYMM) フィールドにも対応。
 */
function normalizeDateField(value: string, fieldName: string): string {
  // 数字以外をすべて除去
  const digitsOnly = value.replace(/\D/g, '');

  // フィールド名で6桁（YYYYMM）か8桁（YYYYMMDD）かを判定
  const segment = getFieldSegment(fieldName).toLowerCase();
  const is6Digit =
    segment.includes('graduation') ||
    segment.includes('startdate') ||
    segment.includes('enddate') ||
    segment.includes('yearmonth');

  if (is6Digit && digitsOnly.length >= 6) {
    return digitsOnly.slice(0, 6);
  }

  if (digitsOnly.length >= 8) {
    return digitsOnly.slice(0, 8);
  }

  // 桁数が足りない場合はそのまま返す（Zod が検出する）
  return digitsOnly;
}

/**
 * 郵便番号正規化: ハイフンや記号を除去し、半角数字のみにする。
 *
 * "106-0032" → "1060032"
 * "〒106-0032" → "1060032"
 */
function normalizePostalCode(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/**
 * 電話番号正規化: ハイフン・カッコ・スペースを除去し、半角数字のみにする。
 *
 * "03-1234-5678" → "0312345678"
 * "(03) 1234-5678" → "0312345678"
 */
function normalizePhoneNumber(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/**
 * 数値正規化: 通貨記号・カンマ・単位を除去し、半角数字のみにする。
 *
 * "¥250,000" → "250000"
 * "1,234,567円" → "1234567"
 */
function normalizeNumericField(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/**
 * 英字大文字化: 英字名フィールドでは大文字に変換。
 *
 * "john doe" → "JOHN DOE"
 * "John Doe" → "JOHN DOE"
 */
function normalizeNameEn(value: string): string {
  return value.toUpperCase();
}

// ============================================================
// メイン正規化関数
// ============================================================

/**
 * normalizeForField
 *
 * フィールド名のパターンに基づいて、適切な正規化ルールを適用する。
 * 全てのテキストはまず全角→半角変換を通過する。
 *
 * @param value     AI 抽出の生テキスト
 * @param fieldName React Hook Form のフィールドパス (例: "identityInfo.birthDate")
 * @returns         正規化済みテキスト
 */
export function normalizeForField(value: string, fieldName: string): string {
  // Step 1: 全角 → 半角（全フィールド共通）
  let normalized = toHalfWidth(value);

  // Step 2: フィールド名に基づく個別ルール
  const segment = getFieldSegment(fieldName).toLowerCase();

  // --- 日付フィールド ---
  if (fieldMatches(fieldName, ['date', 'Date', 'birthDate', 'expiryDate', 'entryDate', 'departureDate', 'licenseDate', 'graduationDate'])) {
    normalized = normalizeDateField(normalized, fieldName);
  }
  // --- 郵便番号 ---
  else if (fieldMatches(fieldName, ['zipCode', 'postalCode', 'zipcode'])) {
    normalized = normalizePostalCode(normalized);
  }
  // --- 電話番号 ---
  else if (fieldMatches(fieldName, ['phone', 'tel', 'mobile', 'fax'])) {
    normalized = normalizePhoneNumber(normalized);
  }
  // --- 金額・数値系 ---
  else if (
    fieldMatches(fieldName, [
      'salary', 'capital', 'revenue', 'count', 'number',
      'monthlySalary', 'annualRevenue', 'employeeCount',
      'foreignEmployeeCount', 'fullTimeEmployeeCount',
      'period', 'years', 'amount', 'fee',
    ])
  ) {
    // ただし corporateNumber や passportNumber 等の「番号」は数字化しない
    if (!fieldMatches(fieldName, ['corporateNumber', 'passportNumber', 'insuranceNumber', 'residenceCardNumber'])) {
      normalized = normalizeNumericField(normalized);
    }
  }
  // --- 英字名（大文字化が必要なフィールド） ---
  else if (segment === 'nameen' || segment === 'companynameen') {
    normalized = normalizeNameEn(normalized);
  }
  // --- 年 (YYYY 4桁) ---
  else if (fieldMatches(fieldName, ['startYear', 'endYear', 'competitionYear'])) {
    const digits = normalized.replace(/\D/g, '');
    if (digits.length >= 4) {
      normalized = digits.slice(0, 4);
    } else {
      normalized = digits;
    }
  }

  return normalized;
}

// ============================================================
// セレクトボックス用: 部分一致フォールバック検索
// ============================================================

/**
 * findBestOptionMatch
 *
 * セレクトボックスの options から、抽出テキストに最も近い選択肢を返す。
 *
 * 検索優先度:
 *   1. 完全一致 (value)
 *   2. 完全一致 (label)
 *   3. value の部分一致
 *   4. label の部分一致
 *   5. トークンマッチング（抽出テキストを分割し、各トークンで label を検索）
 *   6. マッチなし → null
 *
 * トークンマッチングにより、以下のケースをカバー:
 *   "アメリカ合衆国" → "米国 United States of America" (Americaで一致)
 *   "United States"  → "米国 United States of America" (United Statesで一致)
 *
 * @param extractedValue AI 抽出テキスト
 * @param options        <select> の option 要素から取得した {value, label}[]
 * @returns              マッチした option の value、または null
 */
export function findBestOptionMatch(
  extractedValue: string,
  options: { value: string; label: string }[],
): string | null {
  const normalized = toHalfWidth(extractedValue).trim().toLowerCase();

  // 1. value 完全一致
  const exactValue = options.find((o) => o.value.toLowerCase() === normalized);
  if (exactValue) return exactValue.value;

  // 2. label 完全一致
  const exactLabel = options.find((o) => o.label.toLowerCase() === normalized);
  if (exactLabel) return exactLabel.value;

  // 3. value 部分一致
  const partialValue = options.find(
    (o) =>
      o.value.toLowerCase().includes(normalized) ||
      normalized.includes(o.value.toLowerCase()),
  );
  if (partialValue) return partialValue.value;

  // 4. label 部分一致
  const partialLabel = options.find(
    (o) =>
      o.label.toLowerCase().includes(normalized) ||
      normalized.includes(o.label.toLowerCase()),
  );
  if (partialLabel) return partialLabel.value;

  // 5. トークンマッチング
    //    抽出テキストを意味のある単位に分割し、各トークンで label を検索。
    //    国名の異表記（アメリカ合衆国 ↔ 米国 United States of America）をカバー。
    //    さらに、ラベル側からもトークンを抽出し、先頭一致で近似マッチング。
  const tokens = extractTokens(normalized);
  if (tokens.length > 0) {
    // 各 option に対し、マッチしたトークン数をスコアとして計算
    let bestMatch: { value: string; score: number } | null = null;
    for (const opt of options) {
      const labelLower = opt.label.toLowerCase();
      const labelTokens = extractTokens(labelLower);
      let score = 0;

      for (const token of tokens) {
        if (token.length < 2) continue;

        // 直接部分一致
        if (labelLower.includes(token)) {
          score += 2; // 完全な部分一致は高スコア
          continue;
        }

        // ラベルトークンとの先頭一致（prefix match, 4文字以上）
        // 例: "amerika" と "america" → 共通プレフィックス "ameri" (5文字) → マッチ
        for (const lt of labelTokens) {
          if (lt.length < 4 || token.length < 4) continue;
          const prefixLen = commonPrefixLength(token, lt);
          if (prefixLen >= 4) {
            score += 1; // プレフィックスマッチは通常スコア
            break;
          }
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { value: opt.value, score };
      }
    }
    if (bestMatch) return bestMatch.value;
  }

  // 6. マッチなし
  return null;
}

/**
 * 2つの文字列の共通プレフィックスの長さを返す。
 * 例: commonPrefixLength("amerika", "america") → 5 ("ameri")
 */
function commonPrefixLength(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let i = 0;
  while (i < len && a[i] === b[i]) i++;
  return i;
}

/**
 * 抽出テキストを検索用トークンに分割するヘルパー。
 * 日本語は文字単位でも意味を持つため、2文字以上の連続ひらがな/カタカナ/漢字も
 * トークンとして扱う。英字はスペース区切りで分割。
 *
 * さらに、カタカナ部分をローマ字化して英語ラベルとの照合を可能にする。
 *
 * "アメリカ合衆国" → ["アメリカ合衆国", "アメリカ", "合衆国", "amerika"]
 * "United States"  → ["united", "states"]
 * "ベトナム"        → ["ベトナム", "betonamu"]
 */
function extractTokens(text: string): string[] {
  const tokens: string[] = [];

  // 英字部分をスペース区切りで分割
  const englishParts = text.match(/[a-z]+/gi);
  if (englishParts) {
    tokens.push(...englishParts.map((p) => p.toLowerCase()));
  }

  // 日本語部分（カタカナ・漢字の連続）を抽出
  const japaneseParts = text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g);
  if (japaneseParts) {
    tokens.push(...japaneseParts.map((p) => p.toLowerCase()));

    // カタカナ部分のみ個別抽出してローマ字化
    for (const part of japaneseParts) {
      const katakanaOnly = part.match(/[\u30a0-\u30ff]+/g);
      if (katakanaOnly) {
        for (const k of katakanaOnly) {
          if (k.length >= 2) {
            tokens.push(k); // カタカナ単体もトークンに
            const romaji = katakanaToRomaji(k);
            if (romaji.length >= 3) {
              tokens.push(romaji);
            }
          }
        }
      }
    }
  }

  return tokens;
}

// ============================================================
// カタカナ → ローマ字変換
// ============================================================

/**
 * カタカナ文字列を簡易ローマ字に変換する。
 * 完全な音韻変換ではなく、英語ラベルとの部分一致検索用の近似変換。
 *
 * "アメリカ" → "amerika"
 * "ベトナム" → "betonamu"
 * "フィリピン" → "firipin"
 */
function katakanaToRomaji(katakana: string): string {
  const map: Record<string, string> = {
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'サ': 'sa', 'シ': 'si', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'タ': 'ta', 'チ': 'ti', 'ツ': 'tu', 'テ': 'te', 'ト': 'to',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'hu', 'ヘ': 'he', 'ホ': 'ho',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
    'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
    'ザ': 'za', 'ジ': 'zi', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
    'ダ': 'da', 'ヂ': 'di', 'ヅ': 'du', 'デ': 'de', 'ド': 'do',
    'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
    'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
    // 拗音
    'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
    'シャ': 'sya', 'シュ': 'syu', 'ショ': 'syo',
    'チャ': 'tya', 'チュ': 'tyu', 'チョ': 'tyo',
    'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
    'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
    'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
    'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
    'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
    'ジャ': 'zya', 'ジュ': 'zyu', 'ジョ': 'zyo',
    'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
    'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
    // 外来語音
    'ファ': 'fa', 'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo',
    'ティ': 'ti', 'ディ': 'di', 'デュ': 'dyu',
    'ヴァ': 'va', 'ヴィ': 'vi', 'ヴ': 'vu', 'ヴェ': 've', 'ヴォ': 'vo',
    'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo',
    // 小書き・長音
    'ッ': '', // 促音（次の子音を重ねるが、簡易処理では省略）
    'ー': '',  // 長音記号
  };

  let result = '';
  let i = 0;
  while (i < katakana.length) {
    // 2文字の拗音・外来語音を先にチェック
    if (i + 1 < katakana.length) {
      const twoChar = katakana.substring(i, i + 2);
      if (map[twoChar] !== undefined) {
        result += map[twoChar];
        i += 2;
        continue;
      }
    }
    // 1文字
    const oneChar = katakana[i];
    if (map[oneChar] !== undefined) {
      result += map[oneChar];
    }
    // マップにない文字はスキップ
    i++;
  }

  return result;
}

