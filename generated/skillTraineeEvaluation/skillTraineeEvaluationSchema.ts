import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// 技能実習生に関する評価調書 — Zod スキーマ定義
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


// ─── フォーム情報 (formInfo) ──────────────────────────────────────────
export const formInfoSchema = z.object({
  formReferenceNumber: z.string().optional().describe('書類の参考様式番号'), // CSV仕様: 半角英数字
  immigrationBureauChief: z.string().optional().describe('提出先'), // CSV仕様: 全角文字
  evaluationFormTitle: z.string().optional().describe('書類のタイトル'), // CSV仕様: 全角文字
  skillTraineeReportTitle: z.string().optional().describe('書類のタイトル（別表記）'), // CSV仕様: 全角文字
  location: z.string().optional().describe('提出地'), // CSV仕様: 全角文字
});

// ─── １．対象技能実習生 (traineeInfo) ─────────────────────────────────
export const traineeInfoSchema = z.object({
  traineeName: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').describe('技能実習生の氏名'), // CSV仕様: 全角文字、50文字以内
  traineeGender: z.enum(['1', '2'], { message: '選択してください' }).describe('技能実習生の性別'), // CSV仕様: 1:男, 2:女
  traineeBirthDate: z.string().min(1, '必須項目です').max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式、半角数字8桁').describe('技能実習生の生年月日'), // CSV仕様: YYYYMMDD形式、半角数字8桁
  traineeNationality: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').describe('技能実習生の国籍または地域'), // CSV仕様: 全角文字、50文字以内
  implementingOrganizationName: z.string().min(1, '必須項目です').max(100, '100文字以内で入力してください').describe('技能実習を実施する者の名称'), // CSV仕様: 全角文字、100文字以内
  supervisingOrganizationName: z.string().max(100, '100文字以内で入力してください').optional().describe('団体監理型の場合のみ記入すること。'), // CSV仕様: 全角文字、100文字以内
  occupationType: z.string().min(1, '必須項目です').max(100, '100文字以内で入力してください').describe('技能実習の職種と作業内容'), // CSV仕様: 全角文字、100文字以内
});

// ─── ２．技能実習実施状況 (trainingStatus) ────────────────────────────
export const trainingStatusSchema = z.object({
  trainingYear: z.number().min(1, '必須項目です').describe('この月のデータが対象とする年（例: 2017）'), // CSV仕様: 半角数字4桁
  totalScheduledDays: z.number().min(1, '必須項目です').describe('対象年間の実習予定日数の合計'), // CSV仕様: 半角数字
  totalAttendanceDays: z.number().min(1, '必須項目です').describe('対象年間の出勤日数の合計'), // CSV仕様: 半角数字
  totalAttendanceRate: z.string().min(1, '必須項目です').regex(/^\d+(\.\d{1,2})?$/, '半角数字、小数点以下2桁まで').describe('対象年間の出勤率の合計（％）'), // CSV仕様: 半角数字、小数点以下2桁まで
  totalAbsentDays: z.number().min(1, '必須項目です').describe('対象年間の欠勤日数の合計'), // CSV仕様: 半角数字
  totalPaidLeaveDays: z.number().min(1, '必須項目です').describe('対象年間の有給取得日数の合計'), // CSV仕様: 半角数字
  // 月別実習状況（最大12件）
  monthlyReports: z.array(z.object({
      monthlyReports: z.number().min(1, '必須項目です').describe('各月の実習予定日数、出勤日数、出勤率、欠勤日数、有給取得日数を記録します。12ヶ月分必須。'), // CSV仕様: このフィールドはCSV出力時に月別に展開されます (例: scheduled_days_01, attendance_days_01, ...)
    })).max(12).optional().describe('月別実習状況リスト'),
});

// ─── ３．技能検定・技能実習評価試験 (skillTestInfo) ───────────────────
export const skillTestInfoSchema = z.object({
  skillTestNameAndOrganization: z.string().min(1, '必須項目です').max(100, '100文字以内で入力してください').describe('受検した技能検定または技能実習評価試験の名称と実施団体'), // CSV仕様: 全角文字、100文字以内
  skillTestDate: z.string().max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式、半角数字8桁').optional().describe('技能検定または技能実習評価試験の受検日'), // CSV仕様: YYYYMMDD形式、半角数字8桁
  skillTestResult: z.enum(['1', '2'], { message: '選択してください' }).describe('技能検定または技能実習評価試験の合否'), // CSV仕様: 1:合格, 2:不合格
  skillTestReasonNotTaken: z.string().max(200, '200文字以内で入力してください').optional().describe('技能検定または技能実習評価試験を未受検の場合、その理由を具体的に記載すること。'), // CSV仕様: 全角文字、200文字以内
});

// ─── 所見 (opinions) ──────────────────────────────────────────────────
export const opinionsSchema = z.object({
  skillInstructorOpinion: z.string().min(1, '必須項目です').max(1000, '1000文字以内で入力してください').describe('技能実習においてどのような技能を修得し、現在、何がどの程度できるか等について、日本語能力にも触れながら具体的に記載すること。'), // CSV仕様: 全角文字、1000文字以内
  lifeInstructorOpinion: z.string().min(1, '必須項目です').max(1000, '1000文字以内で入力してください').describe('生活態度等について、日本語能力にも触れながら具体的に記載すること。'), // CSV仕様: 全角文字、1000文字以内
  skillSupervisorOpinion: z.string().min(1, '必須項目です').max(1000, '1000文字以内で入力してください').describe('技能等及び日本語能力の向上、生活態度等の諸状況を踏まえた総合的な評価を記載すること。'), // CSV仕様: 全角文字、1000文字以内
  supervisingSupervisorOpinion: z.string().min(1, '必須項目です').max(1000, '1000文字以内で入力してください').describe('上記４～６の各所見及び定期監査等における本人との面談等を踏まえた総合的な評価を記載すること。'), // CSV仕様: 全角文字、1000文字以内
});

// ─── 申告 (declaration) ───────────────────────────────────────────────
export const declarationSchema = z.object({
  submissionDate: z.string().min(1, '必須項目です').max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式、半角数字8桁').describe('評価調書の提出日'), // CSV仕様: YYYYMMDD形式、半角数字8桁
  implementingSupervisorSignatoryName: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').describe('実習実施責任者の氏名'), // CSV仕様: 全角文字、50文字以内
  supervisingSupervisorSignatoryName: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').describe('監理責任者の氏名'), // CSV仕様: 全角文字、50文字以内
});

// ─── ルートスキーマ ──────────────────────────────────────────────────────────
export const skillTraineeEvaluationSchema = z.object({
  formInfo: formInfoSchema.optional(),
  traineeInfo: traineeInfoSchema.optional(),
  trainingStatus: trainingStatusSchema.optional(),
  skillTestInfo: skillTestInfoSchema.optional(),
  opinions: opinionsSchema.optional(),
  declaration: declarationSchema.optional(),
});

// ─── 型エクスポート ──────────────────────────────────────────────────────────
export type SkillTraineeEvaluationFormData = z.infer<typeof skillTraineeEvaluationSchema>;
export type FormInfo = z.infer<typeof formInfoSchema>;
export type TraineeInfo = z.infer<typeof traineeInfoSchema>;
export type TrainingStatus = z.infer<typeof trainingStatusSchema>;
export type SkillTestInfo = z.infer<typeof skillTestInfoSchema>;
export type Opinions = z.infer<typeof opinionsSchema>;
export type Declaration = z.infer<typeof declarationSchema>;

// ─── テンプレート情報 ────────────────────────────────────────────────────────
export const TEMPLATE_ID = 'tpl_gn85kj7p';
export const FORM_NAME = '技能実習生に関する評価調書';
