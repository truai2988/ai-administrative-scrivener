/**
 * index.ts  ── mappers パッケージの統合エントリポイント
 *
 * フロントエンドや API ルートからは、このファイルを経由してマッパーをインポートする。
 *
 * ■ インポート例（フロントエンド側）
 *   import { mapDocumentAiToFormData } from '@/lib/mappers';
 *   import { mapForeignerProfileToFormData } from '@/lib/mappers';
 *
 * ■ 責務
 *   - このパッケージのパブリック API を一元的に再エクスポートする。
 *   - 内部のファイル構造が変わっても、このファイルのエクスポートが変わらなければ
 *     フロントエンド側の修正は不要になる（疎結合）。
 */

// ── Document AI → フォームデータ マッパー（OCR連携） ────────────────────────
export type { OcrExtractedField, OcrMappingResult, AiExtractedData } from './aiExtractedToFormData';
export {
  mapDocumentAiToFormData,
  mapAiExtractedToFormData,
  countMappedFields,
  // 後方互換のため normalizers も再エクスポート
  normalizeDate,
  normalizeResidenceCardNumber,
} from './aiExtractedToFormData';

// ── 台帳プロフィール → フォームデータ マッパー ────────────────────────────────
export { mapForeignerProfileToFormData } from './foreignerToFormData';
