/**
 * extractedItem.ts
 *
 * AI書類読取（OCR / Document AI）から抽出されたデータの型定義。
 * Click-to-Fill サイドバーおよび関連フックで共通使用する。
 */

/** AI抽出データの1件分 */
export interface ExtractedItem {
  /** 一意ID */
  id: string;
  /** 抽出されたテキスト値 */
  value: string;
  /** AIが推測した階層ラベル（パンくずリスト）。nullなら推測なし */
  breadcrumb: string[] | null;
  /** 推測の確信度 (0~1)。nullなら不明 */
  confidence: number | null;
  /** マッピング済みかどうか */
  mapped: boolean;
  /** マッピング先フィールドパス */
  mappedTo: string | null;
  /** 学習辞書による自動入力で代入されたかどうか（手動 Click-to-Fill と区別） */
  autoFilled?: boolean;
}

/** マッピング履歴の1エントリ */
export interface MappingEntry {
  /** 元の抽出テキスト */
  from: string;
  /** 代入先フィールドの日本語ラベル */
  to: string;
  /** 代入した値 */
  value: string;
}
