/**
 * 在留期間更新許可申請書（特定技能）
 * 出入国在留管理庁 別記第29号の15様式 および CSV仕様に基づく型定義
 */

// ─── 在日親族・同居者 ────────────────────────────────────────────────────────
export interface Relative {
  /** [AD-BR] 続柄 */
  relationship: string;
  /** [AE-BS] 氏名 */
  name: string;
  /** [AF-BT] 生年月日 (yyyy-MM-dd) */
  birthDate: string;
  /** [AG-BU] 国籍・地域 */
  nationality: string;
  /** [AH-BV] 同居の有無 */
  cohabitation: boolean;
  /** [AI-BW] 勤務先・通学先 */
  workplace: string;
  /** [AJ-BX] 在留カード番号（任意） */
  residenceCardNumber?: string;
}

// ─── 技能・日本語能力の証明 ─────────────────────────────────────────────────
export interface SkillCertification {
  /** 証明方法: 試験合格 | 技能実習2号良好修了 */
  method: 'exam' | 'technical_intern' | 'none';
  /** 試験名（試験合格の場合） [C,E,G] または [K,M,O] */
  examName?: string;
  /** 受験地（試験合格の場合） [D,F,H] または [L,N,P] */
  examLocation?: string;
}

/** 良好に修了した技能実習2号情報 [R-W] */
export interface TechnicalIntern2Info {
  /** 職種 [R,U] */
  jobType: string;
  /** 作業 [S,V] */
  jobOperation: string;
  /** 良好に修了したことの証明 [T,W] */
  isCertified: boolean;
}

// ─── 職歴 [AK-BN] ───────────────────────────────────────────────────────────
export interface JobHistory {
  /** 入社年月 [AK,AN,AQ,AT,AW,AZ,BC,BF,BI,BL] (yyyy-MM) */
  startDate: string;
  /** 退社年月 [AL,AO,AR,AU,AX,BA,BD,BG,BJ,BM] (yyyy-MM) */
  endDate?: string;
  /** 勤務先名称 [AM,AP,AS,AV,AY,BB,BE,BH,BK,BN] */
  companyName: string;
}

// ─── 外国人本人情報 (Sheet 1) ─────────────────────────────────────────────────
export interface ForeignerInfo {
  // ① 基本属性
  /** [B] 国籍・地域 */
  nationality: string;
  /** [C] 生年月日 (yyyy-MM-dd) */
  birthDate: string;
  /** [D] 氏名（ローマ字）例: KOU OTUHEI */
  nameEn: string;
  /** 氏名（漢字など母国語表記） */
  nameKanji?: string;
  /** [E] 性別 */
  gender: 'male' | 'female';
  /** [F] 配偶者の有無 */
  maritalStatus: 'married' | 'unmarried';
  /** [G] 職業 */
  occupation: string;

  // ② 住所
  /** [H] 本国・地域における居住地 */
  homeCountryAddress: string;
  /** [I] 日本における連絡先 郵便番号 */
  japanZipCode: string;
  /** [J] 日本における住居地(都道府県) */
  japanPrefecture: string;
  /** [K] 日本における住居地(市区町村) */
  japanCity: string;
  /** [L] 日本における住居地(町名丁目番地号等) */
  japanAddressLines: string;
  /** 日本における居住地 (UI表示用結合文字列) */
  japanAddress?: string;

  // ③ 連絡先
  /** [M] 電話番号 */
  phoneNumber: string;
  /** [N] 携帯電話番号 */
  mobileNumber?: string;
  /** [O] メールアドレス */
  email: string;

  // ④ 旅券情報
  /** [P] 旅券番号 */
  passportNumber: string;
  /** [Q] 旅券有効期限 (yyyy-MM-dd) */
  passportExpiryDate: string;

  // ④-1 ED番号
  /** [W] ED番号（英字） */
  edNumberAlpha?: string;
  /** [X] ED番号（数字） */
  edNumberNumeric?: string;

  // ⑤ 在留情報
  /** [R] 現に有する在留資格 */
  currentResidenceStatus: string;
  /** [S] 在留期間 */
  currentStayPeriod: string;
  /** [T] 在留期間の満了日 (yyyy-MM-dd) */
  stayExpiryDate: string;
  /** [U] 在留カードの有無 */
  hasResidenceCard: boolean;
  /** [V] 在留カード番号 */
  residenceCardNumber: string;

  // ⑥ 申請内容
  /** [Y] 希望する在留期間 */
  desiredStayPeriod: '4months' | '6months' | '1year' | 'other';
  /** 希望する在留期間（その他の場合） */
  desiredStayPeriodOther?: string;
  /** [Z] 在留期間更新の理由 */
  renewalReason: string;

  // ⑦ 刑事上の問題
  /** [AA] 犯罪歴の有無 */
  criminalRecord: boolean;
  /** [AB] 犯罪歴の詳細（有りの場合） */
  criminalRecordDetail?: string;

  // ⑧ 特定技能固有
  /** 特定技能の区分 */
  specificSkillCategory: '1' | '2';
  /** 技能水準の証明 (複数枠対応) */
  skillCertifications: SkillCertification[];
  /** 日本語能力の証明 (複数枠対応) */
  languageCertifications: SkillCertification[];
  /** [I] その他の技能評価方法 */
  otherSkillCert?: string;
  /** [Q] その他の日本語評価方法 */
  otherLanguageCert?: string;
  /** [X,Y] 特定技能1号での通算在留期間 (年, 月) */
  totalSpecificSkillStayYears?: number;
  totalSpecificSkillStayMonths?: number;

  // ⑨ 保証金・費用支払 (Sheet 2 [Z-AE])
  /** 預託金の有無 [Z] */
  depositCharged: boolean;
  /** 徴収・管理機関名 [AA] */
  depositOrganizationName?: string;
  /** 徴収金額・管理財産 [AB] */
  depositAmount?: number;
  /** 外国機関への費用支払合意 [AC] */
  feeCharged: boolean;
  /** 外国の機関名 [AD] */
  foreignOrganizationName?: string;
  /** 支払額 [AE] */
  feeAmount?: number;

  // ⑩ 在日家族・同居者 [AC-BS]
  /** [AC] 在日親族及び同居者 有無 */
  hasRelatives: boolean;
  /** 在日親族・同居者リスト (CSVは最大7枠) */
  relatives: Relative[];

  // ⑪ その他 (CSV特有)
  /** [BT] 在留カードの受領方法 */
  residenceCardReceiptMethod: 'window' | 'post';
  /** [BU] 申請対象者の住居地 */
  applicantResidencePlace?: string;
  /** [BV] 受領官署 */
  receivingOffice?: string;
  /** [BW] 通知送信用メールアドレス */
  notificationEmail?: string;
  /** [BX] 申請意思の確認（宣誓） */
  checkIntent: boolean;
  /** [BY] フリー欄 */
  freeFormat?: string;
}

// ─── 所属機関（企業）情報 (Sheet 2) ──────────────────────────────────────────

/** 代理人情報 [BO-BV] */
export interface AgentInfo {
  /** [BO] 氏名 */
  name: string;
  /** [BP] 本人との関係 */
  relationship: string;
  /** [BQ] 郵便番号 */
  zipCode: string;
  /** [BR] 住所(都道府県) */
  addressPref: string;
  /** [BS] 住所(市区町村) */
  addressCity: string;
  /** [BT] 住所(町名丁目番地号等) */
  addressStreet: string;
  /** [BU] 電話番号 */
  phone: string;
  /** [BV] 携帯電話番号 */
  mobile?: string;
}

/** 取次者情報 [BW-CD] */
export interface IntermediaryInfo {
  /** [BW] 氏名 */
  name: string;
  /** [BX] 郵便番号 */
  zipCode: string;
  /** [BY] 住所(都道府県) */
  addressPref: string;
  /** [BZ] 住所(市区町村) */
  addressCity: string;
  /** [CA] 住所(町名丁目番地号等) */
  addressStreet: string;
  /** [CB] 所属機関等 */
  organization: string;
  /** [CC] 電話番号 */
  phone: string;
}

/** 派遣先情報 [DE-DP] / 職業紹介事業者情報 [DQ-EB] / 取次機関情報 [EB-EI] */
export interface OrganizationDetails {
  name: string;
  hasCorporateNumber: boolean;
  corporateNumber?: string;
  employmentInsuranceNumber?: string;
  zipCode: string;
  addressPref: string;
  addressCity: string;
  addressStreet: string;
  phone: string;
  representativeName?: string; // 派遣先のみ
  startDate?: string; // 派遣先
  endDate?: string; // 派遣先
  permitNumber?: string; // 紹介事業者
  receptionDate?: string; // 紹介事業者
  country?: string; // 取次機関
}

export interface EmployerInfo {
  // ① 雇用契約
  /** [CD] 雇用契約期間 開始日 (yyyy-MM-dd) */
  contractStartDate: string;
  /** [CE] 雇用契約期間 終了日 (yyyy-MM-dd) */
  contractEndDate: string;

  // ② 業務内容
  /** [CF,CH,CJ] 特定産業分野 */
  industryFields: string[];
  /** [CG,CI,CK] 業務区分 */
  jobCategories: string[];
  /** [CL] 主たる職種 */
  mainJobType: string;
  /** [CM,CN,CO] 他職種 */
  otherJobTypes: string[];

  // ③ 労働時間
  /** [CP] 所定労働時間（週平均・時間） */
  weeklyWorkHours: number;
  /** [CQ] 所定労働時間（月平均・時間） */
  monthlyWorkHours: number;
  /** [CR] 日本人と同等の所定労働時間か */
  equivalentWorkHours: boolean;

  // ④ 報酬
  /** [CS] 月額報酬（円） */
  monthlySalary: number;
  /** [CT] 基本給の時間換算額（円） */
  hourlyRate: number;
  /** [CU] 同等の業務に従事する日本人の月額報酬 */
  japaneseMonthlySalary: number;
  /** [CV] 日本人と同等以上であることの有無 */
  equivalentSalary: boolean;
  /** [CW] 報酬の支払方法 */
  paymentMethod: 'cash' | 'bank_transfer';
  /** [CX] 外国人であることを理由に日本人と異なった待遇としている事項の有無 */
  hasDifferentTreatment: boolean;
  /** [CY] 異なった待遇の内容 */
  differentTreatmentDetail?: string;

  // ⑤ 法人基本情報
  /** [EI] 氏名又は名称 */
  companyNameJa: string;
  /** [EJ] 法人番号の有無 */
  hasCorporateNumber: boolean;
  /** [EK] 法人番号（13桁） */
  corporateNumber: string;
  /** [EL] 雇用保険適用事業所番号 */
  employmentInsuranceNumber: string;
  /** [ES] 所在地 郵便番号 */
  companyZipCode: string;
  /** [ET] 所在地(都道府県) */
  companyPref: string;
  /** [EU] 所在地(市区町村) */
  companyCity: string;
  /** [EV] 所在地(町名丁目番地号等) */
  companyAddressLines: string;
  /** 法人所在地 (UI表示用結合文字列) */
  companyAddress?: string;
  /** [FA] 代表者氏名 */
  representativeName: string;
  /** [EW] 法人電話番号 */
  companyPhone: string;
  /** [EX] 資本金（円） */
  capital?: number;
  /** [EY] 年間売上金額（円） */
  annualRevenue?: number;
  /** [EZ] 常勤職員数 */
  employeeCount: number;

  // ⑥ 勤務事業所情報 [FB-FI]
  /** [FB] 勤務させる事業所名 */
  workplaceName: string;
  /** [FC] 所在地 郵便番号 */
  workplaceZipCode: string;
  /** [FD] 所在地(都道府県) */
  workplacePref: string;
  /** [FE] 所在地(市区町村) */
  workplaceCity: string;
  /** [FF] 所在地(町名丁目番地号等) */
  workplaceAddressLines: string;
  /** [FG] 健康保険及び厚生年金保険の適用事業所であることの有無 */
  isSocialInsuranceApplicable: boolean;
  /** [FH] 労災保険及び雇用保険の適用事業所であることの有無 */
  isLaborInsuranceApplicable: boolean;
  /** [FI] 労働保険番号 */
  laborInsuranceNumber: string;

  // ⑦ 職歴 [AJ-BN]
  /** [AJ] 職歴の有無 */
  hasJobHistory: boolean;
  /** 職歴リスト */
  jobHistory: JobHistory[];

  // ⑧ 誓約項目 (FJ-HB) - 大量のためグループ化
  /** 法令遵守・欠格事由への誓約 [FJ-HB] */
  complianceOaths: {
    hadLaborLawPenalty: boolean;
    hadIllegalDismissal: boolean;
    hadMissingPersons: boolean;
    // ... 他、必要に応じて追加。一旦代表的な項目をマッピング。
  };

  // ⑨ 支援体制・登録支援機関 [HC-JD]
  /** 登録支援機関への全部委託の有無 [HC] */
  delegateSupportEntirely: boolean;
  /** 支援責任者・担当者情報 [HD-HI] */
  supportPersonnel: {
    supervisorName: string;
    supervisorTitle: string;
    officerName: string;
    officerTitle: string;
  };
  /** 支援能力の証明 [HJ-HM] */
  supportCapability: {
    hasExperience: boolean;
    hasCounselor: boolean;
    canCommunicateInLanguage: boolean;
  };
  /** 支援計画の実施項目 [HV-II] - 空港送迎、住居確保など */
  supportPlanItems: {
    airportPickUp: boolean;
    housingSupport: boolean;
    contractSupport: boolean;
    orientation: boolean;
    publicProcedures: boolean;
    japaneseLearning: boolean;
    consultation: boolean;
    culturalExchange: boolean;
    careerSupport: boolean;
    regularMeetings: boolean;
  };
  /** 登録支援機関詳細 [IJ-JD] */
  supportAgency?: OrganizationDetails & {
    registrationNumber: string;
    registrationDate: string;
    officeName: string;
    supervisorName: string;
    officerName: string;
    availableLanguages: string;
    monthlyFee: number;
  };

  // ⑩ その他
  /** 代理人情報 */
  agent?: AgentInfo;
  /** 取次者情報 */
  intermediary?: IntermediaryInfo;
}

// ─── 同時申請情報 (Sheet 3) ──────────────────────────────────────────────────
export interface SimultaneousApplication {
  /** [B] 再入国許可申請の有無 */
  applyForReEntry: boolean;
  /** [C] 資格外活動許可申請の有無 */
  applyForActivityOutsideStatus: boolean;
  /** [D] 就労資格証明書交付申請の有無 */
  applyForAuthEmployment: boolean;

  /** 再入国詳細 [X-AP] */
  reEntryDetails?: {
    purpose: string;
    destinationCountry: string;
    departureDate: string;
    arrivalDate: string;
    departurePort: string;
    arrivalPort: string;
    permitType: 'single' | 'multiple';
  };

  /** 資格外活動詳細 [BF-BZ] */
  activityOutsideDetails?: {
    currentActivity: string;
    otherActivityJob: string;
    otherActivityHours: number;
    otherActivitySalary: number;
    employerName: string;
    employerAddress: string;
    employerPhone: string;
  };

  /** 就労資格証明書詳細 [CR-CV] */
  authEmploymentDetails?: {
    proofActivity: string;
    workingStartDate: string;
    workingEndDate: string;
    usagePurpose: string;
  };
}

// ─── 申請書全体 ───────────────────────────────────────────────────────────────
export interface RenewalApplicationForm {
  /** 外国人本人情報 */
  foreignerInfo: ForeignerInfo;
  /** 所属機関情報 */
  employerInfo: EmployerInfo;
  /** 同時申請情報 */
  simultaneousApplication?: SimultaneousApplication;
}

// ─── 定数定義 ────────────────────────────────────────────────
export const SPECIFIC_SKILL_CATEGORY_OPTIONS = [
  { value: '1', label: '特定技能1号' },
  { value: '2', label: '特定技能2号' },
] as const;

export const DESIRED_STAY_PERIOD_OPTIONS = [
  { value: '4months', label: '4か月' },
  { value: '6months', label: '6か月' },
  { value: '1year', label: '1年' },
  { value: 'other', label: 'その他' },
] as const;

export const INDUSTRY_FIELD_OPTIONS = [
  { value: 'nursing', label: '介護' },
  { value: 'building_cleaning', label: 'ビルクリーニング' },
  { value: 'industrial_machinery', label: '素形材・産業機械・電気電子情報関連製造業' },
  { value: 'construction', label: '建設' },
  { value: 'shipbuilding', label: '造船・舶用工業' },
  { value: 'automobile_repair', label: '自動車整備' },
  { value: 'aviation', label: '航空' },
  { value: 'accommodation', label: '宿泊' },
  { value: 'agriculture', label: '農業' },
  { value: 'fishery', label: '漁業' },
  { value: 'food_and_beverage_manufacturing', label: '飲食料品製造業' },
  { value: 'food_service', label: '外食業' },
] as const;

export const SKILL_CERT_METHOD_OPTIONS = [
  { value: 'exam', label: '試験合格' },
  { value: 'technical_intern', label: '技能実習2号を良好に修了' },
  { value: 'none', label: '該当なし' },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: '現金持参' },
  { value: 'bank_transfer', label: '銀行振込' },
] as const;

export const RE_ENTRY_PERMIT_OPTIONS = [
  { value: 'single', label: '一次再入国許可' },
  { value: 'multiple', label: '数次再入国許可' },
] as const;
