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


// ─── 資格情報 (qualificationInfo) ─────────────────────────────────────
export const qualificationInfoSchema = z.object({
  technicalInternshipReportTitle: z.string().optional().describe('書類のタイトル'),
  directorGeneralImmigrationBureau: z.string().optional().describe('宛先'),
  subjectTitle: z.string().optional().describe('対象者セクションのタイトル'),
  name: z.string().min(1, '必須項目です').describe('対象者の氏名'), // CSV仕様: 全角文字
  gender: z.enum(['1', '2'], { message: '選択してください' }).describe('対象者の性別'), // CSV仕様: 1:男, 2:女
  birthDate: z.string().min(1, '必須項目です').max(8, '8文字以内で入力してください').regex(/^\d{8}$/, '半角数字8桁 (YYYYMMDD)').describe('対象者の生年月日'), // CSV仕様: 半角数字8桁 (YYYYMMDD)
  nationality: z.string().min(1, '必須項目です').describe('対象者の国籍'), // CSV仕様: 全角文字
  implementingOrganization: z.string().min(1, '必須項目です').describe('技能実習を実施する者の名称'), // CSV仕様: 全角文字
  supervisingOrganization: z.string().optional().describe('監理団体の名称（団体監理型の場合のみ記入）'), // CSV仕様: 全角文字
  supervisingOrganizationNote: z.string().min(1, '必須項目です').describe('監理団体に関する注意書き'),
  technicalInternshipStatusTitle: z.string().optional().describe('技能実習実施状況セクションのタイトル'),
  year2017: z.string().optional().describe('2017年を示すラベル'),
  january: z.string().optional().describe('1月を示すラベル'),
  february: z.string().optional().describe('2月を示すラベル'),
  march: z.string().optional().describe('3月を示すラベル'),
  april: z.string().optional().describe('4月を示すラベル'),
  may: z.string().optional().describe('5月を示すラベル'),
  june: z.string().optional().describe('6月を示すラベル'),
  july: z.string().optional().describe('7月を示すラベル'),
  august: z.string().optional().describe('8月を示すラベル'),
  september: z.string().optional().describe('9月を示すラベル'),
  october: z.string().optional().describe('10月を示すラベル'),
  november: z.string().optional().describe('11月を示すラベル'),
  december: z.string().optional().describe('12月を示すラベル'),
  scheduledTrainingDays: z.number().min(1, '必須項目です').describe('実習の予定日数'), // CSV仕様: 半角数字
  attendanceDays: z.number().min(1, '必須項目です').describe('実際に出勤した日数'), // CSV仕様: 半角数字
  attendanceRate: z.string().optional().describe('出勤率（計算値）'), // CSV仕様: 半角数字（小数点以下2桁まで）
  absentDays: z.number().min(1, '必須項目です').describe('欠勤した日数'), // CSV仕様: 半角数字
  paidLeaveDays: z.number().min(1, '必須項目です').describe('有給休暇を取得した日数'), // CSV仕様: 半角数字
  year2018: z.string().optional().describe('2018年を示すラベル'),
  totalLabel: z.string().optional().describe('合計を示すラベル'),
  overallAttendanceRateLabel: z.string().optional().describe('全体の出勤率を示すラベル'),
  technicalInternshipInstructorCommentTitle: z.string().optional().describe('技能実習指導員の所見セクションのタイトル'),
  instructorComment: z.string().min(1, '必須項目です').describe('技能実習指導員による所見'), // CSV仕様: 全角文字
  instructorCommentNote: z.string().min(1, '必須項目です').describe('技能実習指導員の所見に関する注意書き'),
  lifeInstructorCommentTitle: z.string().optional().describe('生活指導員の所見セクションのタイトル'),
  lifeInstructorCommentNote: z.string().min(1, '必須項目です').describe('生活指導員の所見に関する注意書き'),
  declaration: z.string().min(1, '必須項目です').describe('申告内容'), // CSV仕様: 全角文字
  dateOfSubmission: z.string().min(1, '必須項目です').max(8, '8文字以内で入力してください').regex(/^\d{8}$/, '半角数字8桁 (YYYYMMDD)').describe('書類提出年月日'), // CSV仕様: 半角数字8桁 (YYYYMMDD)
  implementingOrganizationRepresentative: z.string().min(1, '必須項目です').describe('実習実施責任者の氏名'), // CSV仕様: 全角文字
  traineeName: z.string().min(1, '必須項目です').describe('技能実習生の氏名（英字またはカタカナ）'), // CSV仕様: 全角または半角英数字、氏名
  traineeGender: z.enum(['1', '2'], { message: '選択してください' }).describe('技能実習生の性別'), // CSV仕様: 1:男, 2:女
  traineeBirthDate: z.string().min(1, '必須項目です').max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式で入力してください').describe('技能実習生の生年月日'), // CSV仕様: 半角数字、8桁（YYYYMMDD）
  traineeNationality: z.string().min(1, '必須項目です').describe('技能実習生の国籍または地域'), // CSV仕様: 全角または半角英数字
  implementingOrganizationName: z.string().min(1, '必須項目です').describe('技能実習を実施する機関の名称'), // CSV仕様: 全角または半角英数字
  supervisingOrganizationName: z.string().optional().describe('技能実習生を監理する団体の名称（※団体監理型の場合のみ記入すること。）'), // CSV仕様: 全角または半角英数字
  evaluationYear: z.string().min(1, '必須項目です').max(4, '4文字以内で入力してください').regex(/^\d{4}$/, 'YYYY形式で入力してください').describe('技能実習の評価対象年'), // CSV仕様: 半角数字、4桁（YYYY）
  attendanceRateYear1: z.number().optional().describe('1年目の出勤率（％）'), // CSV仕様: 半角数字
  attendanceRateYear2: z.number().optional().describe('2年目の出勤率（％）'), // CSV仕様: 半角数字
  attendanceRateYear3: z.number().optional().describe('3年目の出勤率（％）'), // CSV仕様: 半角数字
  attendanceRateYear4: z.number().optional().describe('4年目の出勤率（％）'), // CSV仕様: 半角数字
  attendanceRateYear5: z.number().optional().describe('5年目の出勤率（％）'), // CSV仕様: 半角数字
  absentDays: z.number().optional().describe('欠勤日数'), // CSV仕様: 半角数字
  paidLeaveDays: z.number().optional().describe('有休取得日数'), // CSV仕様: 半角数字
  dataYear: z.string().optional().describe('出勤率データの対象年'), // CSV仕様: 半角数字
  totalWorkingDays: z.number().optional().describe('総労働日数'), // CSV仕様: 半角数字
  actualWorkingDays: z.number().optional().describe('実労働日数'), // CSV仕様: 半角数字
  overallAttendanceRate: z.number().optional().describe('総合出勤率（％）'), // CSV仕様: 半角数字
  instructorComment: z.string().min(1, '必須項目です').describe('技能実習において修得した技能等がどのように向上したか等について具体的に記載すること。'),
  lifeInstructorComment: z.string().min(1, '必須項目です').describe('生活態度等について具体的に記載すること。'),
  trainingSupervisorComment: z.string().min(1, '必須項目です').describe('技能等の向上，生活態度等の諸状況を踏まえた総合的な評価を記載すること。'),
  supervisingSupervisorComment: z.string().min(1, '必須項目です').describe('上記４～６の各所見及び定期監査等における本人との面談等を踏まえた総合的な評価を記載すること。'),
  confirmationStatement: z.string().min(1, '必須項目です').describe('上記の内容について，事実と相違ありません。'),
  submissionDate: z.string().min(1, '必須項目です').regex(/^\d{8}$/, '半角数字8桁（YYYYMMDD）').describe('提出日（YYYYMMDD形式）'), // CSV仕様: 半角数字8桁（YYYYMMDD）
  trainingSupervisorName: z.string().min(1, '必須項目です').describe('技能実習責任者の氏名'),
  supervisingSupervisorName: z.string().min(1, '必須項目です').describe('監理責任者の氏名'),
  evaluatorNameKikuchi: z.string().optional().describe('評価者氏名（例：菊地政幸）'), // CSV仕様: 全角文字、氏名
  evaluatorNameMisato: z.string().optional().describe('評価者氏名（例：三姓晃一）'), // CSV仕様: 全角文字、氏名
  documentTitle: z.string().optional().describe('書類タイトル'), // CSV仕様: 全角文字
  submissionLocation: z.string().optional().describe('提出地'), // CSV仕様: 全角文字
  recipientImmigrationDirector: z.string().optional().describe('提出先'), // CSV仕様: 全角文字
  traineeSectionHeader: z.string().optional().describe('対象技能実習生セクション見出し'), // CSV仕様: 全角文字
  traineeNameLabel: z.string().optional().describe('技能実習生氏名の表示ラベル'), // CSV仕様: 全角文字
  traineeGender: z.enum(['1', '2'], { message: '選択してください' }).describe('技能実習生の性別'), // CSV仕様: 1:男, 2:女
  traineeName: z.string().optional().describe('技能実習生の氏名（例：NGUYEN PAM HUY）'), // CSV仕様: 半角英大文字
  traineeBirthDate: z.string().max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式の8桁の数字').optional().describe('技能実習生の生年月日（YYYYMMDD形式）'), // CSV仕様: 半角数字8桁（YYYYMMDD）
  traineeNationalityLabel: z.string().optional().describe('技能実習生国籍・地域の表示ラベル'), // CSV仕様: 全角文字
  traineeBirthYearExample: z.string().max(4, '4文字以内で入力してください').regex(/^\d{4}$/, '西暦4桁の数字').optional().describe('技能実習生の生年月日（年のみの例）'), // CSV仕様: 半角数字4桁
  traineeNationality: z.string().optional().describe('技能実習生の国籍・地域（例：ベトナム）'), // CSV仕様: 全角文字
  implementingOrganizationLabel: z.string().optional().describe('実習実施者の表示ラベル'), // CSV仕様: 全角文字
  supervisingOrganizationLabel: z.string().optional().describe('監理団体の表示ラベル'), // CSV仕様: 全角文字
  trainingStatusSectionHeader: z.string().optional().describe('技能実習実施状況セクション見出し'), // CSV仕様: 全角文字
  trainingYear: z.string().max(5, '5文字以内で入力してください').regex(/^\d{4}年$/, '西暦4桁の数字に「年」が付く形式').optional().describe('技能実習実施状況の対象年（例：2017年）'), // CSV仕様: 半角数字4桁＋「年」
  trainingMonth1: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（1月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth2: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（2月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth3: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（3月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth4: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（4月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth5: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（5月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth6: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（6月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth7: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（7月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth8: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（8月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth9: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（9月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth10: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（10月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth11: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（11月）'), // CSV仕様: 半角数字1-2桁＋「月」
  trainingMonth12: z.string().max(3, '3文字以内で入力してください').regex(/^\d{1,2}月$/, '1桁または2桁の数字に「月」が付く形式').optional().describe('技能実習実施状況の対象月（12月）'), // CSV仕様: 半角数字1-2桁＋「月」
  plannedTrainingDaysLabel: z.string().optional().describe('実習予定日数の表示ラベル'), // CSV仕様: 全角文字
  plannedTrainingDaysJan: z.number().optional().describe('1月の実習予定日数（例：21日）'), // CSV仕様: 半角数字
  plannedTrainingDaysFeb: z.number().optional().describe('2月の実習予定日数（例：19日）'), // CSV仕様: 半角数字
  plannedTrainingDaysMar: z.number().optional().describe('3月の実習予定日数（例：22日）'), // CSV仕様: 半角数字
  plannedTrainingDaysApr: z.number().optional().describe('4月の実習予定日数（例：20日）'), // CSV仕様: 半角数字
  plannedTrainingDaysMay: z.number().optional().describe('5月の実習予定日数（例：23日）'), // CSV仕様: 半角数字
  eighteen: z.string().regex(/^\d+$/, '半角数字').optional().describe('年または期間を示す数値'), // CSV仕様: 半角数字
  attendanceDays: z.number().min(1, '必須項目です').describe('出勤日数'), // CSV仕様: 半角数字
  seventeen: z.string().regex(/^\d+$/, '半角数字').optional().describe('年または期間を示す数値'), // CSV仕様: 半角数字
  attendanceRatePercentage: z.string().regex(/^\d+(\.\d+)?$/, '半角数字（小数点以下を含む）').optional().describe('出勤率をパーセンテージで記載'), // CSV仕様: 半角数字（小数点以下を含む）
  oneHundred: z.string().regex(/^\d+(\.\d+)?$/, '半角数字（小数点以下を含む）').optional().describe('出勤率または関連数値'), // CSV仕様: 半角数字（小数点以下を含む）
  ninetyFivePointFourFive: z.string().regex(/^\d+(\.\d+)?$/, '半角数字（小数点以下を含む）').optional().describe('出勤率または関連数値'), // CSV仕様: 半角数字（小数点以下を含む）
  ninetyPointNineZero: z.string().regex(/^\d+(\.\d+)?$/, '半角数字（小数点以下を含む）').optional().describe('出勤率または関連数値'), // CSV仕様: 半角数字（小数点以下を含む）
  ninetyFivePointSixFive: z.string().regex(/^\d+(\.\d+)?$/, '半角数字（小数点以下を含む）').optional().describe('出勤率または関連数値'), // CSV仕様: 半角数字（小数点以下を含む）
  ninetyFourPointFourFour: z.string().regex(/^\d+(\.\d+)?$/, '半角数字（小数点以下を含む）').optional().describe('出勤率または関連数値'), // CSV仕様: 半角数字（小数点以下を含む）
  absenceDays: z.number().min(1, '必須項目です').describe('欠勤日数'), // CSV仕様: 半角数字
  paidLeaveDays: z.number().min(1, '必須項目です').describe('有給休暇取得日数'), // CSV仕様: 半角数字
  year2018: z.string().regex(/^\d{4}年$/, '西暦4桁と「年」').optional().describe('対象年'), // CSV仕様: 西暦4桁と「年」
  total: z.string().optional().describe('合計値'), // CSV仕様: 全角または半角文字
  fiveHundred: z.string().regex(/^\d+$/, '半角数字').optional().describe('合計日数または関連数値'), // CSV仕様: 半角数字
  fourEightyEight: z.string().regex(/^\d+$/, '半角数字').optional().describe('合計日数または関連数値'), // CSV仕様: 半角数字
  attendanceRate: z.string().regex(/^\d+(\.\d+)?$/, '半角数字（小数点以下を含む）').optional().describe('出勤率'), // CSV仕様: 半角数字（小数点以下を含む）
  ninetySevenPointSix: z.string().regex(/^\d+(\.\d+)?$/, '半角数字（小数点以下を含む）').optional().describe('合計出勤率'), // CSV仕様: 半角数字（小数点以下を含む）
  skillTestEvaluationTitle: z.string().optional().describe('技能検定・技能実習評価試験のセクションタイトル'), // CSV仕様: 全角または半角文字
  testNameOrganization: z.string().min(1, '必須項目です').max(255, '255文字以内で入力してください').describe('技能検定・技能実習評価試験の名称と実施団体'), // CSV仕様: 全角または半角文字、255文字以内
  testNameOrganizationValue: z.string().max(255, '255文字以内で入力してください').optional().describe('試験名と実施団体の具体的な内容'), // CSV仕様: 全角または半角文字、255文字以内
  testDate: z.string().max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式の半角数字').optional().describe('技能検定・技能実習評価試験の受検日（YYYYMMDD形式）'), // CSV仕様: 半角数字、8文字（YYYYMMDD）
  testResult: z.enum(['1', '2', '3'], { message: '選択してください' }).describe('技能検定・技能実習評価試験の合否結果'), // CSV仕様: コード値（1:合格, 2:不合格, 3:未受検）
  testResultOptions: z.string().optional().describe('合否の選択肢を示す表示'), // CSV仕様: 全角または半角文字
  testYear: z.string().max(4, '4文字以内で入力してください').regex(/^\d{4}$/, '西暦4桁の半角数字').optional().describe('試験実施年'), // CSV仕様: 半角数字、4文字（YYYY）
  reasonForNotTakingTest: z.string().max(1000, '1000文字以内で入力してください').optional().describe('技能検定・技能実習評価試験を未受検の場合の理由'), // CSV仕様: 全角または半角文字、1000文字以内
  skillInstructorCommentTitle: z.string().optional().describe('技能実習指導員の所見セクションタイトル'), // CSV仕様: 全角または半角文字
  skillInstructorCommentLabel: z.string().optional().describe('所見フィールドのラベル'), // CSV仕様: 全角または半角文字
  skillInstructorComment: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('技能実習指導員による技能実習生の所見'), // CSV仕様: 全角または半角文字、2000文字以内
  skillInstructorCommentDescription: z.string().min(1, '必須項目です').describe('技能実習指導員の所見に関する記載要領'), // CSV仕様: 全角または半角文字
  lifeInstructorCommentTitle: z.string().optional().describe('生活指導員の所見セクションタイトル'), // CSV仕様: 全角または半角文字
  lifeInstructorComment: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('生活指導員による技能実習生の所見'), // CSV仕様: 全角または半角文字、2000文字以内
  lifeInstructorCommentDescription: z.string().min(1, '必須項目です').describe('生活指導員の所見に関する記載要領'), // CSV仕様: 全角または半角文字
  skillTrainingManagerCommentTitle: z.string().optional().describe('技能実習責任者の所見セクションタイトル'), // CSV仕様: 全角または半角文字
  skillTrainingManagerComment: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('技能実習責任者による技能実習生の所見'), // CSV仕様: 全角または半角文字、2000文字以内
  skillTrainingManagerCommentDescription: z.string().min(1, '必須項目です').describe('技能実習責任者の所見に関する記載要領'), // CSV仕様: 全角または半角文字
  supervisingManagerCommentTitle: z.string().optional().describe('監理責任者の所見セクションタイトル'), // CSV仕様: 全角または半角文字
  supervisingManagerComment: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('監理責任者による技能実習生の所見'), // CSV仕様: 全角または半角文字、2000文字以内
  supervisingManagerCommentDescription: z.string().min(1, '必須項目です').describe('監理責任者の所見に関する記載要領'), // CSV仕様: 全角または半角文字
  declarationStatement: z.string().min(1, '必須項目です').max(255, '255文字以内で入力してください').describe('記載内容が事実と相違ないことの宣言文'), // CSV仕様: 全角または半角文字、255文字以内
  declarationDate: z.string().min(1, '必須項目です').regex(/^(平成|令和)\s*\d{1,2}年\s*\d{1,2}月\s*\d{1,2}日$/, '和暦（例: 平成30年9月11日）').describe('宣言日（和暦）'), // CSV仕様: 和暦日付形式
  skillTrainingSupervisorTitle: z.string().optional().describe('技能実習責任者の役職名を示す項目名'),
  supervisingSupervisorTitle: z.string().optional().describe('監理責任者の役職名を示す項目名'),
  skillTrainingSupervisorName: z.string().optional().describe('技能実習責任者の氏名'),
  supervisingSupervisorName: z.string().optional().describe('監理責任者の氏名'),
  submissionLocation: z.string().optional().describe('書類の提出地（例: 東京）'),
  immigrationDirectorSalutation: z.string().optional().describe('入国管理局長への宛名'),
  targetInternSectionTitle: z.string().optional().describe('対象技能実習生に関するセクションタイトル'),
  skillTrainingInstructorCommentSectionTitle: z.string().optional().describe('技能実習指導員の所見に関するセクションタイトル'),
  internNameLabel: z.string().optional().describe('対象技能実習生の氏名の項目名'),
  internGender: z.enum(['1', '2'], { message: '選択してください' }).describe('対象技能実習生の性別（1:男, 2:女）'), // CSV仕様: 1:男, 2:女
  skillTrainingInstructorCommentLabel: z.string().optional().describe('技能実習指導員の所見の項目名'),
  skillTrainingInstructorCommentContent: z.string().optional().describe('技能実習指導員による所見の具体的な内容'),
  internNameContent: z.string().optional().describe('対象技能実習生の氏名（英字）'),
  internBirthDate: z.string().max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式の8桁の数字').optional().describe('対象技能実習生の生年月日（YYYYMMDD形式）'), // CSV仕様: YYYYMMDD形式
  internNationality: z.string().optional().describe('対象技能実習生の国籍または地域を示す項目名'),
  internBirthYear: z.string().max(4, '4文字以内で入力してください').regex(/^\d{4}$/, '西暦4桁の数字').optional().describe('対象技能実習生の生年（西暦4桁）'), // CSV仕様: 西暦4桁
  internNationalityContent: z.string().optional().describe('対象技能実習生の国籍または地域名'),
  implementingOrganizationLabel: z.string().optional().describe('実習実施者の項目名'),
  supervisingOrganizationLabel: z.string().optional().describe('監理団体の項目名'),
  skillImprovementDescriptionNote: z.string().min(1, '必須項目です').describe('技能実習によって修得した技能等の向上について記載する際の注意書き'),
  occupationTypeContent: z.string().optional().describe('技能実習の具体的な職種と作業内容'),
  lifeInstructorCommentSectionTitle: z.string().optional().describe('生活指導員の所見に関するセクションタイトル'),
  lifeInstructorCommentContent: z.string().optional().describe('生活指導員による所見の具体的な内容'),
  skillTrainingStatusSectionTitle: z.string().optional().describe('技能実習実施状況に関するセクションタイトル'),
  trainingYear: z.string().regex(/^\d{4}年$/, 'YYYY年形式').optional().describe('技能実習が実施された年'), // CSV仕様: YYYY年形式
  trainingMonth1: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（1月）'), // CSV仕様: MM月形式
  trainingMonth2: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（2月）'), // CSV仕様: MM月形式
  trainingMonth3: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（3月）'), // CSV仕様: MM月形式
  trainingMonth4: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（4月）'), // CSV仕様: MM月形式
  trainingMonth5: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（5月）'), // CSV仕様: MM月形式
  trainingMonth6: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（6月）'), // CSV仕様: MM月形式
  trainingMonth7: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（7月）'), // CSV仕様: MM月形式
  trainingMonth8: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（8月）'), // CSV仕様: MM月形式
  trainingMonth9: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（9月）'), // CSV仕様: MM月形式
  trainingMonth10: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（10月）'), // CSV仕様: MM月形式
  trainingMonth11: z.string().regex(/^\d{1,2}月$/, 'MM月形式').optional().describe('技能実習が実施された月（11月）'), // CSV仕様: MM月形式
  decemberLabel: z.string().optional().describe('月を示すラベル'),
  scheduledTrainingDays: z.number().optional().describe('実習予定日数'), // CSV仕様: 半角数字
  dataPoint21: z.string().optional().describe('データポイント21'),
  dataPoint19: z.string().optional().describe('データポイント19'),
  dataPoint22: z.string().optional().describe('データポイント22'),
  dataPoint20: z.string().optional().describe('データポイント20'),
  dataPoint23: z.string().optional().describe('データポイント23'),
  dataPoint18: z.string().optional().describe('データポイント18'),
  attendanceDays: z.number().optional().describe('出勤日数'), // CSV仕様: 半角数字
  dataPoint17: z.string().optional().describe('データポイント17'),
  lifeAttitudeDescription: z.string().min(1, '必須項目です').describe('生活態度等に関する記載事項'),
  attendanceRatePercent: z.string().optional().describe('出勤率をパーセンテージで表示'), // CSV仕様: 計算値
  attendanceRateExample1: z.string().optional().describe('出勤率の例1'),
  attendanceRateExample2: z.string().optional().describe('出勤率の例2'),
  attendanceRateExample3: z.string().optional().describe('出勤率の例3'),
  attendanceRateExample4: z.string().optional().describe('出勤率の例4'),
  attendanceRateExample5: z.string().optional().describe('出勤率の例5'),
  trainingSupervisorCommentTitle: z.string().optional().describe('技能実習責任者の所見のタイトル'),
  absenceDays: z.number().optional().describe('欠勤日数'), // CSV仕様: 半角数字
  trainingSupervisorComment: z.string().optional().describe('技能実習責任者による所見'),
  paidLeaveDays: z.number().optional().describe('有給休暇取得日数'), // CSV仕様: 半角数字
  year2018Label: z.string().optional().describe('年を示すラベル'),
  comprehensiveEvaluationInstruction: z.string().min(1, '必須項目です').describe('総合的な評価に関する記載指示'),
  supervisingOrgCommentTitle: z.string().optional().describe('監理責任者の所見のタイトル'),
  supervisingOrgComment: z.string().optional().describe('監理責任者による所見'),
  totalDays: z.string().optional().describe('日数の合計'), // CSV仕様: 計算値
  totalExample1: z.string().optional().describe('合計の例1'),
  totalExample2: z.string().optional().describe('合計の例2'),
  overallAttendanceRate: z.string().optional().describe('全体の出勤率'), // CSV仕様: 計算値
  overallAttendanceRateExample: z.string().optional().describe('全体の出勤率の例'),
  overallEvaluationInstruction: z.string().min(1, '必須項目です').describe('総合的な評価に関する記載指示（所見と面談に基づく）'),
  skillTestEvaluationTitle: z.string().optional().describe('技能検定・技能実習評価試験のタイトル'),
  testNameOrg: z.string().optional().describe('試験名と試験実施団体'),
  declarationStatement: z.string().optional().describe('事実と相違ない旨の宣言'),
  testNameOrgExample: z.string().optional().describe('試験名と試験実施団体の例'),
  testDate: z.string().optional().describe('試験の受検日'), // CSV仕様: YYYYMMDD形式
  testResult: z.enum(['1', '2'], { message: '選択してください' }).describe('試験の合否'), // CSV仕様: 1:合格, 2:不合格
  testResultOptions: z.string().optional().describe('試験の合否選択肢'),
  testDateExample: z.string().optional().describe('受検日の例'),
  year2018Data: z.string().optional().describe('年データ'),
  reasonForNotTakingExam: z.string().optional().describe('技能検定・技能実習評価試験を未受検の場合の理由を記載'), // CSV仕様: 全角文字
  technicalInternshipSupervisorRole: z.string().optional().describe('技能実習責任者の役職名または氏名'), // CSV仕様: 全角文字
  supervisingSupervisorRole: z.string().optional().describe('監理責任者の役職名または氏名'), // CSV仕様: 全角文字
  technicalInternshipSupervisorName: z.string().optional().describe('技能実習責任者の氏名'), // CSV仕様: 全角文字
  supervisingSupervisorName: z.string().optional().describe('監理責任者の氏名'), // CSV仕様: 全角文字
  documentReferenceNumber: z.string().optional().describe('書類の参考様式番号'), // CSV仕様: 半角英数字
  targetTechnicalInternSectionHeader: z.string().optional().describe('対象技能実習生に関するセクションヘッダー'), // CSV仕様: 全角文字
  technicalInternshipInstructorCommentSectionHeader: z.string().optional().describe('技能実習指導員の所見に関するセクションヘッダー'), // CSV仕様: 全角文字
  internName: z.string().optional().describe('技能実習生の氏名'), // CSV仕様: 全角文字
  internGender: z.enum(['1', '2'], { message: '選択してください' }).describe('技能実習生の性別（1:男, 2:女）'), // CSV仕様: 1:男, 2:女
  technicalInternshipInstructorComment: z.string().optional().describe('技能実習指導員による所見内容'), // CSV仕様: 全角文字
  internBirthDate: z.string().max(8, '8文字以内で入力してください').regex(/^(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/, 'YYYYMMDD形式で入力してください').optional().describe('技能実習生の生年月日'), // CSV仕様: YYYYMMDD形式、半角数字8桁
  internNationality: z.string().optional().describe('技能実習生の国籍または地域'), // CSV仕様: 全角文字
  implementingOrganization: z.string().optional().describe('技能実習を実施する機関の名称'), // CSV仕様: 全角文字
  supervisingOrganization: z.string().optional().describe('技能実習生を監理する団体の名称'), // CSV仕様: 全角文字
  supervisingOrganizationNote: z.string().min(1, '必須項目です').describe('監理団体に関する注釈（団体監理型の場合のみ記入）'), // CSV仕様: 全角文字
  occupationAndTask: z.string().optional().describe('技能実習の職種と作業内容'), // CSV仕様: 全角文字
  technicalSkillAcquisitionDescription: z.string().min(1, '必須項目です').describe('技能実習における技能修得状況と日本語能力に関する具体的な記載事項'), // CSV仕様: 全角文字
  lifeGuidanceInstructorCommentSectionHeader: z.string().optional().describe('生活指導員の所見に関するセクションヘッダー'), // CSV仕様: 全角文字
  technicalInternshipImplementationStatusSectionHeader: z.string().optional().describe('技能実習実施状況に関するセクションヘッダー'), // CSV仕様: 全角文字
  yearOfEvaluation: z.string().max(4, '4文字以内で入力してください').regex(/^\d{4}$/, '西暦4桁で入力してください').optional().describe('評価対象の年（西暦）'), // CSV仕様: YYYY形式、半角数字4桁
  scheduledInternshipDays: z.number().optional().describe('実習予定日数'), // CSV仕様: 半角数字
  attendanceDays: z.number().optional().describe('出勤日数'), // CSV仕様: 半角数字
  lifeAttitudeDescription: z.string().min(1, '必須項目です').describe('生活態度と日本語能力に関する具体的な記載事項'), // CSV仕様: 全角文字
  attendanceRatePercentage: z.string().optional().describe('出勤率（パーセンテージ）'), // CSV仕様: 半角数字、小数点以下2桁
  technicalInternshipSupervisorCommentSectionHeader: z.string().optional().describe('技能実習責任者の所見に関するセクションヘッダー'), // CSV仕様: 全角文字
  absenceDays: z.number().optional().describe('欠勤日数'), // CSV仕様: 半角数字
  paidLeaveDays: z.number().optional().describe('有給休暇取得日数'), // CSV仕様: 半角数字
  overallEvaluationDescription: z.string().min(1, '必須項目です').describe('技能実習責任者による総合的な評価に関する記載事項'), // CSV仕様: 全角文字
  supervisingSupervisorCommentSectionHeader: z.string().optional().describe('監理責任者の所見に関するセクションヘッダー'), // CSV仕様: 全角文字
  totalDays: z.number().optional().describe('出勤日数、欠勤日数、有休取得日数の合計'), // CSV仕様: 半角数字
  attendanceRateSummary: z.string().optional().describe('出勤率の概要'), // CSV仕様: 半角数字、小数点以下2桁
  paidLeaveSummary: z.string().optional().describe('有給休暇に関する概要'), // CSV仕様: 全角文字
  supervisingSupervisorOverallEvaluationDescription: z.string().min(1, '必須項目です').describe('監理責任者による総合的な評価に関する記載事項'), // CSV仕様: 全角文字
  skillTestEvaluationExamSectionHeader: z.string().optional().describe('技能検定・技能実習評価試験に関するセクションヘッダー'), // CSV仕様: 全角文字
  declarationStatement: z.string().optional().describe('上記内容が事実と相違ない旨の宣言文'), // CSV仕様: 全角文字
  examNameAndImplementingOrganization: z.string().optional().describe('技能検定・技能実習評価試験の名称と実施団体'), // CSV仕様: 全角文字
  declarationDate: z.string().max(8, '8文字以内で入力してください').regex(/^(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/, 'YYYYMMDD形式で入力してください').optional().describe('宣言日'), // CSV仕様: YYYYMMDD形式、半角数字8桁
  examDate: z.string().min(1, '必須項目です').regex(/^\d{8}$/, '半角数字8桁（YYYYMMDD）').describe('技能実習評価試験の受検日'), // CSV仕様: 半角数字、8桁（YYYYMMDD）
  examResult: z.enum(['1', '2'], { message: '選択してください' }).describe('技能実習評価試験の合否'), // CSV仕様: 1:合格, 2:不合格
  examResultText: z.string().max(4, '4文字以内で入力してください').optional().describe('技能実習評価試験の合否を記載（合格または不合格）'), // CSV仕様: 合格または不合格を記載、4文字以内
  reasonForNotTakingExam: z.string().max(200, '200文字以内で入力してください').optional().describe('技能実習評価試験を受検しなかった場合の理由'), // CSV仕様: 未受検の場合に理由を記載、200文字以内
  technicalInternshipSupervisor: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').describe('技能実習責任者の氏名'), // CSV仕様: 技能実習責任者の氏名を記載、50文字以内
  supervisingSupervisor: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').describe('監理責任者の氏名'), // CSV仕様: 監理責任者の氏名を記載、50文字以内
  // 月別実習状況（最大12件）
  monthlyEvaluation: z.array(z.object({
      monthlyEvaluation: z.number().min(1, '必須項目です').describe('各月の実習予定日数と出勤日数'), // CSV仕様: 月別データは、month_X_scheduled_days, month_X_actual_attendance_days の形式で展開されます (X=1-12)
    })).max(12).optional().describe('月別実習状況リスト'),
  // 技能検定・技能実習評価試験（最大5件）
  skillTests: z.array(z.object({
      skillTests: z.string().optional().describe('技能検定・技能実習評価試験の記録'),
    })).max(5).optional().describe('技能検定・技能実習評価試験リスト'),
});

// ─── 所属機関 (affiliatedOrganization) ────────────────────────────────
export const affiliatedOrganizationSchema = z.object({
  occupationType: z.string().min(1, '必須項目です').describe('技能実習の職種と作業内容'), // CSV仕様: 全角または半角英数字
  implementingOrganizationName: z.string().optional().describe('実習実施者の名称（例：有限会社○○工業）'), // CSV仕様: 全角文字
  supervisingOrganizationName: z.string().optional().describe('監理団体の名称（例：△△事業協同組合）'), // CSV仕様: 全角文字
  supervisingOrgNote: z.string().min(1, '必須項目です').describe('監理団体に関する注記'), // CSV仕様: 全角文字
  occupationTypeLabel: z.string().optional().describe('職種・作業の表示ラベル'), // CSV仕様: 全角文字
  occupationType: z.string().optional().describe('職種・作業の内容（例：溶接職種・半自動溶接）'), // CSV仕様: 全角文字
  implementingOrganizationName: z.string().optional().describe('実習実施者の正式名称'),
  supervisingOrganizationName: z.string().optional().describe('監理団体の正式名称'),
  supervisingOrganizationNote: z.string().min(1, '必須項目です').describe('団体監理型の場合のみ記入することという注意書き'),
  occupationType: z.string().optional().describe('技能実習の職種と作業内容の項目名'),
});

// ─── 在留情報 (residenceInfo) ─────────────────────────────────────────
export const residenceInfoSchema = z.object({
  immigrationBureauDirectorSalutation: z.string().optional().describe('宛先（出入国在留管理局長 殿）'), // CSV仕様: 全角文字
  documentTitle: z.string().optional().describe('書類のタイトル'), // CSV仕様: 全角文字
});

// ─── ルートスキーマ ──────────────────────────────────────────────────────────
export const technicalInternEvaluationSchema = z.object({
  qualificationInfo: qualificationInfoSchema.optional(),
  affiliatedOrganization: affiliatedOrganizationSchema.optional(),
  residenceInfo: residenceInfoSchema.optional(),
});

// ─── 型エクスポート ──────────────────────────────────────────────────────────
export type TechnicalInternEvaluationFormData = z.infer<typeof technicalInternEvaluationSchema>;
export type QualificationInfo = z.infer<typeof qualificationInfoSchema>;
export type AffiliatedOrganization = z.infer<typeof affiliatedOrganizationSchema>;
export type ResidenceInfo = z.infer<typeof residenceInfoSchema>;

// ─── テンプレート情報 ────────────────────────────────────────────────────────
export const TEMPLATE_ID = 'tpl_gn85kj7p';
export const FORM_NAME = '技能実習生に関する評価調書';
