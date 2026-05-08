/**
 * types.ts
 * テンプレート登録システム — 共通型定義
 *
 * パーサー → AI解析 → コード生成 の各フェーズで使用する型を一元定義する。
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ① パーサー出力型（Excel / Word 共通）
// ═══════════════════════════════════════════════════════════════════════════════

/** 入力フィールドの型 */
export type FieldInputType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'unknown';

/** パーサーが抽出した個別フィールド */
export interface ParsedField {
  /** 日本語ラベル（例: "国籍・地域"） */
  label: string;
  /** 所属セクション（例: "身分事項"） */
  section: string;
  /** セル参照（例: "B5"）— Excel の場合 */
  cellRef?: string;
  /** シート名 — Excel の場合 */
  sheetName?: string;
  /** 入力タイプの推定 */
  inputType: FieldInputType;
  /** ドロップダウン選択肢（データバリデーションから抽出） */
  dropdownOptions?: string[];
  /** 入力文字数上限（推定） */
  maxLength?: number;
  /** 必須推定（ラベルに「*」「必須」「※」等がある場合） */
  required?: boolean;
  /** 繰り返し項目の場合のメタデータ */
  repeatable?: {
    maxCount: number;
    groupKey: string;
  };
  /** 元データのヒント情報（記載例の値など） */
  exampleValue?: string;
}

/** パーサーが出力するフォーム全体の構造 */
export interface ParsedFormStructure {
  /** 書類名（シート名やファイル名から推定） */
  title: string;
  /** 抽出されたフィールド一覧 */
  fields: ParsedField[];
  /** シート名一覧（Excel の場合） */
  sheets: string[];
  /** AI解析用のテキストダンプ（全セルテキストの連結） */
  rawText: string;
  /** ソースファイルのパス */
  sourceFile: string;
  /** パーサーの種別 */
  sourceType: 'excel' | 'word' | 'pdf';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ② AI 解析出力型
// ═══════════════════════════════════════════════════════════════════════════════

/** AI が推定した個別フィールドの定義 */
export interface AnalyzedField {
  /** camelCase の英語キー（例: "nationality", "birthDate"） */
  fieldKey: string;
  /** 日本語ラベル */
  label: string;
  /** Zod の型表現（例: "z.string()", "z.enum(['1','2'])"） */
  zodType: string;
  /** バリデーションルール */
  validation: {
    maxLength?: number;
    minLength?: number;
    regex?: string;
    regexDescription?: string;
  };
  /** 対応する CSV ヘッダー名（入管仕様の日本語、`_` 区切り） */
  csvHeader: string;
  /** 所属セクションの camelCase キー */
  sectionKey: string;
  /** 必須フィールドか */
  isRequired: boolean;
  /** 繰り返し可能か（z.array で定義すべきか） */
  isRepeatable: boolean;
  /** 繰り返しの最大件数 */
  repeatMax?: number;
  /** enum 値（選択肢がある場合） */
  enumValues?: string[];
  /** .describe() に付与する説明文 */
  description: string;
  /** CSV仕様コメント（例: "半角英数字、12文字以内"） */
  csvSpec?: string;
  /** AIによって推論された、他のフィールドから自動計算される項目か */
  isComputed?: boolean;
  /** 計算ロジックに必要な依存フィールドのキー配列（例: ["amountA", "amountB"]） */
  dependencies?: string[];
  /** 計算ロジックのJS関数の文字列表現（例: "(A, B) => Number(A || 0) + Number(B || 0)"） */
  computedLogic?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ③ UI Config 出力型 (Schema-Driven UI 用)
// ═══════════════════════════════════════════════════════════════════════════════

export interface ComputedRule {
  targetField: string;
  dependencies: string[];
  logic: string;
}

export interface UiSection {
  sectionKey: string;
  sectionLabel: string;
  fields: { fieldKey: string; label: string; inputType: string }[];
}

export interface FormUiConfig {
  formKey: string;
  formName: string;
  sections: UiSection[];
  computedRules: ComputedRule[];
  /** AI推論による初期フィールドマッピング（breadcrumbKey → sectionKey.fieldKey） */
  fieldMappings?: Record<string, string>;
}

/** AI が推定したセクション定義 */
export interface AnalyzedSection {
  /** camelCase のセクションキー（例: "identityInfo"） */
  sectionKey: string;
  /** 日本語セクション名 */
  sectionLabel: string;
  /** セクション内のフィールド一覧 */
  fields: AnalyzedField[];
}

/** AI が推定した CSV ファイル定義 */
export interface AnalyzedCsvFile {
  /** CSV ファイル名（例: "申請情報入力(在留資格認定証明書交付申請).csv"） */
  fileName: string;
  /** ヘッダー数 */
  headerCount: number;
  /** ヘッダー一覧（順序通り） */
  headers: string[];
}

/** AI 解析の最終出力 */
export interface AnalyzedFormDefinition {
  /** フォーム名（日本語） */
  formName: string;
  /** フォームキー（camelCase、例: "coeApplication"） */
  formKey: string;
  /** セクション一覧 */
  sections: AnalyzedSection[];
  /** CSV ファイル定義一覧 */
  csvFiles: AnalyzedCsvFile[];
  /** 元のFirestoreテンプレートID（もしあれば） */
  templateId?: string;
  /** AI推論による初期フィールドマッピング（breadcrumbKey → sectionKey.fieldKey） */
  initialFieldMappings?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ③ CLI オプション
// ═══════════════════════════════════════════════════════════════════════════════

/** 出力モード: csv = CSV出力, pdf = Excel差し込み, word = Word差し込み */
export type OutputType = 'csv' | 'pdf' | 'word';

export interface GenerateOptions {
  /** Firestore上のformId (例: tpl_gn85kj7p) */
  id?: string;
  /** 入力ファイルパス（Excel or Word） */
  input?: string;
  /** 申請種別のキー名（camelCase、例: "specifiedSkilledWorker"） */
  name?: string;
  /** 日本語ラベル（例: "特定技能ビザ申請"） */
  label?: string;
  /** 出力モード（csv: CSV出力, pdf: Excel差し込み, word: Word差し込み） */
  type: OutputType;
  /** 記載例 PDF パス（任意） */
  example?: string;
  /** 出力先ディレクトリ（デフォルト: "./generated/"） */
  output: string;
  /** AI解析をスキップし、パーサー結果のみ表示するか */
  parseOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ④ Excel 差し込み用型定義
// ═══════════════════════════════════════════════════════════════════════════════

/** パーサーのフィールドと AI 解析結果を結合した、セル書き込み用マッピング */
export interface CellMapping {
  /** シート名 */
  sheetName: string;
  /** セル番地（例: "B5"） */
  cellRef: string;
  /** データアクセスパス（例: "data.identityInfo?.nationality"） */
  accessPath: string;
  /** 日本語ラベル */
  label: string;
  /** フィールドキー */
  fieldKey: string;
  /** セクションキー */
  sectionKey: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⑤ Word 差し込み用型定義
// ═══════════════════════════════════════════════════════════════════════════════

/** Word文書から抽出されたテキスト要素 */
export interface WordTextElement {
  /** テキスト内容 */
  text: string;
  /** 構造タイプ（見出し・段落・表セル・リスト項目） */
  type: 'heading' | 'paragraph' | 'tableCell' | 'listItem';
  /** 階層レベル（見出しの場合: 1-6） */
  level?: number;
  /** 表の行番号（表セルの場合） */
  tableRow?: number;
  /** 表の列番号（表セルの場合） */
  tableCol?: number;
  /** 表のインデックス（複数表がある場合） */
  tableIndex?: number;
}

/** Word差し込み用プレースホルダーマッピング */
export interface WordPlaceholderMapping {
  /** docxtemplaterのタグ名（例: "identityInfo.applicantName"） */
  tag: string;
  /** Zodスキーマのアクセスパス（例: "data.identityInfo?.applicantName"） */
  accessPath: string;
  /** 日本語ラベル */
  label: string;
  /** フィールドキー */
  fieldKey: string;
  /** セクションキー */
  sectionKey: string;
}

