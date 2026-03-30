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

const zipCodeString = z.string().regex(/^\d{7}$/, '郵便番号はハイフンなし7桁で入力してください');
const phoneString = z.string().regex(/^0\d{9,10}$/, '電話番号の形式が正しくありません');

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

// ─── 職歴 ──────────────────────────────────────────────────────────────────
const jobHistorySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM形式で入力してください').describe('sheet2:AK-BL 入社年月'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM形式で入力してください').optional().or(z.literal('')).describe('sheet2:AL-BM 退社年月'),
  companyName: requiredString.describe('sheet2:AM-BN 勤務先名称'),
});

// ─── 技能・日本語能力の証明 ─────────────────────────────────────────────────
const skillCertificationSchema = z.object({
  method: z.enum(['exam', 'technical_intern', 'none']).describe('技能水準・日本語能力 評価区分'),
  examName: optionalString.describe('合格した試験名'),
  examLocation: optionalString.describe('受験地'),
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

    edNumberAlpha: z.string().length(2, '英字2桁').optional().or(z.literal('')).describe('sheet1:W ED番号(英字)'),
    edNumberNumeric: z.string().length(8, '数字8桁').optional().or(z.literal('')).describe('sheet1:X ED番号(数字)'),

    currentResidenceStatus: requiredString.describe('sheet1:R 現に有する在留資格'),
    currentStayPeriod: requiredString.describe('sheet1:S 在留期間'),
    stayExpiryDate: dateString.describe('sheet1:T 在留期間の満了日'),
    hasResidenceCard: z.boolean().describe('sheet1:U 在留カードの有無'),
    residenceCardNumber: requiredString
      .regex(/^[A-Z]{2}\d{8}[A-Z]{2}$/, '在留カード番号の形式が正しくありません')
      .describe('sheet1:V 在留カード番号'),

    desiredStayPeriod: z.enum(['4months', '6months', '1year', 'other']).describe('sheet1:Y 希望する在留期間'),
    desiredStayPeriodOther: optionalString,
    renewalReason: requiredString.min(10, '更新の理由を詳しく入力してください（10文字以上）').describe('sheet1:Z 更新の理由'),
    
    criminalRecord: z.boolean().describe('sheet1:AA 犯罪を理由とする処分を受けたことの有無'),
    criminalRecordDetail: optionalString.describe('sheet1:AB 処分の内容'),

    specificSkillCategory: z.enum(['1', '2']).describe('特定技能の区分'),
    skillCertifications: z.array(skillCertificationSchema).describe('技能水準証明枠'),
    languageCertifications: z.array(skillCertificationSchema).describe('日本語能力証明枠'),
    otherSkillCert: optionalString.describe('sheet2:I 技能水準 その他の評価方法'),
    otherLanguageCert: optionalString.describe('sheet2:Q 日本語能力 その他の評価方法'),
    
    totalSpecificSkillStayYears: z.number().min(0).max(5).optional().describe('sheet2:X 特定技能1号通算在留期間(年)'),
    totalSpecificSkillStayMonths: z.number().min(0).max(11).optional().describe('sheet2:Y 特定技能1号通算在留期間(月)'),

    // 保証金・費用 (Sheet 2)
    depositCharged: z.boolean().describe('sheet2:Z 保証金の徴収等の有無'),
    depositOrganizationName: optionalString.describe('sheet2:AA 徴収・管理機関名'),
    depositAmount: z.number().optional().describe('sheet2:AB 徴収金額'),
    feeCharged: z.boolean().describe('sheet2:AC 外国機関への費用支払合意の有無'),
    foreignOrganizationName: optionalString.describe('sheet2:AD 外国の機関名'),
    feeAmount: z.number().optional().describe('sheet2:AE 支払額'),

    hasRelatives: z.boolean().describe('sheet1:AC 在日親族・同居者の有無'),
    relatives: z.array(relativeSchema),

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


// ─── 所属機関情報スキーマ (Sheet 2) ───────────────────────────────────────────
export const employerInfoSchema = z.object({
  contractStartDate: dateString.describe('sheet2:CD 雇用契約期間(始期)'),
  contractEndDate: dateString.describe('sheet2:CE 雇用契約期間(終期)'),
  
  industryFields: z.array(z.string()).min(1, '少なくとも1つ選択してください').describe('特定産業分野'),
  jobCategories: z.array(z.string()).min(1, '少なくとも1つ選択してください').describe('業務区分'),
  mainJobType: requiredString.describe('sheet2:CL 主たる職種'),
  otherJobTypes: z.array(z.string()).describe('他職種'),

  weeklyWorkHours: z.number().min(1).max(60).describe('sheet2:CP 所定労働時間(週平均)'),
  monthlyWorkHours: z.number().min(1).max(280).describe('sheet2:CQ 所定労働時間(月平均)'),
  equivalentWorkHours: z.boolean().describe('sheet2:CR 日本人と同等であることの有無'),

  monthlySalary: z.number().min(100000).describe('sheet2:CS 月額報酬'),
  hourlyRate: z.number().min(1).describe('sheet2:CT 基本給の時間換算額'),
  japaneseMonthlySalary: z.number().min(100000).describe('sheet2:CU 同等の日本人月額報酬'),
  equivalentSalary: z.boolean().describe('sheet2:CV 日本人と同等以上であることの有無'),
  paymentMethod: z.enum(['cash', 'bank_transfer']).describe('sheet2:CW 報酬の支払方法'),
  
  hasDifferentTreatment: z.boolean().describe('sheet2:CX 異なった待遇の有無'),
  differentTreatmentDetail: optionalString.describe('sheet2:CY 異なった待遇の内容'),

  companyNameJa: requiredString.describe('sheet2:EI 氏名又は名称'),
  hasCorporateNumber: z.boolean().describe('sheet2:EJ 法人番号の有無'),
  corporateNumber: z.string().regex(/^\d{13}$/).describe('sheet2:EK 法人番号'),
  employmentInsuranceNumber: z.string().regex(/^\d{11}$/).describe('sheet2:EL 雇用保険適用事業所番号'),
  companyZipCode: zipCodeString.describe('sheet2:ES 所在地 郵便番号'),
  companyPref: requiredString.describe('sheet2:ET 所在地(都道府県)'),
  companyCity: requiredString.describe('sheet2:EU 所在地(市区町村)'),
  companyAddressLines: requiredString.describe('sheet2:EV 所在地(町名丁目番地号等)'),
  companyAddress: optionalString,
  representativeName: requiredString.describe('sheet2:FA 代表者の氏名'),
  companyPhone: phoneString.describe('sheet2:EW 電話番号'),
  capital: z.number().min(0).optional().describe('sheet2:EX 資本金'),
  annualRevenue: z.number().min(0).optional().describe('sheet2:EY 年間売上金額'),
  employeeCount: z.number().min(1).describe('sheet2:EZ 常勤職員数'),

  workplaceName: requiredString.describe('sheet2:FB 勤務させる事業所名'),
  workplaceZipCode: zipCodeString.describe('sheet2:FC 郵便番号'),
  workplacePref: requiredString.describe('sheet2:FD 所在地(都道府県)'),
  workplaceCity: requiredString.describe('sheet2:FE 所在地(市区町村)'),
  workplaceAddressLines: requiredString.describe('sheet2:FF 所在地(町名丁目番地号等)'),
  isSocialInsuranceApplicable: z.boolean().describe('sheet2:FG 社会保険適用の有無'),
  isLaborInsuranceApplicable: z.boolean().describe('sheet2:FH 労働保険適用の有無'),
  laborInsuranceNumber: requiredString.describe('sheet2:FI 労働保険番号'),

  hasJobHistory: z.boolean().describe('sheet2:AJ 職歴の有無'),
  jobHistory: z.array(jobHistorySchema),

  // 誓約・支援体制はシンプル化して扱う（裏側でTrue固定にするものが多い想定）
  complianceOaths: z.object({
    hadLaborLawPenalty: z.boolean(),
    hadIllegalDismissal: z.boolean(),
    hadMissingPersons: z.boolean(),
  }).describe('欠格事由・誓約項目'),
  delegateSupportEntirely: z.boolean().describe('sheet2:HC 登録支援機関への全部委託の有無'),
  supportAgencyName: optionalString.describe('sheet2:HD 登録支援機関の名称'),
  supportAgencyRegistrationNumber: optionalString.describe('sheet2:HE 登録支援機関の登録番号'),
  supportPersonnel: z.object({
    supervisorName: requiredString,
    supervisorTitle: requiredString,
    officerName: requiredString,
    officerTitle: requiredString,
  }).describe('支援責任者・担当者'),
});

// ─── 同時申請情報 (Sheet 3) ──────────────────────────────────────────────────
export const simultaneousApplicationSchema = z.object({
  applyForReEntry: z.boolean().describe('sheet3:B 再入国許可申請の有無'),
  applyForActivityOutsideStatus: z.boolean().describe('sheet3:C 資格外活動許可申請の有無'),
  applyForAuthEmployment: z.boolean().describe('sheet3:D 就労資格証明書交付申請の有無'),
  // ...詳細項目は必要に応じて追加。一旦フラグのみで構成。
}).optional();

// ─── 申請書全体スキーマ ───────────────────────────────────────────────────────
export const renewalApplicationSchema = z.object({
  foreignerInfo: foreignerInfoSchema,
  employerInfo: employerInfoSchema,
  simultaneousApplication: simultaneousApplicationSchema,
});

export type RenewalApplicationFormData = z.infer<typeof renewalApplicationSchema>;
