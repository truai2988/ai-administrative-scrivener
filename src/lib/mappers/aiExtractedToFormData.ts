/**
 * aiExtractedToFormData.ts
 *
 * 2段構えOCRアーキテクチャの「変換レイヤー」オーケストレーター。
 *
 * ■ このファイルの責務
 *   - 公開インターフェース（型・関数シグネチャ）の定義
 *   - 各エクストラクターへの処理委譲
 *   - 平均信頼度の計算
 *
 * ■ ロジックの所在
 *   - 日付・番号正規化   → normalizers/dateNormalizer.ts
 *   - 外国人本人情報抽出 → extractors/foreignerExtractor.ts
 *   - 所属機関情報抽出   → extractors/employerExtractor.ts   (将来実装)
 *   - 同時申請情報抽出   → extractors/simultaneousExtractor.ts (将来実装)
 *
 * ■ 外部インターフェース
 *   このファイルのエクスポートは変更しないこと。
 *   フロントエンド（useOcrExtract など）はこのファイルのみを参照する。
 */

import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import type { protos } from '@google-cloud/documentai';

import {
  extractForeignerFromEntities,
  extractForeignerFromRawText,
} from './extractors/foreignerExtractor';
import {
  normalizeDate,
  normalizeResidenceCardNumber,
} from './normalizers/dateNormalizer';

// normalizers の再エクスポート（後方互換のため）
export { normalizeDate, normalizeResidenceCardNumber } from './normalizers/dateNormalizer';

// ─── 型エイリアス ──────────────────────────────────────────────────────────────
type IDocument = protos.google.cloud.documentai.v1.IDocument;

// ─── OCR 抽出フィールドの情報型 ───────────────────────────────────────────────
export interface OcrExtractedField {
  /** フォームのフィールド名 */
  fieldPath: string;
  /** 抽出された生の値 */
  rawValue: string;
  /** 正規化後の値 */
  normalizedValue: string;
  /** Document AI の信頼度スコア (0.0 ~ 1.0) */
  confidence: number;
}

/** mapDocumentAiToFormData の戻り値 */
export interface OcrMappingResult {
  /** react-hook-form に setValue できる部分データ */
  formData: Partial<RenewalApplicationFormData['foreignerInfo']>;
  /** 抽出されたフィールドの詳細リスト（UIハイライト用） */
  extractedFields: OcrExtractedField[];
  /** 全フィールドの平均信頼度 (0.0 ~ 1.0) */
  confidence: number;
}

// ─── 旧インターフェース（後方互換性のため残す） ────────────────────────────────
export interface AiExtractedData {
  name?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  residenceCardNumber?: string | null;
  expiryDate?: string | null;
  visaType?: string | null;
}

// ─── メイン変換関数（Document AI → フォームデータ） ─────────────────────────

/**
 * Document AI の IDocument オブジェクトをフォームスキーマにマッピングする。
 *
 * 戦略:
 * 1. document.entities（Custom Extractor / Named Entity Extractor の出力）があれば優先的に使用
 * 2. entities がなければ document.text の全文に対して正規表現マッチングで抽出
 */
export function mapDocumentAiToFormData(document: IDocument): OcrMappingResult {
  const extractedFields: OcrExtractedField[] = [];
  const formData: Partial<RenewalApplicationFormData['foreignerInfo']> = {};

  // ── Entity ベースの抽出（Custom Extractor / Identity Processor 向け） ──
  if (document.entities && document.entities.length > 0) {
    extractForeignerFromEntities(document.entities, formData, extractedFields);
  }

  // ── テキストベースの抽出（汎用 Document OCR 向け） ────────────────────
  // entity から抽出できなかったフィールドを正規表現で補完
  const fullText = document.text ?? '';
  if (fullText) {
    extractForeignerFromRawText(fullText, formData, extractedFields);
  }

  // ── 平均信頼度の計算 ─────────────────────────────────────────────────
  const avgConfidence =
    extractedFields.length > 0
      ? extractedFields.reduce((sum, f) => sum + f.confidence, 0) / extractedFields.length
      : 0;

  return { formData, extractedFields, confidence: avgConfidence };
}

// ─── 後方互換: 旧 AiExtractedData ベース API ─────────────────────────────────

/**
 * @deprecated mapDocumentAiToFormData を使用してください。
 * 旧 Gemini Vision API との後方互換のために残す。
 */
export function mapAiExtractedToFormData(
  extracted: AiExtractedData
): Partial<RenewalApplicationFormData> {
  const foreignerInfo: Partial<RenewalApplicationFormData['foreignerInfo']> = {};

  if (extracted.name) foreignerInfo.nameEn = extracted.name.trim();
  if (extracted.nationality) foreignerInfo.nationality = extracted.nationality.trim();
  if (extracted.birthDate) {
    const n = normalizeDate(extracted.birthDate);
    if (n) foreignerInfo.birthDate = n;
  }
  if (extracted.residenceCardNumber) {
    const n = normalizeResidenceCardNumber(extracted.residenceCardNumber);
    if (n) foreignerInfo.residenceCardNumber = n;
  }
  if (extracted.expiryDate) {
    const n = normalizeDate(extracted.expiryDate);
    if (n) foreignerInfo.stayExpiryDate = n;
  }
  if (extracted.visaType) foreignerInfo.currentResidenceStatus = extracted.visaType.trim();

  return { foreignerInfo: foreignerInfo as RenewalApplicationFormData['foreignerInfo'] };
}

/**
 * @deprecated extractedFields を使用してください。
 * 抽出されたフィールド数を数えるユーティリティ（後方互換）。
 */
export function countMappedFields(extracted: AiExtractedData): number {
  return [
    extracted.name,
    extracted.nationality,
    extracted.birthDate,
    extracted.residenceCardNumber,
    extracted.expiryDate,
    extracted.visaType,
  ].filter((v) => v != null && v !== '').length;
}
