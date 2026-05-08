import type { TechnicalInternEvaluationFormData } from './technicalInternEvaluationSchema';
import { createCsvString } from '@/lib/csv/csvUtils';

/**
 * 技能実習生に関する評価調書 の CSV データを生成します。
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されたスキャフォールドです。
 * ※ 各 row[N] の値変換ロジック（日付フォーマット、ハイフン除去等）は手動で調整してください。
 *
 * @param data - TechnicalInternEvaluationFormData
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateTechnicalInternEvaluationPart1Csv = (data: TechnicalInternEvaluationFormData): string => {
  // technical_intern_evaluation.csv — 全187項目
  const row: string[] = new Array(187).fill('');

  // ═══ 資格情報 ═══
  // [0] technical_internship_report_title
  row[0] = String(data.qualificationInfo?.technicalInternshipReportTitle || '' ?? '');
  // [1] director_general_immigration_bureau
  row[1] = String(data.qualificationInfo?.directorGeneralImmigrationBureau || '' ?? '');
  // [2] subject_title
  row[2] = String(data.qualificationInfo?.subjectTitle || '' ?? '');
  // [3] name
  row[3] = String(data.qualificationInfo?.name || '' ?? '');
  // [4] gender
  row[4] = String(data.qualificationInfo?.gender || '' ?? '');
  // [5] birth_date
  row[5] = String(data.qualificationInfo?.birthDate || '' ?? '');
  // [6] nationality
  row[6] = String(data.qualificationInfo?.nationality || '' ?? '');
  // [7] implementing_organization
  row[7] = String(data.qualificationInfo?.implementingOrganization || '' ?? '');
  // [8] supervising_organization
  row[8] = String(data.qualificationInfo?.supervisingOrganization || '' ?? '');
  // [9] supervising_organization_note
  row[9] = String(data.qualificationInfo?.supervisingOrganizationNote || '' ?? '');
  // [10] technical_internship_status_title
  row[10] = String(data.qualificationInfo?.technicalInternshipStatusTitle || '' ?? '');
  // [11] year_2017
  row[11] = String(data.qualificationInfo?.year2017 || '' ?? '');
  // [12] january
  row[12] = String(data.qualificationInfo?.january || '' ?? '');
  // [13] february
  row[13] = String(data.qualificationInfo?.february || '' ?? '');
  // [14] march
  row[14] = String(data.qualificationInfo?.march || '' ?? '');
  // [15] april
  row[15] = String(data.qualificationInfo?.april || '' ?? '');
  // [16] may
  row[16] = String(data.qualificationInfo?.may || '' ?? '');
  // [17] june
  row[17] = String(data.qualificationInfo?.june || '' ?? '');
  // [18] july
  row[18] = String(data.qualificationInfo?.july || '' ?? '');
  // [19] august
  row[19] = String(data.qualificationInfo?.august || '' ?? '');
  // [20] september
  row[20] = String(data.qualificationInfo?.september || '' ?? '');
  // [21] october
  row[21] = String(data.qualificationInfo?.october || '' ?? '');
  // [22] november
  row[22] = String(data.qualificationInfo?.november || '' ?? '');
  // [23] december
  row[23] = String(data.qualificationInfo?.december || '' ?? '');
  // [24] scheduled_training_days
  row[24] = String(data.qualificationInfo?.scheduledTrainingDays || '' ?? '');
  // [25] attendance_days
  row[25] = String(data.qualificationInfo?.attendanceDays || '' ?? '');
  // [26] attendance_rate
  row[26] = String(data.qualificationInfo?.attendanceRate || '' ?? '');
  // [27] absent_days
  row[27] = String(data.qualificationInfo?.absentDays || '' ?? '');
  // [28] paid_leave_days
  row[28] = String(data.qualificationInfo?.paidLeaveDays || '' ?? '');
  // [29] year_2018
  row[29] = String(data.qualificationInfo?.year2018 || '' ?? '');
  // [30] total_label
  row[30] = String(data.qualificationInfo?.totalLabel || '' ?? '');
  // [31] overall_attendance_rate_label
  row[31] = String(data.qualificationInfo?.overallAttendanceRateLabel || '' ?? '');
  // [32] technical_internship_instructor_comment_title
  row[32] = String(data.qualificationInfo?.technicalInternshipInstructorCommentTitle || '' ?? '');
  // [33] instructor_comment
  row[33] = String(data.qualificationInfo?.instructorComment || '' ?? '');
  // [34] instructor_comment_note
  row[34] = String(data.qualificationInfo?.instructorCommentNote || '' ?? '');
  // [35] life_instructor_comment_title
  row[35] = String(data.qualificationInfo?.lifeInstructorCommentTitle || '' ?? '');
  // [36] life_instructor_comment_note
  row[36] = String(data.qualificationInfo?.lifeInstructorCommentNote || '' ?? '');
  // [37] declaration
  row[37] = String(data.qualificationInfo?.declaration || '' ?? '');
  // [38] date_of_submission
  row[38] = String(data.qualificationInfo?.dateOfSubmission || '' ?? '');
  // [39] implementing_organization_representative
  row[39] = String(data.qualificationInfo?.implementingOrganizationRepresentative || '' ?? '');
  // [40] attendance_rate_year1
  row[40] = String(data.qualificationInfo?.attendanceRateYear1 || '' ?? '');
  // [41] attendance_rate_year2
  row[41] = String(data.qualificationInfo?.attendanceRateYear2 || '' ?? '');
  // [42] attendance_rate_year3
  row[42] = String(data.qualificationInfo?.attendanceRateYear3 || '' ?? '');
  // [43] attendance_rate_year4
  row[43] = String(data.qualificationInfo?.attendanceRateYear4 || '' ?? '');
  // [44] attendance_rate_year5
  row[44] = String(data.qualificationInfo?.attendanceRateYear5 || '' ?? '');
  // [45] data_year
  row[45] = String(data.qualificationInfo?.dataYear || '' ?? '');
  // [46] total_working_days
  row[46] = String(data.qualificationInfo?.totalWorkingDays || '' ?? '');
  // [47] actual_working_days
  row[47] = String(data.qualificationInfo?.actualWorkingDays || '' ?? '');
  // [48] overall_attendance_rate
  row[48] = String(data.qualificationInfo?.overallAttendanceRate || '' ?? '');
  // [49] skill_tests_exam_name_organization_1
  row[49] = String(data.qualificationInfo?.name || '' ?? '');
  // [50] skill_tests_exam_date_1 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[50] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [51] skill_tests_exam_result_1 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[51] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [52] skill_tests_reason_not_taking_exam_1 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[52] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [53] skill_tests_exam_name_organization_2
  row[53] = String(data.qualificationInfo?.name || '' ?? '');
  // [54] skill_tests_exam_date_2 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[54] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [55] skill_tests_exam_result_2 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[55] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [56] skill_tests_reason_not_taking_exam_2 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[56] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [57] skill_tests_exam_name_organization_3
  row[57] = String(data.qualificationInfo?.name || '' ?? '');
  // [58] skill_tests_exam_date_3 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[58] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [59] skill_tests_exam_result_3 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[59] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [60] skill_tests_reason_not_taking_exam_3 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[60] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [61] skill_tests_exam_name_organization_4
  row[61] = String(data.qualificationInfo?.name || '' ?? '');
  // [62] skill_tests_exam_date_4 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[62] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [63] skill_tests_exam_result_4 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[63] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [64] skill_tests_reason_not_taking_exam_4 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[64] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [65] skill_tests_exam_name_organization_5
  row[65] = String(data.qualificationInfo?.name || '' ?? '');
  // [66] skill_tests_exam_date_5 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[66] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [67] skill_tests_exam_result_5 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[67] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [68] skill_tests_reason_not_taking_exam_5 — ※ 繰り返し項目: skillTests からマッピングが必要です
  row[68] = ''; // TODO: data.qualificationInfo?.skillTests?.[N] の展開ロジックを実装
  // [69] life_instructor_comment
  row[69] = String(data.qualificationInfo?.lifeInstructorComment || '' ?? '');
  // [70] training_supervisor_comment
  row[70] = String(data.qualificationInfo?.trainingSupervisorComment || '' ?? '');
  // [71] supervising_supervisor_comment
  row[71] = String(data.qualificationInfo?.supervisingSupervisorComment || '' ?? '');
  // [72] confirmation_statement
  row[72] = String(data.qualificationInfo?.confirmationStatement || '' ?? '');
  // [73] submission_date
  row[73] = String(data.qualificationInfo?.submissionDate || '' ?? '');
  // [74] training_supervisor_name
  row[74] = String(data.qualificationInfo?.trainingSupervisorName || '' ?? '');
  // [75] supervising_supervisor_name
  row[75] = String(data.qualificationInfo?.supervisingSupervisorName || '' ?? '');
  // [76] EVALUATOR_NAME_KIKUCHI
  row[76] = String(data.qualificationInfo?.evaluatorNameKikuchi || '' ?? '');
  // [77] EVALUATOR_NAME_MISATO
  row[77] = String(data.qualificationInfo?.evaluatorNameMisato || '' ?? '');
  // [78] DOCUMENT_TITLE
  row[78] = String(data.qualificationInfo?.documentTitle || '' ?? '');
  // [79] SUBMISSION_LOCATION
  row[79] = String(data.qualificationInfo?.submissionLocation || '' ?? '');
  // [80] RECIPIENT_IMMIGRATION_DIRECTOR
  row[80] = String(data.qualificationInfo?.recipientImmigrationDirector || '' ?? '');
  // [81] TRAINEE_SECTION_HEADER
  row[81] = String(data.qualificationInfo?.traineeSectionHeader || '' ?? '');
  // [82] TRAINEE_NAME_LABEL
  row[82] = String(data.qualificationInfo?.traineeNameLabel || '' ?? '');
  // [83] TRAINEE_GENDER
  row[83] = String(data.qualificationInfo?.traineeGender || '' ?? '');
  // [84] TRAINEE_NAME_FULL
  row[84] = String(data.qualificationInfo?.traineeName || '' ?? '');
  // [85] TRAINEE_BIRTH_DATE
  row[85] = String(data.qualificationInfo?.traineeBirthDate || '' ?? '');
  // [86] TRAINEE_NATIONALITY_LABEL
  row[86] = String(data.qualificationInfo?.traineeNationalityLabel || '' ?? '');
  // [87] TRAINEE_BIRTH_YEAR_EXAMPLE
  row[87] = String(data.qualificationInfo?.traineeBirthYearExample || '' ?? '');
  // [88] TRAINEE_NATIONALITY
  row[88] = String(data.qualificationInfo?.traineeNationality || '' ?? '');
  // [89] IMPLEMENTING_ORGANIZATION_LABEL
  row[89] = String(data.qualificationInfo?.implementingOrganizationLabel || '' ?? '');
  // [90] SUPERVISING_ORGANIZATION_LABEL
  row[90] = String(data.qualificationInfo?.supervisingOrganizationLabel || '' ?? '');
  // ═══ 所属機関 ═══
  // [91] IMPLEMENTING_ORGANIZATION_NAME
  row[91] = String(data.affiliatedOrganization?.implementingOrganizationName || '' ?? '');
  // [92] SUPERVISING_ORGANIZATION_NAME
  row[92] = String(data.affiliatedOrganization?.supervisingOrganizationName || '' ?? '');
  // [93] SUPERVISING_ORG_NOTE
  row[93] = String(data.affiliatedOrganization?.supervisingOrgNote || '' ?? '');
  // [94] OCCUPATION_TYPE_LABEL
  row[94] = String(data.affiliatedOrganization?.occupationTypeLabel || '' ?? '');
  // [95] OCCUPATION_TYPE
  row[95] = String(data.affiliatedOrganization?.occupationType || '' ?? '');
  // ═══ 資格情報 ═══
  // [96] TRAINING_STATUS_SECTION_HEADER
  row[96] = String(data.qualificationInfo?.trainingStatusSectionHeader || '' ?? '');
  // [97] TRAINING_YEAR
  row[97] = String(data.qualificationInfo?.trainingYear || '' ?? '');
  // [98] TRAINING_MONTH_01
  row[98] = String(data.qualificationInfo?.trainingMonth1 || '' ?? '');
  // [99] TRAINING_MONTH_02
  row[99] = String(data.qualificationInfo?.trainingMonth2 || '' ?? '');
  // [100] TRAINING_MONTH_03
  row[100] = String(data.qualificationInfo?.trainingMonth3 || '' ?? '');
  // [101] TRAINING_MONTH_04
  row[101] = String(data.qualificationInfo?.trainingMonth4 || '' ?? '');
  // [102] TRAINING_MONTH_05
  row[102] = String(data.qualificationInfo?.trainingMonth5 || '' ?? '');
  // [103] TRAINING_MONTH_06
  row[103] = String(data.qualificationInfo?.trainingMonth6 || '' ?? '');
  // [104] TRAINING_MONTH_07
  row[104] = String(data.qualificationInfo?.trainingMonth7 || '' ?? '');
  // [105] TRAINING_MONTH_08
  row[105] = String(data.qualificationInfo?.trainingMonth8 || '' ?? '');
  // [106] TRAINING_MONTH_09
  row[106] = String(data.qualificationInfo?.trainingMonth9 || '' ?? '');
  // [107] TRAINING_MONTH_10
  row[107] = String(data.qualificationInfo?.trainingMonth10 || '' ?? '');
  // [108] TRAINING_MONTH_11
  row[108] = String(data.qualificationInfo?.trainingMonth11 || '' ?? '');
  // [109] TRAINING_MONTH_12
  row[109] = String(data.qualificationInfo?.trainingMonth12 || '' ?? '');
  // [110] PLANNED_TRAINING_DAYS_LABEL
  row[110] = String(data.qualificationInfo?.plannedTrainingDaysLabel || '' ?? '');
  // [111] PLANNED_TRAINING_DAYS_JAN
  row[111] = String(data.qualificationInfo?.plannedTrainingDaysJan || '' ?? '');
  // [112] PLANNED_TRAINING_DAYS_FEB
  row[112] = String(data.qualificationInfo?.plannedTrainingDaysFeb || '' ?? '');
  // [113] PLANNED_TRAINING_DAYS_MAR
  row[113] = String(data.qualificationInfo?.plannedTrainingDaysMar || '' ?? '');
  // [114] PLANNED_TRAINING_DAYS_APR
  row[114] = String(data.qualificationInfo?.plannedTrainingDaysApr || '' ?? '');
  // [115] PLANNED_TRAINING_DAYS_MAY
  row[115] = String(data.qualificationInfo?.plannedTrainingDaysMay || '' ?? '');
  // [116] december_label
  row[116] = String(data.qualificationInfo?.decemberLabel || '' ?? '');
  // [117] data_point_21
  row[117] = String(data.qualificationInfo?.dataPoint21 || '' ?? '');
  // [118] data_point_19
  row[118] = String(data.qualificationInfo?.dataPoint19 || '' ?? '');
  // [119] data_point_22
  row[119] = String(data.qualificationInfo?.dataPoint22 || '' ?? '');
  // [120] data_point_20
  row[120] = String(data.qualificationInfo?.dataPoint20 || '' ?? '');
  // [121] data_point_23
  row[121] = String(data.qualificationInfo?.dataPoint23 || '' ?? '');
  // [122] data_point_18
  row[122] = String(data.qualificationInfo?.dataPoint18 || '' ?? '');
  // [123] data_point_17
  row[123] = String(data.qualificationInfo?.dataPoint17 || '' ?? '');
  // [124] life_attitude_description
  row[124] = String(data.qualificationInfo?.lifeAttitudeDescription || '' ?? '');
  // [125] attendance_rate_percent
  row[125] = String(data.qualificationInfo?.attendanceRatePercent || '' ?? '');
  // [126] attendance_rate_example_1
  row[126] = String(data.qualificationInfo?.attendanceRateExample1 || '' ?? '');
  // [127] attendance_rate_example_2
  row[127] = String(data.qualificationInfo?.attendanceRateExample2 || '' ?? '');
  // [128] attendance_rate_example_3
  row[128] = String(data.qualificationInfo?.attendanceRateExample3 || '' ?? '');
  // [129] attendance_rate_example_4
  row[129] = String(data.qualificationInfo?.attendanceRateExample4 || '' ?? '');
  // [130] attendance_rate_example_5
  row[130] = String(data.qualificationInfo?.attendanceRateExample5 || '' ?? '');
  // [131] training_supervisor_comment_title
  row[131] = String(data.qualificationInfo?.trainingSupervisorCommentTitle || '' ?? '');
  // [132] absence_days
  row[132] = String(data.qualificationInfo?.absenceDays || '' ?? '');
  // [133] year_2018_label
  row[133] = String(data.qualificationInfo?.year2018Label || '' ?? '');
  // [134] comprehensive_evaluation_instruction
  row[134] = String(data.qualificationInfo?.comprehensiveEvaluationInstruction || '' ?? '');
  // [135] supervising_org_comment_title
  row[135] = String(data.qualificationInfo?.supervisingOrgCommentTitle || '' ?? '');
  // [136] supervising_org_comment
  row[136] = String(data.qualificationInfo?.supervisingOrgComment || '' ?? '');
  // [137] total_days
  row[137] = String(data.qualificationInfo?.totalDays || '' ?? '');
  // [138] total_example_1
  row[138] = String(data.qualificationInfo?.totalExample1 || '' ?? '');
  // [139] total_example_2
  row[139] = String(data.qualificationInfo?.totalExample2 || '' ?? '');
  // [140] overall_attendance_rate_example
  row[140] = String(data.qualificationInfo?.overallAttendanceRateExample || '' ?? '');
  // [141] overall_evaluation_instruction
  row[141] = String(data.qualificationInfo?.overallEvaluationInstruction || '' ?? '');
  // [142] skill_test_evaluation_title
  row[142] = String(data.qualificationInfo?.skillTestEvaluationTitle || '' ?? '');
  // [143] test_name_org
  row[143] = String(data.qualificationInfo?.testNameOrg || '' ?? '');
  // [144] declaration_statement
  row[144] = String(data.qualificationInfo?.declarationStatement || '' ?? '');
  // [145] test_name_org_example
  row[145] = String(data.qualificationInfo?.testNameOrgExample || '' ?? '');
  // [146] test_date
  row[146] = String(data.qualificationInfo?.testDate || '' ?? '');
  // [147] test_result
  row[147] = String(data.qualificationInfo?.testResult || '' ?? '');
  // [148] test_result_options
  row[148] = String(data.qualificationInfo?.testResultOptions || '' ?? '');
  // [149] test_date_example
  row[149] = String(data.qualificationInfo?.testDateExample || '' ?? '');
  // [150] year_2018_data
  row[150] = String(data.qualificationInfo?.year2018Data || '' ?? '');
  // [151] reason_for_not_taking_exam
  row[151] = String(data.qualificationInfo?.reasonForNotTakingExam || '' ?? '');
  // [152] technical_internship_supervisor_role
  row[152] = String(data.qualificationInfo?.technicalInternshipSupervisorRole || '' ?? '');
  // [153] supervising_supervisor_role
  row[153] = String(data.qualificationInfo?.supervisingSupervisorRole || '' ?? '');
  // [154] technical_internship_supervisor_name
  row[154] = String(data.qualificationInfo?.technicalInternshipSupervisorName || '' ?? '');
  // [155] document_reference_number
  row[155] = String(data.qualificationInfo?.documentReferenceNumber || '' ?? '');
  // ═══ 在留情報 ═══
  // [156] immigration_bureau_director_salutation
  row[156] = String(data.residenceInfo?.immigrationBureauDirectorSalutation || '' ?? '');
  // [157] document_title
  row[157] = String(data.residenceInfo?.documentTitle || '' ?? '');
  // ═══ 資格情報 ═══
  // [158] target_technical_intern_section_header
  row[158] = String(data.qualificationInfo?.targetTechnicalInternSectionHeader || '' ?? '');
  // [159] technical_internship_instructor_comment_section_header
  row[159] = String(data.qualificationInfo?.technicalInternshipInstructorCommentSectionHeader || '' ?? '');
  // [160] intern_name
  row[160] = String(data.qualificationInfo?.internName || '' ?? '');
  // [161] intern_gender
  row[161] = String(data.qualificationInfo?.internGender || '' ?? '');
  // [162] technical_internship_instructor_comment
  row[162] = String(data.qualificationInfo?.technicalInternshipInstructorComment || '' ?? '');
  // [163] intern_birth_date
  row[163] = String(data.qualificationInfo?.internBirthDate || '' ?? '');
  // [164] intern_nationality
  row[164] = String(data.qualificationInfo?.internNationality || '' ?? '');
  // [165] occupation_and_task
  row[165] = String(data.qualificationInfo?.occupationAndTask || '' ?? '');
  // [166] technical_skill_acquisition_description
  row[166] = String(data.qualificationInfo?.technicalSkillAcquisitionDescription || '' ?? '');
  // [167] life_guidance_instructor_comment_section_header
  row[167] = String(data.qualificationInfo?.lifeGuidanceInstructorCommentSectionHeader || '' ?? '');
  // [168] technical_internship_implementation_status_section_header
  row[168] = String(data.qualificationInfo?.technicalInternshipImplementationStatusSectionHeader || '' ?? '');
  // [169] year_of_evaluation
  row[169] = String(data.qualificationInfo?.yearOfEvaluation || '' ?? '');
  // [170] scheduled_internship_days
  row[170] = String(data.qualificationInfo?.scheduledInternshipDays || '' ?? '');
  // [171] attendance_rate_percentage
  row[171] = String(data.qualificationInfo?.attendanceRatePercentage || '' ?? '');
  // [172] technical_internship_supervisor_comment_section_header
  row[172] = String(data.qualificationInfo?.technicalInternshipSupervisorCommentSectionHeader || '' ?? '');
  // [173] overall_evaluation_description
  row[173] = String(data.qualificationInfo?.overallEvaluationDescription || '' ?? '');
  // [174] supervising_supervisor_comment_section_header
  row[174] = String(data.qualificationInfo?.supervisingSupervisorCommentSectionHeader || '' ?? '');
  // [175] attendance_rate_summary
  row[175] = String(data.qualificationInfo?.attendanceRateSummary || '' ?? '');
  // [176] paid_leave_summary
  row[176] = String(data.qualificationInfo?.paidLeaveSummary || '' ?? '');
  // [177] supervising_supervisor_overall_evaluation_description
  row[177] = String(data.qualificationInfo?.supervisingSupervisorOverallEvaluationDescription || '' ?? '');
  // [178] skill_test_evaluation_exam_section_header
  row[178] = String(data.qualificationInfo?.skillTestEvaluationExamSectionHeader || '' ?? '');
  // [179] exam_name_and_implementing_organization
  row[179] = String(data.qualificationInfo?.examNameAndImplementingOrganization || '' ?? '');
  // [180] declaration_date
  row[180] = String(data.qualificationInfo?.declarationDate || '' ?? '');
  // [181] EXAM_DATE
  row[181] = String(data.qualificationInfo?.examDate || '' ?? '');
  // [182] EXAM_RESULT
  row[182] = String(data.qualificationInfo?.examResult || '' ?? '');
  // [183] EXAM_RESULT_TEXT
  row[183] = String(data.qualificationInfo?.examResultText || '' ?? '');
  // [184] REASON_FOR_NOT_TAKING_EXAM
  row[184] = String(data.qualificationInfo?.reasonForNotTakingExam || '' ?? '');
  // [185] TECHNICAL_INTERNSHIP_SUPERVISOR
  row[185] = String(data.qualificationInfo?.technicalInternshipSupervisor || '' ?? '');
  // [186] SUPERVISING_SUPERVISOR
  row[186] = String(data.qualificationInfo?.supervisingSupervisor || '' ?? '');

  // ─── ヘッダー定義 ──────────────────────────────────────
  const headers: string[] = [
    'technical_internship_report_title', // [0]
    'director_general_immigration_bureau', // [1]
    'subject_title', // [2]
    'name', // [3]
    'gender', // [4]
    'birth_date', // [5]
    'nationality', // [6]
    'implementing_organization', // [7]
    'supervising_organization', // [8]
    'supervising_organization_note', // [9]
    'technical_internship_status_title', // [10]
    'year_2017', // [11]
    'january', // [12]
    'february', // [13]
    'march', // [14]
    'april', // [15]
    'may', // [16]
    'june', // [17]
    'july', // [18]
    'august', // [19]
    'september', // [20]
    'october', // [21]
    'november', // [22]
    'december', // [23]
    'scheduled_training_days', // [24]
    'attendance_days', // [25]
    'attendance_rate', // [26]
    'absent_days', // [27]
    'paid_leave_days', // [28]
    'year_2018', // [29]
    'total_label', // [30]
    'overall_attendance_rate_label', // [31]
    'technical_internship_instructor_comment_title', // [32]
    'instructor_comment', // [33]
    'instructor_comment_note', // [34]
    'life_instructor_comment_title', // [35]
    'life_instructor_comment_note', // [36]
    'declaration', // [37]
    'date_of_submission', // [38]
    'implementing_organization_representative', // [39]
    'attendance_rate_year1', // [40]
    'attendance_rate_year2', // [41]
    'attendance_rate_year3', // [42]
    'attendance_rate_year4', // [43]
    'attendance_rate_year5', // [44]
    'data_year', // [45]
    'total_working_days', // [46]
    'actual_working_days', // [47]
    'overall_attendance_rate', // [48]
    'skill_tests_exam_name_organization_1', // [49]
    'skill_tests_exam_date_1', // [50]
    'skill_tests_exam_result_1', // [51]
    'skill_tests_reason_not_taking_exam_1', // [52]
    'skill_tests_exam_name_organization_2', // [53]
    'skill_tests_exam_date_2', // [54]
    'skill_tests_exam_result_2', // [55]
    'skill_tests_reason_not_taking_exam_2', // [56]
    'skill_tests_exam_name_organization_3', // [57]
    'skill_tests_exam_date_3', // [58]
    'skill_tests_exam_result_3', // [59]
    'skill_tests_reason_not_taking_exam_3', // [60]
    'skill_tests_exam_name_organization_4', // [61]
    'skill_tests_exam_date_4', // [62]
    'skill_tests_exam_result_4', // [63]
    'skill_tests_reason_not_taking_exam_4', // [64]
    'skill_tests_exam_name_organization_5', // [65]
    'skill_tests_exam_date_5', // [66]
    'skill_tests_exam_result_5', // [67]
    'skill_tests_reason_not_taking_exam_5', // [68]
    'life_instructor_comment', // [69]
    'training_supervisor_comment', // [70]
    'supervising_supervisor_comment', // [71]
    'confirmation_statement', // [72]
    'submission_date', // [73]
    'training_supervisor_name', // [74]
    'supervising_supervisor_name', // [75]
    'EVALUATOR_NAME_KIKUCHI', // [76]
    'EVALUATOR_NAME_MISATO', // [77]
    'DOCUMENT_TITLE', // [78]
    'SUBMISSION_LOCATION', // [79]
    'RECIPIENT_IMMIGRATION_DIRECTOR', // [80]
    'TRAINEE_SECTION_HEADER', // [81]
    'TRAINEE_NAME_LABEL', // [82]
    'TRAINEE_GENDER', // [83]
    'TRAINEE_NAME_FULL', // [84]
    'TRAINEE_BIRTH_DATE', // [85]
    'TRAINEE_NATIONALITY_LABEL', // [86]
    'TRAINEE_BIRTH_YEAR_EXAMPLE', // [87]
    'TRAINEE_NATIONALITY', // [88]
    'IMPLEMENTING_ORGANIZATION_LABEL', // [89]
    'SUPERVISING_ORGANIZATION_LABEL', // [90]
    'IMPLEMENTING_ORGANIZATION_NAME', // [91]
    'SUPERVISING_ORGANIZATION_NAME', // [92]
    'SUPERVISING_ORG_NOTE', // [93]
    'OCCUPATION_TYPE_LABEL', // [94]
    'OCCUPATION_TYPE', // [95]
    'TRAINING_STATUS_SECTION_HEADER', // [96]
    'TRAINING_YEAR', // [97]
    'TRAINING_MONTH_01', // [98]
    'TRAINING_MONTH_02', // [99]
    'TRAINING_MONTH_03', // [100]
    'TRAINING_MONTH_04', // [101]
    'TRAINING_MONTH_05', // [102]
    'TRAINING_MONTH_06', // [103]
    'TRAINING_MONTH_07', // [104]
    'TRAINING_MONTH_08', // [105]
    'TRAINING_MONTH_09', // [106]
    'TRAINING_MONTH_10', // [107]
    'TRAINING_MONTH_11', // [108]
    'TRAINING_MONTH_12', // [109]
    'PLANNED_TRAINING_DAYS_LABEL', // [110]
    'PLANNED_TRAINING_DAYS_JAN', // [111]
    'PLANNED_TRAINING_DAYS_FEB', // [112]
    'PLANNED_TRAINING_DAYS_MAR', // [113]
    'PLANNED_TRAINING_DAYS_APR', // [114]
    'PLANNED_TRAINING_DAYS_MAY', // [115]
    'december_label', // [116]
    'data_point_21', // [117]
    'data_point_19', // [118]
    'data_point_22', // [119]
    'data_point_20', // [120]
    'data_point_23', // [121]
    'data_point_18', // [122]
    'data_point_17', // [123]
    'life_attitude_description', // [124]
    'attendance_rate_percent', // [125]
    'attendance_rate_example_1', // [126]
    'attendance_rate_example_2', // [127]
    'attendance_rate_example_3', // [128]
    'attendance_rate_example_4', // [129]
    'attendance_rate_example_5', // [130]
    'training_supervisor_comment_title', // [131]
    'absence_days', // [132]
    'year_2018_label', // [133]
    'comprehensive_evaluation_instruction', // [134]
    'supervising_org_comment_title', // [135]
    'supervising_org_comment', // [136]
    'total_days', // [137]
    'total_example_1', // [138]
    'total_example_2', // [139]
    'overall_attendance_rate_example', // [140]
    'overall_evaluation_instruction', // [141]
    'skill_test_evaluation_title', // [142]
    'test_name_org', // [143]
    'declaration_statement', // [144]
    'test_name_org_example', // [145]
    'test_date', // [146]
    'test_result', // [147]
    'test_result_options', // [148]
    'test_date_example', // [149]
    'year_2018_data', // [150]
    'reason_for_not_taking_exam', // [151]
    'technical_internship_supervisor_role', // [152]
    'supervising_supervisor_role', // [153]
    'technical_internship_supervisor_name', // [154]
    'document_reference_number', // [155]
    'immigration_bureau_director_salutation', // [156]
    'document_title', // [157]
    'target_technical_intern_section_header', // [158]
    'technical_internship_instructor_comment_section_header', // [159]
    'intern_name', // [160]
    'intern_gender', // [161]
    'technical_internship_instructor_comment', // [162]
    'intern_birth_date', // [163]
    'intern_nationality', // [164]
    'occupation_and_task', // [165]
    'technical_skill_acquisition_description', // [166]
    'life_guidance_instructor_comment_section_header', // [167]
    'technical_internship_implementation_status_section_header', // [168]
    'year_of_evaluation', // [169]
    'scheduled_internship_days', // [170]
    'attendance_rate_percentage', // [171]
    'technical_internship_supervisor_comment_section_header', // [172]
    'overall_evaluation_description', // [173]
    'supervising_supervisor_comment_section_header', // [174]
    'attendance_rate_summary', // [175]
    'paid_leave_summary', // [176]
    'supervising_supervisor_overall_evaluation_description', // [177]
    'skill_test_evaluation_exam_section_header', // [178]
    'exam_name_and_implementing_organization', // [179]
    'declaration_date', // [180]
    'EXAM_DATE', // [181]
    'EXAM_RESULT', // [182]
    'EXAM_RESULT_TEXT', // [183]
    'REASON_FOR_NOT_TAKING_EXAM', // [184]
    'TECHNICAL_INTERNSHIP_SUPERVISOR', // [185]
    'SUPERVISING_SUPERVISOR' // [186]
  ];

  return createCsvString(headers, row);
};

export const generateTechnicalInternEvaluationPart2Csv = (data: TechnicalInternEvaluationFormData): string => {
  // 技能実習生に関する評価調書.csv — 全67項目
  const row: string[] = new Array(67).fill('');

  // ═══ 資格情報 ═══
  // [0] qualification_info_eighteen
  row[0] = String(data.qualificationInfo?.eighteen || '' ?? '');
  // [1] qualification_info_attendance_days
  row[1] = String(data.qualificationInfo?.attendanceDays || '' ?? '');
  // [2] qualification_info_seventeen
  row[2] = String(data.qualificationInfo?.seventeen || '' ?? '');
  // [3] qualification_info_attendance_rate_percentage
  row[3] = String(data.qualificationInfo?.attendanceRatePercentage || '' ?? '');
  // [4] qualification_info_one_hundred
  row[4] = String(data.qualificationInfo?.oneHundred || '' ?? '');
  // [5] qualification_info_ninety_five_point_four_five
  row[5] = String(data.qualificationInfo?.ninetyFivePointFourFive || '' ?? '');
  // [6] qualification_info_ninety_point_nine_zero
  row[6] = String(data.qualificationInfo?.ninetyPointNineZero || '' ?? '');
  // [7] qualification_info_ninety_five_point_six_five
  row[7] = String(data.qualificationInfo?.ninetyFivePointSixFive || '' ?? '');
  // [8] qualification_info_ninety_four_point_four_four
  row[8] = String(data.qualificationInfo?.ninetyFourPointFourFour || '' ?? '');
  // [9] qualification_info_absence_days
  row[9] = String(data.qualificationInfo?.absenceDays || '' ?? '');
  // [10] qualification_info_paid_leave_days
  row[10] = String(data.qualificationInfo?.paidLeaveDays || '' ?? '');
  // [11] qualification_info_year_2018
  row[11] = String(data.qualificationInfo?.year2018 || '' ?? '');
  // [12] qualification_info_total
  row[12] = String(data.qualificationInfo?.total || '' ?? '');
  // [13] qualification_info_five_hundred
  row[13] = String(data.qualificationInfo?.fiveHundred || '' ?? '');
  // [14] qualification_info_four_eighty_eight
  row[14] = String(data.qualificationInfo?.fourEightyEight || '' ?? '');
  // [15] qualification_info_attendance_rate
  row[15] = String(data.qualificationInfo?.attendanceRate || '' ?? '');
  // [16] qualification_info_ninety_seven_point_six
  row[16] = String(data.qualificationInfo?.ninetySevenPointSix || '' ?? '');
  // [17] qualification_info_skill_test_evaluation_title
  row[17] = String(data.qualificationInfo?.skillTestEvaluationTitle || '' ?? '');
  // [18] qualification_info_test_name_organization
  row[18] = String(data.qualificationInfo?.testNameOrganization || '' ?? '');
  // [19] qualification_info_test_name_organization_value
  row[19] = String(data.qualificationInfo?.testNameOrganizationValue || '' ?? '');
  // [20] qualification_info_test_date
  row[20] = String(data.qualificationInfo?.testDate || '' ?? '');
  // [21] qualification_info_test_result
  row[21] = String(data.qualificationInfo?.testResult || '' ?? '');
  // [22] qualification_info_test_result_options
  row[22] = String(data.qualificationInfo?.testResultOptions || '' ?? '');
  // [23] qualification_info_test_year
  row[23] = String(data.qualificationInfo?.testYear || '' ?? '');
  // [24] qualification_info_reason_for_not_taking_test
  row[24] = String(data.qualificationInfo?.reasonForNotTakingTest || '' ?? '');
  // [25] qualification_info_skill_instructor_comment_title
  row[25] = String(data.qualificationInfo?.skillInstructorCommentTitle || '' ?? '');
  // [26] qualification_info_skill_instructor_comment_label
  row[26] = String(data.qualificationInfo?.skillInstructorCommentLabel || '' ?? '');
  // [27] qualification_info_skill_instructor_comment
  row[27] = String(data.qualificationInfo?.skillInstructorComment || '' ?? '');
  // [28] qualification_info_skill_instructor_comment_description
  row[28] = String(data.qualificationInfo?.skillInstructorCommentDescription || '' ?? '');
  // [29] qualification_info_life_instructor_comment_title
  row[29] = String(data.qualificationInfo?.lifeInstructorCommentTitle || '' ?? '');
  // [30] qualification_info_life_instructor_comment
  row[30] = String(data.qualificationInfo?.lifeInstructorComment || '' ?? '');
  // [31] qualification_info_life_instructor_comment_description
  row[31] = String(data.qualificationInfo?.lifeInstructorCommentDescription || '' ?? '');
  // [32] qualification_info_skill_training_manager_comment_title
  row[32] = String(data.qualificationInfo?.skillTrainingManagerCommentTitle || '' ?? '');
  // [33] qualification_info_skill_training_manager_comment
  row[33] = String(data.qualificationInfo?.skillTrainingManagerComment || '' ?? '');
  // [34] qualification_info_skill_training_manager_comment_description
  row[34] = String(data.qualificationInfo?.skillTrainingManagerCommentDescription || '' ?? '');
  // [35] qualification_info_supervising_manager_comment_title
  row[35] = String(data.qualificationInfo?.supervisingManagerCommentTitle || '' ?? '');
  // [36] qualification_info_supervising_manager_comment
  row[36] = String(data.qualificationInfo?.supervisingManagerComment || '' ?? '');
  // [37] qualification_info_supervising_manager_comment_description
  row[37] = String(data.qualificationInfo?.supervisingManagerCommentDescription || '' ?? '');
  // [38] qualification_info_declaration_statement
  row[38] = String(data.qualificationInfo?.declarationStatement || '' ?? '');
  // [39] qualification_info_declaration_date
  row[39] = String(data.qualificationInfo?.declarationDate || '' ?? '');
  // [40] skill_training_supervisor_name
  row[40] = String(data.qualificationInfo?.skillTrainingSupervisorName || '' ?? '');
  // [41] supervising_supervisor_name
  row[41] = String(data.qualificationInfo?.supervisingSupervisorName || '' ?? '');
  // [42] submission_location
  row[42] = String(data.qualificationInfo?.submissionLocation || '' ?? '');
  // [43] intern_gender
  row[43] = String(data.qualificationInfo?.internGender || '' ?? '');
  // [44] skill_training_instructor_comment_content
  row[44] = String(data.qualificationInfo?.skillTrainingInstructorCommentContent || '' ?? '');
  // [45] intern_name_content
  row[45] = String(data.qualificationInfo?.internNameContent || '' ?? '');
  // [46] intern_birth_date
  row[46] = String(data.qualificationInfo?.internBirthDate || '' ?? '');
  // [47] intern_nationality
  row[47] = String(data.qualificationInfo?.internNationality || '' ?? '');
  // [48] intern_birth_year
  row[48] = String(data.qualificationInfo?.internBirthYear || '' ?? '');
  // [49] intern_nationality_content
  row[49] = String(data.qualificationInfo?.internNationalityContent || '' ?? '');
  // ═══ 所属機関 ═══
  // [50] implementing_organization_name
  row[50] = String(data.affiliatedOrganization?.implementingOrganizationName || '' ?? '');
  // [51] supervising_organization_name
  row[51] = String(data.affiliatedOrganization?.supervisingOrganizationName || '' ?? '');
  // [52] occupation_type
  row[52] = String(data.affiliatedOrganization?.occupationType || '' ?? '');
  // ═══ 資格情報 ═══
  // [53] occupation_type_content
  row[53] = String(data.qualificationInfo?.occupationTypeContent || '' ?? '');
  // [54] life_instructor_comment_content
  row[54] = String(data.qualificationInfo?.lifeInstructorCommentContent || '' ?? '');
  // [55] training_year
  row[55] = String(data.qualificationInfo?.trainingYear || '' ?? '');
  // [56] training_month_01
  row[56] = String(data.qualificationInfo?.trainingMonth1 || '' ?? '');
  // [57] training_month_02
  row[57] = String(data.qualificationInfo?.trainingMonth2 || '' ?? '');
  // [58] training_month_03
  row[58] = String(data.qualificationInfo?.trainingMonth3 || '' ?? '');
  // [59] training_month_04
  row[59] = String(data.qualificationInfo?.trainingMonth4 || '' ?? '');
  // [60] training_month_05
  row[60] = String(data.qualificationInfo?.trainingMonth5 || '' ?? '');
  // [61] training_month_06
  row[61] = String(data.qualificationInfo?.trainingMonth6 || '' ?? '');
  // [62] training_month_07
  row[62] = String(data.qualificationInfo?.trainingMonth7 || '' ?? '');
  // [63] training_month_08
  row[63] = String(data.qualificationInfo?.trainingMonth8 || '' ?? '');
  // [64] training_month_09
  row[64] = String(data.qualificationInfo?.trainingMonth9 || '' ?? '');
  // [65] training_month_10
  row[65] = String(data.qualificationInfo?.trainingMonth10 || '' ?? '');
  // [66] training_month_11
  row[66] = String(data.qualificationInfo?.trainingMonth11 || '' ?? '');

  // ─── ヘッダー定義 ──────────────────────────────────────
  const headers: string[] = [
    'qualification_info_eighteen', // [0]
    'qualification_info_attendance_days', // [1]
    'qualification_info_seventeen', // [2]
    'qualification_info_attendance_rate_percentage', // [3]
    'qualification_info_one_hundred', // [4]
    'qualification_info_ninety_five_point_four_five', // [5]
    'qualification_info_ninety_point_nine_zero', // [6]
    'qualification_info_ninety_five_point_six_five', // [7]
    'qualification_info_ninety_four_point_four_four', // [8]
    'qualification_info_absence_days', // [9]
    'qualification_info_paid_leave_days', // [10]
    'qualification_info_year_2018', // [11]
    'qualification_info_total', // [12]
    'qualification_info_five_hundred', // [13]
    'qualification_info_four_eighty_eight', // [14]
    'qualification_info_attendance_rate', // [15]
    'qualification_info_ninety_seven_point_six', // [16]
    'qualification_info_skill_test_evaluation_title', // [17]
    'qualification_info_test_name_organization', // [18]
    'qualification_info_test_name_organization_value', // [19]
    'qualification_info_test_date', // [20]
    'qualification_info_test_result', // [21]
    'qualification_info_test_result_options', // [22]
    'qualification_info_test_year', // [23]
    'qualification_info_reason_for_not_taking_test', // [24]
    'qualification_info_skill_instructor_comment_title', // [25]
    'qualification_info_skill_instructor_comment_label', // [26]
    'qualification_info_skill_instructor_comment', // [27]
    'qualification_info_skill_instructor_comment_description', // [28]
    'qualification_info_life_instructor_comment_title', // [29]
    'qualification_info_life_instructor_comment', // [30]
    'qualification_info_life_instructor_comment_description', // [31]
    'qualification_info_skill_training_manager_comment_title', // [32]
    'qualification_info_skill_training_manager_comment', // [33]
    'qualification_info_skill_training_manager_comment_description', // [34]
    'qualification_info_supervising_manager_comment_title', // [35]
    'qualification_info_supervising_manager_comment', // [36]
    'qualification_info_supervising_manager_comment_description', // [37]
    'qualification_info_declaration_statement', // [38]
    'qualification_info_declaration_date', // [39]
    'skill_training_supervisor_name', // [40]
    'supervising_supervisor_name', // [41]
    'submission_location', // [42]
    'intern_gender', // [43]
    'skill_training_instructor_comment_content', // [44]
    'intern_name_content', // [45]
    'intern_birth_date', // [46]
    'intern_nationality', // [47]
    'intern_birth_year', // [48]
    'intern_nationality_content', // [49]
    'implementing_organization_name', // [50]
    'supervising_organization_name', // [51]
    'occupation_type', // [52]
    'occupation_type_content', // [53]
    'life_instructor_comment_content', // [54]
    'training_year', // [55]
    'training_month_01', // [56]
    'training_month_02', // [57]
    'training_month_03', // [58]
    'training_month_04', // [59]
    'training_month_05', // [60]
    'training_month_06', // [61]
    'training_month_07', // [62]
    'training_month_08', // [63]
    'training_month_09', // [64]
    'training_month_10', // [65]
    'training_month_11' // [66]
  ];

  return createCsvString(headers, row);
};
