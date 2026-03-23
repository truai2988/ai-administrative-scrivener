/**
 * Firestore Data Models (Schema)
 */

export type ForeignerStatus = '準備中' | 'チェック中' | '申請済' | '追加資料待機' | '完了' | '期限切れ警告';

export interface Foreigner {
  id: string; // Firestore Document ID
  name: string;
  residenceCardNumber: string; // 英字2桁 + 数字8桁 + 英字2桁
  expiryDate: string; // ISO 8601 (yyyy-MM-dd)
  birthDate: string; // ISO 8601 (yyyy-MM-dd)
  nationality: string;
  passportImageUrl: string;
  status: ForeignerStatus;
  company?: string; // 所属機関
  visaType?: string; // 在留資格種別
  jobTitle?: string; // 職務の名称 (受入情報)
  experience?: string; // 経験・スキル要約 (受入情報)
  
  // 雇用・待遇情報
  salary?: string; // 基本給 (月額)
  allowances?: string; // 諸手当 (月額)
  socialInsurance?: boolean; // 社会保険加入
  housingProvided?: boolean; // 住宅の提供
  
  // AI Review fields
  aiReview?: {
    riskScore: number; // 0-100
    reason: string;
    checkedAt: string;
    jobTitle: string;
    pastExperience: string;
  };

  // Legal Consent Log
  consentLog?: {
    ipAddress: string;
    userAgent: string;
    agreedAt: string;
  };

  // Original Data Snapshot for Legal Compliance
  isEditedByAdmin?: boolean;
  originalSubmittedData?: Partial<Foreigner>;

  createdAt: string;
  updatedAt: string;
}

export type ApplicationType = '更新' | '変更' | '認定';

export interface Application {
  id: string;
  foreignerId: string;
  type: ApplicationType;
  appliedAt: string | null;
  administrativeScrivenerId: string; // 担当行政書士
  supportAgencyId: string; // 支援機関
  
  // Consent logs
  consent: {
    agreedAt: string;
    ip: string;
  };
}

export interface Client {
  id: string; // 支援機関ID
  name: string;
  address: string;
  contactPerson: string;
  phoneNumber: string;
}
