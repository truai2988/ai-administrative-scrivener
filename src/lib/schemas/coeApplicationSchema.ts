import { z } from 'zod';
import { formOptions } from '../constants/formOptions';

// ─── 共通バリデーター ────────────────────────────────────────────────────────
const requiredString = z.string().min(1, '必須項目です');

// 動的配列からz.enum用のタプルを生成するヘルパー
const getEnumValues = (options: { value: string }[]) => {
  if (!options || options.length === 0) return [''] as [string, ...string[]];
  const values = options.map(o => o.value);
  return [values[0], ...values.slice(1)] as [string, ...string[]];
};

// YYYYMMDD の8桁固定、または空文字を許容
const dateString8 = z
  .string()
  .regex(/^(|\d{8})$/, '日付形式はYYYYMMDD(8桁)で入力してください');

// 過去の日付（YYYYMMDD）
const pastDateString8 = z
  .string()
  .regex(/^(|\d{8})$/, '日付形式はYYYYMMDD(8桁)で入力してください')
  .refine(
    (val) => {
      if (!val) return true; // 空文字は許容（必須バリデーションは別途）
      const year = parseInt(val.substring(0, 4), 10);
      const month = parseInt(val.substring(4, 6), 10) - 1;
      const day = parseInt(val.substring(6, 8), 10);
      const date = new Date(year, month, day);
      return date <= new Date();
    },
    '過去の日付を入力してください'
  );

// 未来の日付（YYYYMMDD）
const futureDateString8 = z
  .string()
  .regex(/^(|\d{8})$/, '日付形式はYYYYMMDD(8桁)で入力してください')
  .refine(
    (val) => {
      if (!val) return true;
      const year = parseInt(val.substring(0, 4), 10);
      const month = parseInt(val.substring(4, 6), 10) - 1;
      const day = parseInt(val.substring(6, 8), 10);
      const date = new Date(year, month, day);
      return date >= new Date(new Date().setHours(0, 0, 0, 0));
    },
    '今日以降の日付を入力してください'
  );

const zipCodeString = z.string().regex(/^(|\d{7})$/, '郵便番号はハイフンなし7桁で入力してください');
const optionalZipCode = z.string().regex(/^(|\d{7})$/, '郵便番号はハイフンなし7桁').optional();
const phoneString = z.string().regex(/^(|0\d{9,10})$/, '電話番号の形式が正しくありません');
const optionalPhone = z.string().regex(/^(|0\d{9,10})$/, '電話番号の形式が正しくありません').optional();



const alphanumericExact = (length: number) =>
  z.string().regex(new RegExp(`^[A-Za-z0-9]{${length}}$`), `英数字${length}文字で入力してください`).or(z.literal(''));


// ─── 身分事項 (Identity Info) ─────────────────────────────────────────────────
export const identityInfoSchema = z.object({
  // CSV: 申請情報入力(在留資格認定証明書交付申請).csv に相当
  nationality: z.enum(getEnumValues(formOptions.nationality)).describe('国籍・地域'),
  birthDate: pastDateString8.min(1, '必須項目です').describe('生年月日'),
  nameEn: requiredString
    .max(80, '80文字以内で入力してください')
    .regex(/^[A-Za-z\s]+$/, '英字・スペースのみで入力してください')
    .describe('氏名'),
  nameKanji: z.string().max(40, '40文字以内で入力してください').optional().describe('氏名（母国語）'),
  gender: z.enum(['1', '2']).describe('性別 (1:男, 2:女)'),
  birthPlace: requiredString.max(40, '40文字以内で入力してください').describe('出生地'),
  maritalStatus: z.enum(['1', '2']).describe('配偶者の有無 (1:有, 2:無)'),
  occupation: requiredString.max(40, '40文字以内で入力してください').describe('職業'),
  homeCountryAddress: requiredString.max(120, '120文字以内で入力してください').describe('本国における居住地'),

  japanZipCode: zipCodeString.describe('日本における連絡先 郵便番号'),
  japanPrefecture: requiredString.describe('日本における連絡先(都道府県)'),
  japanCity: requiredString.describe('日本における連絡先(市区町村)'),
  japanAddressLines: requiredString.max(120, '120文字以内で入力してください').describe('日本における連絡先(町名丁目番地号等)'),
  
  phoneNumber: phoneString.describe('日本における連絡先 電話番号'),
  mobileNumber: optionalPhone.describe('日本における連絡先 携帯電話番号'),
  email: z.string().email('正しいメールアドレスを入力してください').max(50).optional().or(z.literal('')).describe('メールアドレス'),

  passportNumber: z.string().max(20).optional().describe('旅券 (1)番号'),
  passportExpiryDate: dateString8.optional().describe('旅券 (2)有効期限'),

  entryPurpose: z.enum(getEnumValues(formOptions.entryPurpose)).describe('入国目的（在留資格）'),
  entryPurposeOther: z.string().max(40, '40文字以内で入力してください').optional().describe('入国目的（その他）'),
  entryPort: z.enum(getEnumValues(formOptions.entryPort)).describe('入国予定港'),
  entryDate: futureDateString8.describe('入国予定年月日'),
  stayPeriod: requiredString.max(40, '40文字以内で入力してください').describe('滞在予定期間'),

  accompanyingPersons: z.enum(['1', '2']).describe('同伴者の有無 (1:有, 2:無)'),
  visaApplicationPlace: requiredString.max(40, '40文字以内で入力してください').describe('査証申請予定地'),

  pastEntryCount: z.string().regex(/^(|\d{1,3})$/, '3桁以内の数字で入力してください').optional().describe('過去の出入国歴 回数'),
  latestEntryDate: pastDateString8.optional().describe('過去の出入国歴 直近の出入国歴（入国）'),
  latestDepartureDate: pastDateString8.optional().describe('過去の出入国歴 直近の出入国歴（出国）'),

  pastApplicationRecord: z.enum(['1', '2']).describe('過去の在留資格認定証明書交付申請歴 (1:有, 2:無)'),
  pastApplicationCount: z.string().regex(/^(|\d{1,3})$/, '3桁以内の数字で入力してください').optional().describe('過去の在留資格認定証明書交付申請歴 回数'),
  pastApplicationApprovalCount: z.string().regex(/^(|\d{1,3})$/, '3桁以内の数字で入力してください').optional().describe('過去の在留資格認定証明書交付申請歴 不交付となった回数'),

  criminalRecord: z.enum(['1', '2']).describe('犯罪を理由とする処分を受けたことの有無 (1:有, 2:無)'),
  criminalRecordDetail: z.string().max(120, '120文字以内で入力してください').optional().describe('処分の内容'),

  departureOrderHistory: z.enum(['1', '2']).describe('退去強制又は出国命令による出国の有無 (1:有, 2:無)'),
  departureOrderCount: z.string().regex(/^(|\d{1,3})$/, '3桁以内の数字で入力してください').optional().describe('退去強制又は出国命令による出国の有無 回数'),
  latestDepartureOrderDate: pastDateString8.optional().describe('退去強制又は出国命令による出国の有無 直近の出国日'),

  familyInJapan: z.enum(['1', '2']).describe('在日親族（父・母・配偶者・子・兄弟姉妹など）及び同居者の有無 (1:有, 2:無)'),
  relatives: z.array(z.object({
    relationship: requiredString.max(40).describe('続柄'),
    name: requiredString.max(80).describe('氏名'),
    birthDate: pastDateString8.min(1, '必須項目です').describe('生年月日'),
    nationality: requiredString.max(40).describe('国籍・地域'),
    cohabitation: z.enum(['1', '2']).describe('同居の有無 (1:有, 2:無)'),
    workplace: z.string().max(40).optional().describe('勤務先名称・通学先名称'),
    residenceCardNumber: alphanumericExact(12).describe('在留カード番号'),
  })).max(6).optional().describe('在日親族リスト（最大6名）'),
});

// ─── 申請人情報（区分V特有） (Applicant Specific Info) ────────────────────────────────
export const applicantSpecificInfoSchema = z.object({
  // 経歴
  academicBackground: z.enum(['1', '2', '3', '4', '5', '6', '7']).describe('修学歴（1:大学院博士, 2:大学院修士, 3:大学, 4:短期大学, 5:専門学校, 6:高等学校, 7:その他）'),
  schoolName: requiredString.max(80).describe('学校名'),
  graduationDate: dateString8.optional().describe('卒業年月日'),
  majorCategory: z.enum(['1', '2', '3', '4']).optional().describe('専攻（1:文系, 2:理系, 3:芸術・体育系, 4:その他）'),
  majorDetails: z.string().max(40).optional().describe('専攻詳細'),
  
  // 職歴（最大8件）
  hasJobHistory: z.enum(['1', '2']).describe('職歴の有無 (1:有, 2:無)'),
  jobHistory: z.array(z.object({
    startDate: dateString8.optional().describe('入社年月'),
    endDate: dateString8.optional().describe('退社年月'),
    companyName: z.string().max(80).optional().describe('勤務先名称'),
  })).max(8).optional().describe('職歴（最大8件）'),

  // 資格、日本語能力など
  hasJapaneseCertification: z.enum(['1', '2']).describe('日本語能力証明 (1:有, 2:無)'),
  japaneseCertificationName: z.string().max(40).optional().describe('合格した試験名'),
  japaneseCertificationGrade: z.string().max(40).optional().describe('級'),
  
  // その他区分V固有の申請人関連項目（必要に応じて追加）
});

// ─── 法定代理人 (Legal Representative) ───────────────────────────────────────
export const legalRepresentativeSchema = z.object({
  name: z.string().max(80).optional().describe('代理人 (1)氏名'),
  relationship: z.string().max(40).optional().describe('代理人 (2)本人との関係'),
  zipCode: optionalZipCode.describe('代理人 (3)郵便番号'),
  prefecture: z.string().max(40).optional().describe('代理人 (3)住所(都道府県)'),
  city: z.string().max(40).optional().describe('代理人 (3)住所(市区町村)'),
  addressLines: z.string().max(120).optional().describe('代理人 (3)住所(町名丁目番地号等)'),
  phone: optionalPhone.describe('代理人 (3)電話番号'),
  mobilePhone: optionalPhone.describe('代理人 (3)携帯電話番号'),
});

// ─── 所属機関・雇用主 (Employers) ───────────────────────────────────────────
// 同居家族スキーマ
const cohabitingFamilySchema = z.object({
  name: z.string().max(80).optional().describe('同居者 氏名'),
  relationship: z.string().max(40).optional().describe('同居者 続柄'),
  nationality: z.string().max(40).optional().describe('同居者 国籍・地域'),
  birthDate: dateString8.optional().describe('同居者 生年月日'),
  occupation: z.string().max(40).optional().describe('同居者 職業'),
  income: z.string().regex(/^(|\d{1,10})$/, '10桁以内の数字で入力してください').optional().describe('同居者 年収'),
});

// 取次者
export const agencyRepSchema = z.object({
  name: z.string().max(80).optional().describe('取次者 (1)氏名'),
  zipCode: optionalZipCode.describe('取次者 (2)郵便番号'),
  prefecture: z.string().max(40).optional().describe('取次者 (2)住所(都道府県)'),
  city: z.string().max(40).optional().describe('取次者 (2)住所(市区町村)'),
  addressLines: z.string().max(120).optional().describe('取次者 (2)住所(町名丁目番地号等)'),
  organization: z.string().max(80).optional().describe('取次者 (3)所属機関等'),
  phone: optionalPhone.describe('取次者 (3)電話番号'),
});

// 雇用主・所属機関の全体情報
export const employerInfoSchema = z.object({
  companyNameJa: requiredString.max(80).describe('氏名又は名称'),
  hasCorporateNumber: z.enum(['1', '2']).describe('法人番号の有無 (1:有, 2:無)'),
  corporateNumber: z.string().regex(/^(|\d{13})$/, '法人番号は13桁です').describe('法人番号'),
  employmentInsuranceNumber: z.string().regex(/^(|\d{11})$/, '雇用保険適用事業所番号は11桁です').optional().describe('雇用保険適用事業所番号'),

  mainIndustry: z.string().max(40).optional().describe('主たる業種'),
  companyZipCode: zipCodeString.describe('所在地 郵便番号'),
  companyPref: requiredString.max(40).describe('所在地(都道府県)'),
  companyCity: requiredString.max(40).describe('所在地(市区町村)'),
  companyAddressLines: requiredString.max(120).describe('所在地(町名丁目番地号等)'),
  companyPhone: phoneString.describe('電話番号'),

  capital: z.string().regex(/^(|\d{1,12})$/, '12桁以内の数字で入力してください').optional().describe('資本金'),
  annualRevenue: z.string().regex(/^(|\d{1,12})$/, '12桁以内の数字で入力してください').optional().describe('年間売上金額'),
  employeeCount: z.string().regex(/^(|\d{1,6})$/, '6桁以内の数字で入力してください').describe('常勤職員数'),
  foreignEmployeeCount: z.string().regex(/^(|\d{1,6})$/, '6桁以内の数字で入力してください').optional().describe('うち外国人職員数'),

  // 区分V固有の雇用主情報
  monthlySalary: z.string().regex(/^(|\d{1,10})$/, '10桁以内の数字で入力してください').optional().describe('月額報酬'),
  workingHoursPerWeek: z.string().regex(/^(|\d{1,3})$/, '3桁以内の数字で入力してください').optional().describe('週労働時間'),
  
  // 雇用主の同居家族（最大6件など）
  cohabitingFamilies: z.array(cohabitingFamilySchema).max(6).optional().describe('雇用主の同居家族'),
});

// ─── COE申請フォーム全体スキーマ (COE Application Schema) ───────────────────────────
export const tabAssignmentsSchema = z.record(z.string(), z.string());

export const coeApplicationSchema = z.object({
  identityInfo: identityInfoSchema,
  applicantSpecificInfo: applicantSpecificInfoSchema.optional(),
  legalRepresentative: legalRepresentativeSchema.optional(),
  employerInfo: employerInfoSchema.optional(),
  agencyRep: agencyRepSchema.optional(),

  // その他申請書作成用メタデータ
  residenceCardReceiptMethod: z.enum(['1', '2']).describe('在留カードの受領方法 (1:窓口, 2:郵送)'),
  checkIntent: z.enum(['1', '2']).describe('申請意思の確認 (1:確認済, 2:未確認)'),
  freeFormat: z.string().max(120).optional().describe('フリー欄'),

  /** タブごとの担当者割り当て（tabId → userId） */
  assignments: tabAssignmentsSchema.optional(),
});

export type TabId = 'identity' | 'applicant' | 'employer' | 'representative' | 'metadata';
export type TabAssignments = Partial<Record<TabId, string>>;

export type CoeApplicationFormData = z.infer<typeof coeApplicationSchema>;
export type IdentityInfo = z.infer<typeof identityInfoSchema>;
export type ApplicantSpecificInfo = z.infer<typeof applicantSpecificInfoSchema>;
export type LegalRepresentative = z.infer<typeof legalRepresentativeSchema>;
export type EmployerInfo = z.infer<typeof employerInfoSchema>;
export type AgencyRep = z.infer<typeof agencyRepSchema>;
