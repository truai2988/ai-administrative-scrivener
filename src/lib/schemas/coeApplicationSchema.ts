import { z } from 'zod';
import { coeFormOptions } from '@/lib/constants/coeFormOptions';

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
// CSV仕様: 半角数字、12文字以内
const phoneString = z.string().regex(/^(|\d{1,12})$/, '半角数字12文字以内で入力してください');
const optionalPhone = z.string().regex(/^(|\d{1,12})$/, '半角数字12文字以内で入力してください').optional();


// ─── 身分事項 (Identity Info) ─────────────────────────────────────────────────
export const identityInfoSchema = z.object({
  // CSV: 申請情報入力(在留資格認定証明書交付申請).csv に相当
  nationality: z.enum(getEnumValues(coeFormOptions.nationality), { message: '選択してください' }).describe('国籍・地域'),
  birthDate: pastDateString8.min(1, '必須項目です').describe('生年月日'),
  // CSV仕様: 半角英字(大文字入力)、104文字以内、スペース区切り
  nameEn: requiredString
    .max(104, '104文字以内で入力してください')
    .regex(/^[A-Z\s]+$/, '半角英字(大文字)・スペースのみで入力してください')
    .describe('氏名'),
  nameKanji: z.string().max(40, '40文字以内で入力してください').optional().describe('氏名（母国語）'),
  gender: z.enum(['1', '2'], { message: '選択してください' }).describe('性別 (1:男, 2:女)'),
  birthPlace: requiredString.max(40, '40文字以内で入力してください').describe('出生地'),
  maritalStatus: z.enum(['1', '2'], { message: '選択してください' }).describe('配偶者の有無 (1:有, 2:無)'),
  occupation: requiredString.max(40, '40文字以内で入力してください').describe('職業'),
  // CSV仕様: 全角、80文字以内
  homeCountryAddress: requiredString.max(80, '80文字以内で入力してください').describe('本国における居住地'),

  japanZipCode: zipCodeString.describe('日本における連絡先 郵便番号'),
  japanPrefecture: requiredString.describe('日本における連絡先(都道府県)'),
  japanCity: requiredString.describe('日本における連絡先(市区町村)'),
  // CSV仕様: 全角、85文字以内
  japanAddressLines: requiredString.max(85, '85文字以内で入力してください').describe('日本における連絡先(町名丁目番地号等)'),
  
  phoneNumber: phoneString.describe('日本における連絡先 電話番号'),
  mobileNumber: optionalPhone.describe('日本における連絡先 携帯電話番号'),
  // CSV仕様: 半角英数字記号、60文字以内
  email: z.string().email('正しいメールアドレスを入力してください').max(60, '60文字以内で入力してください').optional().or(z.literal('')).describe('メールアドレス'),

  // CSV仕様: 半角英数字記号、12文字以内
  passportNumber: z.string().max(12, '12文字以内で入力してください').regex(/^(|[A-Za-z0-9]+)$/, '半角英数字で入力してください').optional().describe('旅券 (1)番号'),
  // CSV仕様: YYYYMMDD、半角数字8文字
  passportExpiryDate: dateString8.optional().describe('旅券 (2)有効期限'),

  entryPurpose: z.enum(getEnumValues(coeFormOptions.entryPurpose), { message: '選択してください' }).describe('入国目的（在留資格）'),
  entryPurposeOther: z.string().max(40, '40文字以内で入力してください').optional().describe('入国目的（その他）'),
  entryPort: z.enum(getEnumValues(coeFormOptions.entryPort), { message: '選択してください' }).describe('入国予定港'),
  entryDate: futureDateString8.describe('入国予定年月日'),
  stayPeriod: requiredString.max(40, '40文字以内で入力してください').describe('滞在予定期間'),

  accompanyingPersons: z.enum(['1', '2'], { message: '選択してください' }).describe('同伴者の有無 (1:有, 2:無)'),
  visaApplicationPlace: requiredString.max(40, '40文字以内で入力してください').describe('査証申請予定地'),

  pastEntryCount: z.string().regex(/^(|\d{1,3})$/, '3桁以内の数字で入力してください').optional().describe('過去の出入国歴 回数'),
  latestEntryDate: pastDateString8.optional().describe('過去の出入国歴 直近の出入国歴（入国）'),
  latestDepartureDate: pastDateString8.optional().describe('過去の出入国歴 直近の出入国歴（出国）'),

  pastApplicationRecord: z.enum(['1', '2'], { message: '選択してください' }).describe('過去の在留資格認定証明書交付申請歴 (1:有, 2:無)'),
  pastApplicationCount: z.string().regex(/^(|\d{1,3})$/, '3桁以内の数字で入力してください').optional().describe('過去の在留資格認定証明書交付申請歴 回数'),
  pastApplicationApprovalCount: z.string().regex(/^(|\d{1,3})$/, '3桁以内の数字で入力してください').optional().describe('過去の在留資格認定証明書交付申請歴 不交付となった回数'),

  criminalRecord: z.enum(['1', '2'], { message: '選択してください' }).describe('犯罪を理由とする処分を受けたことの有無 (1:有, 2:無)'),
  // CSV仕様: 40文字以内
  criminalRecordDetail: z.string().max(40, '40文字以内で入力してください').optional().describe('処分の内容'),

  departureOrderHistory: z.enum(['1', '2'], { message: '選択してください' }).describe('退去強制又は出国命令による出国の有無 (1:有, 2:無)'),
  departureOrderCount: z.string().regex(/^(|\d{1,3})$/, '3桁以内の数字で入力してください').optional().describe('退去強制又は出国命令による出国の有無 回数'),
  latestDepartureOrderDate: pastDateString8.optional().describe('退去強制又は出国命令による出国の有無 直近の出国日'),

  familyInJapan: z.enum(['1', '2'], { message: '選択してください' }).describe('在日親族（父・母・配偶者・子・兄弟姉妹など）及び同居者の有無 (1:有, 2:無)'),
  // CSV仕様: 在日親族（最大6名）
  relatives: z.array(z.object({
    relationship: requiredString.max(40).describe('続柄'), // プルダウンから選択
    name: requiredString.max(26, '26文字以内で入力してください').describe('氏名'), // CSV仕様: 全角、26文字以内
    birthDate: pastDateString8.min(1, '必須項目です').describe('生年月日'), // YYYYMMDD 半角数字8文字
    nationality: requiredString.max(40).describe('国籍・地域'), // プルダウンから選択
    cohabitation: z.enum(['1', '2'], { message: '選択してください' }).describe('同居予定の有無 (1:有, 2:無)'), // プルダウンから選択
    workplace: z.string().max(60, '60文字以内で入力してください').optional().describe('勤務先名称・通学先名称'), // CSV仕様: 全角、60文字以内
    residenceCardNumber: z.string().regex(/^(|[A-Z0-9]{12})$/, '半角英数字(大文字)12文字で入力してください').optional().describe('在留カード番号'), // CSV仕様: 半角英数字(大文字入力)、12文字
  })).max(6).optional().describe('在日親族リスト（最大6名）'),
});

// ─── 申請人情報（区分V特有） (Applicant Specific Info) ────────────────────────────────
// YYYYMM の6桁固定、または空文字を許容
const dateString6 = z
  .string()
  .regex(/^(|\d{6})$/, '年月形式はYYYYMM(6桁)で入力してください');

// YYYY の4桁固定、または空文字を許容
const yearString4 = z
  .string()
  .regex(/^(|\d{4})$/, '年はYYYY(4桁)で入力してください');

export const applicantSpecificInfoSchema = z.object({
  // CSV仕様: プルダウンから選択
  activityContent: z.string().optional().describe('活動内容'),

  // 最終学歴
  academicBackground: z.enum(['1', '2', '3', '4', '5', '6', '7'], { message: '選択してください' }).describe('最終学歴(1) プルダウン'),
  academicBackgroundDetail: z.string().optional().describe('最終学歴(2) プルダウン'),
  academicBackgroundOther: z.string().max(40, '40文字以内で入力してください').optional().describe('最終学歴(2) その他'),
  // CSV仕様: 60文字以内
  schoolName: requiredString.max(60, '60文字以内で入力してください').describe('学校名'),
  // CSV仕様: 50文字以内
  facultyName: z.string().max(50, '50文字以内で入力してください').optional().describe('学部・課程又は専門課程名称'),
  // CSV仕様: 半角数字、6文字 (YYYYMM)
  graduationDate: dateString6.optional().describe('卒業年月'),
  // CSV仕様: YYYYMMDD、半角数字8文字（准看護師の免許取得年月日）
  nursingLicenseDate: dateString8.optional().describe('准看護師の免許取得年月日'),

  // 専攻・専門分野
  majorCategory: z.string().optional().describe('専攻・専門分野（大学院～短期大学）'),
  majorDetails: z.string().max(40, '40文字以内で入力してください').optional().describe('専攻詳細（その他の場合）'),
  majorCategoryCollege: z.string().optional().describe('専攻・専門分野（専門学校）'),
  majorDetailsCollege: z.string().max(40, '40文字以内で入力してください').optional().describe('専攻詳細（専門学校・その他の場合）'),

  // 実務経験年数
  businessExperienceYears: z.string().regex(/^(|\d{1,3})$/, '3文字以内の半角数字で入力してください').optional().describe('経営又は管理の実務経験年数'),
  fieldExperienceYears: z.string().regex(/^(|\d{1,3})$/, '3文字以内の半角数字で入力してください').optional().describe('業務の実務経験年数'),

  // 在学中の大学
  currentUniversity: z.string().max(60, '60文字以内で入力してください').optional().describe('在学中の大学名'),
  currentFaculty: z.string().max(40, '40文字以内で入力してください').optional().describe('学部・課程'),

  // 具体的な在留目的（滞在費支弁方法を含む）
  // CSV仕様: 600文字以内
  purposeOfStay: z.string().max(600, '600文字以内で入力してください').optional().describe('具体的な在留目的'),
  
  // 職歴（最大8件）
  // CSV仕様: プルダウンから選択（外国におけるものを含む）
  hasJobHistory: z.enum(['1', '2'], { message: '選択してください' }).describe('職歴の有無 (1:有, 2:無)'),
  jobHistory: z.array(z.object({
    country: z.string().optional().describe('国・地域名'), // プルダウン
    startDateUnknown: z.string().optional().describe('入社年月不詳'), // プルダウン
    // CSV仕様: 半角数字、6文字 (YYYYMM)
    startDate: dateString6.optional().describe('入社年月'),
    startYear: yearString4.optional().describe('入社年（月不詳の場合）'),
    endDateUnknown: z.string().optional().describe('退社年月不詳'), // プルダウン
    // CSV仕様: 半角数字、6文字 (YYYYMM)
    endDate: dateString6.optional().describe('退社年月'),
    endYear: yearString4.optional().describe('退社年（月不詳の場合）'),
    // CSV仕様: 半角英数字記号、200文字以内
    companyNameEn: z.string().max(200, '200文字以内で入力してください').optional().describe('勤務先名称（英字表記）'),
    // CSV仕様: 60文字以内
    companyNameJa: z.string().max(60, '60文字以内で入力してください').optional().describe('勤務先名称（漢字表記）'),
  })).max(8).optional().describe('職歴（最大8件）'),

  // 経歴（大会出場歴、最大10件）
  competitionHistory: z.array(z.object({
    competitionType: z.string().optional().describe('大会の種類'), // プルダウン
    competitionName: z.string().max(60, '60文字以内で入力してください').optional().describe('出場競技会名'),
    competitionYear: yearString4.optional().describe('大会出場年'), // 半角数字、4文字(YYYY)
  })).max(10).optional().describe('大会出場歴（最大10件）'),

  // 資格、日本語能力など
  hasJapaneseCertification: z.enum(['1', '2'], { message: '選択してください' }).optional().describe('日本語能力証明 (1:有, 2:無)'),
  japaneseCertificationName: z.string().max(40).optional().describe('合格した試験名'),
  japaneseCertificationGrade: z.string().max(40).optional().describe('級'),
});

// ─── 法定代理人 (Legal Representative) ───────────────────────────────────────
export const legalRepresentativeSchema = z.object({
  // CSV仕様: 全角、26文字以内
  name: z.string().max(26, '26文字以内で入力してください').optional().describe('代理人 (1)氏名'),
  // CSV仕様: 40文字以内
  relationship: z.string().max(40, '40文字以内で入力してください').optional().describe('代理人 (2)本人との関係'),
  zipCode: optionalZipCode.describe('代理人 (3)郵便番号'),
  prefecture: z.string().optional().describe('代理人 (3)住所(都道府県)'), // プルダウン
  city: z.string().optional().describe('代理人 (3)住所(市区町村)'), // プルダウン
  // CSV仕様: 全角、85文字以内
  addressLines: z.string().max(85, '85文字以内で入力してください').optional().describe('代理人 (3)住所(町名丁目番地号等)'),
  phone: optionalPhone.describe('代理人 (3)電話番号'),
  mobilePhone: optionalPhone.describe('代理人 (3)携帯電話番号'),
});

// ─── 所属機関・雇用主 (Employers) ───────────────────────────────────────────
// 同居家族スキーマ
const cohabitingFamilySchema = z.object({
  relationship: z.string().optional().describe('同居家族 続柄'), // プルダウン
  relationshipOther: z.string().max(40, '40文字以内で入力してください').optional().describe('同居家族 続柄（その他）'),
  // CSV仕様: 全角、26文字以内
  name: z.string().max(26, '26文字以内で入力してください').optional().describe('同居家族 氏名'),
  // CSV仕様: YYYYMMDD、半角数字8文字
  birthDate: dateString8.optional().describe('同居家族 生年月日'),
  nationality: z.string().optional().describe('同居家族 国籍・地域'), // プルダウン
  cohabitation: z.string().optional().describe('同居家族 同居の有無'), // プルダウン
  // CSV仕様: 60文字以内
  workplace: z.string().max(60, '60文字以内で入力してください').optional().describe('同居家族 勤務先名称・通学先名称'),
  residenceStatus: z.string().optional().describe('同居家族 在留資格'), // プルダウン
});

// 取次者
export const agencyRepSchema = z.object({
  // CSV仕様: 全角、26文字以内
  name: z.string().max(26, '26文字以内で入力してください').optional().describe('取次者 (1)氏名'),
  zipCode: optionalZipCode.describe('取次者 (2)郵便番号'),
  prefecture: z.string().optional().describe('取次者 (2)住所(都道府県)'), // プルダウン
  city: z.string().optional().describe('取次者 (2)住所(市区町村)'), // プルダウン
  // CSV仕様: 全角、85文字以内
  addressLines: z.string().max(85, '85文字以内で入力してください').optional().describe('取次者 (2)住所(町名丁目番地号等)'),
  // CSV仕様: 256文字以内
  organization: z.string().max(256, '256文字以内で入力してください').optional().describe('取次者 (3)所属機関等'),
  phone: optionalPhone.describe('取次者 (3)電話番号'),
});

// 雇用主・所属機関の全体情報
export const employerInfoSchema = z.object({
  // CSV仕様: 60文字以内
  companyNameJa: requiredString.max(60, '60文字以内で入力してください').describe('勤務先、所属機関又は通学先(1)名称'),
  // CSV仕様: 60文字以内
  branchName: z.string().max(60, '60文字以内で入力してください').optional().describe('支店・事業所名'),
  hasCorporateNumber: z.enum(['1', '2'], { message: '選択してください' }).describe('法人番号の有無 (1:有, 2:無)'),
  // CSV仕様: 半角数字、13桁
  corporateNumber: z.string().regex(/^(|\d{13})$/, '法人番号は半角数字13桁です').describe('法人番号'),
  // CSV仕様: 半角数字、11桁
  employmentInsuranceNumber: z.string().regex(/^(|\d{11})$/, '雇用保険適用事業所番号は半角数字11桁です').optional().describe('雇用保険適用事業所番号'),

  mainIndustry: z.string().optional().describe('主たる業種'), // プルダウン
  mainIndustryOther: z.string().max(40, '40文字以内で入力してください').optional().describe('主たる業種（その他）'),
  subIndustry1: z.string().optional().describe('他業種1'), // プルダウン
  subIndustry1Other: z.string().max(40, '40文字以内で入力してください').optional().describe('他業種1（その他）'),
  subIndustry2: z.string().optional().describe('他業種2'), // プルダウン
  subIndustry2Other: z.string().max(40, '40文字以内で入力してください').optional().describe('他業種2（その他）'),

  companyZipCode: zipCodeString.describe('所在地 郵便番号'),
  companyPref: z.string().optional().describe('所在地(都道府県)'), // プルダウン
  companyCity: z.string().optional().describe('所在地(市区町村)'), // プルダウン
  // CSV仕様: 全角、85文字以内
  companyAddressLines: z.string().max(85, '85文字以内で入力してください').optional().describe('所在地(町名丁目番地号等)'),
  companyPhone: phoneString.describe('電話番号'),

  // CSV仕様: 半角数字、13文字以内
  capital: z.string().regex(/^(|\d{1,13})$/, '13文字以内の半角数字で入力してください').optional().describe('資本金'),
  // CSV仕様: 半角数字、15文字以内
  annualRevenue: z.string().regex(/^(|\d{1,15})$/, '15文字以内の半角数字で入力してください').optional().describe('年間売上高'),
  // CSV仕様: 半角数字、5文字以内
  employeeCount: z.string().regex(/^(|\d{1,5})$/, '5文字以内の半角数字で入力してください').describe('従業員数'),
  foreignEmployeeCount: z.string().regex(/^(|\d{1,15})$/, '15文字以内の半角数字で入力してください').optional().describe('うち外国人職員数'),
  // CSV仕様: 半角数字、5文字以内
  fullTimeEmployeeCount: z.string().regex(/^(|\d{1,5})$/, '5文字以内の半角数字で入力してください').optional().describe('常勤職員数'),

  // 技能実習生・インターンシップ生
  trainee1Count: z.string().regex(/^(|\d{1,5})$/, '5文字以内の半角数字で入力してください').optional().describe('第１号技能実習生数 現在の在籍数'),
  trainee1Planned: z.string().regex(/^(|\d{1,5})$/, '5文字以内の半角数字で入力してください').optional().describe('第１号技能実習生数 受入予定数'),
  internCount: z.string().regex(/^(|\d{1,5})$/, '5文字以内の半角数字で入力してください').optional().describe('インターンシップ生数 現在の在籍数'),
  internPlanned: z.string().regex(/^(|\d{1,5})$/, '5文字以内の半角数字で入力してください').optional().describe('インターンシップ生数 受入予定数'),

  // 職種
  mainOccupation: z.string().optional().describe('主たる職種'), // プルダウン
  subOccupation1: z.string().optional().describe('他職種1'), // プルダウン
  subOccupation2: z.string().optional().describe('他職種2'), // プルダウン
  subOccupation3: z.string().optional().describe('他職種3'), // プルダウン

  // 特定技能カスケード
  specifiedSkilledField: z.string().optional().describe('特定技能の分野'), // 親プルダウン (CC04_L)
  specifiedSkilledSubCategory: z.string().optional().describe('特定技能の業務区分'), // 子プルダウン (CC04_XX_L)

  // 技能実習カスケード
  technicalInternOccupation: z.string().optional().describe('技能実習の職種'), // 親プルダウン (CA94_L)
  technicalInternWork: z.string().optional().describe('技能実習の作業'), // 子プルダウン (CA94_XXX_L)

  // 技能実習カスケード（別テーブル）
  technicalInternOccupation2: z.string().optional().describe('技能実習の職種（別系統）'), // 親プルダウン (CC02_3_L)
  technicalInternWork2: z.string().optional().describe('技能実習の作業（別系統）'), // 子プルダウン (CC02_3_LXX_L)

  // 活動内容詳細
  // CSV仕様: 600文字以内
  activityDetail: z.string().max(600, '600文字以内で入力してください').optional().describe('活動内容詳細'),

  // 職務上の地位
  hasPosition: z.string().optional().describe('職務上の地位'), // プルダウン
  // CSV仕様: 60文字以内
  positionTitle: z.string().max(60, '60文字以内で入力してください').optional().describe('役職名'),
  // CSV仕様: 半角数字、3文字以内
  employmentPeriod: z.string().regex(/^(|\d{1,3})$/, '3文字以内の半角数字で入力してください').optional().describe('就労又は就学予定期間(月数)'),
  // CSV仕様: 半角数字、8文字以内
  monthlySalary: z.string().regex(/^(|\d{1,8})$/, '8文字以内の半角数字で入力してください').optional().describe('月額報酬'),

  // 雇用主の同居家族（最大5件）
  cohabitingFamilies: z.array(cohabitingFamilySchema).max(5).optional().describe('雇用主の同居家族'),
});

// ─── COE申請フォーム全体スキーマ (COE Application Schema) ───────────────────────────


export const coeApplicationSchema = z.object({
  identityInfo: identityInfoSchema,
  applicantSpecificInfo: applicantSpecificInfoSchema.optional(),
  legalRepresentative: legalRepresentativeSchema.optional(),
  employerInfo: employerInfoSchema.optional(),
  agencyRep: agencyRepSchema.optional(),

  // その他申請書作成用メタデータ
  residenceCardReceiptMethod: z.enum(['1', '2'], { message: '選択してください' }).describe('在留資格認定証明書の受領方法 (1:窓口, 2:郵送)'),
  checkIntent: z.enum(['1', '2'], { message: '選択してください' }).describe('申請意思の確認 (1:確認済, 2:未確認)'),
  // CSV仕様: 300文字以内
  freeFormat: z.string().max(300, '300文字以内で入力してください').optional().describe('フリー欄'),
  // CSV仕様: 半角英数字記号、60文字以内
  notificationEmail: z.string().email('正しいメールアドレスを入力してください').max(60, '60文字以内で入力してください').optional().or(z.literal('')).describe('通知送信用メールアドレス'),

  /** タブごとの担当者割り当て（tabId → userId） */

});

export type TabId = 'identity' | 'applicant' | 'employer' | 'representative' | 'metadata';


export type CoeApplicationFormData = z.infer<typeof coeApplicationSchema>;
export type IdentityInfo = z.infer<typeof identityInfoSchema>;
export type ApplicantSpecificInfo = z.infer<typeof applicantSpecificInfoSchema>;
export type LegalRepresentative = z.infer<typeof legalRepresentativeSchema>;
export type EmployerInfo = z.infer<typeof employerInfoSchema>;
export type AgencyRep = z.infer<typeof agencyRepSchema>;
