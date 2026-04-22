import { z } from 'zod';

// ─── 共通バリデーター ────────────────────────────────────────────────────────
const requiredString = z.string().min(1, '必須項目です');
const optionalString = z.string().optional();

const dateString = z
  .string()
  .min(1, '必須項目です')
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式はYYYY-MM-DDで入力してください');

const pastDateString = dateString.refine(
  (val) => new Date(val) <= new Date(),
  '過去の日付を入力してください'
);

const futureDateString = dateString.refine(
  (val) => new Date(val) >= new Date(),
  '今日以降の日付を入力してください'
);

const optionalDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式はYYYY-MM-DDで入力してください')
  .optional()
  .or(z.literal(''));

const zipCodeString = z.string().regex(/^\d{7}$/, '郵便番号はハイフンなし7桁で入力してください');
const optionalZipCode = z.string().regex(/^\d{7}$/, '郵便番号はハイフンなし7桁').optional().or(z.literal(''));
const phoneString = z.string().regex(/^0\d{9,10}$/, '電話番号の形式が正しくありません');
const optionalPhone = z.string().regex(/^0\d{9,10}$/, '電話番号の形式が正しくありません').optional().or(z.literal(''));

// ─── 在日親族・同居者 ────────────────────────────────────────────────────────
const relativeSchema = z.object({
  relationship: requiredString.describe('sheet1:AD-BM-BR 続柄'),
  name: requiredString.describe('sheet1:AE-BN-BS 氏名'),
  birthDate: dateString.describe('sheet1:AF-BO-BT 生年月日'),
  nationality: requiredString.describe('sheet1:AG-BP-BU 国籍・地域'),
  cohabitation: z.boolean().describe('sheet1:AH-BQ-BV 同居の有無'),
  workplace: z.string().describe('sheet1:AI-BR-BW 勤務先名称・通学先名称'),
  residenceCardNumber: z
    .string()
    .regex(/^[A-Z]{2}\d{8}[A-Z]{2}$/, '在留カード番号の形式が正しくありません')
    .optional()
    .or(z.literal(''))
    .describe('sheet1:AJ-BS-BX 在留カード番号'),
});

// ─── 職歴（最大10件）────────────────────────────────────────────────────────
// CSV仕様: 入社年月・退社年月は YYYYMM (6桁)
const jobHistorySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM形式で入力してください').describe('sheet2:AK-BL 入社年月'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM形式で入力してください').optional().or(z.literal('')).describe('sheet2:AL-BM 退社年月'),
  companyName: requiredString.describe('sheet2:AM-BN 勤務先名称'),
});

// ─── 技能・日本語能力の証明 ─────────────────────────────────────────────────
// CSV仕様: 試験名・受験地は各最大3個まで繰り返し
const skillCertificationSchema = z.object({
  method: z.enum(['exam', 'technical_intern', 'none']).describe('技能水準・日本語能力 評価区分'),
  examName: optionalString.describe('合格した試験名'),
  examLocation: optionalString.describe('受験地'),
});

// 技能実習2号良好修了（最大2件）
const technicalInternSchema = z.object({
  jobType: optionalString.describe('職種'),
  workType: optionalString.describe('作業'),
  completionProof: optionalString.describe('良好に修了したことの証明'),
});

// ─── 代理人情報（法定代理人）──────────────────────────────────────────────
// CSV仕様: 区分V の代理人セクション
const agentSchema = z.object({
  name: optionalString.describe('代理人 (1)氏名'),
  relationship: optionalString.describe('代理人 (2)本人との関係'),
  zipCode: optionalZipCode.describe('代理人 (3)郵便番号'),
  prefecture: optionalString.describe('代理人 (3)住所(都道府県)'),
  city: optionalString.describe('代理人 (3)住所(市区町村)'),
  addressLines: optionalString.describe('代理人 (3)住所(町名丁目番地号等)'),
  phone: optionalPhone.describe('代理人 (3)電話番号'),
  mobilePhone: optionalPhone.describe('代理人 (3)携帯電話番号'),
});

// ─── 取次者情報 ───────────────────────────────────────────────────────────
// CSV仕様: 区分V の取次者セクション
const agencyRepSchema = z.object({
  name: optionalString.describe('取次者(オンラインシステム利用者) (1)氏名'),
  zipCode: optionalZipCode.describe('取次者 (2)郵便番号'),
  prefecture: optionalString.describe('取次者 (2)住所(都道府県)'),
  city: optionalString.describe('取次者 (2)住所(市区町村)'),
  addressLines: optionalString.describe('取次者 (2)住所(町名丁目番地号等)'),
  organization: optionalString.describe('取次者 (3)所属機関等'),
  phone: optionalPhone.describe('取次者 (3)電話番号'),
});

// ─── 外国人本人情報スキーマ (Sheet 1) ──────────────────────────────────────────
export const foreignerInfoSchema = z
  .object({
    nationality: requiredString.describe('sheet1:B 国籍・地域'),
    birthDate: pastDateString.describe('sheet1:C 生年月日'),
    nameEn: requiredString
      .regex(/^[A-Za-z\s]+$/, '英字・スペースのみで入力してください')
      .describe('sheet1:D 氏名'),
    nameKanji: optionalString.describe('氏名（母国語）'),
    gender: z.enum(['male', 'female']).describe('sheet1:E 性別'),
    maritalStatus: z.enum(['married', 'unmarried']).describe('sheet1:F 配偶者の有無'),
    occupation: requiredString.describe('sheet1:G 職業'),
    homeCountryAddress: requiredString.describe('sheet1:H 本国における居住地'),

    // 住所分割
    japanZipCode: zipCodeString.describe('sheet1:I 日本における連絡先 郵便番号'),
    japanPrefecture: requiredString.describe('sheet1:J 日本における住居地(都道府県)'),
    japanCity: requiredString.describe('sheet1:K 日本における住居地(市区町村)'),
    japanAddressLines: requiredString.describe('sheet1:L 日本における住居地(町名丁目番地号等)'),
    japanAddress: optionalString, // UI表示・結合用。既存との互換性のため残す

    phoneNumber: phoneString.describe('sheet1:M 日本における連絡先 電話番号'),
    mobileNumber: phoneString.optional().or(z.literal('')).describe('sheet1:N 日本における連絡先 携帯電話番号'),
    email: z.string().email('正しいメールアドレスを入力してください').describe('sheet1:O メールアドレス'),

    passportNumber: z.string().regex(/^[A-Za-z0-9]{7,9}$/, '旅券番号は英数字7〜9桁です').describe('sheet1:P 旅券 (1)番号'),
    passportExpiryDate: futureDateString.describe('sheet1:Q 旅券 (2)有効期限'),

    // CSV仕様: 英字4桁・数字7桁
    edNumberAlpha: z.string().length(4, '英字4桁').optional().or(z.literal('')).describe('sheet1:W ED番号(英字)'),
    edNumberNumeric: z.string().length(7, '数字7桁').optional().or(z.literal('')).describe('sheet1:X ED番号(数字)'),

    currentResidenceStatus: requiredString.describe('sheet1:R 現に有する在留資格'),
    currentStayPeriod: requiredString.describe('sheet1:S 在留期間'),
    stayExpiryDate: dateString.describe('sheet1:T 在留期間の満了日'),
    hasResidenceCard: z.boolean().describe('sheet1:U 在留カードの有無'),
    residenceCardNumber: requiredString
      .regex(/^[A-Z]{2}\d{8}[A-Z]{2}$/, '在留カード番号の形式が正しくありません')
      .describe('sheet1:V 在留カード番号'),

    desiredStayPeriod: z.enum(['4months', '6months', '1year', 'other']).or(z.literal('')).describe('sheet1:Y 希望する在留期間'),
    desiredStayPeriodOther: optionalString,
    renewalReason: requiredString.min(10, '更新の理由を詳しく入力してください（10文字以上）').describe('sheet1:Z 更新の理由'),

    criminalRecord: z.boolean().describe('sheet1:AA 犯罪を理由とする処分を受けたことの有無'),
    criminalRecordDetail: optionalString.describe('sheet1:AB 処分の内容'),

    specificSkillCategory: z.enum(['1', '2']).describe('特定技能の区分'),
    skillCertifications: z.array(skillCertificationSchema).describe('技能水準証明枠'),
    languageCertifications: z.array(skillCertificationSchema).describe('日本語能力証明枠'),
    otherSkillCert: optionalString.describe('sheet2:I 技能水準 その他の評価方法'),
    otherLanguageCert: optionalString.describe('sheet2:Q 日本語能力 その他の評価方法'),

    // 技能実習2号良好修了記録（最大2件）
    technicalInternRecords: z.array(technicalInternSchema).max(2).optional().describe('sheet2:R-W 技能実習2号良好修了記録'),

    totalSpecificSkillStayYears: z.number().min(0).max(5).optional().describe('sheet2:X 特定技能1号通算在留期間(年)'),
    totalSpecificSkillStayMonths: z.number().min(0).max(11).optional().describe('sheet2:Y 特定技能1号通算在留期間(月)'),

    // 保証金・費用 (Sheet 2)
    depositCharged: z.boolean().describe('sheet2:Z 保証金の徴収等の有無'),
    depositOrganizationName: optionalString.describe('sheet2:AA 徴収・管理機関名'),
    depositAmount: z.number().optional().describe('sheet2:AB 徴収金額'),
    feeCharged: z.boolean().describe('sheet2:AC 外国機関への費用支払合意の有無'),
    foreignOrganizationName: optionalString.describe('sheet2:AD 外国の機関名'),
    feeAmount: z.number().optional().describe('sheet2:AE 支払額'),

    // --- CSV追加項目（区分V Sheet2） ---
    // 国籍国手続き・本邦費用合意・技能移転努力・特定産業基準
    followsHomeCountryProcedures: z.boolean().optional().describe('sheet2:AF 国籍国の手続きを経ていることの有無'),
    agreesToLocalCosts: z.boolean().optional().describe('sheet2:AG 本邦で定期的に負担する費用へ合意の有無'),
    effortsToTransferSkills: z.boolean().optional().describe('sheet2:AH 技能移転に努めることの有無'),
    meetsSpecificIndustryStandards: z.boolean().optional().describe('sheet2:AI 特定産業分野固有基準への適合'),

    wasInvoluntarilySeparated: z.boolean().optional().describe('非自発的離職'),
    hasMissingPersonOccurred: z.boolean().optional().describe('行方不明者の発生の有無'),
    notDisqualified: z.boolean().optional().describe('欠格事由の非該当'),
    applicantDeclarationTrue: z.boolean().optional().describe('本人申告の真正'),
    agentDeliveryInfo: z.enum(['1', '2']).optional().describe('代理人等交付情報提供'),

    hasRelatives: z.boolean().describe('sheet1:AC 在日親族・同居者の有無'),
    relatives: z.array(relativeSchema),

    // 代理人・取次者（区分V固有）
    agent: agentSchema.optional().describe('代理人情報（法定代理人）'),
    agencyRep: agencyRepSchema.optional().describe('取次者情報'),

    residenceCardReceiptMethod: z.enum(['window', 'post']).describe('sheet1:BT 在留カードの受領方法'),
    applicantResidencePlace: optionalString.describe('sheet1:BU 申請対象者の住居地'),
    receivingOffice: optionalString.describe('sheet1:BV 受領官署'),
    notificationEmail: optionalString.describe('sheet1:BW 通知送信用メールアドレス'),
    checkIntent: z.boolean().describe('sheet1:BX 申請意思の確認'),
    freeFormat: optionalString.describe('sheet1:BY フリー欄'),
  })
  .refine(
    (data) => (data.desiredStayPeriod === 'other' ? !!data.desiredStayPeriodOther : true),
    { message: '希望期間の詳細を入力してください', path: ['desiredStayPeriodOther'] }
  );


// ─── 欠格事由スキーマ（CSV仕様: 項目11〜28 + 誓約項目） ──────────────────────
// 各欠格事由は「有無(boolean) + 内容(optional string)」のペア
const disqualificationItemSchema = z.object({
  applies: z.boolean(),
  detail: optionalString,
});

export const complianceOathsSchema = z.object({
  // (11) 労働・社会保険・租税法令違反
  hadLaborLawPenalty: disqualificationItemSchema.describe('(11)労働・社会保険・租税法令違反'),
  // (12) 非自発的離職
  hadInvoluntaryDismissal: disqualificationItemSchema.describe('(12)非自発的離職'),
  // (13) 行方不明者の発生
  hadMissingPersons: disqualificationItemSchema.describe('(13)行方不明者の発生'),
  // (14) 刑事罰
  hadCriminalPenalty: disqualificationItemSchema.describe('(14)刑事罰'),
  // (15) 精神機能障害
  hasMentalImpairment: disqualificationItemSchema.describe('(15)精神機能障害'),
  // (16) 破産
  hasBankruptcy: disqualificationItemSchema.describe('(16)破産手続'),
  // (17) 技能実習認定取消
  hadTechnicalInternRevocation: disqualificationItemSchema.describe('(17)技能実習認定取消'),
  // (18) 取消法人の役員であった
  wasOfficerOfRevokedEntity: disqualificationItemSchema.describe('(18)取消法人の役員'),
  // (19) 不正行為
  hadIllegalAct: disqualificationItemSchema.describe('(19)不正行為'),
  // (20) 暴力団員
  hadGangsterRelation: disqualificationItemSchema.describe('(20)暴力団員'),
  // (21) 法定代理人が(14)〜(20)に該当
  legalRepresentativeQualifies: disqualificationItemSchema.describe('(21)法定代理人が(14)〜(20)に該当'),
  // (22) 暴力団支配
  isGangControlled: disqualificationItemSchema.describe('(22)暴力団支配'),
  // (23) 活動内容書類の保管
  keepsActivityRecords: z.boolean().describe('(23)活動内容書類保管1年以上'),
  // (24) 保証金認識
  awaresOfGuaranteeContract: disqualificationItemSchema.describe('(24)保証金契約認識'),
  // (25) 違約金契約
  hasCompliancePenaltyContract: disqualificationItemSchema.describe('(25)違約金契約'),
  // (26) 支援費用外国人負担なし（特定技能1号のみ）
  noSupportCostBurdenOnForeigner: z.boolean().optional().describe('(26)1号支援費用を外国人に負担させない'),
  // 誓約項目（(7)〜(11)に対応）
  allowsTemporaryReturn: z.boolean().describe('(7)一時帰国有給休暇取得'),
  meetsEmploymentStandards: z.boolean().describe('(8)雇用関係基準適合'),
  coversReturnTravelCost: z.boolean().describe('(9)帰国旅費負担'),
  monitorsHealthAndLife: z.boolean().describe('(10)健康・生活状況把握'),
  meetsSpecificIndustryEmploymentStandards: z.boolean().optional().describe('(11)特定産業分野固有雇用基準'),
  // (30)〜(32)
  hasContractContinuationSystem: z.boolean().describe('(30)雇用契約継続体制'),
  paysWageByTransfer: z.boolean().describe('(31)振込等による報酬支払'),
  meetsAdditionalEmploymentStandards: z.boolean().optional().describe('(32)雇用契約適正履行追加基準'),
});

// ─── 派遣先スキーマ（特定技能雇用契約 (12)）─────────────────────────────
const dispatchDestinationSchema = z.object({
  name: optionalString.describe('派遣先 氏名又は名称'),
  hasCorporateNumber: z.boolean().optional().describe('派遣先 法人番号の有無'),
  corporateNumber: z.string().regex(/^\d{13}$/).optional().or(z.literal('')).describe('派遣先 法人番号'),
  employmentInsuranceNumber: z.string().regex(/^\d{11}$/).optional().or(z.literal('')).describe('派遣先 雇用保険適用事業所番号'),
  zipCode: optionalZipCode.describe('派遣先 郵便番号'),
  prefecture: optionalString.describe('派遣先 都道府県'),
  city: optionalString.describe('派遣先 市区町村'),
  addressLines: optionalString.describe('派遣先 町名丁目番地号等'),
  phone: optionalPhone.describe('派遣先 電話番号'),
  representativeName: optionalString.describe('派遣先 代表者の氏名'),
  periodStart: optionalDateString.describe('派遣先 派遣期間(始期)'),
  periodEnd: optionalDateString.describe('派遣先 派遣期間(終期)'),
});

// ─── 職業紹介事業者スキーマ（特定技能雇用契約 (13)）─────────────────────
const placementAgencySchema = z.object({
  name: optionalString.describe('職業紹介事業者 氏名又は名称'),
  hasCorporateNumber: z.boolean().optional().describe('職業紹介事業者 法人番号の有無'),
  corporateNumber: z.string().regex(/^\d{13}$/).optional().or(z.literal('')).describe('職業紹介事業者 法人番号'),
  employmentInsuranceNumber: z.string().regex(/^\d{11}$/).optional().or(z.literal('')).describe('職業紹介事業者 雇用保険適用事業所番号'),
  zipCode: optionalZipCode.describe('職業紹介事業者 郵便番号'),
  prefecture: optionalString.describe('職業紹介事業者 都道府県'),
  city: optionalString.describe('職業紹介事業者 市区町村'),
  addressLines: optionalString.describe('職業紹介事業者 町名丁目番地号等'),
  phone: optionalPhone.describe('職業紹介事業者 電話番号'),
  licenseNumber: optionalString.describe('職業紹介事業者 許可・届出番号'),
  acceptanceDate: optionalDateString.describe('職業紹介事業者 受理年月日'),
});

// ─── 取次機関スキーマ（特定技能雇用契約 (14)）──────────────────────────
const intermediaryAgencySchema = z.object({
  name: optionalString.describe('取次機関 氏名又は名称'),
  country: optionalString.describe('取次機関 国・地域'),
  zipCode: optionalZipCode.describe('取次機関 郵便番号'),
  prefecture: optionalString.describe('取次機関 都道府県'),
  city: optionalString.describe('取次機関 市区町村'),
  addressLines: optionalString.describe('取次機関 町名丁目番地号等'),
  phone: optionalPhone.describe('取次機関 電話番号'),
});

// ─── 派遣機関要件（(27) 次のいずれかに該当）────────────────────────────
const dispatchQualificationSchema = z.object({
  applies: z.boolean().optional().describe('(27)いずれかに該当することの有無'),
  // (1) 特定産業分野業務を行っていること
  doesSpecificIndustryBusiness: z.boolean().optional(),
  doesSpecificIndustryBusinessDetail: optionalString,
  // (2) 地方公共団体等が資本金過半数出資
  publicBodyCapitalMajority: z.boolean().optional(),
  publicBodyCapitalMajorityDetail: optionalString,
  // (3) 地方公共団体等が業務執行に実質的に関与
  publicBodyManagementInvolvement: z.boolean().optional(),
  publicBodyManagementInvolvementDetail: optionalString,
  // (4) 農業特区機関
  isAgricultureSpecialZoneEntity: z.boolean().optional(),
});

// ─── 1号特定技能外国人支援計画（14項目）────────────────────────────────
export const supportPlanSchema = z.object({
  // (1) 出入国時送迎
  airportPickup: z.boolean().describe('(1)出入国時の港・飛行場への送迎'),
  // (2) 住居確保支援
  housingSupport: z.boolean().describe('(2)適切な住居確保支援'),
  // (3) 金融機関・生活契約支援
  financialContractSupport: z.boolean().describe('(3)金融機関口座・携帯等生活契約支援'),
  // (4) 生活情報提供（外国語）
  lifeInfoProvision: z.boolean().describe('(4)生活一般情報の外国語提供'),
  // (5) 行政手続き同行
  adminProcedureEscort: z.boolean().describe('(5)行政機関手続きへの同行等'),
  // (6) 日本語学習機会提供
  japaneseLanguageLearning: z.boolean().describe('(6)日本語学習機会の提供'),
  // (7) 相談・苦情対応（外国語）
  complaintSupport: z.boolean().describe('(7)外国語による相談・苦情対応'),
  // (8) 日本人との交流促進
  interculturalExchange: z.boolean().describe('(8)外国人と日本人の交流促進'),
  // (9) 転職支援
  jobChangeSupport: z.boolean().describe('(9)本人起因でない契約解除時の転職支援'),
  // (10) 定期面談・問題通報
  regularInterviewAndReport: z.boolean().describe('(10)定期面談の実施と問題発生時の関係機関通報'),
  // (11) 支援計画の書面交付
  writtenPlanProvision: z.boolean().describe('(11)支援計画の外国語書面交付'),
  // (12) 特定産業分野固有事項の記載
  specificIndustryItems: z.boolean().optional().describe('(12)特定産業分野固有事項の記載'),
  // (13) 支援の実施可能性
  implementationCapability: z.boolean().describe('(13)支援実施体制の適切性'),
  // (14) 支援計画の告示適合
  meetsRegulationStandards: z.boolean().optional().describe('(14)支援計画の告示基準適合'),
});

// ─── 登録支援機関スキーマ ────────────────────────────────────────────────
const supportAgencySchema = z.object({
  name: optionalString.describe('登録支援機関 (1)氏名又は名称'),
  hasCorporateNumber: z.boolean().optional().describe('登録支援機関 (2)法人番号の有無'),
  corporateNumber: z.string().regex(/^\d{13}$/).optional().or(z.literal('')).describe('登録支援機関 (2)法人番号'),
  employmentInsuranceNumber: z.string().regex(/^\d{11}$/).optional().or(z.literal('')).describe('登録支援機関 (3)雇用保険適用事業所番号'),
  zipCode: optionalZipCode.describe('登録支援機関 (4)郵便番号'),
  prefecture: optionalString.describe('登録支援機関 (4)都道府県'),
  city: optionalString.describe('登録支援機関 (4)市区町村'),
  addressLines: optionalString.describe('登録支援機関 (4)町名丁目番地号等'),
  phone: optionalPhone.describe('登録支援機関 (4)電話番号'),
  representativeName: optionalString.describe('登録支援機関 (5)代表者の氏名'),
  registrationNumber: optionalString.describe('登録支援機関 (6)登録番号'),
  registrationDate: optionalDateString.describe('登録支援機関 (7)登録年月日'),
  supportOfficeName: optionalString.describe('登録支援機関 (8)支援を行う事業所の名称'),
  officeZipCode: optionalZipCode.describe('登録支援機関 (9)事業所郵便番号'),
  officePrefecture: optionalString.describe('登録支援機関 (9)事業所都道府県'),
  officeCity: optionalString.describe('登録支援機関 (9)事業所市区町村'),
  officeAddressLines: optionalString.describe('登録支援機関 (9)事業所町名丁目番地号等'),
  supportSupervisorName: optionalString.describe('登録支援機関 (10)支援責任者名'),
  supportOfficerName: optionalString.describe('登録支援機関 (11)支援担当者名'),
  supportLanguages: optionalString.describe('登録支援機関 (12)対応可能言語'),
  supportFeeMonthly: z.number().min(0).optional().describe('登録支援機関 (13)支援委託手数料(月額/人)'),
});

// ─── 所属機関情報スキーマ (Sheet 2) ───────────────────────────────────────────
export const employerInfoSchema = z.object({
  // ─ 特定技能雇用契約(1) ─
  contractStartDate: dateString.describe('sheet2:CD 雇用契約期間(始期)'),
  contractEndDate: dateString.describe('sheet2:CE 雇用契約期間(終期)'),

  // ─ 特定技能雇用契約(2) ─
  industryFields: z.array(z.string()).min(1, '少なくとも1つ選択してください').describe('特定産業分野'),
  jobCategories: z.array(z.string()).min(1, '少なくとも1つ選択してください').describe('業務区分'),
  mainJobType: requiredString.describe('sheet2:CL 主たる職種'),
  otherJobTypes: z.array(z.string()).describe('他職種'),

  // ─ 特定技能雇用契約(3) ─
  weeklyWorkHours: z.number().min(1).max(60).describe('sheet2:CP 所定労働時間(週平均)'),
  monthlyWorkHours: z.number().min(1).max(280).describe('sheet2:CQ 所定労働時間(月平均)'),
  equivalentWorkHours: z.boolean().describe('sheet2:CR 日本人と同等であることの有無'),

  // ─ 特定技能雇用契約(4) ─
  monthlySalary: z.number().min(100000).describe('sheet2:CS 月額報酬'),
  hourlyRate: z.number().min(1).describe('sheet2:CT 基本給の時間換算額'),
  japaneseMonthlySalary: z.number().min(100000).describe('sheet2:CU 同等の日本人月額報酬'),
  equivalentSalary: z.boolean().describe('sheet2:CV 日本人と同等以上であることの有無'),
  paymentMethod: z.enum(['cash', 'bank_transfer']).describe('sheet2:CW 報酬の支払方法'),

  // ─ 特定技能雇用契約(6) ─
  hasDifferentTreatment: z.boolean().describe('sheet2:CX 異なった待遇の有無'),
  differentTreatmentDetail: optionalString.describe('sheet2:CY 異なった待遇の内容'),

  // ─ 特定技能雇用契約(12) 派遣先 ─
  dispatchDestination: dispatchDestinationSchema.optional().describe('特定技能雇用契約(12)派遣先'),

  // ─ 特定技能雇用契約(13) 職業紹介事業者 ─
  placementAgency: placementAgencySchema.optional().describe('特定技能雇用契約(13)職業紹介事業者'),

  // ─ 特定技能雇用契約(14) 取次機関 ─
  intermediaryAgency: intermediaryAgencySchema.optional().describe('特定技能雇用契約(14)取次機関'),

  // ─ 特定技能所属機関(1) ─
  companyNameJa: requiredString.describe('sheet2:EI 氏名又は名称'),
  hasCorporateNumber: z.boolean().describe('sheet2:EJ 法人番号の有無'),
  corporateNumber: z.string().regex(/^\d{13}$/).describe('sheet2:EK 法人番号'),
  employmentInsuranceNumber: z.string().regex(/^\d{11}$/).describe('sheet2:EL 雇用保険適用事業所番号'),

  // ─ 特定技能所属機関(4) 業種 ─
  mainIndustry: optionalString.describe('sheet2:EM 主たる業種'),
  mainIndustryOther: optionalString.describe('sheet2:EN 主たる業種(その他)'),
  otherIndustries: z.array(z.object({
    industry: optionalString,
    industryOther: optionalString,
  })).optional().describe('他業種'),

  // ─ 特定技能所属機関(5) 住所 ─
  companyZipCode: zipCodeString.describe('sheet2:ES 所在地 郵便番号'),
  companyPref: requiredString.describe('sheet2:ET 所在地(都道府県)'),
  companyCity: requiredString.describe('sheet2:EU 所在地(市区町村)'),
  companyAddressLines: requiredString.describe('sheet2:EV 所在地(町名丁目番地号等)'),
  companyAddress: optionalString,
  companyPhone: phoneString.describe('sheet2:EW 電話番号'),

  // ─ 特定技能所属機関(6)(7)(8)(9) ─
  capital: z.number().min(0).optional().describe('sheet2:EX 資本金'),
  annualRevenue: z.number().min(0).optional().describe('sheet2:EY 年間売上金額'),
  employeeCount: z.number().min(1).describe('sheet2:EZ 常勤職員数'),
  representativeName: requiredString.describe('sheet2:FA 代表者の氏名'),

  // ─ 特定技能所属機関(10) 勤務事業所 ─
  workplaceName: requiredString.describe('sheet2:FB 勤務させる事業所名'),
  workplaceZipCode: zipCodeString.describe('sheet2:FC 郵便番号'),
  workplacePref: requiredString.describe('sheet2:FD 所在地(都道府県)'),
  workplaceCity: requiredString.describe('sheet2:FE 所在地(市区町村)'),
  workplaceAddressLines: requiredString.describe('sheet2:FF 所在地(町名丁目番地号等)'),
  isSocialInsuranceApplicable: z.boolean().describe('sheet2:FG 社会保険適用の有無'),
  isLaborInsuranceApplicable: z.boolean().describe('sheet2:FH 労働保険適用の有無'),
  laborInsuranceNumber: requiredString.describe('sheet2:FI 労働保険番号'),

  // ─ 職歴 ─
  hasJobHistory: z.boolean().describe('sheet2:AJ 職歴の有無'),
  jobHistory: z.array(jobHistorySchema).max(10).describe('職歴（最大10件）'),

  // ─ 欠格事由・誓約（CSV項目11〜32、7〜11を全網羅）─
  complianceOaths: complianceOathsSchema.describe('欠格事由・誓約項目'),

  // ─ 派遣機関要件(27) ─
  dispatchQualification: dispatchQualificationSchema.optional().describe('(27)派遣機関要件'),

  // ─ 派遣先欠格事由チェック(28) ─
  dispatchDestinationDisqualification: disqualificationItemSchema.optional().describe('(28)派遣先が(11)〜(22)に該当'),

  // ─ 労災保険等措置(29) ─
  hasWorkersCompMeasures: disqualificationItemSchema.optional().describe('(29)労災保険加入等の措置'),

  // ─ 1号支援計画の実施委託 ─
  delegateSupportEntirely: z.boolean().describe('sheet2:HC 登録支援機関への全部委託の有無'),

  // ─ 支援責任者・担当者（委託しない場合）─
  supportPersonnel: z.object({
    supervisorName: requiredString.describe('(33)支援責任者名'),
    supervisorTitle: requiredString.describe('(33)所属・役職'),
    isSupervisorFromStaff: z.boolean().optional().describe('(33)役員・職員からの選任'),
    officerName: requiredString.describe('(34)支援担当者名'),
    officerTitle: requiredString.describe('(34)所属・役職'),
    isOfficerFromStaff: z.boolean().optional().describe('(34)役員・職員からの選任'),
  }).describe('支援責任者・担当者'),

  // ─ (35) 支援業務実施要件 ─
  qualifiedForSupportWork: z.boolean().optional().describe('(35)支援業務実施要件'),
  supportWorkQualification1: z.boolean().optional().describe('(35)(1)過去2年間の中長期在留者受入れ実績'),
  supportWorkQualification2: z.boolean().optional().describe('(35)(2)生活相談等従事経験'),
  supportWorkQualification3: z.boolean().optional().describe('(35)(3)その他支援適正実施事情'),
  supportWorkQualification3Detail: optionalString.describe('(35)(3)その他詳細'),

  // ─ (36)〜(41) 支援実施体制確認 ─
  hasForeignLanguageSupportCapability: z.boolean().optional().describe('(36)外国語支援体制'),
  keepsSupportRecords: z.boolean().optional().describe('(37)支援状況書類の保管'),
  supportersNeutral: z.boolean().optional().describe('(38)支援実施の中立性'),
  hadSupportNeglect: disqualificationItemSchema.optional().describe('(39)支援計画怠慢'),
  hasRegularMeetingCapability: z.boolean().optional().describe('(40)定期面談実施体制'),
  meetsSpecificIndustrySupportStandards: z.boolean().optional().describe('(41)特定産業分野固有支援基準'),

  // ─ 1号特定技能外国人支援計画（14項目）─
  supportPlan: supportPlanSchema.optional().describe('1号特定技能外国人支援計画'),

  // ─ 登録支援機関情報（委託する場合）─
  supportAgency: supportAgencySchema.optional().describe('登録支援機関情報'),
});

// ─── 同時申請：再入国許可申請 ──────────────────────────────────────────
const reEntryPermitSchema = z.object({
  // 渡航目的（複数選択可。CSV仕様ではプルダウン）
  travelPurpose1: optionalString.describe('渡航目的1'),
  travelPurpose2: optionalString.describe('渡航目的2'),
  travelPurposeOther: optionalString.describe('渡航目的その他'),
  // 予定渡航先国（最大2件）
  destinationCountry1: optionalString.describe('予定渡航先国名1'),
  destinationCountry2: optionalString.describe('予定渡航先国名2'),
  // 出国予定
  departureDatePrimary: optionalDateString.describe('出国予定年月日(主)'),
  departureDateSecondary: optionalDateString.describe('出国予定年月日(副)'),
  departurePortPrimary: optionalString.describe('出国予定の日本の(空)港(主)'),
  departurePortSecondary: optionalString.describe('出国予定の日本の(空)港(副)'),
  // 再入国予定
  reEntryDatePrimary: optionalDateString.describe('再入国予定年月日(主)'),
  reEntryDateSecondary: optionalDateString.describe('再入国予定年月日(副)'),
  reEntryPortPrimary: optionalString.describe('再入国予定の日本の(空)港(主)'),
  reEntryPortSecondary: optionalString.describe('再入国予定の日本の(空)港(副)'),
  // 希望する再入国許可の種別
  desiredPermitType: optionalString.describe('希望する再入国許可'),
  // 犯罪歴
  hasCriminalRecord: z.boolean().optional().describe('犯罪を理由とする処分を受けたことの有無'),
  criminalRecordDetail: optionalString,
  // 確定前刑事裁判
  hasPendingCriminalCase: z.boolean().optional().describe('確定前の刑事裁判の有無'),
  pendingCriminalCaseDetail: optionalString,
  // 旅券取得不可の理由
  noPassportReason: optionalString.describe('旅券取得不可の理由'),
  // 代理人・取次者（再入国申請固有）
  agent: agentSchema.optional(),
  agencyRep: agencyRepSchema.optional(),
});

// ─── 同時申請：資格外活動許可申請 ───────────────────────────────────────
const activityOutsideStatusSchema = z.object({
  // 現在の在留活動の内容
  currentActivityDescription: optionalString.describe('現在の在留活動の内容'),
  // 他に従事しようとする活動(1) 職務内容（最大3件）
  newActivityJob1: optionalString,
  newActivityJob2: optionalString,
  newActivityJob3: optionalString,
  // 他に従事しようとする活動(2) 雇用契約期間
  newActivityContractYears: z.number().min(0).max(10).optional().describe('雇用契約期間(年数)'),
  newActivityContractMonths: z.number().min(0).max(11).optional().describe('雇用契約期間(月数)'),
  // 他に従事しようとする活動(3) 週間稼働時間（複数）
  newActivityWeeklyHours1: z.number().min(0).optional(),
  newActivityWeeklyHours2: z.number().min(0).optional(),
  // 他に従事しようとする活動(4) 報酬
  newActivityHasPayment: z.boolean().optional(),
  newActivityMonthlySalary: z.number().min(0).optional().describe('月額報酬'),
  // 勤務先(1) 名称（最大2件）
  workplaceName1: optionalString,
  workplaceName2: optionalString,
  // 勤務先(2) 所在地
  workplaceZipCode: optionalZipCode,
  workplacePrefecture: optionalString,
  workplaceCity: optionalString,
  workplaceAddressLines: optionalString,
  workplacePhone1: optionalPhone,
  workplacePhone2: optionalPhone,
  // 勤務先(3) 業種（最大2件）
  workplaceIndustry1: optionalString,
  workplaceIndustry2: optionalString,
  workplaceIndustryOther: optionalString,
  // 代理人・取次者
  agent: agentSchema.optional(),
  agencyRep: agencyRepSchema.optional(),
});

// ─── 同時申請：就労資格証明書交付申請 ───────────────────────────────────
const authEmploymentCertSchema = z.object({
  // 証明を希望する活動の内容
  certificationActivityDescription: optionalString.describe('証明を希望する活動の内容'),
  // 就労する期間
  employmentPeriodStart: optionalDateString.describe('就労する期間(始期)'),
  employmentPeriodEnd: optionalDateString.describe('就労する期間(終期)'),
  // 使用目的
  purpose: optionalString.describe('使用目的'),
  // 代理人・取次者
  agent: agentSchema.optional(),
  agencyRep: agencyRepSchema.optional(),
});

// ─── 同時申請共通情報 ─────────────────────────────────────────────────
const simultaneousCommonInfoSchema = z.object({
  nationality: optionalString.describe('国籍・地域'),
  birthDate: optionalString.describe('生年月日'),
  nameEn: optionalString.describe('氏名'),
  gender: z.enum(['male', 'female']).optional().describe('性別'),
  zipCode: optionalZipCode.describe('住居地 郵便番号'),
  prefecture: optionalString.describe('住居地(都道府県)'),
  city: optionalString.describe('住居地(市区町村)'),
  addressLines: optionalString.describe('住居地(町名丁目番地号等)'),
  phone: optionalPhone.describe('電話番号'),
  mobilePhone: optionalPhone.describe('携帯電話番号'),
  passportNumber: optionalString.describe('旅券番号'),
  passportExpiryDate: optionalDateString.describe('旅券有効期限'),
  currentResidenceStatus: optionalString.describe('現に有する在留資格'),
  currentStayPeriod: optionalString.describe('在留期間'),
  stayExpiryDate: optionalDateString.describe('在留期間の満了日'),
  hasResidenceCard: z.boolean().optional().describe('在留カードの有無'),
  residenceCardNumber: optionalString.describe('在留カード番号'),
  edNumberAlpha: z.string().length(4).optional().or(z.literal('')).describe('ED番号(英字)'),
  edNumberNumeric: z.string().length(7).optional().or(z.literal('')).describe('ED番号(数字)'),
});

// ─── 同時申請情報 (Sheet 3) ──────────────────────────────────────────────────
export const simultaneousApplicationSchema = z.object({
  // 申請種別フラグ
  applyForReEntry: z.boolean().describe('sheet3:B 再入国許可申請の有無'),
  applyForActivityOutsideStatus: z.boolean().describe('sheet3:C 資格外活動許可申請の有無'),
  applyForAuthEmployment: z.boolean().describe('sheet3:D 就労資格証明書交付申請の有無'),

  // 共通項目（同時申請用）
  commonInfo: simultaneousCommonInfoSchema.optional().describe('同時申請共通項目'),

  // 各申請詳細
  reEntryPermit: reEntryPermitSchema.optional().describe('再入国許可申請詳細'),
  activityOutsideStatus: activityOutsideStatusSchema.optional().describe('資格外活動許可申請詳細'),
  authEmploymentCert: authEmploymentCertSchema.optional().describe('就労資格証明書交付申請詳細'),
}).optional();

// ─── 添付ファイルメタデータスキーマ ──────────────────────────────────────────
/**
 * 1件の添付ファイルに関するメタデータ。
 * 実ファイルは Firebase Storage に保存し、ここには参照情報のみ保持する。
 */
export const attachmentMetaSchema = z.object({
  /** クライアント生成のユニークID (crypto.randomUUID) */
  id: z.string(),
  /** オリジナルのファイル表示名 */
  name: z.string(),
  /** Firebase Storage のダウンロードURL */
  url: z.string().url(),
  /** Firebase Storage 内のオブジェクトパス（削除時に使用） */
  path: z.string(),
  /** ファイルサイズ（バイト） */
  size: z.number().min(0),
  /** MIMEタイプ */
  mimeType: z.string(),
  /** アップロード日時（ISO 8601） */
  uploadedAt: z.string(),
  /** 事前選択された書類タグ（例：パスポート顔写真ページ） */
  tag: z.string().optional(),
});

export type AttachmentMeta = z.infer<typeof attachmentMetaSchema>;

/**
 * タブ別添付ファイルマップ（ドキュメントルートに配置）。
 * タブごとに AttachmentMeta の配列を持ち、横断的な合計容量計算を容易にする。
 * optional なフィールドとし、画面側で ?? [] でフォールバックする。
 */
export const attachmentsMapSchema = z.object({
  foreignerInfo: z.array(attachmentMetaSchema).optional(),
  employerInfo:  z.array(attachmentMetaSchema).optional(),
  simultaneous:  z.array(attachmentMetaSchema).optional(),
});

export type AttachmentsMap = z.infer<typeof attachmentsMapSchema>;

// ─── 申請書全体スキーマ ───────────────────────────────────────────────────────
/**
 * タブIDをキー、担当者ユーザーIDを値とする割り当てマップ
 * キー例: 'foreigner' | 'employer' | 'simultaneous'
 */
export const tabAssignmentsSchema = z.record(z.string(), z.string());

export const renewalApplicationSchema = z.object({
  foreignerInfo: foreignerInfoSchema,
  employerInfo: employerInfoSchema,
  simultaneousApplication: simultaneousApplicationSchema,
  /** タブごとの担当者割り当て（tabId → userId） */
  assignments: tabAssignmentsSchema.optional(),
  /**
   * タブごとの添付ファイルリスト（ドキュメントルートで一元管理）。
   * 全タブを横断した合計サイズ・ファイル数のバリデーションを容易にするため、
   * 各タブのformDataにではなく、ルートに配置する。
   */
  attachments: attachmentsMapSchema.optional(),
});

export type TabId = 'foreigner' | 'employer' | 'simultaneous';
export type TabAssignments = Partial<Record<TabId, string>>;
export type RenewalApplicationFormData = z.infer<typeof renewalApplicationSchema>;

// ─── 派生型エクスポート（extractor等で使用）────────────────────────────────
export type JobHistory = z.infer<typeof jobHistorySchema>;
export type Relative = z.infer<typeof relativeSchema>;
export type AgentInfo = z.infer<typeof agentSchema>;
export type AgencyRepInfo = z.infer<typeof agencyRepSchema>;
export type SupportPlan = z.infer<typeof supportPlanSchema>;
export type ComplianceOaths = z.infer<typeof complianceOathsSchema>;
export type DispatchDestination = z.infer<typeof dispatchDestinationSchema>;
export type PlacementAgency = z.infer<typeof placementAgencySchema>;
export type IntermediaryAgency = z.infer<typeof intermediaryAgencySchema>;
export type SupportAgency = z.infer<typeof supportAgencySchema>;
export type ReEntryPermit = z.infer<typeof reEntryPermitSchema>;
export type ActivityOutsideStatus = z.infer<typeof activityOutsideStatusSchema>;
export type AuthEmploymentCert = z.infer<typeof authEmploymentCertSchema>;
