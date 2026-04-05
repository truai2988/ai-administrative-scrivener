/**
 * aiExtractedToFormData.ts
 *
 * 2段構えOCRアーキテクチャの「変換レイヤー」。
 *
 * ■ フェーズ2（MVP）: Google Cloud Document AI（汎用OCR）の出力を
 *   RenewalApplicationFormData のスキーマにマッピングする。
 *
 * ■ 設計方針:
 *   - このファイルが「AIレスポンス → 申請書フォーム」の唯一の変換ポイント。
 *   - プロセッサを CDE（カスタム抽出）に差し替えた場合も、
 *     ここのマッピングロジックを更新するだけで対応できる疎結合設計。
 */

import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import type { protos } from '@google-cloud/documentai';

// ─── 型エイリアス ──────────────────────────────────────────────────────────────
type IDocument   = protos.google.cloud.documentai.v1.IDocument;
type IEntity     = protos.google.cloud.documentai.v1.Document.IEntity;

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

// ─── 日付正規化ユーティリティ ─────────────────────────────────────────────────

/** 和暦 → 西暦 変換テーブル */
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

  // 和暦: 令和6年3月15日 / 令和6.3.15 / R6.3.15
  const wareki = raw.match(/^(令和|平成|昭和|大正|明治)(\d{1,2})年(\d{1,2})月(\d{1,2})日$/);
  if (wareki) {
    const base = ERA_TABLE[wareki[1]];
    const year = base + parseInt(wareki[2], 10);
    return `${year}-${wareki[3].padStart(2, '0')}-${wareki[4].padStart(2, '0')}`;
  }

  // 2028 年12月1日（スペース・年月日混在）
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
 * 形式: AL1234567890 (英2+数8+英2 = 12文字)
 */
export function normalizeResidenceCardNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  const cleaned = raw.replace(/[\s\-]/g, '').toUpperCase();
  // 末尾2桁が欠けているケース（番号の一部しか読めなかった場合）はそのまま渡す
  return cleaned;
}

/**
 * 旅券番号を正規化する（スペース除去・大文字化）。
 * 形式: AA1234567 など英数7〜9桁
 */
function normalizePassportNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/\s/g, '').toUpperCase();
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
    _extractFromEntities(document.entities, formData, extractedFields);
  }

  // ── テキストベースの抽出（汎用 Document OCR 向け） ────────────────────
  // entity から抽出できなかったフィールドを正規表現で補完
  const fullText = document.text ?? '';
  if (fullText) {
    _extractFromRawText(fullText, formData, extractedFields);
  }

  // ── 平均信頼度の計算 ─────────────────────────────────────────────────
  const avgConfidence = extractedFields.length > 0
    ? extractedFields.reduce((sum, f) => sum + f.confidence, 0) / extractedFields.length
    : 0;

  return { formData, extractedFields, confidence: avgConfidence };
}

// ─── Entity ベース抽出 ────────────────────────────────────────────────────────

function _extractFromEntities(
  entities: IEntity[],
  formData: Partial<RenewalApplicationFormData['foreignerInfo']>,
  fields: OcrExtractedField[]
): void {
  for (const entity of entities) {
    const type  = entity.type ?? '';
    const raw   = entity.mentionText ?? entity.normalizedValue?.text ?? '';
    const conf  = entity.confidence ?? 0;

    switch (type.toLowerCase()) {
      case 'given-name':
      case 'first-name':
      case 'given_name': {
        // 姓名はひとまず nameEn に結合（別途分割ロジックを確認）
        const current = formData.nameEn ?? '';
        formData.nameEn = current ? `${raw.trim()} ${current}` : raw.trim();
        _pushField(fields, 'foreignerInfo.nameEn', raw, formData.nameEn, conf);
        break;
      }
      case 'family-name':
      case 'last-name':
      case 'family_name': {
        const current = formData.nameEn ?? '';
        formData.nameEn = current ? `${current} ${raw.trim()}` : raw.trim();
        _pushField(fields, 'foreignerInfo.nameEn', raw, formData.nameEn, conf);
        break;
      }
      case 'name':
      case 'full-name':
      case 'full_name': {
        formData.nameEn = raw.trim();
        _pushField(fields, 'foreignerInfo.nameEn', raw, raw.trim(), conf);
        break;
      }
      case 'date-of-birth':
      case 'birth_date':
      case 'birthday': {
        const normalized = normalizeDate(raw);
        if (normalized) {
          formData.birthDate = normalized;
          _pushField(fields, 'foreignerInfo.birthDate', raw, normalized, conf);
        }
        break;
      }
      case 'nationality':
      case 'country': {
        formData.nationality = raw.trim();
        _pushField(fields, 'foreignerInfo.nationality', raw, raw.trim(), conf);
        break;
      }
      case 'document-id':
      case 'card_number':
      case 'residence_card_number': {
        const normalized = normalizeResidenceCardNumber(raw);
        if (normalized) {
          formData.residenceCardNumber = normalized;
          _pushField(fields, 'foreignerInfo.residenceCardNumber', raw, normalized, conf);
        }
        break;
      }
      case 'expiration-date':
      case 'expiry_date':
      case 'expiration_date': {
        const normalized = normalizeDate(raw);
        if (normalized) {
          formData.stayExpiryDate = normalized;
          _pushField(fields, 'foreignerInfo.stayExpiryDate', raw, normalized, conf);
        }
        break;
      }
      case 'passport-number':
      case 'passport_number': {
        const normalized = normalizePassportNumber(raw);
        if (normalized) {
          formData.passportNumber = normalized;
          _pushField(fields, 'foreignerInfo.passportNumber', raw, normalized, conf);
        }
        break;
      }
      case 'address': {
        formData.japanAddress = raw.trim();
        _pushField(fields, 'foreignerInfo.japanAddress', raw, raw.trim(), conf);
        break;
      }
      case 'residence-status':
      case 'visa_type':
      case 'status_of_residence': {
        formData.currentResidenceStatus = raw.trim();
        _pushField(fields, 'foreignerInfo.currentResidenceStatus', raw, raw.trim(), conf);
        break;
      }
    }
  }
}

// ─── 正規表現ベース抽出（汎用OCR テキスト全文から） ──────────────────────────

function _extractFromRawText(
  text: string,
  formData: Partial<RenewalApplicationFormData['foreignerInfo']>,
  fields: OcrExtractedField[]
): void {
  // 在留カード番号: 英2桁 + 数字8桁 + 英2桁
  if (!formData.residenceCardNumber) {
    const cardMatch = text.match(/\b([A-Z]{2}\d{8}[A-Z]{2})\b/);
    if (cardMatch) {
      formData.residenceCardNumber = cardMatch[1];
      _pushField(fields, 'foreignerInfo.residenceCardNumber', cardMatch[1], cardMatch[1], 0.7);
    }
  }

  // パスポート番号: 英字2桁+数字7桁 または 英字1桁+数字8桁 等
  if (!formData.passportNumber) {
    const ppMatch = text.match(/\b([A-Z]{1,2}\d{7,8})\b/);
    if (ppMatch) {
      formData.passportNumber = ppMatch[1];
      _pushField(fields, 'foreignerInfo.passportNumber', ppMatch[1], ppMatch[1], 0.6);
    }
  }

  // 在留資格（特定技能、技術・人文知識・国際業務 など）
  if (!formData.currentResidenceStatus) {
    const statusPatterns = [
      /在留資格[：:]\s*(.+?)(?:\n|$)/,
      /(特定技能[12号]*|技術[・\/]人文知識[・\/]国際業務|経営[・\/]管理|技能実習[123号]*|留学|家族滞在|永住者|定住者|日本人の配偶者等|高度専門職[12号]*)/,
    ];
    for (const pattern of statusPatterns) {
      const m = text.match(pattern);
      if (m) {
        formData.currentResidenceStatus = m[1].trim();
        _pushField(fields, 'foreignerInfo.currentResidenceStatus', m[1], m[1].trim(), 0.65);
        break;
      }
    }
  }

  // 在留期間の満了日（日本語書式）
  if (!formData.stayExpiryDate) {
    const expiryPatterns = [
      /在留期限[：:]\s*([\d年月日\s\/\.\-]+)/,
      /満了日[：:]\s*([\d年月日\s\/\.\-]+)/,
      /有効期限[：:]\s*([\d年月日\s\/\.\-]+)/,
    ];
    for (const pattern of expiryPatterns) {
      const m = text.match(pattern);
      if (m) {
        const normalized = normalizeDate(m[1].trim());
        if (normalized) {
          formData.stayExpiryDate = normalized;
          _pushField(fields, 'foreignerInfo.stayExpiryDate', m[1], normalized, 0.7);
          break;
        }
      }
    }
  }

  // 国籍（国籍/地域 ラベルの次に来る値）
  if (!formData.nationality) {
    const natMatch = text.match(/国籍[・\/地域]*[：:]\s*(.+?)(?:\n|$)/);
    if (natMatch) {
      formData.nationality = natMatch[1].trim();
      _pushField(fields, 'foreignerInfo.nationality', natMatch[1], natMatch[1].trim(), 0.7);
    }
  }

  // 生年月日
  if (!formData.birthDate) {
    const birthPatterns = [
      /生年月日[：:]\s*([\d年月日\s\/\.\-]+)/,
      /Date\s+of\s+Birth[：:]\s*([\d\/\.\-]+)/i,
    ];
    for (const pattern of birthPatterns) {
      const m = text.match(pattern);
      if (m) {
        const normalized = normalizeDate(m[1].trim());
        if (normalized) {
          formData.birthDate = normalized;
          _pushField(fields, 'foreignerInfo.birthDate', m[1], normalized, 0.7);
          break;
        }
      }
    }
  }
}

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function _pushField(
  fields: OcrExtractedField[],
  fieldPath: string,
  rawValue: string,
  normalizedValue: string,
  confidence: number
): void {
  // 同一 fieldPath は上書きせず最初の高信頼度エントリを優先
  const existing = fields.find(f => f.fieldPath === fieldPath);
  if (existing) {
    if (confidence > existing.confidence) {
      existing.rawValue = rawValue;
      existing.normalizedValue = normalizedValue;
      existing.confidence = confidence;
    }
    return;
  }
  fields.push({ fieldPath, rawValue, normalizedValue, confidence });
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
