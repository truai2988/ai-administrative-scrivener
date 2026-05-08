/**
 * 技能実習生に関する評価調書 — Schema-Driven UI Config
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されました。
 * ※ UIの描画順序や自動計算ロジック（computedRules）を定義しています。
 * ※ fieldMappings はAI書類読み取りの自動入力に使用されます。
 */

import type { FormUiConfig } from '@/components/forms/types/uiConfigTypes';

export const technicalInternEvaluationUiConfig = {
  "formKey": "technicalInternEvaluation",
  "formName": "技能実習生に関する評価調書",
  "sections": [
    {
      "sectionKey": "qualificationInfo",
      "sectionLabel": "資格情報",
      "fields": [
        {
          "fieldKey": "technicalInternshipReportTitle",
          "label": "技能実習実施状況報告書",
          "inputType": "text"
        },
        {
          "fieldKey": "directorGeneralImmigrationBureau",
          "label": "入国管理局長　殿",
          "inputType": "text"
        },
        {
          "fieldKey": "subjectTitle",
          "label": "１．対象者",
          "inputType": "text"
        },
        {
          "fieldKey": "name",
          "label": "氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "gender",
          "label": "性別",
          "inputType": "select"
        },
        {
          "fieldKey": "birthDate",
          "label": "生年月日",
          "inputType": "text"
        },
        {
          "fieldKey": "nationality",
          "label": "国籍",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganization",
          "label": "実習実施者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganization",
          "label": "監理団体",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationNote",
          "label": "※　監理団体の名称は団体監理型の場合のみ記入すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "technicalInternshipStatusTitle",
          "label": "２．技能実習実施状況",
          "inputType": "text"
        },
        {
          "fieldKey": "year2017",
          "label": "2017年",
          "inputType": "text"
        },
        {
          "fieldKey": "january",
          "label": "１月",
          "inputType": "text"
        },
        {
          "fieldKey": "february",
          "label": "２月",
          "inputType": "text"
        },
        {
          "fieldKey": "march",
          "label": "３月",
          "inputType": "text"
        },
        {
          "fieldKey": "april",
          "label": "４月",
          "inputType": "text"
        },
        {
          "fieldKey": "may",
          "label": "５月",
          "inputType": "text"
        },
        {
          "fieldKey": "june",
          "label": "６月",
          "inputType": "text"
        },
        {
          "fieldKey": "july",
          "label": "７月",
          "inputType": "text"
        },
        {
          "fieldKey": "august",
          "label": "８月",
          "inputType": "text"
        },
        {
          "fieldKey": "september",
          "label": "９月",
          "inputType": "text"
        },
        {
          "fieldKey": "october",
          "label": "１０月",
          "inputType": "text"
        },
        {
          "fieldKey": "november",
          "label": "１１月",
          "inputType": "text"
        },
        {
          "fieldKey": "december",
          "label": "１２月",
          "inputType": "text"
        },
        {
          "fieldKey": "scheduledTrainingDays",
          "label": "実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceDays",
          "label": "出勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceRate",
          "label": "出勤率（％）",
          "inputType": "text"
        },
        {
          "fieldKey": "absentDays",
          "label": "欠勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "paidLeaveDays",
          "label": "有給取得日数",
          "inputType": "number"
        },
        {
          "fieldKey": "year2018",
          "label": "2018年",
          "inputType": "text"
        },
        {
          "fieldKey": "totalLabel",
          "label": "合計",
          "inputType": "text"
        },
        {
          "fieldKey": "overallAttendanceRateLabel",
          "label": "出勤率",
          "inputType": "text"
        },
        {
          "fieldKey": "technicalInternshipInstructorCommentTitle",
          "label": "３．技能実習指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "instructorComment",
          "label": "所見",
          "inputType": "text"
        },
        {
          "fieldKey": "instructorCommentNote",
          "label": "※　技能実習において修得した技能等がどのように向上したかなどについて具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentTitle",
          "label": "４．生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentNote",
          "label": "※　生活態度などについて具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "declaration",
          "label": "上記の内容について，事実と相違ありません。",
          "inputType": "text"
        },
        {
          "fieldKey": "dateOfSubmission",
          "label": "平成　　　　年　　　　月　　　　日",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganizationRepresentative",
          "label": "実習実施責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeName",
          "label": "氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeGender",
          "label": "性別",
          "inputType": "select"
        },
        {
          "fieldKey": "traineeBirthDate",
          "label": "生年月日",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeNationality",
          "label": "国籍・地域",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganizationName",
          "label": "実習実施者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationName",
          "label": "監理団体",
          "inputType": "text"
        },
        {
          "fieldKey": "evaluationYear",
          "label": "評価対象年",
          "inputType": "text"
        },
        {
          "fieldKey": "monthlyEvaluation",
          "label": "月別実習状況",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceRateYear1",
          "label": "1年目出勤率",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceRateYear2",
          "label": "2年目出勤率",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceRateYear3",
          "label": "3年目出勤率",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceRateYear4",
          "label": "4年目出勤率",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceRateYear5",
          "label": "5年目出勤率",
          "inputType": "number"
        },
        {
          "fieldKey": "absentDays",
          "label": "欠勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "paidLeaveDays",
          "label": "有休取得日数",
          "inputType": "number"
        },
        {
          "fieldKey": "dataYear",
          "label": "対象年",
          "inputType": "text"
        },
        {
          "fieldKey": "totalWorkingDays",
          "label": "総労働日数",
          "inputType": "number"
        },
        {
          "fieldKey": "actualWorkingDays",
          "label": "実労働日数",
          "inputType": "number"
        },
        {
          "fieldKey": "overallAttendanceRate",
          "label": "総合出勤率",
          "inputType": "number"
        },
        {
          "fieldKey": "skillTests",
          "label": "技能検定・技能実習評価試験",
          "inputType": "select"
        },
        {
          "fieldKey": "instructorComment",
          "label": "技能実習指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorComment",
          "label": "生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingSupervisorComment",
          "label": "技能実習責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorComment",
          "label": "監理責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "confirmationStatement",
          "label": "事実確認",
          "inputType": "text"
        },
        {
          "fieldKey": "submissionDate",
          "label": "提出日",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingSupervisorName",
          "label": "技能実習責任者氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorName",
          "label": "監理責任者氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "evaluatorNameKikuchi",
          "label": "菊地　政幸",
          "inputType": "text"
        },
        {
          "fieldKey": "evaluatorNameMisato",
          "label": "三姓　晃一",
          "inputType": "text"
        },
        {
          "fieldKey": "documentTitle",
          "label": "技能実習生に対する評価調書",
          "inputType": "text"
        },
        {
          "fieldKey": "submissionLocation",
          "label": "東京",
          "inputType": "text"
        },
        {
          "fieldKey": "recipientImmigrationDirector",
          "label": "入国管理局長　殿",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeSectionHeader",
          "label": "１．対象技能実習生",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeNameLabel",
          "label": "氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeGender",
          "label": "性別",
          "inputType": "select"
        },
        {
          "fieldKey": "traineeName",
          "label": "NGUYEN　PAM　HUY",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeBirthDate",
          "label": "生年月日",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeNationalityLabel",
          "label": "国籍・地域",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeBirthYearExample",
          "label": "1991",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeNationality",
          "label": "ベトナム",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganizationLabel",
          "label": "実習実施者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationLabel",
          "label": "監理団体",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingStatusSectionHeader",
          "label": "２．技能実習実施状況",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingYear",
          "label": "2017年",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth1",
          "label": "１月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth2",
          "label": "２月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth3",
          "label": "３月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth4",
          "label": "４月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth5",
          "label": "５月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth6",
          "label": "６月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth7",
          "label": "７月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth8",
          "label": "８月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth9",
          "label": "９月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth10",
          "label": "１０月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth11",
          "label": "１１月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth12",
          "label": "１２月",
          "inputType": "text"
        },
        {
          "fieldKey": "plannedTrainingDaysLabel",
          "label": "実習予定日数",
          "inputType": "text"
        },
        {
          "fieldKey": "plannedTrainingDaysJan",
          "label": "21",
          "inputType": "number"
        },
        {
          "fieldKey": "plannedTrainingDaysFeb",
          "label": "19",
          "inputType": "number"
        },
        {
          "fieldKey": "plannedTrainingDaysMar",
          "label": "22",
          "inputType": "number"
        },
        {
          "fieldKey": "plannedTrainingDaysApr",
          "label": "20",
          "inputType": "number"
        },
        {
          "fieldKey": "plannedTrainingDaysMay",
          "label": "23",
          "inputType": "number"
        },
        {
          "fieldKey": "eighteen",
          "label": "18",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceDays",
          "label": "出勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "seventeen",
          "label": "17",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRatePercentage",
          "label": "出勤率（％）",
          "inputType": "text"
        },
        {
          "fieldKey": "oneHundred",
          "label": "100",
          "inputType": "text"
        },
        {
          "fieldKey": "ninetyFivePointFourFive",
          "label": "95.45454545454545",
          "inputType": "text"
        },
        {
          "fieldKey": "ninetyPointNineZero",
          "label": "90.9090909090909",
          "inputType": "text"
        },
        {
          "fieldKey": "ninetyFivePointSixFive",
          "label": "95.65217391304348",
          "inputType": "text"
        },
        {
          "fieldKey": "ninetyFourPointFourFour",
          "label": "94.44444444444444",
          "inputType": "text"
        },
        {
          "fieldKey": "absenceDays",
          "label": "欠勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "paidLeaveDays",
          "label": "有休取得日数",
          "inputType": "number"
        },
        {
          "fieldKey": "year2018",
          "label": "2018年",
          "inputType": "text"
        },
        {
          "fieldKey": "total",
          "label": "合計",
          "inputType": "text"
        },
        {
          "fieldKey": "fiveHundred",
          "label": "500",
          "inputType": "text"
        },
        {
          "fieldKey": "fourEightyEight",
          "label": "488",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRate",
          "label": "出勤率",
          "inputType": "text"
        },
        {
          "fieldKey": "ninetySevenPointSix",
          "label": "97.6",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTestEvaluationTitle",
          "label": "３．技能検定・技能実習評価試験",
          "inputType": "text"
        },
        {
          "fieldKey": "testNameOrganization",
          "label": "試験名・試験実施団体",
          "inputType": "text"
        },
        {
          "fieldKey": "testNameOrganizationValue",
          "label": "溶接技能評価試験（専門級）・一般社団法人　日本溶接協会",
          "inputType": "text"
        },
        {
          "fieldKey": "testDate",
          "label": "受検日",
          "inputType": "text"
        },
        {
          "fieldKey": "testResult",
          "label": "合否",
          "inputType": "select"
        },
        {
          "fieldKey": "testResultOptions",
          "label": "合格　　　　・　　　　不合格",
          "inputType": "text"
        },
        {
          "fieldKey": "testYear",
          "label": "2018",
          "inputType": "text"
        },
        {
          "fieldKey": "reasonForNotTakingTest",
          "label": "未受検の場合はその理由",
          "inputType": "text"
        },
        {
          "fieldKey": "skillInstructorCommentTitle",
          "label": "４．技能実習指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "skillInstructorCommentLabel",
          "label": "所見",
          "inputType": "text"
        },
        {
          "fieldKey": "skillInstructorComment",
          "label": "技能実習指導員の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "skillInstructorCommentDescription",
          "label": "※　技能実習において修得した技能等がどのように向上したか等について具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentTitle",
          "label": "５．生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorComment",
          "label": "生活指導員の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentDescription",
          "label": "※　生活態度等について具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingManagerCommentTitle",
          "label": "６．技能実習責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingManagerComment",
          "label": "技能実習責任者の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingManagerCommentDescription",
          "label": "※　技能等の向上，生活態度等の諸状況を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingManagerCommentTitle",
          "label": "７．監理責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingManagerComment",
          "label": "監理責任者の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingManagerCommentDescription",
          "label": "※　上記４～６の各所見及び定期監査等における本人との面談等を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "declarationStatement",
          "label": "上記の内容について，事実と相違ありません。",
          "inputType": "text"
        },
        {
          "fieldKey": "declarationDate",
          "label": "平成　　３０年　　９月　　１１日",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingSupervisorTitle",
          "label": "技能実習責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorTitle",
          "label": "監理責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingSupervisorName",
          "label": "技能実習責任者氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorName",
          "label": "監理責任者氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "submissionLocation",
          "label": "提出地",
          "inputType": "text"
        },
        {
          "fieldKey": "immigrationDirectorSalutation",
          "label": "宛先",
          "inputType": "text"
        },
        {
          "fieldKey": "targetInternSectionTitle",
          "label": "１．対象技能実習生",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingInstructorCommentSectionTitle",
          "label": "４．技能実習指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "internNameLabel",
          "label": "氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "internGender",
          "label": "性別",
          "inputType": "select"
        },
        {
          "fieldKey": "skillTrainingInstructorCommentLabel",
          "label": "所見",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingInstructorCommentContent",
          "label": "技能実習指導員の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "internNameContent",
          "label": "対象技能実習生氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "internBirthDate",
          "label": "生年月日",
          "inputType": "text"
        },
        {
          "fieldKey": "internNationality",
          "label": "国籍・地域",
          "inputType": "text"
        },
        {
          "fieldKey": "internBirthYear",
          "label": "生年",
          "inputType": "text"
        },
        {
          "fieldKey": "internNationalityContent",
          "label": "対象技能実習生国籍",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganizationLabel",
          "label": "実習実施者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationLabel",
          "label": "監理団体",
          "inputType": "text"
        },
        {
          "fieldKey": "skillImprovementDescriptionNote",
          "label": "技能向上記載注意",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationTypeContent",
          "label": "職種・作業内容",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentSectionTitle",
          "label": "５．生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentContent",
          "label": "生活指導員の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingStatusSectionTitle",
          "label": "２．技能実習実施状況",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingYear",
          "label": "実習実施年",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth1",
          "label": "実習実施月1月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth2",
          "label": "実習実施月2月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth3",
          "label": "実習実施月3月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth4",
          "label": "実習実施月4月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth5",
          "label": "実習実施月5月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth6",
          "label": "実習実施月6月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth7",
          "label": "実習実施月7月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth8",
          "label": "実習実施月8月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth9",
          "label": "実習実施月9月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth10",
          "label": "実習実施月10月",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingMonth11",
          "label": "実習実施月11月",
          "inputType": "text"
        },
        {
          "fieldKey": "decemberLabel",
          "label": "１２月",
          "inputType": "text"
        },
        {
          "fieldKey": "scheduledTrainingDays",
          "label": "実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "dataPoint21",
          "label": "21",
          "inputType": "text"
        },
        {
          "fieldKey": "dataPoint19",
          "label": "19",
          "inputType": "text"
        },
        {
          "fieldKey": "dataPoint22",
          "label": "22",
          "inputType": "text"
        },
        {
          "fieldKey": "dataPoint20",
          "label": "20",
          "inputType": "text"
        },
        {
          "fieldKey": "dataPoint23",
          "label": "23",
          "inputType": "text"
        },
        {
          "fieldKey": "dataPoint18",
          "label": "18",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceDays",
          "label": "出勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "dataPoint17",
          "label": "17",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeAttitudeDescription",
          "label": "※　生活態度等について日本語能力にも触れながら具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRatePercent",
          "label": "出勤率（％）",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateExample1",
          "label": "100",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateExample2",
          "label": "95.45454545454545",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateExample3",
          "label": "90.9090909090909",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateExample4",
          "label": "95.65217391304348",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateExample5",
          "label": "94.44444444444444",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingSupervisorCommentTitle",
          "label": "６．技能実習責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "absenceDays",
          "label": "欠勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "trainingSupervisorComment",
          "label": "技能実習指導員の所見にもあるとおり，当初は技能修得に伸び悩みが見られたものの，日本語能力の向上に従い，指導内容がよく理解できるようになったのか，急速に高い技能修得を見せ始め，通常であれば修得することが困難な作業も他の技能実習生よりも早く身につけるなど，その修得レベルは高く評価でき，技能実習評価試験には残念ながら不合格となったものの，日常の業務においては合格者と変わらないほどの優秀な勤務成績を示している。\n日常生活においても，特段の問題行動は見られず，むしろ，２年目を過ぎた辺りからは周囲に積極的に溶け込む姿勢を見せ始め，元来の真面目な性格もあってか，同僚や地域住民とも非常に良好な関係を築いていた。\nこれらのことから，本表の技能実習生の技能実習は成功例の一つとして高く評価できるものである。",
          "inputType": "text"
        },
        {
          "fieldKey": "paidLeaveDays",
          "label": "有休取得日数",
          "inputType": "number"
        },
        {
          "fieldKey": "year2018Label",
          "label": "2018年",
          "inputType": "text"
        },
        {
          "fieldKey": "comprehensiveEvaluationInstruction",
          "label": "※　技能等及び日本語能力の向上，生活態度等の諸状況を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrgCommentTitle",
          "label": "７．監理責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrgComment",
          "label": "１年目の定期監査時に面談した際には，まだ日本語能力や技能実習そのものに自信がうかがえず，若干，心配もしていたが，実習実施者側が述べているとおり，２年目を過ぎた頃から技能修得や日本語能力に急速な伸びを見せ始め，それが自信につながったのか，定期監査で作業現場を訪問するたびに，明るく挨拶をしてくるなど，充実した技能実習生活を送っていたものと見ている。残念ながら，技能実習評価試験には合格できなかったものの，技能実習生としての評価は非常に高い。",
          "inputType": "text"
        },
        {
          "fieldKey": "totalDays",
          "label": "合計",
          "inputType": "text"
        },
        {
          "fieldKey": "totalExample1",
          "label": "500",
          "inputType": "text"
        },
        {
          "fieldKey": "totalExample2",
          "label": "488",
          "inputType": "text"
        },
        {
          "fieldKey": "overallAttendanceRate",
          "label": "出勤率",
          "inputType": "text"
        },
        {
          "fieldKey": "overallAttendanceRateExample",
          "label": "97.6",
          "inputType": "text"
        },
        {
          "fieldKey": "overallEvaluationInstruction",
          "label": "※　上記４～６の各所見及び定期監査等における本人との面談等を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTestEvaluationTitle",
          "label": "３．技能検定・技能実習評価試験",
          "inputType": "text"
        },
        {
          "fieldKey": "testNameOrg",
          "label": "試験名・\n試験実施団体",
          "inputType": "text"
        },
        {
          "fieldKey": "declarationStatement",
          "label": "上記の内容について，事実と相違ありません。",
          "inputType": "text"
        },
        {
          "fieldKey": "testNameOrgExample",
          "label": "溶接技能評価試験（専門級）・一般社団法人　日本溶接協会",
          "inputType": "text"
        },
        {
          "fieldKey": "testDate",
          "label": "受検日",
          "inputType": "text"
        },
        {
          "fieldKey": "testResult",
          "label": "合否",
          "inputType": "text"
        },
        {
          "fieldKey": "testResultOptions",
          "label": "合格　　　　・　　　　不合格",
          "inputType": "text"
        },
        {
          "fieldKey": "testDateExample",
          "label": "平成　　３０年　　９月　　１１日",
          "inputType": "text"
        },
        {
          "fieldKey": "year2018Data",
          "label": "2018",
          "inputType": "text"
        },
        {
          "fieldKey": "reasonForNotTakingExam",
          "label": "未受検の場合は\nその理由",
          "inputType": "text"
        },
        {
          "fieldKey": "technicalInternshipSupervisorRole",
          "label": "技能実習責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorRole",
          "label": "監理責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "technicalInternshipSupervisorName",
          "label": "菊地　政幸",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorName",
          "label": "三姓　晃一",
          "inputType": "text"
        },
        {
          "fieldKey": "documentReferenceNumber",
          "label": "参考様式第１－２号",
          "inputType": "text"
        },
        {
          "fieldKey": "targetTechnicalInternSectionHeader",
          "label": "１．対象技能実習生",
          "inputType": "text"
        },
        {
          "fieldKey": "technicalInternshipInstructorCommentSectionHeader",
          "label": "４．技能実習指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "internName",
          "label": "氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "internGender",
          "label": "性別",
          "inputType": "select"
        },
        {
          "fieldKey": "technicalInternshipInstructorComment",
          "label": "所見",
          "inputType": "text"
        },
        {
          "fieldKey": "internBirthDate",
          "label": "生年月日",
          "inputType": "text"
        },
        {
          "fieldKey": "internNationality",
          "label": "国籍・地域",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganization",
          "label": "実習実施者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganization",
          "label": "監理団体",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationNote",
          "label": "※　団体監理型の場合のみ記入すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationAndTask",
          "label": "職種・作業",
          "inputType": "text"
        },
        {
          "fieldKey": "technicalSkillAcquisitionDescription",
          "label": "※　技能実習においてどのような技能を修得し、現在、何がどの程度できるか等について、日本語能力にも触れながら具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeGuidanceInstructorCommentSectionHeader",
          "label": "５．生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "technicalInternshipImplementationStatusSectionHeader",
          "label": "２．技能実習実施状況",
          "inputType": "text"
        },
        {
          "fieldKey": "yearOfEvaluation",
          "label": "20  年",
          "inputType": "text"
        },
        {
          "fieldKey": "scheduledInternshipDays",
          "label": "実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceDays",
          "label": "出勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "lifeAttitudeDescription",
          "label": "※　生活態度等について、日本語能力にも触れながら具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRatePercentage",
          "label": "出勤率（％）",
          "inputType": "text"
        },
        {
          "fieldKey": "technicalInternshipSupervisorCommentSectionHeader",
          "label": "６．技能実習責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "absenceDays",
          "label": "欠勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "paidLeaveDays",
          "label": "有休取得日数",
          "inputType": "number"
        },
        {
          "fieldKey": "overallEvaluationDescription",
          "label": "※　技能等及び日本語能力の向上、生活態度等の諸状況を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorCommentSectionHeader",
          "label": "７．監理責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "totalDays",
          "label": "合計",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceRateSummary",
          "label": "出勤率",
          "inputType": "text"
        },
        {
          "fieldKey": "paidLeaveSummary",
          "label": "有給休暇",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorOverallEvaluationDescription",
          "label": "※　上記４～６の各所見及び定期監査等における本人との面談等を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTestEvaluationExamSectionHeader",
          "label": "３．技能検定・技能実習評価試験",
          "inputType": "text"
        },
        {
          "fieldKey": "declarationStatement",
          "label": "上記の内容について、事実と相違ありません。",
          "inputType": "text"
        },
        {
          "fieldKey": "examNameAndImplementingOrganization",
          "label": "試験名・\n試験実施団体",
          "inputType": "text"
        },
        {
          "fieldKey": "declarationDate",
          "label": "年　　　月　　　日",
          "inputType": "text"
        },
        {
          "fieldKey": "examDate",
          "label": "受検日",
          "inputType": "text"
        },
        {
          "fieldKey": "examResult",
          "label": "合否",
          "inputType": "select"
        },
        {
          "fieldKey": "examResultText",
          "label": "合格　　　　・　　　　不合格",
          "inputType": "text"
        },
        {
          "fieldKey": "reasonForNotTakingExam",
          "label": "未受検の場合は\nその理由",
          "inputType": "text"
        },
        {
          "fieldKey": "technicalInternshipSupervisor",
          "label": "技能実習責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisor",
          "label": "監理責任者",
          "inputType": "text"
        }
      ]
    },
    {
      "sectionKey": "affiliatedOrganization",
      "sectionLabel": "所属機関",
      "fields": [
        {
          "fieldKey": "occupationType",
          "label": "職種・作業",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganizationName",
          "label": "有限会社　○○工業",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationName",
          "label": "△△事業協同組合",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrgNote",
          "label": "※　団体監理型の場合のみ記入すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationTypeLabel",
          "label": "職種・作業",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationType",
          "label": "溶接職種・半自動溶接",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganizationName",
          "label": "実習実施者名称",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationName",
          "label": "監理団体名称",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationNote",
          "label": "監理団体記入注意",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationType",
          "label": "職種・作業",
          "inputType": "text"
        }
      ]
    },
    {
      "sectionKey": "residenceInfo",
      "sectionLabel": "在留情報",
      "fields": [
        {
          "fieldKey": "immigrationBureauDirectorSalutation",
          "label": "出入国在留管理局長　殿",
          "inputType": "text"
        },
        {
          "fieldKey": "documentTitle",
          "label": "技　能　実　習　生　に　関　す　る　評　価　調　書",
          "inputType": "text"
        }
      ]
    }
  ],
  "computedRules": [
    {
      "targetField": "technicalInternshipReportTitle",
      "dependencies": [],
      "logic": "() => '技能実習実施状況報告書'"
    },
    {
      "targetField": "directorGeneralImmigrationBureau",
      "dependencies": [],
      "logic": "() => '入国管理局長　殿'"
    },
    {
      "targetField": "subjectTitle",
      "dependencies": [],
      "logic": "() => '１．対象者'"
    },
    {
      "targetField": "supervisingOrganizationNote",
      "dependencies": [],
      "logic": "() => '※　監理団体の名称は団体監理型の場合のみ記入すること。'"
    },
    {
      "targetField": "technicalInternshipStatusTitle",
      "dependencies": [],
      "logic": "() => '２．技能実習実施状況'"
    },
    {
      "targetField": "year2017",
      "dependencies": [],
      "logic": "() => '2017年'"
    },
    {
      "targetField": "january",
      "dependencies": [],
      "logic": "() => '１月'"
    },
    {
      "targetField": "february",
      "dependencies": [],
      "logic": "() => '２月'"
    },
    {
      "targetField": "march",
      "dependencies": [],
      "logic": "() => '３月'"
    },
    {
      "targetField": "april",
      "dependencies": [],
      "logic": "() => '４月'"
    },
    {
      "targetField": "may",
      "dependencies": [],
      "logic": "() => '５月'"
    },
    {
      "targetField": "june",
      "dependencies": [],
      "logic": "() => '６月'"
    },
    {
      "targetField": "july",
      "dependencies": [],
      "logic": "() => '７月'"
    },
    {
      "targetField": "august",
      "dependencies": [],
      "logic": "() => '８月'"
    },
    {
      "targetField": "september",
      "dependencies": [],
      "logic": "() => '９月'"
    },
    {
      "targetField": "october",
      "dependencies": [],
      "logic": "() => '１０月'"
    },
    {
      "targetField": "november",
      "dependencies": [],
      "logic": "() => '１１月'"
    },
    {
      "targetField": "december",
      "dependencies": [],
      "logic": "() => '１２月'"
    },
    {
      "targetField": "attendanceRate",
      "dependencies": [
        "attendanceDays",
        "scheduledTrainingDays"
      ],
      "logic": "(attendanceDays, scheduledTrainingDays) => { const att = Number(attendanceDays || 0); const sched = Number(scheduledTrainingDays || 0); return sched > 0 ? ((att / sched) * 100).toFixed(2) + '%' : '0.00%'; }"
    },
    {
      "targetField": "year2018",
      "dependencies": [],
      "logic": "() => '2018年'"
    },
    {
      "targetField": "totalLabel",
      "dependencies": [],
      "logic": "() => '合計'"
    },
    {
      "targetField": "overallAttendanceRateLabel",
      "dependencies": [],
      "logic": "() => '出勤率'"
    },
    {
      "targetField": "technicalInternshipInstructorCommentTitle",
      "dependencies": [],
      "logic": "() => '３．技能実習指導員の所見'"
    },
    {
      "targetField": "instructorCommentNote",
      "dependencies": [],
      "logic": "() => '※　技能実習において修得した技能等がどのように向上したかなどについて具体的に記載すること。'"
    },
    {
      "targetField": "lifeInstructorCommentTitle",
      "dependencies": [],
      "logic": "() => '４．生活指導員の所見'"
    },
    {
      "targetField": "lifeInstructorCommentNote",
      "dependencies": [],
      "logic": "() => '※　生活態度などについて具体的に記載すること。'"
    },
    {
      "targetField": "overallAttendanceRate",
      "dependencies": [
        "totalWorkingDays",
        "actualWorkingDays"
      ],
      "logic": "(totalWorkingDays, actualWorkingDays) => totalWorkingDays > 0 ? (actualWorkingDays / totalWorkingDays * 100).toFixed(2) : 0"
    },
    {
      "targetField": "attendanceRatePercent",
      "dependencies": [
        "attendanceDays",
        "scheduledTrainingDays"
      ],
      "logic": "(attendanceDays, scheduledTrainingDays) => scheduledTrainingDays > 0 ? ((attendanceDays / scheduledTrainingDays) * 100).toFixed(2) : '0.00'"
    },
    {
      "targetField": "totalDays",
      "dependencies": [
        "scheduledTrainingDays",
        "attendanceDays",
        "absenceDays",
        "paidLeaveDays"
      ],
      "logic": "(scheduledTrainingDays, attendanceDays, absenceDays, paidLeaveDays) => (Number(scheduledTrainingDays || 0) + Number(attendanceDays || 0) + Number(absenceDays || 0) + Number(paidLeaveDays || 0)).toString()"
    },
    {
      "targetField": "overallAttendanceRate",
      "dependencies": [
        "attendanceDays",
        "scheduledTrainingDays"
      ],
      "logic": "(attendanceDays, scheduledTrainingDays) => scheduledTrainingDays > 0 ? ((attendanceDays / scheduledTrainingDays) * 100).toFixed(2) : '0.00'"
    },
    {
      "targetField": "attendanceRatePercentage",
      "dependencies": [
        "attendanceDays",
        "absenceDays"
      ],
      "logic": "(attendanceDays, absenceDays) => { const totalWorkingDays = Number(attendanceDays || 0) + Number(absenceDays || 0); return totalWorkingDays > 0 ? ((Number(attendanceDays || 0) / totalWorkingDays) * 100).toFixed(2) : '0.00'; }"
    },
    {
      "targetField": "totalDays",
      "dependencies": [
        "attendanceDays",
        "absenceDays",
        "paidLeaveDays"
      ],
      "logic": "(attendanceDays, absenceDays, paidLeaveDays) => Number(attendanceDays || 0) + Number(absenceDays || 0) + Number(paidLeaveDays || 0)"
    },
    {
      "targetField": "attendanceRateSummary",
      "dependencies": [
        "attendanceDays",
        "absenceDays"
      ],
      "logic": "(attendanceDays, absenceDays) => { const totalWorkingDays = Number(attendanceDays || 0) + Number(absenceDays || 0); return totalWorkingDays > 0 ? ((Number(attendanceDays || 0) / totalWorkingDays) * 100).toFixed(2) : '0.00'; }"
    }
  ],
  "fieldMappings": {
    "身分事項 > 氏名": "qualificationInfo.internName",
    "身分事項 > 性別": "qualificationInfo.internGender",
    "身分事項 > 生年月日": "qualificationInfo.internBirthDate",
    "身分事項 > 国籍": "qualificationInfo.internNationality",
    "所属機関等 > 名称": "qualificationInfo.implementingOrganization",
    "技能実習 > 監理団体名": "qualificationInfo.supervisingOrganization",
    "評価・試験 > 技能実習指導員所見": "qualificationInfo.instructorComment",
    "評価・試験 > 申告": "qualificationInfo.declaration",
    "評価・試験 > 提出年月日": "qualificationInfo.dateOfSubmission",
    "所属機関等 > 責任者氏名": "qualificationInfo.implementingOrganizationRepresentative",
    "身分事項 > 氏名（英字）": "qualificationInfo.internNameContent",
    "所属機関等 > 実習実施者名": "affiliationInfo.implementingOrganizationName",
    "所属機関等 > 監理団体名": "qualificationInfo.supervisingOrganization",
    "技能実習 > 職種・作業": "qualificationInfo.occupationAndTask",
    "技能実習 > 出勤率（1年目）": "qualificationInfo.attendanceRateYear1",
    "技能実習 > 出勤率（2年目）": "qualificationInfo.attendanceRateYear2",
    "技能実習 > 出勤率（3年目）": "qualificationInfo.attendanceRateYear3",
    "技能実習 > 出勤率（4年目）": "qualificationInfo.attendanceRateYear4",
    "技能実習 > 出勤率（5年目）": "qualificationInfo.attendanceRateYear5",
    "技能実習 > 欠勤日数": "qualificationInfo.absenceDays",
    "技能実習 > 有休取得日数": "qualificationInfo.paidLeaveDays",
    "技能実習 > 対象年": "qualificationInfo.dataYear",
    "技能実習 > 総労働日数": "qualificationInfo.totalWorkingDays",
    "技能実習 > 実労働日数": "qualificationInfo.actualWorkingDays",
    "技能実習 > 総合出勤率": "qualificationInfo.overallAttendanceRate",
    "評価・試験 > 技能検定 > 試験名・実施団体": "qualificationInfo.skillTests[0].examNameAndOrganization",
    "評価・試験 > 技能検定 > 受検日": "qualificationInfo.skillTests[0].examDate",
    "評価・試験 > 技能検定 > 合否": "qualificationInfo.skillTests[0].examResult",
    "評価・試験 > 技能検定 > 未受検理由": "qualificationInfo.skillTests[0].reasonForNotTakingExam",
    "評価・試験 > 技能実習指導員の所見": "qualificationInfo.instructorComment",
    "評価・試験 > 生活指導員の所見": "qualificationInfo.lifeInstructorComment",
    "評価・試験 > 技能実習責任者の所見": "qualificationInfo.trainingSupervisorComment",
    "評価・試験 > 監理責任者の所見": "qualificationInfo.supervisingOrgComment",
    "評価・試験 > 事実確認": "qualificationInfo.confirmationStatement",
    "評価・試験 > 提出日": "qualificationInfo.submissionDate",
    "評価・試験 > 技能実習責任者氏名": "qualificationInfo.trainingSupervisorName",
    "評価・試験 > 監理責任者氏名": "qualificationInfo.supervisingSupervisorName",
    "評価・試験 > 試験名・試験実施団体": "qualificationInfo.testNameOrg",
    "評価・試験 > 受検日": "qualificationInfo.examDate",
    "評価・試験 > 合否": "qualificationInfo.examResult",
    "評価・試験 > 未受検理由": "qualificationInfo.reasonForNotTakingExam",
    "技能実習 > 技能実習指導員の所見": "qualificationInfo.skillInstructorComment",
    "技能実習 > 生活指導員の所見": "qualificationInfo.lifeInstructorComment",
    "技能実習 > 技能実習責任者の所見": "qualificationInfo.skillTrainingManagerComment",
    "技能実習 > 監理責任者の所見": "qualificationInfo.supervisingManagerComment",
    "技能実習 > 実習予定日数": "qualificationInfo.scheduledTrainingDays",
    "技能実習 > 出勤日数": "qualificationInfo.attendanceDays",
    "技能実習 > 出勤率": "qualificationInfo.attendanceRatePercent",
    "評価・試験 > 合否（手書き）": "qualificationInfo.examResultText",
    "所属機関等 > 技能実習責任者": "qualificationInfo.technicalInternshipSupervisor",
    "所属機関等 > 監理責任者": "qualificationInfo.supervisingSupervisor"
  }
} as const;

export type TechnicalInternEvaluationUiConfig = typeof technicalInternEvaluationUiConfig;
