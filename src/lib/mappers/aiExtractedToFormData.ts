/**
 * aiExtractedToFormData.ts
 * /api/validate-image エンドポイントが返す extractedData を
 * RenewalApplicationFormData の形にマッピングする純粋関数
 *
 * ここが唯一の「AIレスポンス → 申請書フォーム」変換レイヤー。
 * AIのレスポンス仕様が変わった場合はここだけを修正する。
 */
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';

/**
 * /api/validate-image が返す extractedData の型
 * （route.ts のプロンプトに基づく）
 */
export interface AiExtractedData {
  name?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  residenceCardNumber?: string | null;
  expiryDate?: string | null;
  visaType?: string | null;
}

/**
 * 日付文字列を YYYY-MM-DD 形式に正規化する
 * - AIが "2028/12/01" や "December 1, 2028" のように返すケースに対応
 * - 変換できない場合は空文字を返す（フォームバリデーションに委ねる）
 */
function normalizeDate(raw: string | null | undefined): string {
  if (!raw) return '';

  // すでに YYYY-MM-DD 形式
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // YYYY/MM/DD → YYYY-MM-DD
  const slashMatch = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (slashMatch) return `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`;

  // YYYY.MM.DD → YYYY-MM-DD
  const dotMatch = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (dotMatch) return `${dotMatch[1]}-${dotMatch[2]}-${dotMatch[3]}`;

  // Date() でパース試行（英語表記など）
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return '';
}

/**
 * 在留カード番号の正規化（小文字 → 大文字 / スペース除去）
 */
function normalizeResidenceCardNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/\s/g, '').toUpperCase();
}

/**
 * AIの extractedData から RenewalApplicationFormData の部分オブジェクトを生成する
 *
 * 注意: ここで生成するのは「読み取れた項目のみ」。
 * 空欄はデフォルト値（DEFAULT_VALUES）で補完される。
 * バリデーションはフォーム側の Zod スキーマに委ねる。
 */
export function mapAiExtractedToFormData(
  extracted: AiExtractedData
): Partial<RenewalApplicationFormData> {
  const foreignerInfo: Partial<RenewalApplicationFormData['foreignerInfo']> = {};

  if (extracted.name) {
    foreignerInfo.nameEn = extracted.name.trim();
  }

  if (extracted.nationality) {
    foreignerInfo.nationality = extracted.nationality.trim();
  }

  if (extracted.birthDate) {
    const normalized = normalizeDate(extracted.birthDate);
    if (normalized) foreignerInfo.birthDate = normalized;
  }

  if (extracted.residenceCardNumber) {
    const normalized = normalizeResidenceCardNumber(extracted.residenceCardNumber);
    if (normalized) foreignerInfo.residenceCardNumber = normalized;
  }

  if (extracted.expiryDate) {
    const normalized = normalizeDate(extracted.expiryDate);
    if (normalized) foreignerInfo.stayExpiryDate = normalized;
  }

  if (extracted.visaType) {
    foreignerInfo.currentResidenceStatus = extracted.visaType.trim();
  }

  return {
    foreignerInfo: foreignerInfo as RenewalApplicationFormData['foreignerInfo'],
  };
}

/**
 * extractedData から実際にマッピングされたフィールド数を数える（UI表示用）
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
