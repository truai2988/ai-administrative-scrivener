import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { Foreigner, ForeignerStatus } from '@/types/database';

/**
 * 申請書のステータスを外国人台帳（Foreigner）のステータスに変換する
 */
export function mapApplicationStatusToForeignerStatus(appStatus: string): ForeignerStatus {
  switch (appStatus) {
    case 'draft':
      return '準備中';
    case 'editing':
      return '編集中';
    case 'pending_review':
      return 'チェック中';
    case 'approved':
      return '申請済';
    default:
      return '準備中';
  }
}

/**
 * 更新申請書データを外国人台帳（Foreigner）データへマッピングする関数
 */
export function mapFormDataToForeigner(
  formData: RenewalApplicationFormData,
  applicationId: string,
  appStatus: string
): Partial<Foreigner> {
  const fInfo = formData.foreignerInfo;
  const eInfo = formData.employerInfo;

  return {
    name: fInfo.nameKanji || fInfo.nameEn || '名称未設定',
    residenceCardNumber: fInfo.residenceCardNumber || '',
    expiryDate: fInfo.stayExpiryDate || '',
    birthDate: fInfo.birthDate || '',
    nationality: fInfo.nationality || '',
    gender: fInfo.gender || '',
    address: `${fInfo.japanPrefecture || ''}${fInfo.japanCity || ''}${fInfo.japanAddressLines || ''}`,
    residenceCardFrontUrl: '', // 将来的にアタッチメントから抽出
    photoUrl: '', // 将来的にアタッチメントから抽出
    
    // 申請書の関連付け
    current_application_id: applicationId,
    current_status: appStatus,
    status: mapApplicationStatusToForeignerStatus(appStatus),
    
    // 承認ステータス（申請側とリンクさせる場合）
    approvalStatus: appStatus === 'draft' ? 'draft' : 
                    appStatus === 'editing' ? 'draft' : 
                    appStatus === 'pending_review' ? 'pending_review' : 
                    appStatus === 'approved' ? 'approved' : 'draft',
                    
    // 企業情報
    company: eInfo.companyNameJa || '',
    // 職務・在留資格
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
    name: iInfo.nameKanji || iInfo.nameEn || '名称未設定',
    passportNumber: iInfo.passportNumber || '',
    birthDate: iInfo.birthDate || '',
    nationality: iInfo.nationality || '',
    gender: iInfo.gender || '',
    address: `${iInfo.japanPrefecture || ''}${iInfo.japanCity || ''}${iInfo.japanAddressLines || ''}`,
    
    // 申請書の関連付け
    current_application_id: applicationId,
    current_status: appStatus,
    status: mapApplicationStatusToForeignerStatus(appStatus),
    
    // 承認ステータス（申請側とリンクさせる場合）
    approvalStatus: appStatus === 'draft' ? 'draft' : 
                    appStatus === 'editing' ? 'draft' : 
                    appStatus === 'pending_review' ? 'pending_review' : 
                    appStatus === 'approved' ? 'approved' : 'draft',
                    
    // 企業情報
    company: eInfo?.companyNameJa || '',
    // 職務・在留資格
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
    name: fInfo.nameKanji || fInfo.nameEn || '名称未設定',
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
    
    // 承認ステータス
    approvalStatus: appStatus === 'draft' ? 'draft' : 
                    appStatus === 'editing' ? 'draft' : 
                    appStatus === 'pending_review' ? 'pending_review' : 
                    appStatus === 'approved' ? 'approved' : 'draft',
                    
    // 企業情報
    company: eInfo?.companyNameJa || '',
    // 職務・在留資格
    jobTitle: eInfo?.mainJobType || '', 
    visaType: fInfo.desiredStatus || '',
  };
}
