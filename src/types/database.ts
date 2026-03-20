/**
 * Firestore Data Models (Schema)
 */

export type ForeignerStatus = '準備中' | 'チェック中' | '申請済';

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
  
  // AI Review fields
  aiReview?: {
    riskScore: number; // 0-100
    reason: string;
    checkedAt: string;
    jobTitle: string;
    pastExperience: string;
  };

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
