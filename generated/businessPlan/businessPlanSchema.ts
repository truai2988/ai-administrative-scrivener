import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// 事業計画書 — Zod スキーマ定義
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


// ─── 申請者情報 (applicantInfo) ───────────────────────────────────────
export const applicantInfoSchema = z.object({
  name: z.string().min(1, '必須項目です').describe('申請者の氏名'), // CSV仕様: 全角文字
  birthDate: z.string().min(1, '必須項目です').regex(/^\d{8}$/, 'YYYYMMDD形式').describe('申請者の生年月日'), // CSV仕様: 半角数字8桁 (YYYYMMDD)
  nationality: z.string().min(1, '必須項目です').describe('申請者の国籍'), // CSV仕様: 全角文字
  address: z.string().min(1, '必須項目です').describe('申請者の住所'), // CSV仕様: 全角文字
  phoneNumber: z.string().min(1, '必須項目です').regex(/^\d{10,12}$/, 'ハイフンなし半角数字、10〜12文字').describe('申請者の電話番号'), // CSV仕様: 半角数字、ハイフンなし
});

// ─── 事業概要 (businessOverview) ──────────────────────────────────────
export const businessOverviewSchema = z.object({
  businessName: z.string().min(1, '必須項目です').describe('事業の名称'), // CSV仕様: 全角文字
  businessContent: z.string().min(1, '必須項目です').describe('事業の内容'), // CSV仕様: 全角文字
  businessStartDate: z.string().min(1, '必須項目です').regex(/^\d{8}$/, 'YYYYMMDD形式').describe('事業開始予定年月日'), // CSV仕様: 半角数字8桁 (YYYYMMDD)
  businessLocation: z.string().min(1, '必須項目です').describe('事業所の所在地'), // CSV仕様: 全角文字
  numberOfEmployees: z.string().min(1, '必須項目です').describe('従業員数'), // CSV仕様: 半角数字
  capital: z.string().min(1, '必須項目です').describe('資本金'), // CSV仕様: 半角数字
});

// ─── 経歴・資格 (careerQualifications) ────────────────────────────────
export const careerQualificationsSchema = z.object({
  finalEducation: z.string().min(1, '必須項目です').describe('最終学歴'), // CSV仕様: 全角文字
  workHistory: z.string().min(1, '必須項目です').describe('職歴'), // CSV仕様: 全角文字
  qualifications: z.string().min(1, '必須項目です').describe('保有資格'), // CSV仕様: 全角文字
  japaneseProficiency: z.string().min(1, '必須項目です').describe('日本語能力'), // CSV仕様: 全角文字
});

// ─── ルートスキーマ ──────────────────────────────────────────────────────────
export const businessPlanSchema = z.object({
  applicantInfo: applicantInfoSchema.optional(),
  businessOverview: businessOverviewSchema.optional(),
  careerQualifications: careerQualificationsSchema.optional(),
});

// ─── 型エクスポート ──────────────────────────────────────────────────────────
export type BusinessPlanFormData = z.infer<typeof businessPlanSchema>;
export type ApplicantInfo = z.infer<typeof applicantInfoSchema>;
export type BusinessOverview = z.infer<typeof businessOverviewSchema>;
export type CareerQualifications = z.infer<typeof careerQualificationsSchema>;
