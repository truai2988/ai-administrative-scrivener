/**
 * Firestore Data Models (Schema)
 */

// ─── RBAC (Role-Based Access Control) ─────────────────────────────────────────

/**
 * システム全体で使用するロール定義
 *
 * - scrivener     : 行政書士 / システム全体管理者（最上位権限）
 * - enterprise_staff: 企業担当者（担当タブのみ編集可）
 */
export type UserRole = 'scrivener' | 'union_staff' | 'enterprise_staff' | 'applicant';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  scrivener: '行政書士',
  union_staff: '組合職員',
  enterprise_staff: '企業担当者',
  applicant: '申請人',
};

/**
 * テナント種別
 * - union    : 組合（union_staff が所属）
 * - enterprise: 企業（enterprise_staff が所属）
 */
export type OrganizationType = 'union' | 'enterprise';

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  union: '組合',
  enterprise: '企業',
};

/**
 * Firestore: organizations コレクション
 * 組合・企業を一元管理するシングルテナント構造
 */
export interface Organization {
  id: string;             // Firestore Document ID
  name: string;           // 例: 「〇〇協同組合」「株式会社〇〇」
  type: OrganizationType;
  createdAt: string;
  updatedAt: string;
}

/**
 * Firestore: users コレクション
 * Firebase Auth UID をドキュメントIDとして使用
 */
export interface User {
  id: string;             // Firebase Auth UID（= Firestoreドキュメントid）
  email: string;
  displayName: string;
  role: UserRole;
  /**
   * 所属テナントID（organizations コレクションのドキュメントID）
   * - scrivener は null（テナントに縛られない）
   * - union_staff は unionテナントのID
   * - enterprise_staff は enterpriseテナントのID
   */
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * ロールがグローバル管理者か（全テナント横断アクセス可能）
 */
export function isGlobalAdmin(role: UserRole): boolean {
  return role === 'scrivener';
}


// ─── Foreigner (外国人データ) ─────────────────────────────────────────────────
export type ForeignerStatus = '準備中' | '編集中' | 'チェック中' | '申請済' | '追加資料待機' | '入管審査中' | '完了' | '期限切れ警告' | '差し戻し';

/** 承認ワークフロー専用ステータス（status フィールドとは独立して管理）*/
export type ApprovalStatus = 'draft' | 'pending_review' | 'approved' | 'returned' | null;

export const APPROVAL_STATUS_LABELS: Record<NonNullable<ApprovalStatus>, string> = {
  draft: '入力中',
  pending_review: '確認待ち',
  approved: '承認済',
  returned: '差し戻し',
};

export interface Foreigner {
  id: string; // Firestore Document ID
  userId?: string; // 申請人の Firebase Auth UID (申請人自身のアカウントと紐付け)
  unionId?: string; // 組合ID (RBAC フィルタリング用)
  enterpriseId?: string; // 企業ID (RBAC フィルタリング用)
  name: string;
  email?: string;
  residenceCardNumber: string; // 英字2桁 + 数字8桁 + 英字2桁
  expiryDate: string; // ISO 8601 (yyyy-MM-dd)
  birthDate: string; // ISO 8601 (yyyy-MM-dd)
  nationality: string;
  passportImageUrl?: string;
  photoUrl?: string; // 顔写真
  residenceCardFrontUrl?: string; // 在留カード(表)
  residenceCardBackUrl?: string; // 在留カード(裏)
  status: ForeignerStatus;
  company?: string; // 所属機関
  visaType?: string; // 在留資格種別
  jobTitle?: string; // 職務の名称 (受入情報)
  experience?: string; // 経験・スキル要約 (受入情報)

  // 在留カード・パスポートから読み取る追加情報
  gender?: string; // 性別（男 / 女）
  address?: string; // 住居地住所
  workRestriction?: string; // 就労制限の有無（就労活動のみ可・制限なし など）
  periodOfStay?: string; // 在留期間（5年・3年 など）
  dateOfPermission?: string; // 許可年月日 (ISO 8601)
  dateOfDelivery?: string; // 交付年月日 (ISO 8601)
  passportNumber?: string; // 旅券番号
  placeOfBirth?: string; // 出生地
  passportIssueDate?: string; // パスポート発行日 (ISO 8601)
  passportExpiryDate?: string; // パスポート有効期間満了日 (ISO 8601)
  issuingAuthority?: string; // パスポート発行機関
  
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

  // 承認ワークフロー
  approvalStatus?: ApprovalStatus; // 承認ステータス（既存の status フィールドとは独立）
  returnReason?: string; // 差し戻し時の理由

  // 最新申請とのリンク (申請書ファースト移行による追加)
  current_application_id?: string;
  current_status?: string;

  createdAt: string;
  updatedAt: string;
}

// ─── Correction History (修正履歴) ────────────────────────────────────────────
export interface CorrectionHistory {
  id?: string;
  foreignerId: string;
  correctedBy: string; // 実行者のユーザーIDや名前
  correctedAt: string; // ISO 8601
  reason: string;
  diff: Record<string, { old: unknown; new: unknown }>;
}

// ─── Application ──────────────────────────────────────────────────────────────
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

// ─── Client (支援機関) ────────────────────────────────────────────────────────
export interface Client {
  id: string; // 支援機関ID
  name: string;
  address: string;
  contactPerson: string;
  phoneNumber: string;
}

// ─── CompanyMaster (企業マスタ) ───────────────────────────────────────────────
/**
 * 事前登録しておく「所属機関（雇用主）」のマスタデータ。
 * 申請フォームの「法人基本情報」セクションで選択すると、関連フィールドに一括自動入力される。
 * organizationId で RBAC フィルタリングを行う（自支部の企業マスタのみ参照可）。
 */
export interface CompanyMaster {
  id: string;                         // Firestore Document ID
  organizationId: string;             // 所属支部ID（RBAC フィルタリング用）
  // 法人基本情報
  companyNameJa: string;              // 法人名（日本語）
  hasCorporateNumber: boolean;        // 法人番号の有無
  corporateNumber?: string;           // 法人番号（13桁）
  // 法人所在地
  companyZipCode: string;             // 郵便番号
  companyPref: string;                // 都道府県
  companyCity: string;                // 市区町村
  companyAddressLines: string;        // 番地等
  companyAddress?: string;            // 結合住所（任意）
  companyPhone: string;               // 電話番号
  representativeName: string;         // 代表者氏名
  // 勤務事業所（法人所在地と異なる場合）
  workplaceName?: string;             // 事業所名
  workplaceZipCode?: string;          // 事業所 郵便番号
  workplacePref?: string;             // 事業所 都道府県
  workplaceCity?: string;             // 事業所 市区町村
  workplaceAddressLines?: string;     // 事業所 番地等
  // 従業員・財務情報
  employeeCount?: number;             // 従業員数
  capital?: number;                   // 資本金（万円）
  annualRevenue?: number;             // 売上高（万円）
  // 保険情報
  isSocialInsuranceApplicable?: boolean;   // 社会保険適用の有無
  isLaborInsuranceApplicable?: boolean;    // 労働保険適用の有無
  laborInsuranceNumber?: string;           // 労働保険番号
  employmentInsuranceNumber?: string;      // 雇用保険適用事業所番号
  // メタデータ
  createdAt: string;
  updatedAt: string;
}

// ─── UnionMaster (組合マスタ) ───────────────────────────────────────────────
/**
 * 事前登録しておく「監理団体・登録支援機関（組合）」のマスタデータ。
 * 申請フォームの関連フィールドに一括自動入力される。
 * organizationId で RBAC フィルタリングを行う（自支部の組合マスタのみ参照可）。
 */
export interface UnionMaster {
  id: string;                         // Firestore Document ID
  organizationId: string;             // 所属支部ID（RBAC フィルタリング用）
  unionNameJa: string;                // 組合名（日本語）
  hasCorporateNumber: boolean;        // 法人番号の有無
  corporateNumber?: string;           // 法人番号（13桁）
  permissionNumber?: string;          // 許可・登録番号（監理団体の許可番号や、登録支援機関の登録番号）
  zipCode: string;                    // 郵便番号
  pref: string;                       // 都道府県
  city: string;                       // 市区町村
  addressLines: string;               // 番地等
  address?: string;                   // 結合住所（任意）
  phone: string;                      // 電話番号
  representativeTitle: string;        // 代表者役職
  representativeName: string;         // 代表者氏名
  contactPerson: string;              // 担当者氏名
  // メタデータ
  createdAt: string;
  updatedAt: string;
}

// ─── AiDiagnosticRule (AI診断カスタムルール) ──────────────────────────────────
/**
 * Firestore: ai_diagnostic_rules コレクション
 * 行政書士・本部管理者が独自に追加するAI診断チェックルール。
 * テキスト入力またはPDFアップロードで登録し、AI診断時にシステムプロンプトへ動的に結合される。
 */
export type AiDiagnosticRuleType = 'text' | 'pdf';

export interface AiDiagnosticRule {
  id: string;                        // Firestore Document ID
  title: string;                     // ルール名（例：「最低賃金の基準引き上げ」）
  type: AiDiagnosticRuleType;        // ルールの種別
  // type === 'text' の場合
  content?: string;                  // マークダウンや自然言語テキスト
  // type === 'pdf' の場合
  pdfUrl?: string;                   // Firebase Storage 上のダウンロードURL
  pdfStoragePath?: string;           // Firebase Storage 上のオブジェクトパス
  pdfFileName?: string;              // 元ファイル名（表示用）
  pdfExtractedText?: string;         // PDFから抽出したテキスト（AI読込用キャッシュ）
  enabled: boolean;                  // 有効/無効（トグルで切替可能）
  createdAt: string;                 // ISO 8601
  updatedAt: string;                 // ISO 8601
  createdBy: string;                 // ユーザーUID
}
