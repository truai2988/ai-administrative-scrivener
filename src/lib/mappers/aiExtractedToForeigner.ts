/**
 * aiExtractedToForeigner.ts
 *
 * /api/validate-image エンドポイントが返す extractedData を
 * Foreigner エンティティ（台帳登録用）の形にマッピングする純粋関数。
 *
 * aiExtractedToFormData.ts（申請書フォーム用）とは独立したレイヤー。
 * 新規外国人登録フロー（PC職員用）専用。
 */

import type { Foreigner } from '@/types/database';

export interface AiExtractedData {
  name?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  residenceCardNumber?: string | null;
  expiryDate?: string | null;
  visaType?: string | null;
  passportNumber?: string | null;
  // 在留カードの追加読み取り項目
  gender?: string | null;
  address?: string | null;
  workRestriction?: string | null;
  periodOfStay?: string | null;
  dateOfPermission?: string | null;
  dateOfDelivery?: string | null;
}

/** 日付を YYYY-MM-DD 形式に正規化 */
function normalizeDate(raw: string | null | undefined): string {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const slashMatch = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (slashMatch) return `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`;
  const dotMatch = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (dotMatch) return `${dotMatch[1]}-${dotMatch[2]}-${dotMatch[3]}`;
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

/**
 * 国籍名を select の value（英語表記）に正規化する。
 * AIは日本語/英語/中国語など様々な表記で返すため、統一する。
 */
function normalizeNationality(raw: string | null | undefined): string {
  if (!raw) return '';
  const r = raw.toLowerCase();
  if (r.includes('中国') || r.includes('china') || r.includes('prc'))       return 'China';
  if (r.includes('フィリピン') || r.includes('philippines') || r.includes('pilipinas')) return 'Philippines';
  if (r.includes('ベトナム') || r.includes('vietnam') || r.includes('viet nam'))  return 'Vietnam';
  if (r.includes('インドネシア') || r.includes('indonesia'))                 return 'Indonesia';
  if (r.includes('ネパール') || r.includes('nepal'))                         return 'Nepal';
  if (r.includes('ミャンマー') || r.includes('myanmar') || r.includes('burma'))   return 'Myanmar';
  if (r.includes('カンボジア') || r.includes('cambodia') || r.includes('khmer'))  return 'Cambodia';
  if (r.includes('タイ') || r.includes('thailand'))                          return 'Thailand';
  if (r.includes('インド') || r.includes('india'))                           return 'India';
  if (r.includes('スリランカ') || r.includes('sri lanka') || r.includes('srilanka')) return 'Sri Lanka';
  return raw;
}

/** 在留カード番号を大文字・スペースなしに正規化 */
function normalizeResidenceCardNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/\s/g, '').toUpperCase();
}

/**
 * AIの extractedData から Foreigner の部分オブジェクトを生成する。
 * 読み取れなかった項目は含まない（画面で手入力してもらう）。
 */
export function mapAiExtractedToForeigner(
  extracted: AiExtractedData
): Partial<Foreigner> {
  const result: Partial<Foreigner> = {};

  if (extracted.name) {
    result.name = extracted.name.trim().toUpperCase();
  }
  if (extracted.nationality) {
    const n = normalizeNationality(extracted.nationality);
    if (n) result.nationality = n;
  }
  if (extracted.birthDate) {
    const d = normalizeDate(extracted.birthDate);
    if (d) result.birthDate = d;
  }
  if (extracted.residenceCardNumber) {
    result.residenceCardNumber = normalizeResidenceCardNumber(extracted.residenceCardNumber);
  }
  if (extracted.expiryDate) {
    const d = normalizeDate(extracted.expiryDate);
    if (d) result.expiryDate = d;
  }
  if (extracted.visaType) {
    result.visaType = extracted.visaType.trim();
  }
  if (extracted.gender) {
    result.gender = extracted.gender.trim();
  }
  if (extracted.address) {
    result.address = extracted.address.trim();
  }
  if (extracted.workRestriction) {
    result.workRestriction = extracted.workRestriction.trim();
  }
  if (extracted.periodOfStay) {
    result.periodOfStay = extracted.periodOfStay.trim();
  }
  if (extracted.dateOfPermission) {
    const d = normalizeDate(extracted.dateOfPermission);
    if (d) result.dateOfPermission = d;
  }
  if (extracted.dateOfDelivery) {
    const d = normalizeDate(extracted.dateOfDelivery);
    if (d) result.dateOfDelivery = d;
  }
  if (extracted.passportNumber) {
    result.passportNumber = extracted.passportNumber.trim().toUpperCase();
  }

  return result;
}

/** マッピングされたフィールド数を返す（UI表示用） */
export function countMappedFields(extracted: AiExtractedData): number {
  return [
    extracted.name,
    extracted.nationality,
    extracted.birthDate,
    extracted.residenceCardNumber,
    extracted.expiryDate,
    extracted.visaType,
    extracted.gender,
    extracted.address,
    extracted.workRestriction,
    extracted.periodOfStay,
    extracted.dateOfPermission,
    extracted.dateOfDelivery,
    extracted.passportNumber,
  ].filter((v) => v != null && v !== '').length;
}
