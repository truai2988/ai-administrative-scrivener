import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { Foreigner, ForeignerStatus, ApprovalStatus } from '@/types/database';
import { mapApplicationStatusToApprovalStatus } from '@/lib/utils/firestoreUtils';


/**
 * 申請書のステータスを外国人台帳（Foreigner）の表示ステータスに変換する
 */
export function mapApplicationStatusToForeignerStatus(appStatus: string): ForeignerStatus {
  switch (appStatus) {
    case 'draft':          return '準備中';
    case 'editing':        return '編集中';
    case 'pending_review': return 'チェック中';
    case 'approved':       return '申請済';
    default:               return '準備中';
  }
}

/**
 * 更新申請書データを外国人台帳（Foreigner）データへマッピングする関数
 *
 * ※ name フィールドは空文字を返す。「名称未設定」は使わない。
 *    呼び出し側の _syncForeignerMaster で isValidPersonName チェックにより
 *    空レコードの生成を防いでいる。
 */
export function mapFormDataToForeigner(
  formData: RenewalApplicationFormData,
  applicationId: string,
  appStatus: string
): Partial<Foreigner> {
  const fInfo = formData.foreignerInfo;
  const eInfo = formData.employerInfo;

  return {
    // ③ '名称未設定' フォールバックをやめ、空文字を返すよう修正
    name: fInfo.nameKanji || fInfo.nameEn || '',
    residenceCardNumber: fInfo.residenceCardNumber || '',
    expiryDate: fInfo.stayExpiryDate || '',
    birthDate: fInfo.birthDate || '',
    nationality: fInfo.nationality || '',
    gender: fInfo.gender || '',
    address: `${fInfo.japanPrefecture || ''}${fInfo.japanCity || ''}${fInfo.japanAddressLines || ''}`,
    residenceCardFrontUrl: '',
    photoUrl: '',

    // 申請書の関連付け
    current_application_id: applicationId,
    current_status: appStatus,
    status: mapApplicationStatusToForeignerStatus(appStatus),

    // ② 共通関数に統一
    approvalStatus: mapApplicationStatusToApprovalStatus(appStatus) as ApprovalStatus,

    // 企業情報
    company: eInfo.companyNameJa || '',
    jobTitle: eInfo.mainJobType || '',
    visaType: fInfo.currentResidenceStatus || '',
  };
}

/**
 * 認定証明書交付申請書データを外国人台帳（Foreigner）データへマッピングする関数
 */
export function mapCoeFormDataToForeigner(
  formData: CoeApplicationFormData,
  applicationId: string,
  appStatus: string
): Partial<Foreigner> {
  const iInfo = formData.identityInfo;
  const eInfo = formData.employerInfo;

  return {
    // ③ '名称未設定' フォールバックをやめ、空文字を返すよう修正
    name: iInfo.nameKanji || iInfo.nameEn || '',
    passportNumber: iInfo.passportNumber || '',
    birthDate: iInfo.birthDate || '',
    nationality: iInfo.nationality || '',
    gender: iInfo.gender || '',
    address: `${iInfo.japanPrefecture || ''}${iInfo.japanCity || ''}${iInfo.japanAddressLines || ''}`,

    // 申請書の関連付け
    current_application_id: applicationId,
    current_status: appStatus,
    status: mapApplicationStatusToForeignerStatus(appStatus),

    // ② 共通関数に統一
    approvalStatus: mapApplicationStatusToApprovalStatus(appStatus) as ApprovalStatus,

    // 企業情報
    company: eInfo?.companyNameJa || '',
    jobTitle: eInfo?.mainIndustry || '',
    visaType: iInfo.entryPurpose || '',
  };
}

/**
 * 在留資格変更許可申請書データを外国人台帳（Foreigner）データへマッピングする関数
 */
export function mapChangeOfStatusFormDataToForeigner(
  formData: ChangeOfStatusApplicationFormData,
  applicationId: string,
  appStatus: string
): Partial<Foreigner> {
  const fInfo = formData.foreignerInfo;
  const eInfo = formData.employerInfo;

  return {
    // ③ '名称未設定' フォールバックをやめ、空文字を返すよう修正
    name: fInfo.nameKanji || fInfo.nameEn || '',
    residenceCardNumber: fInfo.residenceCardNumber || '',
    passportNumber: fInfo.passportNumber || '',
    expiryDate: fInfo.stayExpiryDate || '',
    birthDate: fInfo.birthDate || '',
    nationality: fInfo.nationality || '',
    gender: fInfo.gender || '',
    address: `${fInfo.japanPrefecture || ''}${fInfo.japanCity || ''}${fInfo.japanAddressLines || ''}`,

    // 申請書の関連付け
    current_application_id: applicationId,
    current_status: appStatus,
    status: mapApplicationStatusToForeignerStatus(appStatus),

    // ② 共通関数に統一
    approvalStatus: mapApplicationStatusToApprovalStatus(appStatus) as ApprovalStatus,

    // 企業情報
    company: eInfo?.companyNameJa || '',
    jobTitle: eInfo?.mainJobType || '',
    visaType: fInfo.currentResidenceStatus || '',
  };
}
