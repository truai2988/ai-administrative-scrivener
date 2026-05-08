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
  // 技能実習生に関する評価調書.csv — 全134項目
  const row: string[] = new Array(134).fill('');

  // ═══ 資格情報 ═══
  // [0] SHIMEI
  row[0] = String(data.qualificationInfo?.name ?? '');
  // [1] SEIBETSU
  row[1] = String(data.qualificationInfo?.gender ?? '');
  // [2] SEINEN_GATSUPI
  row[2] = String(data.qualificationInfo?.birthDate ?? '');
  // [3] KOKUSEKI
  row[3] = String(data.qualificationInfo?.nationality ?? '');
  // [4] JISSHU_JISSHISHA
  row[4] = String(data.qualificationInfo?.trainingImplementer ?? '');
  // [5] KANRI_DANTAI
  row[5] = String(data.qualificationInfo?.supervisingOrganization ?? '');
  // [6] JISSHU_YOTEI_NISSU
  row[6] = String(data.qualificationInfo?.scheduledTrainingDays ?? '');
  // [7] SHUKKIN_NISSU
  row[7] = String(data.qualificationInfo?.attendanceDays ?? '');
  // [8] SHUKKIN_RITSU_PERCENT
  row[8] = String(data.qualificationInfo?.attendanceRate ?? '');
  // [9] KEKKIN_NISSU
  row[9] = String(data.qualificationInfo?.absentDays ?? '');
  // [10] YUKYU_SHUTOKU_NISSU
  row[10] = String(data.qualificationInfo?.paidLeaveDays ?? '');
  // [11] OVERALL_SHUKKIN_RITSU_PERCENT
  row[11] = String(data.qualificationInfo?.overallAttendanceRate ?? '');
  // [12] JISSHU_SHIDOIN_SHOKEN
  row[12] = String(data.qualificationInfo?.trainingInstructorComments ?? '');
  // [13] DECLARATION_STATEMENT_TEXT
  row[13] = String(data.qualificationInfo?.declarationStatement ?? '');
  // [14] SHINSEI_DATE
  row[14] = String(data.qualificationInfo?.declarationDate ?? '');
  // [15] JISSHU_JISSHI_SEKININSHA
  row[15] = String(data.qualificationInfo?.trainingImplementerResponsiblePerson ?? '');
  // [16] qualificationInfo_documentTitle
  row[16] = String(data.qualificationInfo?.documentTitle ?? '');
  // [17] qualificationInfo_submissionLocation
  row[17] = String(data.qualificationInfo?.submissionLocation ?? '');
  // [18] qualificationInfo_recipient
  row[18] = String(data.qualificationInfo?.recipient ?? '');
  // [19] qualificationInfo_traineeSectionTitle
  row[19] = String(data.qualificationInfo?.traineeSectionTitle ?? '');
  // [20] qualificationInfo_traineeNameLabel
  row[20] = String(data.qualificationInfo?.traineeNameLabel ?? '');
  // [21] qualificationInfo_traineeGender
  row[21] = String(data.qualificationInfo?.traineeGender ?? '');
  // [22] qualificationInfo_traineeFullName
  row[22] = String(data.qualificationInfo?.traineeFullName ?? '');
  // [23] qualificationInfo_traineeBirthDate
  row[23] = String(data.qualificationInfo?.traineeBirthDate ?? '');
  // [24] qualificationInfo_traineeNationality
  row[24] = String(data.qualificationInfo?.traineeNationality ?? '');
  // [25] qualificationInfo_traineeBirthYearSample
  row[25] = String(data.qualificationInfo?.traineeBirthYearSample ?? '');
  // [26] qualificationInfo_traineeNationalitySample
  row[26] = String(data.qualificationInfo?.traineeNationalitySample ?? '');
  // [27] qualificationInfo_trainingProviderLabel
  row[27] = String(data.qualificationInfo?.trainingProviderLabel ?? '');
  // [28] qualificationInfo_supervisingOrganizationLabel
  row[28] = String(data.qualificationInfo?.supervisingOrganizationLabel ?? '');
  // [29] qualificationInfo_trainingStatusSectionTitle
  row[29] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [30] qualificationInfo_trainingYear
  row[30] = String(data.qualificationInfo?.trainingYear ?? '');
  // [31] qualificationInfo_monthLabelJan
  row[31] = String(data.qualificationInfo?.monthLabelJan ?? '');
  // [32] qualificationInfo_monthLabelFeb
  row[32] = String(data.qualificationInfo?.monthLabelFeb ?? '');
  // [33] qualificationInfo_monthLabelMar
  row[33] = String(data.qualificationInfo?.monthLabelMar ?? '');
  // [34] qualificationInfo_monthLabelApr
  row[34] = String(data.qualificationInfo?.monthLabelApr ?? '');
  // [35] qualificationInfo_monthLabelMay
  row[35] = String(data.qualificationInfo?.monthLabelMay ?? '');
  // [36] qualificationInfo_monthLabelJun
  row[36] = String(data.qualificationInfo?.monthLabelJun ?? '');
  // [37] qualificationInfo_monthLabelJul
  row[37] = String(data.qualificationInfo?.monthLabelJul ?? '');
  // [38] qualificationInfo_monthLabelAug
  row[38] = String(data.qualificationInfo?.monthLabelAug ?? '');
  // [39] qualificationInfo_monthLabelSep
  row[39] = String(data.qualificationInfo?.monthLabelSep ?? '');
  // [40] qualificationInfo_monthLabelOct
  row[40] = String(data.qualificationInfo?.monthLabelOct ?? '');
  // [41] qualificationInfo_monthLabelNov
  row[41] = String(data.qualificationInfo?.monthLabelNov ?? '');
  // [42] qualificationInfo_monthLabelDec
  row[42] = String(data.qualificationInfo?.monthLabelDec ?? '');
  // [43] qualificationInfo_scheduledDaysLabel
  row[43] = String(data.qualificationInfo?.scheduledDaysLabel ?? '');
  // [44] qualificationInfo_scheduledDaysJan
  row[44] = String(data.qualificationInfo?.scheduledDaysJan ?? '');
  // [45] qualificationInfo_scheduledDaysFeb
  row[45] = String(data.qualificationInfo?.scheduledDaysFeb ?? '');
  // [46] qualificationInfo_scheduledDaysMar
  row[46] = String(data.qualificationInfo?.scheduledDaysMar ?? '');
  // [47] qualificationInfo_scheduledDaysApr
  row[47] = String(data.qualificationInfo?.scheduledDaysApr ?? '');
  // [48] qualificationInfo_scheduledDaysMay
  row[48] = String(data.qualificationInfo?.scheduledDaysMay ?? '');
  // [49] qualificationInfo_scheduledDaysJun
  row[49] = String(data.qualificationInfo?.scheduledDaysJun ?? '');
  // [50] qualificationInfo_attendanceDaysLabel
  row[50] = String(data.qualificationInfo?.attendanceDaysLabel ?? '');
  // ═══ 所属機関 ═══
  // [51] affiliationInfo_trainingProviderName
  row[51] = String(data.affiliationInfo?.trainingProviderName ?? '');
  // [52] affiliationInfo_supervisingOrganizationName
  row[52] = String(data.affiliationInfo?.supervisingOrganizationName ?? '');
  // [53] affiliationInfo_supervisingOrganizationNote
  row[53] = String(data.affiliationInfo?.supervisingOrganizationNote ?? '');
  // [54] affiliationInfo_jobTypeLabel
  row[54] = String(data.affiliationInfo?.jobTypeLabel ?? '');
  // [55] affiliationInfo_jobTypeName
  row[55] = String(data.affiliationInfo?.jobTypeName ?? '');
  // ═══ 資格情報 ═══
  // [56] technical_internship_supervisor
  row[56] = String(data.qualificationInfo?.technicalInternshipSupervisor ?? '');
  // [57] supervising_supervisor
  row[57] = String(data.qualificationInfo?.supervisingSupervisor ?? '');
  // [58] evaluator_name_example
  row[58] = String(data.qualificationInfo?.evaluatorNameExample ?? '');
  // [59] supervising_org_representative_example
  row[59] = String(data.qualificationInfo?.supervisingOrgRepresentativeExample ?? '');
  // [60] submission_location_example
  row[60] = String(data.qualificationInfo?.submissionLocationExample ?? '');
  // [61] recipient
  row[61] = String(data.qualificationInfo?.recipient ?? '');
  // [62] target_intern_section_header
  row[62] = String(data.qualificationInfo?.targetInternSectionHeader ?? '');
  // [63] supervisor_opinion_section_header
  row[63] = String(data.qualificationInfo?.supervisorOpinionSectionHeader ?? '');
  // [64] intern_name
  row[64] = String(data.qualificationInfo?.internName ?? '');
  // [65] intern_gender
  row[65] = String(data.qualificationInfo?.internGender ?? '');
  // [66] supervisor_opinion
  row[66] = String(data.qualificationInfo?.supervisorOpinion ?? '');
  // [67] supervisor_opinion_example_text
  row[67] = String(data.qualificationInfo?.supervisorOpinionExampleText ?? '');
  // [68] intern_name_example
  row[68] = String(data.qualificationInfo?.internNameExample ?? '');
  // [69] intern_birth_date
  row[69] = String(data.qualificationInfo?.internBirthDate ?? '');
  // [70] intern_nationality
  row[70] = String(data.qualificationInfo?.internNationality ?? '');
  // [71] example_birth_year
  row[71] = String(data.qualificationInfo?.exampleBirthYear ?? '');
  // [72] example_nationality
  row[72] = String(data.qualificationInfo?.exampleNationality ?? '');
  // [73] implementing_organization
  row[73] = String(data.qualificationInfo?.implementingOrganization ?? '');
  // [74] supervising_organization
  row[74] = String(data.qualificationInfo?.noteSupervisingOrganization ?? '');
  // ═══ 所属機関 ═══
  // [75] implementing_organization_example
  row[75] = String(data.affiliationInfo?.implementingOrganizationExample ?? '');
  // [76] supervising_organization_example
  row[76] = String(data.affiliationInfo?.supervisingOrganizationExample ?? '');
  // [77] supervising_org_note
  row[77] = String(data.affiliationInfo?.supervisingOrgNote ?? '');
  // [78] occupation_task
  row[78] = String(data.affiliationInfo?.occupationTask ?? '');
  // ═══ 資格情報 ═══
  // [79] skill_improvement_description_note
  row[79] = String(data.qualificationInfo?.skillImprovementDescriptionNote ?? '');
  // [80] occupation_task_example
  row[80] = String(data.qualificationInfo?.occupationTaskExample ?? '');
  // [81] life_supervisor_opinion_section_header
  row[81] = String(data.qualificationInfo?.lifeSupervisorOpinionSectionHeader ?? '');
  // [82] life_supervisor_opinion_example_text
  row[82] = String(data.qualificationInfo?.lifeSupervisorOpinionExampleText ?? '');
  // [83] internship_status_section_header
  row[83] = String(data.qualificationInfo?.internshipStatusSectionHeader ?? '');
  // [84] internship_start_year_example
  row[84] = String(data.qualificationInfo?.internshipStartYearExample ?? '');
  // [85] month_01_label
  row[85] = String(data.qualificationInfo?.month1Label ?? '');
  // [86] month_02_label
  row[86] = String(data.qualificationInfo?.month2Label ?? '');
  // [87] month_03_label
  row[87] = String(data.qualificationInfo?.month3Label ?? '');
  // [88] month_04_label
  row[88] = String(data.qualificationInfo?.month4Label ?? '');
  // [89] month_05_label
  row[89] = String(data.qualificationInfo?.month5Label ?? '');
  // [90] month_06_label
  row[90] = String(data.qualificationInfo?.month6Label ?? '');
  // [91] month_07_label
  row[91] = String(data.qualificationInfo?.month7Label ?? '');
  // [92] month_08_label
  row[92] = String(data.qualificationInfo?.month8Label ?? '');
  // [93] month_09_label
  row[93] = String(data.qualificationInfo?.month9Label ?? '');
  // [94] month_10_label
  row[94] = String(data.qualificationInfo?.month10Label ?? '');
  // [95] month_11_label
  row[95] = String(data.qualificationInfo?.month11Label ?? '');
  // [96] reason_for_not_taking_exam
  row[96] = String(data.qualificationInfo?.reasonForNotTakingExam ?? '');
  // [97] skill_training_supervisor_name
  row[97] = String(data.qualificationInfo?.skillTrainingSupervisorName ?? '');
  // [98] supervising_supervisor_name
  row[98] = String(data.qualificationInfo?.supervisingSupervisorName ?? '');
  // [99] signatory_kikuchi_masayuki
  row[99] = String(data.qualificationInfo?.signatoryKikuchiMasayuki ?? '');
  // [100] signatory_sanjo_koichi
  row[100] = String(data.qualificationInfo?.signatorySanjoKoichi ?? '');
  // [101] document_reference_number
  row[101] = String(data.qualificationInfo?.documentReferenceNumber ?? '');
  // ═══ 在留情報 ═══
  // [102] addressee_immigration_bureau_director
  row[102] = String(data.residenceInfo?.addresseeImmigrationBureauDirector ?? '');
  // [103] document_title
  row[103] = String(data.residenceInfo?.documentTitle ?? '');
  // ═══ 資格情報 ═══
  // [104] target_technical_intern_section_title
  row[104] = String(data.qualificationInfo?.targetTechnicalInternSectionTitle ?? '');
  // [105] skill_training_instructor_comment_section_title
  row[105] = String(data.qualificationInfo?.skillTrainingInstructorCommentSectionTitle ?? '');
  // [106] name
  row[106] = String(data.qualificationInfo?.traineeNameLabel ?? '');
  // [107] gender
  row[107] = String(data.qualificationInfo?.traineeGender ?? '');
  // [108] skill_training_instructor_comment
  row[108] = String(data.qualificationInfo?.skillTrainingInstructorComment ?? '');
  // [109] birth_date
  row[109] = String(data.qualificationInfo?.internBirthDate ?? '');
  // [110] nationality_region
  row[110] = String(data.qualificationInfo?.nationalityRegion ?? '');
  // [111] note_supervising_organization
  row[111] = String(data.qualificationInfo?.noteSupervisingOrganization ?? '');
  // [112] occupation_work
  row[112] = String(data.qualificationInfo?.occupationWork ?? '');
  // [113] note_skill_training_instructor_comment
  row[113] = String(data.qualificationInfo?.noteSkillTrainingInstructorComment ?? '');
  // [114] life_instructor_comment_section_title
  row[114] = String(data.qualificationInfo?.lifeInstructorCommentSectionTitle ?? '');
  // [115] skill_training_status_section_title
  row[115] = String(data.qualificationInfo?.skillTrainingStatusSectionTitle ?? '');
  // [116] report_year
  row[116] = String(data.qualificationInfo?.reportYear ?? '');
  // ═══ 技能実習実施状況 ═══
  // [117] scheduled_training_days
  row[117] = String(data.trainingStatus?.totalScheduledTrainingDays ?? '');
  // ═══ 資格情報 ═══
  // [118] attendance_days
  row[118] = String(data.qualificationInfo?.actualAttendanceDays2018 ?? '');
  // [119] note_life_instructor_comment
  row[119] = String(data.qualificationInfo?.noteLifeInstructorComment ?? '');
  // [120] attendance_rate
  row[120] = String(data.qualificationInfo?.attendanceRateValue100 ?? '');
  // [121] skill_training_supervisor_comment_section_title
  row[121] = String(data.qualificationInfo?.skillTrainingSupervisorCommentSectionTitle ?? '');
  // [122] absence_days
  row[122] = String(data.qualificationInfo?.absenceDays ?? '');
  // [123] paid_leave_days
  row[123] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [124] note_skill_training_supervisor_comment
  row[124] = String(data.qualificationInfo?.noteSkillTrainingSupervisorComment ?? '');
  // [125] supervising_supervisor_comment_section_title
  row[125] = String(data.qualificationInfo?.supervisingSupervisorCommentSectionTitle ?? '');
  // [126] total_days
  row[126] = String(data.qualificationInfo?.totalDays ?? '');
  // [127] attendance_rate_label
  row[127] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [128] paid_leave_label
  row[128] = String(data.qualificationInfo?.paidLeaveLabel ?? '');
  // [129] note_supervising_supervisor_comment
  row[129] = String(data.qualificationInfo?.noteSupervisingSupervisorComment ?? '');
  // [130] skill_test_evaluation_exam_section_title
  row[130] = String(data.qualificationInfo?.skillTestEvaluationExamSectionTitle ?? '');
  // [131] declaration_statement
  row[131] = String(data.qualificationInfo?.declarationStatement ?? '');
  // [132] exam_name_implementing_organization
  row[132] = String(data.qualificationInfo?.examNameImplementingOrganization ?? '');
  // [133] evaluation_date
  row[133] = String(data.qualificationInfo?.evaluationDate ?? '');

  // ─── ヘッダー定義 ──────────────────────────────────────
  const headers: string[] = [
    'SHIMEI', // [0]
    'SEIBETSU', // [1]
    'SEINEN_GATSUPI', // [2]
    'KOKUSEKI', // [3]
    'JISSHU_JISSHISHA', // [4]
    'KANRI_DANTAI', // [5]
    'JISSHU_YOTEI_NISSU', // [6]
    'SHUKKIN_NISSU', // [7]
    'SHUKKIN_RITSU_PERCENT', // [8]
    'KEKKIN_NISSU', // [9]
    'YUKYU_SHUTOKU_NISSU', // [10]
    'OVERALL_SHUKKIN_RITSU_PERCENT', // [11]
    'JISSHU_SHIDOIN_SHOKEN', // [12]
    'DECLARATION_STATEMENT_TEXT', // [13]
    'SHINSEI_DATE', // [14]
    'JISSHU_JISSHI_SEKININSHA', // [15]
    'qualificationInfo_documentTitle', // [16]
    'qualificationInfo_submissionLocation', // [17]
    'qualificationInfo_recipient', // [18]
    'qualificationInfo_traineeSectionTitle', // [19]
    'qualificationInfo_traineeNameLabel', // [20]
    'qualificationInfo_traineeGender', // [21]
    'qualificationInfo_traineeFullName', // [22]
    'qualificationInfo_traineeBirthDate', // [23]
    'qualificationInfo_traineeNationality', // [24]
    'qualificationInfo_traineeBirthYearSample', // [25]
    'qualificationInfo_traineeNationalitySample', // [26]
    'qualificationInfo_trainingProviderLabel', // [27]
    'qualificationInfo_supervisingOrganizationLabel', // [28]
    'qualificationInfo_trainingStatusSectionTitle', // [29]
    'qualificationInfo_trainingYear', // [30]
    'qualificationInfo_monthLabelJan', // [31]
    'qualificationInfo_monthLabelFeb', // [32]
    'qualificationInfo_monthLabelMar', // [33]
    'qualificationInfo_monthLabelApr', // [34]
    'qualificationInfo_monthLabelMay', // [35]
    'qualificationInfo_monthLabelJun', // [36]
    'qualificationInfo_monthLabelJul', // [37]
    'qualificationInfo_monthLabelAug', // [38]
    'qualificationInfo_monthLabelSep', // [39]
    'qualificationInfo_monthLabelOct', // [40]
    'qualificationInfo_monthLabelNov', // [41]
    'qualificationInfo_monthLabelDec', // [42]
    'qualificationInfo_scheduledDaysLabel', // [43]
    'qualificationInfo_scheduledDaysJan', // [44]
    'qualificationInfo_scheduledDaysFeb', // [45]
    'qualificationInfo_scheduledDaysMar', // [46]
    'qualificationInfo_scheduledDaysApr', // [47]
    'qualificationInfo_scheduledDaysMay', // [48]
    'qualificationInfo_scheduledDaysJun', // [49]
    'qualificationInfo_attendanceDaysLabel', // [50]
    'affiliationInfo_trainingProviderName', // [51]
    'affiliationInfo_supervisingOrganizationName', // [52]
    'affiliationInfo_supervisingOrganizationNote', // [53]
    'affiliationInfo_jobTypeLabel', // [54]
    'affiliationInfo_jobTypeName', // [55]
    'technical_internship_supervisor', // [56]
    'supervising_supervisor', // [57]
    'evaluator_name_example', // [58]
    'supervising_org_representative_example', // [59]
    'submission_location_example', // [60]
    'recipient', // [61]
    'target_intern_section_header', // [62]
    'supervisor_opinion_section_header', // [63]
    'intern_name', // [64]
    'intern_gender', // [65]
    'supervisor_opinion', // [66]
    'supervisor_opinion_example_text', // [67]
    'intern_name_example', // [68]
    'intern_birth_date', // [69]
    'intern_nationality', // [70]
    'example_birth_year', // [71]
    'example_nationality', // [72]
    'implementing_organization', // [73]
    'supervising_organization', // [74]
    'implementing_organization_example', // [75]
    'supervising_organization_example', // [76]
    'supervising_org_note', // [77]
    'occupation_task', // [78]
    'skill_improvement_description_note', // [79]
    'occupation_task_example', // [80]
    'life_supervisor_opinion_section_header', // [81]
    'life_supervisor_opinion_example_text', // [82]
    'internship_status_section_header', // [83]
    'internship_start_year_example', // [84]
    'month_01_label', // [85]
    'month_02_label', // [86]
    'month_03_label', // [87]
    'month_04_label', // [88]
    'month_05_label', // [89]
    'month_06_label', // [90]
    'month_07_label', // [91]
    'month_08_label', // [92]
    'month_09_label', // [93]
    'month_10_label', // [94]
    'month_11_label', // [95]
    'reason_for_not_taking_exam', // [96]
    'skill_training_supervisor_name', // [97]
    'supervising_supervisor_name', // [98]
    'signatory_kikuchi_masayuki', // [99]
    'signatory_sanjo_koichi', // [100]
    'document_reference_number', // [101]
    'addressee_immigration_bureau_director', // [102]
    'document_title', // [103]
    'target_technical_intern_section_title', // [104]
    'skill_training_instructor_comment_section_title', // [105]
    'name', // [106]
    'gender', // [107]
    'skill_training_instructor_comment', // [108]
    'birth_date', // [109]
    'nationality_region', // [110]
    'note_supervising_organization', // [111]
    'occupation_work', // [112]
    'note_skill_training_instructor_comment', // [113]
    'life_instructor_comment_section_title', // [114]
    'skill_training_status_section_title', // [115]
    'report_year', // [116]
    'scheduled_training_days', // [117]
    'attendance_days', // [118]
    'note_life_instructor_comment', // [119]
    'attendance_rate', // [120]
    'skill_training_supervisor_comment_section_title', // [121]
    'absence_days', // [122]
    'paid_leave_days', // [123]
    'note_skill_training_supervisor_comment', // [124]
    'supervising_supervisor_comment_section_title', // [125]
    'total_days', // [126]
    'attendance_rate_label', // [127]
    'paid_leave_label', // [128]
    'note_supervising_supervisor_comment', // [129]
    'skill_test_evaluation_exam_section_title', // [130]
    'declaration_statement', // [131]
    'exam_name_implementing_organization', // [132]
    'evaluation_date' // [133]
  ];

  return createCsvString(headers, row);
};

export const generateTechnicalInternEvaluationPart2Csv = (data: TechnicalInternEvaluationFormData): string => {
  // technical_intern_evaluation.csv — 全46項目
  const row: string[] = new Array(46).fill('');

  // ═══ 資格情報 ═══
  // [0] evaluator_name_1
  row[0] = String(data.qualificationInfo?.evaluatorName1 ?? '');
  // [1] evaluator_name_2
  row[1] = String(data.qualificationInfo?.evaluatorName2 ?? '');
  // ═══ 在留情報 ═══
  // [2] document_title
  row[2] = String(data.residenceInfo?.documentTitle ?? '');
  // ═══ 資格情報 ═══
  // [3] submission_location
  row[3] = String(data.qualificationInfo?.submissionLocationExample ?? '');
  // [4] recipient_title
  row[4] = String(data.qualificationInfo?.recipientTitle ?? '');
  // [5] trainee_section_header
  row[5] = String(data.qualificationInfo?.traineeSectionHeader ?? '');
  // [6] trainee_name_label
  row[6] = String(data.qualificationInfo?.traineeName ?? '');
  // [7] trainee_gender
  row[7] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [8] trainee_name
  row[8] = String(data.qualificationInfo?.traineeName ?? '');
  // [9] trainee_birth_date
  row[9] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [10] trainee_nationality_label
  row[10] = String(data.qualificationInfo?.traineeNationalityLabel ?? '');
  // [11] trainee_birth_year_example
  row[11] = String(data.qualificationInfo?.traineeBirthYearExample ?? '');
  // [12] trainee_nationality
  row[12] = String(data.qualificationInfo?.traineeNationalityLabel ?? '');
  // [13] implementing_organization_label
  row[13] = String(data.qualificationInfo?.implementingOrganizationLabel ?? '');
  // [14] supervising_organization_label
  row[14] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // ═══ 所属機関 ═══
  // [15] implementing_organization_name
  row[15] = String(data.affiliationInfo?.implementingOrganizationName ?? '');
  // [16] supervising_organization_name
  row[16] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [17] supervising_organization_note
  row[17] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [18] occupation_type_label
  row[18] = String(data.affiliationInfo?.occupationTypeLabel ?? '');
  // [19] occupation_type
  row[19] = String(data.affiliationInfo?.occupationType ?? '');
  // ═══ 技能実習実施状況 ═══
  // [20] training_status_section_header
  row[20] = String(data.trainingStatus?.trainingStatusSectionHeader ?? '');
  // [21] training_year
  row[21] = String(data.trainingStatus?.trainingYear ?? '');
  // [22] month_label_jan
  row[22] = String(data.trainingStatus?.monthLabelJan ?? '');
  // [23] month_label_feb
  row[23] = String(data.trainingStatus?.monthLabelFeb ?? '');
  // [24] month_label_mar
  row[24] = String(data.trainingStatus?.monthLabelMar ?? '');
  // [25] month_label_apr
  row[25] = String(data.trainingStatus?.monthLabelApr ?? '');
  // [26] month_label_may
  row[26] = String(data.trainingStatus?.monthLabelMay ?? '');
  // [27] month_label_jun
  row[27] = String(data.trainingStatus?.monthLabelJun ?? '');
  // [28] month_label_jul
  row[28] = String(data.trainingStatus?.monthLabelJul ?? '');
  // [29] month_label_aug
  row[29] = String(data.trainingStatus?.monthLabelAug ?? '');
  // [30] month_label_sep
  row[30] = String(data.trainingStatus?.monthLabelSep ?? '');
  // [31] month_label_oct
  row[31] = String(data.trainingStatus?.monthLabelOct ?? '');
  // [32] month_label_nov
  row[32] = String(data.trainingStatus?.monthLabelNov ?? '');
  // [33] month_label_dec
  row[33] = String(data.trainingStatus?.monthLabelDec ?? '');
  // [34] total_scheduled_training_days
  row[34] = String(data.trainingStatus?.totalScheduledTrainingDays ?? '');
  // [35] january_scheduled_days
  row[35] = String(data.trainingStatus?.januaryScheduledDays ?? '');
  // [36] february_scheduled_days
  row[36] = String(data.trainingStatus?.februaryScheduledDays ?? '');
  // [37] march_scheduled_days
  row[37] = String(data.trainingStatus?.marchScheduledDays ?? '');
  // [38] april_scheduled_days
  row[38] = String(data.trainingStatus?.aprilScheduledDays ?? '');
  // [39] may_scheduled_days
  row[39] = String(data.trainingStatus?.mayScheduledDays ?? '');
  // ═══ 資格情報 ═══
  // [40] EXAM_DATE
  row[40] = String(data.qualificationInfo?.examDate ?? '');
  // [41] PASS_FAIL_RESULT_CODE
  row[41] = String(data.qualificationInfo?.passFailResultCode ?? '');
  // [42] PASS_FAIL_RESULT_TEXT
  row[42] = String(data.qualificationInfo?.passFailResultText ?? '');
  // [43] REASON_FOR_NOT_TAKING_EXAM
  row[43] = String(data.qualificationInfo?.reasonForNotTakingExam ?? '');
  // [44] TECHNICAL_INTERNSHIP_SUPERVISOR_NAME
  row[44] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [45] SUPERVISING_SUPERVISOR_NAME
  row[45] = String(data.qualificationInfo?.supervisingSupervisorName ?? '');

  // ─── ヘッダー定義 ──────────────────────────────────────
  const headers: string[] = [
    'evaluator_name_1', // [0]
    'evaluator_name_2', // [1]
    'document_title', // [2]
    'submission_location', // [3]
    'recipient_title', // [4]
    'trainee_section_header', // [5]
    'trainee_name_label', // [6]
    'trainee_gender', // [7]
    'trainee_name', // [8]
    'trainee_birth_date', // [9]
    'trainee_nationality_label', // [10]
    'trainee_birth_year_example', // [11]
    'trainee_nationality', // [12]
    'implementing_organization_label', // [13]
    'supervising_organization_label', // [14]
    'implementing_organization_name', // [15]
    'supervising_organization_name', // [16]
    'supervising_organization_note', // [17]
    'occupation_type_label', // [18]
    'occupation_type', // [19]
    'training_status_section_header', // [20]
    'training_year', // [21]
    'month_label_jan', // [22]
    'month_label_feb', // [23]
    'month_label_mar', // [24]
    'month_label_apr', // [25]
    'month_label_may', // [26]
    'month_label_jun', // [27]
    'month_label_jul', // [28]
    'month_label_aug', // [29]
    'month_label_sep', // [30]
    'month_label_oct', // [31]
    'month_label_nov', // [32]
    'month_label_dec', // [33]
    'total_scheduled_training_days', // [34]
    'january_scheduled_days', // [35]
    'february_scheduled_days', // [36]
    'march_scheduled_days', // [37]
    'april_scheduled_days', // [38]
    'may_scheduled_days', // [39]
    'EXAM_DATE', // [40]
    'PASS_FAIL_RESULT_CODE', // [41]
    'PASS_FAIL_RESULT_TEXT', // [42]
    'REASON_FOR_NOT_TAKING_EXAM', // [43]
    'TECHNICAL_INTERNSHIP_SUPERVISOR_NAME', // [44]
    'SUPERVISING_SUPERVISOR_NAME' // [45]
  ];

  return createCsvString(headers, row);
};
