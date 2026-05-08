import type { SkillTraineeEvaluationFormData } from './skillTraineeEvaluationSchema';
import { createCsvString } from '@/lib/csv/csvUtils';

/**
 * 技能実習生に関する評価調書 の CSV データを生成します。
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されたスキャフォールドです。
 * ※ 各 row[N] の値変換ロジック（日付フォーマット、ハイフン除去等）は手動で調整してください。
 *
 * @param data - SkillTraineeEvaluationFormData
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateSkillTraineeEvaluationCsv = (data: SkillTraineeEvaluationFormData): string => {
  // 技能実習生に関する評価調書.csv — 全84項目
  const row: string[] = new Array(84).fill('');

  // ═══ １．対象技能実習生 ═══
  // [0] trainee_name
  row[0] = data.traineeInfo?.traineeName || '';
  // [1] trainee_gender
  row[1] = data.traineeInfo?.traineeGender || '';
  // [2] trainee_birth_date
  row[2] = data.traineeInfo?.traineeBirthDate || '';
  // [3] trainee_nationality
  row[3] = data.traineeInfo?.traineeNationality || '';
  // [4] implementing_organization_name
  row[4] = data.traineeInfo?.implementingOrganizationName || '';
  // [5] supervising_organization_name
  row[5] = data.traineeInfo?.supervisingOrganizationName || '';
  // [6] occupation_type
  row[6] = data.traineeInfo?.occupationType || '';
  // ═══ ２．技能実習実施状況 ═══
  // [7] training_year
  row[7] = data.trainingStatus?.trainingYear || '';
  // [8] scheduled_days_01
  row[8] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [9] attendance_days_01
  row[9] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [10] attendance_rate_01
  row[10] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [11] absent_days_01
  row[11] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [12] paid_leave_days_01
  row[12] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [13] scheduled_days_02
  row[13] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [14] attendance_days_02
  row[14] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [15] attendance_rate_02
  row[15] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [16] absent_days_02
  row[16] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [17] paid_leave_days_02
  row[17] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [18] scheduled_days_03
  row[18] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [19] attendance_days_03
  row[19] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [20] attendance_rate_03
  row[20] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [21] absent_days_03
  row[21] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [22] paid_leave_days_03
  row[22] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [23] scheduled_days_04
  row[23] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [24] attendance_days_04
  row[24] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [25] attendance_rate_04
  row[25] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [26] absent_days_04
  row[26] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [27] paid_leave_days_04
  row[27] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [28] scheduled_days_05
  row[28] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [29] attendance_days_05
  row[29] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [30] attendance_rate_05
  row[30] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [31] absent_days_05
  row[31] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [32] paid_leave_days_05
  row[32] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [33] scheduled_days_06
  row[33] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [34] attendance_days_06
  row[34] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [35] attendance_rate_06
  row[35] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [36] absent_days_06
  row[36] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [37] paid_leave_days_06
  row[37] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [38] scheduled_days_07
  row[38] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [39] attendance_days_07
  row[39] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [40] attendance_rate_07
  row[40] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [41] absent_days_07
  row[41] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [42] paid_leave_days_07
  row[42] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [43] scheduled_days_08
  row[43] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [44] attendance_days_08
  row[44] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [45] attendance_rate_08
  row[45] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [46] absent_days_08
  row[46] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [47] paid_leave_days_08
  row[47] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [48] scheduled_days_09
  row[48] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [49] attendance_days_09
  row[49] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [50] attendance_rate_09
  row[50] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [51] absent_days_09
  row[51] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [52] paid_leave_days_09
  row[52] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [53] scheduled_days_10
  row[53] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [54] attendance_days_10
  row[54] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [55] attendance_rate_10
  row[55] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [56] absent_days_10
  row[56] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [57] paid_leave_days_10
  row[57] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [58] scheduled_days_11
  row[58] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [59] attendance_days_11
  row[59] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [60] attendance_rate_11
  row[60] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [61] absent_days_11
  row[61] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [62] paid_leave_days_11
  row[62] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [63] scheduled_days_12
  row[63] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [64] attendance_days_12
  row[64] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [65] attendance_rate_12
  row[65] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [66] absent_days_12
  row[66] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [67] paid_leave_days_12
  row[67] = ''; // TODO: マッピング未特定 — 手動で割り当ててください
  // [68] total_scheduled_days
  row[68] = data.trainingStatus?.totalScheduledDays || '';
  // [69] total_attendance_days
  row[69] = data.trainingStatus?.totalAttendanceDays || '';
  // [70] total_attendance_rate
  row[70] = data.trainingStatus?.totalAttendanceRate || '';
  // [71] total_absent_days
  row[71] = data.trainingStatus?.totalAbsentDays || '';
  // [72] total_paid_leave_days
  row[72] = data.trainingStatus?.totalPaidLeaveDays || '';
  // ═══ ３．技能検定・技能実習評価試験 ═══
  // [73] skill_test_name_and_organization
  row[73] = data.skillTestInfo?.skillTestNameAndOrganization || '';
  // [74] skill_test_date
  row[74] = data.skillTestInfo?.skillTestDate || '';
  // [75] skill_test_result
  row[75] = data.skillTestInfo?.skillTestResult || '';
  // [76] skill_test_reason_not_taken
  row[76] = data.skillTestInfo?.skillTestReasonNotTaken || '';
  // ═══ 所見 ═══
  // [77] skill_instructor_opinion
  row[77] = data.opinions?.skillInstructorOpinion || '';
  // [78] life_instructor_opinion
  row[78] = data.opinions?.lifeInstructorOpinion || '';
  // [79] skill_supervisor_opinion
  row[79] = data.opinions?.skillSupervisorOpinion || '';
  // [80] supervising_supervisor_opinion
  row[80] = data.opinions?.supervisingSupervisorOpinion || '';
  // ═══ 申告 ═══
  // [81] submission_date
  row[81] = data.declaration?.submissionDate || '';
  // [82] implementing_supervisor_signatory_name
  row[82] = data.declaration?.implementingSupervisorSignatoryName || '';
  // [83] supervising_supervisor_signatory_name
  row[83] = data.declaration?.supervisingSupervisorSignatoryName || '';

  // ─── ヘッダー定義 ──────────────────────────────────────
  const headers: string[] = [
    'trainee_name', // [0]
    'trainee_gender', // [1]
    'trainee_birth_date', // [2]
    'trainee_nationality', // [3]
    'implementing_organization_name', // [4]
    'supervising_organization_name', // [5]
    'occupation_type', // [6]
    'training_year', // [7]
    'scheduled_days_01', // [8]
    'attendance_days_01', // [9]
    'attendance_rate_01', // [10]
    'absent_days_01', // [11]
    'paid_leave_days_01', // [12]
    'scheduled_days_02', // [13]
    'attendance_days_02', // [14]
    'attendance_rate_02', // [15]
    'absent_days_02', // [16]
    'paid_leave_days_02', // [17]
    'scheduled_days_03', // [18]
    'attendance_days_03', // [19]
    'attendance_rate_03', // [20]
    'absent_days_03', // [21]
    'paid_leave_days_03', // [22]
    'scheduled_days_04', // [23]
    'attendance_days_04', // [24]
    'attendance_rate_04', // [25]
    'absent_days_04', // [26]
    'paid_leave_days_04', // [27]
    'scheduled_days_05', // [28]
    'attendance_days_05', // [29]
    'attendance_rate_05', // [30]
    'absent_days_05', // [31]
    'paid_leave_days_05', // [32]
    'scheduled_days_06', // [33]
    'attendance_days_06', // [34]
    'attendance_rate_06', // [35]
    'absent_days_06', // [36]
    'paid_leave_days_06', // [37]
    'scheduled_days_07', // [38]
    'attendance_days_07', // [39]
    'attendance_rate_07', // [40]
    'absent_days_07', // [41]
    'paid_leave_days_07', // [42]
    'scheduled_days_08', // [43]
    'attendance_days_08', // [44]
    'attendance_rate_08', // [45]
    'absent_days_08', // [46]
    'paid_leave_days_08', // [47]
    'scheduled_days_09', // [48]
    'attendance_days_09', // [49]
    'attendance_rate_09', // [50]
    'absent_days_09', // [51]
    'paid_leave_days_09', // [52]
    'scheduled_days_10', // [53]
    'attendance_days_10', // [54]
    'attendance_rate_10', // [55]
    'absent_days_10', // [56]
    'paid_leave_days_10', // [57]
    'scheduled_days_11', // [58]
    'attendance_days_11', // [59]
    'attendance_rate_11', // [60]
    'absent_days_11', // [61]
    'paid_leave_days_11', // [62]
    'scheduled_days_12', // [63]
    'attendance_days_12', // [64]
    'attendance_rate_12', // [65]
    'absent_days_12', // [66]
    'paid_leave_days_12', // [67]
    'total_scheduled_days', // [68]
    'total_attendance_days', // [69]
    'total_attendance_rate', // [70]
    'total_absent_days', // [71]
    'total_paid_leave_days', // [72]
    'skill_test_name_and_organization', // [73]
    'skill_test_date', // [74]
    'skill_test_result', // [75]
    'skill_test_reason_not_taken', // [76]
    'skill_instructor_opinion', // [77]
    'life_instructor_opinion', // [78]
    'skill_supervisor_opinion', // [79]
    'supervising_supervisor_opinion', // [80]
    'submission_date', // [81]
    'implementing_supervisor_signatory_name', // [82]
    'supervising_supervisor_signatory_name' // [83]
  ];

  return createCsvString(headers, row);
};
