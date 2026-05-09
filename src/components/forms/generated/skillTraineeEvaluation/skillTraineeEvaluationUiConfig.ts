/**
 * 技能実習生に関する評価調書 — Schema-Driven UI Config
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されました。
 * ※ UIの描画順序や自動計算ロジック（computedRules）を定義しています。
 */

export const skillTraineeEvaluationUiConfig = {
  "formKey": "skillTraineeEvaluation",
  "formName": "技能実習生に関する評価調書",
  "sections": [
    {
      "sectionKey": "formInfo",
      "sectionLabel": "フォーム情報",
      "fields": [
        {
          "fieldKey": "formReferenceNumber",
          "label": "参考様式第１－２号",
          "inputType": "text"
        },
        {
          "fieldKey": "immigrationBureauChief",
          "label": "出入国在留管理局長　殿",
          "inputType": "text"
        },
        {
          "fieldKey": "evaluationFormTitle",
          "label": "技能実習生に関する評価調書",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTraineeReportTitle",
          "label": "技能実習実施状況報告書",
          "inputType": "text"
        },
        {
          "fieldKey": "location",
          "label": "提出地",
          "inputType": "text"
        }
      ]
    },
    {
      "sectionKey": "traineeInfo",
      "sectionLabel": "１．対象技能実習生",
      "fields": [
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
          "fieldKey": "occupationType",
          "label": "職種・作業",
          "inputType": "text"
        }
      ]
    },
    {
      "sectionKey": "trainingStatus",
      "sectionLabel": "２．技能実習実施状況",
      "fields": [
        {
          "fieldKey": "trainingYear",
          "label": "対象年",
          "inputType": "number"
        },
        {
          "fieldKey": "monthlyReports",
          "label": "月別実習状況",
          "inputType": "number"
        },
        {
          "fieldKey": "totalScheduledDays",
          "label": "合計 実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "totalAttendanceDays",
          "label": "合計 出勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "totalAttendanceRate",
          "label": "合計 出勤率",
          "inputType": "text"
        },
        {
          "fieldKey": "totalAbsentDays",
          "label": "合計 欠勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "totalPaidLeaveDays",
          "label": "合計 有給取得日数",
          "inputType": "number"
        }
      ]
    },
    {
      "sectionKey": "skillTestInfo",
      "sectionLabel": "３．技能検定・技能実習評価試験",
      "fields": [
        {
          "fieldKey": "skillTestNameAndOrganization",
          "label": "試験名・試験実施団体",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTestDate",
          "label": "受検日",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTestResult",
          "label": "合否",
          "inputType": "select"
        },
        {
          "fieldKey": "skillTestReasonNotTaken",
          "label": "未受検の場合はその理由",
          "inputType": "text"
        }
      ]
    },
    {
      "sectionKey": "opinions",
      "sectionLabel": "所見",
      "fields": [
        {
          "fieldKey": "skillInstructorOpinion",
          "label": "技能実習指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorOpinion",
          "label": "生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "skillSupervisorOpinion",
          "label": "技能実習責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorOpinion",
          "label": "監理責任者の所見",
          "inputType": "text"
        }
      ]
    },
    {
      "sectionKey": "declaration",
      "sectionLabel": "申告",
      "fields": [
        {
          "fieldKey": "submissionDate",
          "label": "提出日",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingSupervisorSignatoryName",
          "label": "実習実施責任者 氏名",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorSignatoryName",
          "label": "監理責任者 氏名",
          "inputType": "text"
        }
      ]
    }
  ],
  "computedRules": [
    {
      "targetField": "totalScheduledDays",
      "dependencies": [
        "monthlyReports"
      ],
      "logic": "(monthlyReports) => monthlyReports.reduce((sum, m) => sum + (Number(m.scheduledDays) || 0), 0)"
    },
    {
      "targetField": "totalAttendanceDays",
      "dependencies": [
        "monthlyReports"
      ],
      "logic": "(monthlyReports) => monthlyReports.reduce((sum, m) => sum + (Number(m.attendanceDays) || 0), 0)"
    },
    {
      "targetField": "totalAttendanceRate",
      "dependencies": [
        "totalScheduledDays",
        "totalAttendanceDays"
      ],
      "logic": "(totalScheduledDays, totalAttendanceDays) => totalScheduledDays > 0 ? ((totalAttendanceDays / totalScheduledDays) * 100).toFixed(2) : '0.00'"
    },
    {
      "targetField": "totalAbsentDays",
      "dependencies": [
        "monthlyReports"
      ],
      "logic": "(monthlyReports) => monthlyReports.reduce((sum, m) => sum + (Number(m.absentDays) || 0), 0)"
    },
    {
      "targetField": "totalPaidLeaveDays",
      "dependencies": [
        "monthlyReports"
      ],
      "logic": "(monthlyReports) => monthlyReports.reduce((sum, m) => sum + (Number(m.paidLeaveDays) || 0), 0)"
    }
  ],
  "fieldMappings": {
    "身分事項 > 氏名": "traineeInfo.traineeName",
    "身分事項 > 氏名（英字）": "traineeInfo.traineeName",
    "身分事項 > 氏名（母国語/漢字）": "traineeInfo.traineeName",
    "身分事項 > 性別": "traineeInfo.traineeGender",
    "身分事項 > 生年月日": "traineeInfo.traineeBirthDate",
    "身分事項 > 国籍": "traineeInfo.traineeNationality",
    "身分事項 > 国籍・地域": "traineeInfo.traineeNationality",
    "所属機関等 > 勤務先名称": "traineeInfo.implementingOrganizationName",
    "所属機関等 > 実習実施者": "traineeInfo.implementingOrganizationName",
    "技能実習 > 監理団体": "traineeInfo.supervisingOrganizationName",
    "技能実習 > 職種・作業": "traineeInfo.occupationType",
    "評価・試験 > 試験名": "skillTestInfo.skillTestNameAndOrganization",
    "評価・試験 > 試験実施団体": "skillTestInfo.skillTestNameAndOrganization",
    "評価・試験 > 受検日": "skillTestInfo.skillTestDate",
    "評価・試験 > 合否": "skillTestInfo.skillTestResult"
  }
} as const;

export type SkillTraineeEvaluationUiConfig = typeof skillTraineeEvaluationUiConfig;
