import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// テストCOE申請 — Zod スキーマ定義
// ※ このファイルはテンプレート登録システムにより自動生成されました。
// ※ 必要に応じてバリデーションルールや型を手動で調整してください。
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 共通バリデーター ────────────────────────────────────────────────────────
const requiredString = z.string().min(1, '必須項目です');

const dateString8 = z
  .string()
  .regex(/^(|\d{8})$/, '日付形式はYYYYMMDD(8桁)で入力してください');

const dateString6 = z.string().regex(/^(|\d{6})$/, '年月形式はYYYYMM(6桁)で入力してください');

const zipCodeString = z.string().regex(/^(|\d{7})$/, '郵便番号はハイフンなし7桁で入力してください');

const phoneString = z.string().regex(/^(|\d{1,12})$/, '半角数字12文字以内で入力してください');


// ─── 身分事項 (identityInfo) ──────────────────────────────────────────
export const identityInfoSchema = z.object({
  nationality: z.string().min(1, '必須項目です').describe('国籍または地域'),
  birthDate: z.string().min(1, '必須項目です').regex(/^\d{8}$/, 'YYYYMMDD形式').describe('生年月日（西暦8桁）'), // CSV仕様: 半角数字、YYYYMMDD形式
  nameEn: z.string().min(1, '必須項目です').describe('氏名（ローマ字）'),
  gender: z.enum(['1', '2'], { message: '選択してください' }).describe('性別'), // CSV仕様: 1:男, 2:女
  birthPlace: z.string().min(1, '必須項目です').describe('出生地'),
  maritalStatus: z.enum(['1', '2'], { message: '選択してください' }).describe('配偶者の有無'), // CSV仕様: 1:有, 2:無
  occupation: z.string().min(1, '必須項目です').describe('職業'),
  homeCountryAddress: z.string().min(1, '必須項目です').describe('本国における居住地'),
  zipCode: z.string().min(1, '必須項目です').regex(/^\d{7}$/, '7桁の半角数字').describe('郵便番号（ハイフンなし7桁）'), // CSV仕様: 半角数字、7桁
  prefecture: z.string().min(1, '必須項目です').describe('都道府県'),
  city: z.string().min(1, '必須項目です').describe('市区町村'),
  streetAddress: z.string().min(1, '必須項目です').describe('町名丁目番地号等'),
  phoneNumber: z.string().min(1, '必須項目です').regex(/^\d{1,12}$/, '12桁以内の半角数字').describe('電話番号（ハイフンなし）'), // CSV仕様: 半角数字、12文字以内
  mobileNumber: z.string().min(1, '必須項目です').regex(/^\d{1,12}$/, '12桁以内の半角数字').describe('携帯電話番号（ハイフンなし）'), // CSV仕様: 半角数字、12文字以内
  email: z.string().min(1, '必須項目です').describe('メールアドレス'),
});

// ─── 旅券情報 (passportInfo) ──────────────────────────────────────────
export const passportInfoSchema = z.object({
  passportNumber: z.string().min(1, '必須項目です').describe('旅券番号'),
  passportExpiryDate: z.string().min(1, '必須項目です').regex(/^\d{8}$/, 'YYYYMMDD形式').describe('旅券有効期限（西暦8桁）'), // CSV仕様: 半角数字、YYYYMMDD形式
  purposeOfEntry: z.string().min(1, '必須項目です').describe('入国目的'),
  plannedEntryDate: z.string().min(1, '必須項目です').regex(/^\d{8}$/, 'YYYYMMDD形式').describe('入国予定年月日（西暦8桁）'), // CSV仕様: 半角数字、YYYYMMDD形式
  portOfEntry: z.string().min(1, '必須項目です').describe('上陸予定港'),
  plannedStayDuration: z.string().min(1, '必須項目です').describe('滞在予定期間'),
});

// ─── 家族情報 (familyInfo) ────────────────────────────────────────────
export const familyInfoSchema = z.object({
  hasRelativesInJapan: z.enum(['1', '2'], { message: '選択してください' }).describe('在日親族の有無'), // CSV仕様: 1:有, 2:無
  hasCriminalRecord: z.enum(['1', '2'], { message: '選択してください' }).describe('犯罪を理由とする処分の有無'), // CSV仕様: 1:有, 2:無
  criminalRecordDetails: z.string().min(1, '必須項目です').describe('犯罪を理由とする処分の内容'),
  // 親族（最大6件）
  relative: z.array(z.object({
      relative: z.string().min(1, '必須項目です').describe('在日親族の氏名'),
    })).max(6).optional().describe('親族リスト'),
});

// ─── 所属機関 (organizationInfo) ──────────────────────────────────────
export const organizationInfoSchema = z.object({
  employerName: z.string().min(1, '必須項目です').describe('勤務先名称'),
  organizationName: z.string().min(1, '必須項目です').describe('所属機関の名称'),
  branchName: z.string().min(1, '必須項目です').describe('支店・事業所名'),
  hasCorporateNumber: z.enum(['1', '2'], { message: '選択してください' }).describe('法人番号の有無'), // CSV仕様: 1:有, 2:無
  corporateNumber: z.string().min(1, '必須項目です').regex(/^\d{13}$/, '13桁の半角数字').describe('法人番号（13桁）'), // CSV仕様: 半角数字、13桁
  industryType: z.string().min(1, '必須項目です').describe('業種'),
  organizationZipCode: z.string().min(1, '必須項目です').regex(/^\d{7}$/, '7桁の半角数字').describe('所属機関の郵便番号（ハイフンなし7桁）'), // CSV仕様: 半角数字、7桁
  organizationPrefecture: z.string().min(1, '必須項目です').describe('所属機関の所在地（都道府県）'),
  organizationCity: z.string().min(1, '必須項目です').describe('所属機関の所在地（市区町村）'),
  organizationStreetAddress: z.string().min(1, '必須項目です').describe('所属機関の所在地（町名丁目番地号等）'),
  organizationPhoneNumber: z.string().min(1, '必須項目です').regex(/^\d{1,12}$/, '12桁以内の半角数字').describe('所属機関の電話番号（ハイフンなし）'), // CSV仕様: 半角数字、12文字以内
  capitalAmount: z.number().min(1, '必須項目です').describe('資本金'),
  numberOfEmployees: z.number().min(1, '必須項目です').describe('従業員数'),
  monthlySalary: z.number().min(1, '必須項目です').describe('月額報酬'),
});

// ─── ルートスキーマ ──────────────────────────────────────────────────────────
export const testCoeSchema = z.object({
  identityInfo: identityInfoSchema.optional(),
  passportInfo: passportInfoSchema.optional(),
  familyInfo: familyInfoSchema.optional(),
  organizationInfo: organizationInfoSchema.optional(),
});

// ─── 型エクスポート ──────────────────────────────────────────────────────────
export type TestCoeFormData = z.infer<typeof testCoeSchema>;
export type IdentityInfo = z.infer<typeof identityInfoSchema>;
export type PassportInfo = z.infer<typeof passportInfoSchema>;
export type FamilyInfo = z.infer<typeof familyInfoSchema>;
export type OrganizationInfo = z.infer<typeof organizationInfoSchema>;
