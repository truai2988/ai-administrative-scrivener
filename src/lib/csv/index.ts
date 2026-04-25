import { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import { generateBasicCsv } from './generateBasicCsv';
import { generateSpecificCsv } from './generateSpecificCsv';
import { generateSimultaneousCsv } from './generateSimultaneousCsv';
import { strToShiftJISBlob } from './csvUtils';

/**
 * フォームデータから3種類のCSV（在留期間更新許可申請、区分V、同時申請）のBlobを生成します。
 * @param data - RenewalApplicationFormData のデータ
 * @returns 3つのBlobオブジェクトを含むプロミスまたはオブジェクト
 */
export const generateApplicationCsvs = async (data: RenewalApplicationFormData) => {
  // 1. 在留期間更新許可申請のCSV文字列を生成
  const basicCsvStr = generateBasicCsv(data);

  // 2. 区分V のCSV文字列を生成
  const specificCsvStr = generateSpecificCsv(data);

  // 3. 同時申請 のCSV文字列を生成
  const simultaneousCsvStr = generateSimultaneousCsv(data);

  // 文字列をShift_JISエンコーディングのBlobに変換して返却
  return {
    basicBlob: strToShiftJISBlob(basicCsvStr),
    specificBlob: strToShiftJISBlob(specificCsvStr),
    simultaneousBlob: strToShiftJISBlob(simultaneousCsvStr),
  };
};

export * from './csvUtils';
