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
  technicalInternTrainingReportTitle: z.string().optional().describe('書類のタイトル'),
  directorGeneralImmigrationSalutation: z.string().optional().describe('入国管理局長への宛名'),
  applicantSectionTitle: z.string().optional().describe('対象者情報のセクションタイトル'),
  name: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').describe('氏名'), // CSV仕様: 全角文字、50文字以内
  gender: z.enum(['1', '2'], { message: '選択してください' }).describe('性別'), // CSV仕様: 1:男, 2:女
  birthDate: z.string().min(1, '必須項目です').max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式').describe('生年月日'), // CSV仕様: YYYYMMDD形式
  nationality: z.string().min(1, '必須項目です').max(30, '30文字以内で入力してください').describe('国籍'), // CSV仕様: 全角文字、30文字以内
  trainingImplementer: z.string().min(1, '必須項目です').max(100, '100文字以内で入力してください').describe('実習実施者'), // CSV仕様: 全角文字、100文字以内
  supervisingOrganization: z.string().max(100, '100文字以内で入力してください').optional().describe('監理団体の名称は団体監理型の場合のみ記入すること。'), // CSV仕様: 全角文字、100文字以内（団体監理型の場合のみ）
  supervisingOrganizationNote: z.string().optional().describe('監理団体に関する注釈'),
  trainingStatusSectionTitle: z.string().optional().describe('技能実習実施状況のセクションタイトル'),
  year2017Label: z.string().optional().describe('2017年の期間を示すラベル'),
  januaryLabel: z.string().optional().describe('1月を示すラベル'),
  februaryLabel: z.string().optional().describe('2月を示すラベル'),
  marchLabel: z.string().optional().describe('3月を示すラベル'),
  aprilLabel: z.string().optional().describe('4月を示すラベル'),
  mayLabel: z.string().optional().describe('5月を示すラベル'),
  juneLabel: z.string().optional().describe('6月を示すラベル'),
  julyLabel: z.string().optional().describe('7月を示すラベル'),
  augustLabel: z.string().optional().describe('8月を示すラベル'),
  septemberLabel: z.string().optional().describe('9月を示すラベル'),
  octoberLabel: z.string().optional().describe('10月を示すラベル'),
  novemberLabel: z.string().optional().describe('11月を示すラベル'),
  decemberLabel: z.string().optional().describe('12月を示すラベル'),
  scheduledTrainingDays: z.number().min(1, '必須項目です').describe('実習予定日数'), // CSV仕様: 半角数字、0以上の整数
  attendanceDays: z.number().min(1, '必須項目です').describe('出勤日数'), // CSV仕様: 半角数字、0以上の整数
  attendanceRate: z.string().regex(/^\d{1,3}(\.\d{1,2})?%$/, '半角数字（小数点以下2桁まで）、%記号付き').optional().describe('出勤率（％）'), // CSV仕様: 半角数字（小数点以下2桁まで）、%記号付き
  absentDays: z.number().min(1, '必須項目です').describe('欠勤日数'), // CSV仕様: 半角数字、0以上の整数
  paidLeaveDays: z.number().min(1, '必須項目です').describe('有給取得日数'), // CSV仕様: 半角数字、0以上の整数
  year2018Label: z.string().optional().describe('2018年の期間を示すラベル'),
  totalLabel: z.string().optional().describe('合計行または列を示すラベル'),
  overallAttendanceRate: z.string().regex(/^\d{1,3}(\.\d{1,2})?%$/, '半角数字（小数点以下2桁まで）、%記号付き').optional().describe('出勤率'), // CSV仕様: 半角数字（小数点以下2桁まで）、%記号付き
  trainingInstructorCommentsSectionTitle: z.string().optional().describe('技能実習指導員の所見セクションタイトル'),
  trainingInstructorComments: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('技能実習において修得した技能等がどのように向上したかなどについて具体的に記載すること。'), // CSV仕様: 全角文字、2000文字以内
  trainingInstructorCommentsGuidance: z.string().optional().describe('技能実習指導員の所見に関する具体的な記載指示'),
  lifeInstructorCommentsSectionTitle: z.string().optional().describe('生活指導員の所見セクションタイトル'),
  lifeInstructorCommentsGuidance: z.string().optional().describe('生活指導員の所見に関する具体的な記載指示'),
  declarationStatement: z.string().min(1, '必須項目です').max(500, '500文字以内で入力してください').describe('上記の内容について，事実と相違ありません。'), // CSV仕様: 全角文字、500文字以内
  declarationDate: z.string().min(1, '必須項目です').max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式').describe('申請日（和暦表示だが、データは西暦YYYYMMDD形式）'), // CSV仕様: YYYYMMDD形式
  trainingImplementerResponsiblePerson: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください').describe('実習実施責任者'), // CSV仕様: 全角文字、50文字以内
  documentTitle: z.string().optional().describe('書類のタイトル'),
  submissionLocation: z.string().optional().describe('提出先（例：東京入国管理局）'),
  recipient: z.string().optional().describe('書類の宛先'),
  traineeSectionTitle: z.string().optional().describe('対象技能実習生セクションのタイトル'),
  traineeNameLabel: z.string().optional().describe('技能実習生の氏名を示すラベル'),
  traineeGender: z.enum(['1', '2'], { message: '選択してください' }).describe('技能実習生の性別'), // CSV仕様: コード値 (1:男, 2:女)
  traineeFullName: z.string().optional().describe('技能実習生の氏名（英字）'), // CSV仕様: 半角英数字
  traineeBirthDate: z.string().max(8, '8文字以内で入力してください').regex(/^\d{8}$/, '半角数字8桁 (YYYYMMDD)').optional().describe('技能実習生の生年月日'), // CSV仕様: 半角数字8桁 (YYYYMMDD)
  traineeNationality: z.string().optional().describe('技能実習生の国籍または地域'),
  traineeBirthYearSample: z.string().optional().describe('生年月日の年のサンプル値'),
  traineeNationalitySample: z.string().optional().describe('国籍・地域のサンプル値'),
  trainingProviderLabel: z.string().optional().describe('実習実施者を示すラベル'),
  supervisingOrganizationLabel: z.string().optional().describe('監理団体を示すラベル'),
  trainingYear: z.string().max(4, '4文字以内で入力してください').regex(/^\d{4}$/, '半角数字4桁 (YYYY)').optional().describe('技能実習が実施された年'), // CSV仕様: 半角数字4桁 (YYYY)
  monthLabelJan: z.string().optional().describe('1月を示すラベル'),
  monthLabelFeb: z.string().optional().describe('2月を示すラベル'),
  monthLabelMar: z.string().optional().describe('3月を示すラベル'),
  monthLabelApr: z.string().optional().describe('4月を示すラベル'),
  monthLabelMay: z.string().optional().describe('5月を示すラベル'),
  monthLabelJun: z.string().optional().describe('6月を示すラベル'),
  monthLabelJul: z.string().optional().describe('7月を示すラベル'),
  monthLabelAug: z.string().optional().describe('8月を示すラベル'),
  monthLabelSep: z.string().optional().describe('9月を示すラベル'),
  monthLabelOct: z.string().optional().describe('10月を示すラベル'),
  monthLabelNov: z.string().optional().describe('11月を示すラベル'),
  monthLabelDec: z.string().optional().describe('12月を示すラベル'),
  scheduledDaysLabel: z.string().optional().describe('実習予定日数を示すラベル'),
  scheduledDaysJan: z.number().optional().describe('1月の実習予定日数'), // CSV仕様: 半角数字、0-31
  scheduledDaysFeb: z.number().optional().describe('2月の実習予定日数'), // CSV仕様: 半角数字、0-29
  scheduledDaysMar: z.number().optional().describe('3月の実習予定日数'), // CSV仕様: 半角数字、0-31
  scheduledDaysApr: z.number().optional().describe('4月の実習予定日数'), // CSV仕様: 半角数字、0-30
  scheduledDaysMay: z.number().optional().describe('5月の実習予定日数'), // CSV仕様: 半角数字、0-31
  scheduledDaysJun: z.number().optional().describe('6月の実習予定日数'), // CSV仕様: 半角数字、0-30
  attendanceDaysLabel: z.string().optional().describe('出勤日数を示すラベル'),
  staticLabel17: z.string().optional().describe('Static label or row number in the form.'),
  attendanceRatePercentageLabel: z.string().optional().describe('Label for attendance rate percentage.'),
  attendanceRatePeriod1: z.string().regex(/^\d+(\.\d+)?$/, '半角数字で入力してください。').optional().describe('Attendance rate for a specific period (e.g., 1st year). Pre-filled with an example value.'), // CSV仕様: 半角数字
  attendanceRatePeriod2: z.string().regex(/^\d+(\.\d+)?$/, '半角数字で入力してください。').optional().describe('Attendance rate for a specific period (e.g., 2nd year). Pre-filled with an example value.'), // CSV仕様: 半角数字
  attendanceRatePeriod3: z.string().regex(/^\d+(\.\d+)?$/, '半角数字で入力してください。').optional().describe('Attendance rate for a specific period (e.g., 3rd year). Pre-filled with an example value.'), // CSV仕様: 半角数字
  attendanceRatePeriod4: z.string().regex(/^\d+(\.\d+)?$/, '半角数字で入力してください。').optional().describe('Attendance rate for a specific period (e.g., 4th year). Pre-filled with an example value.'), // CSV仕様: 半角数字
  attendanceRatePeriod5: z.string().regex(/^\d+(\.\d+)?$/, '半角数字で入力してください。').optional().describe('Attendance rate for a specific period (e.g., 5th year). Pre-filled with an example value.'), // CSV仕様: 半角数字
  attendanceYear: z.string().regex(/^\d{4}年$/, 'YYYY年形式で入力してください。').optional().describe('Year for attendance record. Pre-filled with an example value.'), // CSV仕様: 半角数字4桁 + '年'
  totalWorkingDays: z.string().regex(/^\d+$/, '半角数字で入力してください。').optional().describe('Total scheduled working days. Pre-filled with an example value.'), // CSV仕様: 半角数字
  actualWorkingDays: z.string().regex(/^\d+$/, '半角数字で入力してください。').optional().describe('Actual working days. Pre-filled with an example value.'), // CSV仕様: 半角数字
  attendanceRateLabel: z.string().optional().describe('Label for overall attendance rate.'),
  skillTestEvaluationHeader: z.string().optional().describe('Header for skill test and evaluation section.'),
  testNameOrganization: z.string().min(1, '必須項目です').max(255, '255文字以内で入力してください').describe('Name of the test and the implementing organization.'), // CSV仕様: 全角文字、255文字以内
  testNameOrganizationExample: z.string().optional().describe('Example value for test name and organization.'),
  testDate: z.string().min(1, '必須項目です').max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式で入力してください。').describe('Date of the test (YYYYMMDD).'), // CSV仕様: 半角数字8桁 (YYYYMMDD)
  passFailResult: z.enum(['1', '2'], { message: '選択してください' }).describe('Result of the test (1: Pass, 2: Fail).'), // CSV仕様: 1:合格, 2:不合格
  passFailOptionsLabel: z.string().optional().describe('Label indicating pass/fail options for the test result.'),
  testYear: z.string().max(4, '4文字以内で入力してください').regex(/^\d{4}$/, 'YYYY形式で入力してください。').optional().describe('Year of the test. Pre-filled with an example value.'), // CSV仕様: 半角数字4桁 (YYYY)
  reasonForNotTakingTest: z.string().max(1000, '1000文字以内で入力してください').optional().describe('Reason if the test was not taken.'), // CSV仕様: 全角文字、1000文字以内
  instructorCommentHeader: z.string().optional().describe('Header for skill training instructor\'s comment section.'),
  instructorCommentSubLabel: z.string().optional().describe('Sub-label for the comment field.'),
  instructorComment: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('Specific comments from the skill training instructor regarding skill improvement. Pre-filled with an example text.'), // CSV仕様: 全角文字、2000文字以内
  instructorCommentInstruction: z.string().optional().describe('Instruction for the instructor\'s comment field.'),
  lifeInstructorCommentHeader: z.string().optional().describe('Header for life guidance instructor\'s comment section.'),
  lifeInstructorComment: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('Specific comments from the life guidance instructor regarding daily life and attitude. Pre-filled with an example text.'), // CSV仕様: 全角文字、2000文字以内
  lifeInstructorCommentInstruction: z.string().optional().describe('Instruction for the life instructor\'s comment field.'),
  supervisorCommentHeader: z.string().optional().describe('Header for skill training supervisor\'s comment section.'),
  supervisorComment: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('Comprehensive evaluation from the skill training supervisor. Pre-filled with an example text.'), // CSV仕様: 全角文字、2000文字以内
  supervisorCommentInstruction: z.string().optional().describe('Instruction for the supervisor\'s comment field.'),
  supervisingOrganizationCommentHeader: z.string().optional().describe('Header for supervising organization\'s comment section.'),
  supervisingOrganizationComment: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('Comprehensive evaluation from the supervising organization\'s representative. Pre-filled with an example text.'), // CSV仕様: 全角文字、2000文字以内
  supervisingOrganizationCommentInstruction: z.string().optional().describe('Instruction for the supervising organization\'s comment field.'),
  supervisorSignatureLabel: z.string().min(1, '必須項目です').max(100, '100文字以内で入力してください').describe('Label for the signature/name of the skill training supervisor.'), // CSV仕様: 全角文字、100文字以内
  supervisingOrganizationSignatureLabel: z.string().min(1, '必須項目です').max(100, '100文字以内で入力してください').describe('Label for the signature/name of the supervising organization\'s representative.'), // CSV仕様: 全角文字、100文字以内
  evaluatorName1: z.string().max(50, '50文字以内で入力してください').optional().describe('評価者氏名（例：菊地 政幸）'), // CSV仕様: 全角文字、50文字以内
  evaluatorName2: z.string().max(50, '50文字以内で入力してください').optional().describe('評価者氏名（例：三姓 晃一）'), // CSV仕様: 全角文字、50文字以内
  recipientTitle: z.string().min(1, '必須項目です').describe('書類の提出先'), // CSV仕様: 固定値
  traineeSectionHeader: z.string().min(1, '必須項目です').describe('対象技能実習生に関するセクションの見出し'), // CSV仕様: 固定値
  traineeName: z.string().min(1, '必須項目です').max(100, '100文字以内で入力してください').describe('対象技能実習生の氏名（例：NGUYEN PAM HUY）'), // CSV仕様: 半角英数字、100文字以内
  traineeNationalityLabel: z.string().min(1, '必須項目です').describe('対象技能実習生の国籍・地域を示すラベル'), // CSV仕様: 固定値
  traineeBirthYearExample: z.string().max(4, '4文字以内で入力してください').regex(/^\d{4}$/, '半角数字4桁（YYYY）').optional().describe('生年月日の年の例（例：1991）'), // CSV仕様: 半角数字4桁（YYYY）
  implementingOrganizationLabel: z.string().min(1, '必須項目です').describe('実習実施者を示すラベル'), // CSV仕様: 固定値
  attendanceInfoValue18: z.string().optional().describe('出勤情報に関連する数値18'),
  attendanceInfoValue17: z.string().optional().describe('出勤情報に関連する数値17'),
  attendanceRateValue100: z.string().optional().describe('出勤率の数値100'),
  attendanceRateValue95_45: z.string().optional().describe('出勤率の数値95.45'),
  attendanceRateValue90_90: z.string().optional().describe('出勤率の数値90.90'),
  attendanceRateValue95_65: z.string().optional().describe('出勤率の数値95.65'),
  attendanceRateValue94_44: z.string().optional().describe('出勤率の数値94.44'),
  totalWorkingDays2018: z.string().optional().describe('2018年の総労働日数'),
  actualAttendanceDays2018: z.string().optional().describe('2018年の実際の出勤日数'),
  attendanceRate2018: z.string().optional().describe('2018年の出勤率'),
  testNameAndOrganization: z.string().optional().describe('試験名と実施団体'),
  testNameAndOrganizationValue: z.string().optional().describe('試験名と実施団体の具体的な内容'), // CSV仕様: 200文字以内
  testResultLabel: z.string().optional().describe('合否の項目名'),
  testResultOptions: z.string().optional().describe('合否の選択肢表示'),
  testResult: z.enum(['1', '2'], { message: '選択してください' }).describe('技能検定・評価試験の合否結果 (1:合格, 2:不合格)'), // CSV仕様: 1:合格, 2:不合格
  instructorCommentLabel: z.string().optional().describe('所見の項目名'),
  instructorCommentContent: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('技能実習指導員の所見内容'), // CSV仕様: 2000文字以内
  instructorCommentDescription: z.string().optional().describe('技能実習指導員の所見に関する説明'),
  lifeInstructorCommentContent: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('生活指導員の所見内容。提供されたデータではtype=numberと指定されていますが、内容からtype=textとして処理します。'), // CSV仕様: 2000文字以内
  lifeInstructorCommentDescription: z.string().optional().describe('生活指導員の所見に関する説明'),
  supervisorCommentContent: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('技能実習責任者の所見内容'), // CSV仕様: 2000文字以内
  supervisorCommentDescription: z.string().optional().describe('技能実習責任者の所見に関する説明'),
  supervisingOrgSupervisorCommentHeader: z.string().optional().describe('監理責任者の所見のセクション見出し'),
  supervisingOrgSupervisorCommentContent: z.string().min(1, '必須項目です').max(2000, '2000文字以内で入力してください').describe('監理責任者の所見内容'), // CSV仕様: 2000文字以内
  supervisingOrgSupervisorCommentDescription: z.string().optional().describe('監理責任者の所見に関する説明'),
  technicalInternshipSupervisor: z.string().optional().describe('技能実習責任者の氏名'), // CSV仕様: 氏名、全角文字
  supervisingSupervisor: z.string().optional().describe('監理責任者の氏名'), // CSV仕様: 氏名、全角文字
  evaluatorNameExample: z.string().optional().describe('評価調書作成者の氏名の例文'), // CSV仕様: 氏名、全角文字
  supervisingOrgRepresentativeExample: z.string().optional().describe('監理団体の代表者氏名の例文'), // CSV仕様: 氏名、全角文字
  submissionLocationExample: z.string().optional().describe('評価調書の提出地の例文'), // CSV仕様: 地名、全角文字
  targetInternSectionHeader: z.string().min(1, '必須項目です').describe('対象技能実習生に関する情報セクションのヘッダー（固定値）'), // CSV仕様: 固定値、全角文字
  supervisorOpinionSectionHeader: z.string().min(1, '必須項目です').describe('技能実習指導員の所見セクションのヘッダー（固定値）'), // CSV仕様: 固定値、全角文字
  internName: z.string().optional().describe('対象技能実習生の氏名'), // CSV仕様: 氏名、全角文字
  internGender: z.enum(['1', '2'], { message: '選択してください' }).describe('対象技能実習生の性別 (1:男, 2:女)'), // CSV仕様: 1:男, 2:女
  supervisorOpinion: z.string().optional().describe('技能実習指導員による所見'), // CSV仕様: 所見、全角文字
  supervisorOpinionExampleText: z.string().optional().describe('技能実習指導員の所見の例文'), // CSV仕様: 例文、全角文字
  internNameExample: z.string().optional().describe('対象技能実習生の氏名の例文'), // CSV仕様: 氏名、半角英字
  internBirthDate: z.string().max(8, '8文字以内で入力してください').regex(/^\d{8}$/, 'YYYYMMDD形式の8桁の数字').optional().describe('対象技能実習生の生年月日 (YYYYMMDD)'), // CSV仕様: YYYYMMDD、半角数字8桁
  internNationality: z.string().optional().describe('対象技能実習生の国籍または地域'), // CSV仕様: 国籍、全角文字
  exampleBirthYear: z.string().max(4, '4文字以内で入力してください').regex(/^\d{4}$/, 'YYYY形式の4桁の数字').optional().describe('生年の例文'), // CSV仕様: YYYY、半角数字4桁
  exampleNationality: z.string().optional().describe('国籍の例文'), // CSV仕様: 国籍、全角文字
  implementingOrganization: z.string().optional().describe('技能実習を実施する機関の名称'), // CSV仕様: 機関名称、全角文字
  skillImprovementDescriptionNote: z.string().min(1, '必須項目です').describe('技能実習による技能向上に関する記載上の注意書き（固定値）'), // CSV仕様: 固定値、全角文字
  occupationTaskExample: z.string().optional().describe('職種・作業内容の例文'), // CSV仕様: 職種・作業、全角文字
  lifeSupervisorOpinionSectionHeader: z.string().min(1, '必須項目です').describe('生活指導員の所見セクションのヘッダー（固定値）'), // CSV仕様: 固定値、全角文字
  lifeSupervisorOpinionExampleText: z.string().optional().describe('生活指導員による所見の例文'), // CSV仕様: 例文、全角文字
  internshipStatusSectionHeader: z.string().min(1, '必須項目です').describe('技能実習実施状況セクションのヘッダー（固定値）'), // CSV仕様: 固定値、全角文字
  internshipStartYearExample: z.string().max(5, '5文字以内で入力してください').regex(/^\d{4}年$/, 'YYYY年形式の4桁の数字と「年」').optional().describe('技能実習開始年の例文'), // CSV仕様: YYYY年、全角文字
  month1Label: z.string().min(1, '必須項目です').describe('1月（固定値）'), // CSV仕様: 固定値、全角文字
  month2Label: z.string().min(1, '必須項目です').describe('2月（固定値）'), // CSV仕様: 固定値、全角文字
  month3Label: z.string().min(1, '必須項目です').describe('3月（固定値）'), // CSV仕様: 固定値、全角文字
  month4Label: z.string().min(1, '必須項目です').describe('4月（固定値）'), // CSV仕様: 固定値、全角文字
  month5Label: z.string().min(1, '必須項目です').describe('5月（固定値）'), // CSV仕様: 固定値、全角文字
  month6Label: z.string().min(1, '必須項目です').describe('6月（固定値）'), // CSV仕様: 固定値、全角文字
  month7Label: z.string().min(1, '必須項目です').describe('7月（固定値）'), // CSV仕様: 固定値、全角文字
  month8Label: z.string().min(1, '必須項目です').describe('8月（固定値）'), // CSV仕様: 固定値、全角文字
  month9Label: z.string().min(1, '必須項目です').describe('9月（固定値）'), // CSV仕様: 固定値、全角文字
  month10Label: z.string().min(1, '必須項目です').describe('10月（固定値）'), // CSV仕様: 固定値、全角文字
  month11Label: z.string().min(1, '必須項目です').describe('11月（固定値）'), // CSV仕様: 固定値、全角文字
  reasonForNotTakingExam: z.string().optional().describe('技能検定・技能実習評価試験を未受検の場合の理由を記載してください。'), // CSV仕様: 全角文字、255文字以内
  skillTrainingSupervisorName: z.string().optional().describe('技能実習責任者の氏名を記載してください。'), // CSV仕様: 全角文字、50文字以内
  supervisingSupervisorName: z.string().optional().describe('監理責任者の氏名を記載してください。'), // CSV仕様: 全角文字、50文字以内
  signatoryKikuchiMasayuki: z.string().optional().describe('署名欄の氏名（菊地 政幸）'), // CSV仕様: 全角文字、50文字以内
  signatorySanjoKoichi: z.string().optional().describe('署名欄の氏名（三姓 晃一）'), // CSV仕様: 全角文字、50文字以内
  documentReferenceNumber: z.string().optional().describe('書類の参考様式番号'), // CSV仕様: 半角英数字、20文字以内
  targetTechnicalInternSectionTitle: z.string().optional().describe('対象技能実習生に関するセクションタイトル'), // CSV仕様: 全角文字、50文字以内
  skillTrainingInstructorCommentSectionTitle: z.string().optional().describe('技能実習指導員の所見に関するセクションタイトル'), // CSV仕様: 全角文字、50文字以内
  skillTrainingInstructorComment: z.string().optional().describe('技能実習指導員による所見。技能実習においてどのような技能を修得し、現在、何がどの程度できるか等について、日本語能力にも触れながら具体的に記載すること。'), // CSV仕様: 全角文字、500文字以内
  nationalityRegion: z.string().optional().describe('技能実習生の国籍または地域'), // CSV仕様: 全角文字、50文字以内
  noteSupervisingOrganization: z.string().min(1, '必須項目です').describe('監理団体に関する注釈'), // CSV仕様: 全角文字、100文字以内
  occupationWork: z.string().optional().describe('技能実習の職種および作業内容'), // CSV仕様: 全角文字、100文字以内
  noteSkillTrainingInstructorComment: z.string().min(1, '必須項目です').describe('技能実習指導員の所見に関する注釈'), // CSV仕様: 全角文字、255文字以内
  lifeInstructorCommentSectionTitle: z.string().optional().describe('生活指導員の所見に関するセクションタイトル'), // CSV仕様: 全角文字、50文字以内
  skillTrainingStatusSectionTitle: z.string().optional().describe('技能実習実施状況に関するセクションタイトル'), // CSV仕様: 全角文字、50文字以内
  reportYear: z.string().regex(/^\d{4}$/, 'YYYY形式で入力してください').optional().describe('評価調書の作成年'), // CSV仕様: 半角数字、4文字（YYYY）
  noteLifeInstructorComment: z.string().min(1, '必須項目です').describe('生活指導員の所見に関する注釈'), // CSV仕様: 全角文字、255文字以内
  skillTrainingSupervisorCommentSectionTitle: z.string().optional().describe('技能実習責任者の所見に関するセクションタイトル'), // CSV仕様: 全角文字、50文字以内
  absenceDays: z.number().optional().describe('実習期間中の欠勤日数'), // CSV仕様: 半角数字、5桁以内
  noteSkillTrainingSupervisorComment: z.string().min(1, '必須項目です').describe('技能実習責任者の所見に関する注釈'), // CSV仕様: 全角文字、255文字以内
  supervisingSupervisorCommentSectionTitle: z.string().optional().describe('監理責任者の所見に関するセクションタイトル'), // CSV仕様: 全角文字、50文字以内
  totalDays: z.number().optional().describe('出勤日数、欠勤日数、有休取得日数の合計'), // CSV仕様: 半角数字、5桁以内
  paidLeaveLabel: z.string().optional().describe('有給休暇のラベル'), // CSV仕様: 全角文字、20文字以内
  noteSupervisingSupervisorComment: z.string().min(1, '必須項目です').describe('監理責任者の所見に関する注釈'), // CSV仕様: 全角文字、255文字以内
  skillTestEvaluationExamSectionTitle: z.string().optional().describe('技能検定・技能実習評価試験に関するセクションタイトル'), // CSV仕様: 全角文字、50文字以内
  examNameImplementingOrganization: z.string().optional().describe('技能検定または技能実習評価試験の名称および実施団体'), // CSV仕様: 全角文字、100文字以内
  evaluationDate: z.string().regex(/^\d{8}$/, 'YYYYMMDD形式で入力してください').optional().describe('評価調書の作成年月日'), // CSV仕様: 半角数字、8文字（YYYYMMDD）
  examDate: z.string().min(1, '必須項目です').regex(/^\d{8}$/, 'YYYYMMDD形式').describe('技能実習評価試験の受検日を西暦8桁（YYYYMMDD）で入力してください。'), // CSV仕様: 半角数字、8桁（YYYYMMDD）
  passFailResultCode: z.enum(['1', '2'], { message: '選択してください' }).describe('技能実習評価試験の合否結果を選択してください。（1:合格, 2:不合格）'), // CSV仕様: 1:合格, 2:不合格
  passFailResultText: z.string().optional().describe('技能実習評価試験の合否結果をテキストで表示します。'), // CSV仕様: 合否結果コードに基づくテキスト表示
});

// ─── 所属機関 (affiliationInfo) ───────────────────────────────────────
export const affiliationInfoSchema = z.object({
  trainingProviderName: z.string().optional().describe('実習実施者の名称'),
  supervisingOrganizationName: z.string().optional().describe('監理団体の名称（団体監理型の場合のみ記入）'),
  supervisingOrganizationNote: z.string().min(1, '必須項目です').describe('監理団体に関する注意書き'),
  jobTypeLabel: z.string().optional().describe('職種・作業を示すラベル'),
  jobTypeName: z.string().optional().describe('技能実習の職種・作業名'),
  implementingOrganizationName: z.string().min(1, '必須項目です').max(100, '100文字以内で入力してください').describe('技能実習を実施する機関の名称（例：有限会社 ○○工業）'), // CSV仕様: 全角文字、100文字以内
  occupationTypeLabel: z.string().min(1, '必須項目です').describe('技能実習の職種・作業を示すラベル'), // CSV仕様: 固定値
  occupationType: z.string().min(1, '必須項目です').max(100, '100文字以内で入力してください').describe('技能実習の職種および作業内容（例：溶接職種・半自動溶接）'), // CSV仕様: 全角文字、100文字以内
  implementingOrganizationExample: z.string().optional().describe('実習実施者の名称の例文'), // CSV仕様: 機関名称、全角文字
  supervisingOrganizationExample: z.string().optional().describe('監理団体の名称の例文'), // CSV仕様: 団体名称、全角文字
  supervisingOrgNote: z.string().min(1, '必須項目です').describe('監理団体に関する記入上の注意書き（固定値）'), // CSV仕様: 固定値、全角文字
  occupationTask: z.string().optional().describe('技能実習生の職種および作業内容'), // CSV仕様: 職種・作業、全角文字
});

// ─── 技能実習実施状況 (trainingStatus) ────────────────────────────────
export const trainingStatusSchema = z.object({
  trainingStatusSectionHeader: z.string().min(1, '必須項目です').describe('技能実習実施状況に関するセクションの見出し'), // CSV仕様: 固定値
  trainingYear: z.string().min(1, '必須項目です').max(4, '4文字以内で入力してください').regex(/^\d{4}$/, '半角数字4桁（YYYY）').describe('技能実習実施状況の対象年（YYYY形式、例：2017）'), // CSV仕様: 半角数字4桁（YYYY）
  monthLabelJan: z.string().min(1, '必須項目です').describe('月表示ラベル（１月）'), // CSV仕様: 固定値
  monthLabelFeb: z.string().min(1, '必須項目です').describe('月表示ラベル（２月）'), // CSV仕様: 固定値
  monthLabelMar: z.string().min(1, '必須項目です').describe('月表示ラベル（３月）'), // CSV仕様: 固定値
  monthLabelApr: z.string().min(1, '必須項目です').describe('月表示ラベル（４月）'), // CSV仕様: 固定値
  monthLabelMay: z.string().min(1, '必須項目です').describe('月表示ラベル（５月）'), // CSV仕様: 固定値
  monthLabelJun: z.string().min(1, '必須項目です').describe('月表示ラベル（６月）'), // CSV仕様: 固定値
  monthLabelJul: z.string().min(1, '必須項目です').describe('月表示ラベル（７月）'), // CSV仕様: 固定値
  monthLabelAug: z.string().min(1, '必須項目です').describe('月表示ラベル（８月）'), // CSV仕様: 固定値
  monthLabelSep: z.string().min(1, '必須項目です').describe('月表示ラベル（９月）'), // CSV仕様: 固定値
  monthLabelOct: z.string().min(1, '必須項目です').describe('月表示ラベル（１０月）'), // CSV仕様: 固定値
  monthLabelNov: z.string().min(1, '必須項目です').describe('月表示ラベル（１１月）'), // CSV仕様: 固定値
  monthLabelDec: z.string().min(1, '必須項目です').describe('月表示ラベル（１２月）'), // CSV仕様: 固定値
  totalScheduledTrainingDays: z.number().optional().describe('実習予定日数の合計（入力された月のみ）'), // CSV仕様: 半角数字、整数
  januaryScheduledDays: z.number().optional().describe('1月の実習予定日数（例：21）'), // CSV仕様: 半角数字、整数
  februaryScheduledDays: z.number().optional().describe('2月の実習予定日数（例：19）'), // CSV仕様: 半角数字、整数
  marchScheduledDays: z.number().optional().describe('3月の実習予定日数（例：22）'), // CSV仕様: 半角数字、整数
  aprilScheduledDays: z.number().optional().describe('4月の実習予定日数（例：20）'), // CSV仕様: 半角数字、整数
  mayScheduledDays: z.number().optional().describe('5月の実習予定日数（例：23）'), // CSV仕様: 半角数字、整数
});

// ─── 在留情報 (residenceInfo) ─────────────────────────────────────────
export const residenceInfoSchema = z.object({
  addresseeImmigrationBureauDirector: z.string().optional().describe('書類の宛先'), // CSV仕様: 全角文字、50文字以内
  documentTitle: z.string().optional().describe('書類のタイトル'), // CSV仕様: 全角文字、50文字以内
});

// ─── ルートスキーマ ──────────────────────────────────────────────────────────
export const technicalInternEvaluationSchema = z.object({
  qualificationInfo: qualificationInfoSchema.optional(),
  affiliationInfo: affiliationInfoSchema.optional(),
  trainingStatus: trainingStatusSchema.optional(),
  residenceInfo: residenceInfoSchema.optional(),
});

// ─── 型エクスポート ──────────────────────────────────────────────────────────
export type TechnicalInternEvaluationFormData = z.infer<typeof technicalInternEvaluationSchema>;
export type QualificationInfo = z.infer<typeof qualificationInfoSchema>;
export type AffiliationInfo = z.infer<typeof affiliationInfoSchema>;
export type TrainingStatus = z.infer<typeof trainingStatusSchema>;
export type ResidenceInfo = z.infer<typeof residenceInfoSchema>;

// ─── テンプレート情報 ────────────────────────────────────────────────────────
export const TEMPLATE_ID = 'tpl_gn85kj7p';
export const FORM_NAME = '技能実習生に関する評価調書';
