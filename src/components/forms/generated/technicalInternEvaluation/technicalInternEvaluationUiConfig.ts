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
          "fieldKey": "technicalInternTrainingReportTitle",
          "label": "技能実習実施状況報告書",
          "inputType": "text"
        },
        {
          "fieldKey": "directorGeneralImmigrationSalutation",
          "label": "入国管理局長　殿",
          "inputType": "text"
        },
        {
          "fieldKey": "applicantSectionTitle",
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
          "fieldKey": "trainingImplementer",
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
          "fieldKey": "trainingStatusSectionTitle",
          "label": "２．技能実習実施状況",
          "inputType": "text"
        },
        {
          "fieldKey": "year2017Label",
          "label": "2017年",
          "inputType": "text"
        },
        {
          "fieldKey": "januaryLabel",
          "label": "１月",
          "inputType": "text"
        },
        {
          "fieldKey": "februaryLabel",
          "label": "２月",
          "inputType": "text"
        },
        {
          "fieldKey": "marchLabel",
          "label": "３月",
          "inputType": "text"
        },
        {
          "fieldKey": "aprilLabel",
          "label": "４月",
          "inputType": "text"
        },
        {
          "fieldKey": "mayLabel",
          "label": "５月",
          "inputType": "text"
        },
        {
          "fieldKey": "juneLabel",
          "label": "６月",
          "inputType": "text"
        },
        {
          "fieldKey": "julyLabel",
          "label": "７月",
          "inputType": "text"
        },
        {
          "fieldKey": "augustLabel",
          "label": "８月",
          "inputType": "text"
        },
        {
          "fieldKey": "septemberLabel",
          "label": "９月",
          "inputType": "text"
        },
        {
          "fieldKey": "octoberLabel",
          "label": "１０月",
          "inputType": "text"
        },
        {
          "fieldKey": "novemberLabel",
          "label": "１１月",
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
          "fieldKey": "year2018Label",
          "label": "2018年",
          "inputType": "text"
        },
        {
          "fieldKey": "totalLabel",
          "label": "合計",
          "inputType": "text"
        },
        {
          "fieldKey": "overallAttendanceRate",
          "label": "出勤率",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingInstructorCommentsSectionTitle",
          "label": "３．技能実習指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingInstructorComments",
          "label": "所見",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingInstructorCommentsGuidance",
          "label": "※　技能実習において修得した技能等がどのように向上したかなどについて具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentsSectionTitle",
          "label": "４．生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentsGuidance",
          "label": "※　生活態度などについて具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "declarationStatement",
          "label": "上記の内容について，事実と相違ありません。",
          "inputType": "text"
        },
        {
          "fieldKey": "declarationDate",
          "label": "平成　　　　年　　　　月　　　　日",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingImplementerResponsiblePerson",
          "label": "実習実施責任者",
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
          "fieldKey": "recipient",
          "label": "入国管理局長　殿",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeSectionTitle",
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
          "fieldKey": "traineeFullName",
          "label": "氏名（実習生）",
          "inputType": "text"
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
          "fieldKey": "traineeBirthYearSample",
          "label": "生年月日（年）サンプル",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeNationalitySample",
          "label": "国籍・地域サンプル",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingProviderLabel",
          "label": "実習実施者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationLabel",
          "label": "監理団体",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingYear",
          "label": "実習実施年",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelJan",
          "label": "１月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelFeb",
          "label": "２月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelMar",
          "label": "３月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelApr",
          "label": "４月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelMay",
          "label": "５月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelJun",
          "label": "６月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelJul",
          "label": "７月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelAug",
          "label": "８月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelSep",
          "label": "９月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelOct",
          "label": "１０月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelNov",
          "label": "１１月",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelDec",
          "label": "１２月",
          "inputType": "text"
        },
        {
          "fieldKey": "scheduledDaysLabel",
          "label": "実習予定日数",
          "inputType": "text"
        },
        {
          "fieldKey": "scheduledDaysJan",
          "label": "1月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "scheduledDaysFeb",
          "label": "2月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "scheduledDaysMar",
          "label": "3月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "scheduledDaysApr",
          "label": "4月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "scheduledDaysMay",
          "label": "5月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "scheduledDaysJun",
          "label": "6月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "attendanceDaysLabel",
          "label": "出勤日数",
          "inputType": "text"
        },
        {
          "fieldKey": "staticLabel17",
          "label": "17",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRatePercentageLabel",
          "label": "出勤率（％）",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRatePeriod1",
          "label": "100",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRatePeriod2",
          "label": "95.45454545454545",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRatePeriod3",
          "label": "90.9090909090909",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRatePeriod4",
          "label": "95.65217391304348",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRatePeriod5",
          "label": "94.44444444444444",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceYear",
          "label": "2018年",
          "inputType": "text"
        },
        {
          "fieldKey": "totalWorkingDays",
          "label": "500",
          "inputType": "text"
        },
        {
          "fieldKey": "actualWorkingDays",
          "label": "488",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateLabel",
          "label": "出勤率",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTestEvaluationHeader",
          "label": "３．技能検定・技能実習評価試験",
          "inputType": "text"
        },
        {
          "fieldKey": "testNameOrganization",
          "label": "試験名・試験実施団体",
          "inputType": "text"
        },
        {
          "fieldKey": "testNameOrganizationExample",
          "label": "溶接技能評価試験（専門級）・一般社団法人　日本溶接協会",
          "inputType": "text"
        },
        {
          "fieldKey": "testDate",
          "label": "受検日",
          "inputType": "text"
        },
        {
          "fieldKey": "passFailResult",
          "label": "合否",
          "inputType": "select"
        },
        {
          "fieldKey": "passFailOptionsLabel",
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
          "fieldKey": "instructorCommentHeader",
          "label": "４．技能実習指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "instructorCommentSubLabel",
          "label": "所見",
          "inputType": "text"
        },
        {
          "fieldKey": "instructorComment",
          "label": "入国当初は半自動アーク溶接機等の各種設備の取扱いやその簡単な整備，溶接製品の梱包等の周辺的な業務の一つ一つに戸惑いが見られ，指導員による指導もなかなか身につかないなど，初めに予定していた実習ペースの見直しも検討するほどであったが，１年目の後半に入った頃から，作業現場における日本語にも慣れてきたのか，初歩的な作業であれば，特段の注意等を行わずとも問題なく作業が行えるように成長した。\n２年目に入った頃からは，本人としても自信が芽生えてきたのか，作業に積極性が見られるようになり，通常は指導するのも困難な上向姿勢での溶接作業も他の技能実習生よりも早く習熟するなど，技能の著しい向上がうかがえるようになり，簡単な作業であれば，後輩技能実習生に助言をするほどの能力を身につけるようになった。\nそして，３年目に入ってからは，前年にも増した熱意ある技能実習への取組み姿勢が見られ，スピードや出来映えも意識した作業を行うなど，技能実習評価試験には残念ながら不合格となったものの，日常の業務においては合格者と変わらないほどの高い技能の修得を見せた。",
          "inputType": "text"
        },
        {
          "fieldKey": "instructorCommentInstruction",
          "label": "※　技能実習において修得した技能等がどのように向上したか等について具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentHeader",
          "label": "５．生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorComment",
          "label": "入国当初は日本語能力が高くなく，技能実習指導員による指導の理解も思うように進まなかったせいか，やや自信なげな様子で作業しており，その不安感やホームシックのせいか，勤務時間終了後のプライベートな時間でも口数が少なく，生活指導員としても心配をしていましたが，入国後半年を過ぎた頃から，徐々に日本語能力が上がってきたこともあり，自ら技能実習生だけでなく，日本人の同僚とも談笑をするなど，実習中やそれ以外の生活の場でも，笑顔が見せるようになってきました。今では，後輩技能実習生の悩みや相談事を受けるなど，技能実習生の中のリーダー的存在として，充実した技能実習生活を送っています。\nもともと大人しい性格であるのか，日常生活においても特段のトラブルを起こすことはなく，ゴミ出しのルール等も早くから理解し，夜中まで遊んで技能実習に支障を来すなどの問題行動も見られませんでした。２年目を過ぎた頃から，寮の近所の方とも積極的に挨拶や会話を交わすようになり，地域の夏の盆踊り大会ではやぐらの上で踊るなど，地域コミュニティーの中でもすっかり溶け込み，安心して見ていられるようになりました。",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentInstruction",
          "label": "※　生活態度等について具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisorCommentHeader",
          "label": "６．技能実習責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisorComment",
          "label": "技能実習指導員の所見にもあるとおり，当初は技能修得に伸び悩みが見られたものの，日本語能力の向上に従い，指導内容がよく理解できるようになったのか，急速に高い技能修得を見せ始め，通常であれば修得することが困難な作業も他の技能実習生よりも早く身につけるなど，その修得レベルは高く評価でき，技能実習評価試験には残念ながら不合格となったものの，日常の業務においては合格者と変わらないほどの優秀な勤務成績を示している。\n日常生活においても，特段の問題行動は見られず，むしろ，２年目を過ぎた辺りからは周囲に積極的に溶け込む姿勢を見せ始め，元来の真面目な性格もあってか，同僚や地域住民とも非常に良好な関係を築いていた。\nこれらのことから，本表の技能実習生の技能実習は成功例の一つとして高く評価できるものである。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisorCommentInstruction",
          "label": "※　技能等の向上，生活態度等の諸状況を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationCommentHeader",
          "label": "７．監理責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationComment",
          "label": "１年目の定期監査時に面談した際には，まだ日本語能力や技能実習そのものに自信がうかがえず，若干，心配もしていたが，実習実施者側が述べているとおり，２年目を過ぎた頃から技能修得や日本語能力に急速な伸びを見せ始め，それが自信につながったのか，定期監査で作業現場を訪問するたびに，明るく挨拶をしてくるなど，充実した技能実習生活を送っていたものと見ている。残念ながら，技能実習評価試験には合格できなかったものの，技能実習生としての評価は非常に高い。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationCommentInstruction",
          "label": "※　上記４～６の各所見及び定期監査等における本人との面談等を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisorSignatureLabel",
          "label": "技能実習責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationSignatureLabel",
          "label": "監理責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "evaluatorName1",
          "label": "評価者氏名１",
          "inputType": "text"
        },
        {
          "fieldKey": "evaluatorName2",
          "label": "評価者氏名２",
          "inputType": "text"
        },
        {
          "fieldKey": "recipientTitle",
          "label": "提出先",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeSectionHeader",
          "label": "対象技能実習生セクション見出し",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeName",
          "label": "氏名（入力）",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeNationalityLabel",
          "label": "国籍・地域ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "traineeBirthYearExample",
          "label": "生年（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganizationLabel",
          "label": "実習実施者ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceInfoValue18",
          "label": "18",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceInfoValue17",
          "label": "17",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateValue100",
          "label": "100",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateValue95_45",
          "label": "95.45454545454545",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateValue90_90",
          "label": "90.9090909090909",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateValue95_65",
          "label": "95.65217391304348",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRateValue94_44",
          "label": "94.44444444444444",
          "inputType": "text"
        },
        {
          "fieldKey": "totalWorkingDays2018",
          "label": "500",
          "inputType": "text"
        },
        {
          "fieldKey": "actualAttendanceDays2018",
          "label": "488",
          "inputType": "text"
        },
        {
          "fieldKey": "attendanceRate2018",
          "label": "97.6",
          "inputType": "text"
        },
        {
          "fieldKey": "testNameAndOrganization",
          "label": "試験名・\n試験実施団体",
          "inputType": "text"
        },
        {
          "fieldKey": "testNameAndOrganizationValue",
          "label": "溶接技能評価試験（専門級）・一般社団法人　日本溶接協会",
          "inputType": "text"
        },
        {
          "fieldKey": "testResultLabel",
          "label": "合否",
          "inputType": "text"
        },
        {
          "fieldKey": "testResultOptions",
          "label": "合格　　　　・　　　　不合格",
          "inputType": "text"
        },
        {
          "fieldKey": "testResult",
          "label": "合否結果",
          "inputType": "select"
        },
        {
          "fieldKey": "instructorCommentLabel",
          "label": "所見",
          "inputType": "text"
        },
        {
          "fieldKey": "instructorCommentContent",
          "label": "技能実習指導員の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "instructorCommentDescription",
          "label": "※　技能実習において修得した技能等がどのように向上したか等について具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentContent",
          "label": "生活指導員の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentDescription",
          "label": "※　生活態度等について具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisorCommentContent",
          "label": "技能実習責任者の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisorCommentDescription",
          "label": "※　技能等の向上，生活態度等の諸状況を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrgSupervisorCommentHeader",
          "label": "７．監理責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrgSupervisorCommentContent",
          "label": "監理責任者の所見内容",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrgSupervisorCommentDescription",
          "label": "※　上記４～６の各所見及び定期監査等における本人との面談等を踏まえた総合的な評価を記載すること。",
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
        },
        {
          "fieldKey": "evaluatorNameExample",
          "label": "評価者氏名（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrgRepresentativeExample",
          "label": "監理団体代表者氏名（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "submissionLocationExample",
          "label": "提出地（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "targetInternSectionHeader",
          "label": "１．対象技能実習生",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisorOpinionSectionHeader",
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
          "fieldKey": "supervisorOpinion",
          "label": "所見",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisorOpinionExampleText",
          "label": "技能実習指導員の所見（例文）",
          "inputType": "text"
        },
        {
          "fieldKey": "internNameExample",
          "label": "対象技能実習生氏名（例）",
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
          "fieldKey": "exampleBirthYear",
          "label": "生年（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "exampleNationality",
          "label": "国籍（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganization",
          "label": "実習実施者",
          "inputType": "text"
        },
        {
          "fieldKey": "skillImprovementDescriptionNote",
          "label": "技能向上記載注意",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationTaskExample",
          "label": "職種・作業（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeSupervisorOpinionSectionHeader",
          "label": "５．生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeSupervisorOpinionExampleText",
          "label": "生活指導員の所見（例文）",
          "inputType": "text"
        },
        {
          "fieldKey": "internshipStatusSectionHeader",
          "label": "２．技能実習実施状況",
          "inputType": "text"
        },
        {
          "fieldKey": "internshipStartYearExample",
          "label": "実習開始年（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "month1Label",
          "label": "１月",
          "inputType": "text"
        },
        {
          "fieldKey": "month2Label",
          "label": "２月",
          "inputType": "text"
        },
        {
          "fieldKey": "month3Label",
          "label": "３月",
          "inputType": "text"
        },
        {
          "fieldKey": "month4Label",
          "label": "４月",
          "inputType": "text"
        },
        {
          "fieldKey": "month5Label",
          "label": "５月",
          "inputType": "text"
        },
        {
          "fieldKey": "month6Label",
          "label": "６月",
          "inputType": "text"
        },
        {
          "fieldKey": "month7Label",
          "label": "７月",
          "inputType": "text"
        },
        {
          "fieldKey": "month8Label",
          "label": "８月",
          "inputType": "text"
        },
        {
          "fieldKey": "month9Label",
          "label": "９月",
          "inputType": "text"
        },
        {
          "fieldKey": "month10Label",
          "label": "１０月",
          "inputType": "text"
        },
        {
          "fieldKey": "month11Label",
          "label": "１１月",
          "inputType": "text"
        },
        {
          "fieldKey": "reasonForNotTakingExam",
          "label": "未受検の場合は\nその理由",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingSupervisorName",
          "label": "技能実習責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorName",
          "label": "監理責任者",
          "inputType": "text"
        },
        {
          "fieldKey": "signatoryKikuchiMasayuki",
          "label": "菊地　政幸",
          "inputType": "text"
        },
        {
          "fieldKey": "signatorySanjoKoichi",
          "label": "三姓　晃一",
          "inputType": "text"
        },
        {
          "fieldKey": "documentReferenceNumber",
          "label": "参考様式第１－２号",
          "inputType": "text"
        },
        {
          "fieldKey": "targetTechnicalInternSectionTitle",
          "label": "１．対象技能実習生",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingInstructorCommentSectionTitle",
          "label": "４．技能実習指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingInstructorComment",
          "label": "所見",
          "inputType": "text"
        },
        {
          "fieldKey": "nationalityRegion",
          "label": "国籍・地域",
          "inputType": "text"
        },
        {
          "fieldKey": "noteSupervisingOrganization",
          "label": "※　団体監理型の場合のみ記入すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationWork",
          "label": "職種・作業",
          "inputType": "text"
        },
        {
          "fieldKey": "noteSkillTrainingInstructorComment",
          "label": "※　技能実習においてどのような技能を修得し、現在、何がどの程度できるか等について、日本語能力にも触れながら具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "lifeInstructorCommentSectionTitle",
          "label": "５．生活指導員の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingStatusSectionTitle",
          "label": "２．技能実習実施状況",
          "inputType": "text"
        },
        {
          "fieldKey": "reportYear",
          "label": "20 年",
          "inputType": "text"
        },
        {
          "fieldKey": "noteLifeInstructorComment",
          "label": "※　生活態度等について、日本語能力にも触れながら具体的に記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTrainingSupervisorCommentSectionTitle",
          "label": "６．技能実習責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "absenceDays",
          "label": "欠勤日数",
          "inputType": "number"
        },
        {
          "fieldKey": "noteSkillTrainingSupervisorComment",
          "label": "※　技能等及び日本語能力の向上、生活態度等の諸状況を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingSupervisorCommentSectionTitle",
          "label": "７．監理責任者の所見",
          "inputType": "text"
        },
        {
          "fieldKey": "totalDays",
          "label": "合計",
          "inputType": "number"
        },
        {
          "fieldKey": "paidLeaveLabel",
          "label": "有給休暇",
          "inputType": "text"
        },
        {
          "fieldKey": "noteSupervisingSupervisorComment",
          "label": "※　上記４～６の各所見及び定期監査等における本人との面談等を踏まえた総合的な評価を記載すること。",
          "inputType": "text"
        },
        {
          "fieldKey": "skillTestEvaluationExamSectionTitle",
          "label": "３．技能検定・技能実習評価試験",
          "inputType": "text"
        },
        {
          "fieldKey": "examNameImplementingOrganization",
          "label": "試験名・\n試験実施団体",
          "inputType": "text"
        },
        {
          "fieldKey": "evaluationDate",
          "label": "年　　　月　　　日",
          "inputType": "text"
        },
        {
          "fieldKey": "examDate",
          "label": "受検日",
          "inputType": "text"
        },
        {
          "fieldKey": "passFailResultCode",
          "label": "合否",
          "inputType": "select"
        },
        {
          "fieldKey": "passFailResultText",
          "label": "合否結果",
          "inputType": "text"
        }
      ]
    },
    {
      "sectionKey": "affiliationInfo",
      "sectionLabel": "所属機関",
      "fields": [
        {
          "fieldKey": "trainingProviderName",
          "label": "実習実施者名",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationName",
          "label": "監理団体名",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationNote",
          "label": "監理団体記入注意書き",
          "inputType": "text"
        },
        {
          "fieldKey": "jobTypeLabel",
          "label": "職種・作業",
          "inputType": "text"
        },
        {
          "fieldKey": "jobTypeName",
          "label": "職種・作業名",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganizationName",
          "label": "実習実施者名",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationTypeLabel",
          "label": "職種・作業ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationType",
          "label": "職種・作業（入力）",
          "inputType": "text"
        },
        {
          "fieldKey": "implementingOrganizationExample",
          "label": "実習実施者（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrganizationExample",
          "label": "監理団体（例）",
          "inputType": "text"
        },
        {
          "fieldKey": "supervisingOrgNote",
          "label": "監理団体記入注意",
          "inputType": "text"
        },
        {
          "fieldKey": "occupationTask",
          "label": "職種・作業",
          "inputType": "text"
        }
      ]
    },
    {
      "sectionKey": "trainingStatus",
      "sectionLabel": "技能実習実施状況",
      "fields": [
        {
          "fieldKey": "trainingStatusSectionHeader",
          "label": "技能実習実施状況セクション見出し",
          "inputType": "text"
        },
        {
          "fieldKey": "trainingYear",
          "label": "実習実施年",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelJan",
          "label": "１月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelFeb",
          "label": "２月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelMar",
          "label": "３月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelApr",
          "label": "４月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelMay",
          "label": "５月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelJun",
          "label": "６月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelJul",
          "label": "７月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelAug",
          "label": "８月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelSep",
          "label": "９月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelOct",
          "label": "１０月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelNov",
          "label": "１１月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "monthLabelDec",
          "label": "１２月ラベル",
          "inputType": "text"
        },
        {
          "fieldKey": "totalScheduledTrainingDays",
          "label": "実習予定日数（合計）",
          "inputType": "number"
        },
        {
          "fieldKey": "januaryScheduledDays",
          "label": "1月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "februaryScheduledDays",
          "label": "2月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "marchScheduledDays",
          "label": "3月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "aprilScheduledDays",
          "label": "4月の実習予定日数",
          "inputType": "number"
        },
        {
          "fieldKey": "mayScheduledDays",
          "label": "5月の実習予定日数",
          "inputType": "number"
        }
      ]
    },
    {
      "sectionKey": "residenceInfo",
      "sectionLabel": "在留情報",
      "fields": [
        {
          "fieldKey": "addresseeImmigrationBureauDirector",
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
      "targetField": "attendanceRate",
      "dependencies": [
        "scheduledTrainingDays",
        "attendanceDays"
      ],
      "logic": "(scheduledTrainingDays, attendanceDays) => { const s = Number(scheduledTrainingDays); const a = Number(attendanceDays); return s > 0 ? ((a / s) * 100).toFixed(2) + '%' : '0.00%'; }"
    },
    {
      "targetField": "overallAttendanceRate",
      "dependencies": [
        "scheduledTrainingDays",
        "attendanceDays"
      ],
      "logic": "(scheduledTrainingDays, attendanceDays) => { const s = Number(scheduledTrainingDays); const a = Number(attendanceDays); return s > 0 ? ((a / s) * 100).toFixed(2) + '%' : '0.00%'; }"
    },
    {
      "targetField": "documentTitle",
      "dependencies": [],
      "logic": "() => \"技能実習生に関する評価調書\""
    },
    {
      "targetField": "recipient",
      "dependencies": [],
      "logic": "() => \"入国管理局長　殿\""
    },
    {
      "targetField": "traineeSectionTitle",
      "dependencies": [],
      "logic": "() => \"１．対象技能実習生\""
    },
    {
      "targetField": "traineeNameLabel",
      "dependencies": [],
      "logic": "() => \"氏名\""
    },
    {
      "targetField": "traineeBirthYearSample",
      "dependencies": [
        "traineeBirthDate"
      ],
      "logic": "(traineeBirthDate) => traineeBirthDate ? traineeBirthDate.substring(0, 4) : null"
    },
    {
      "targetField": "traineeNationalitySample",
      "dependencies": [
        "traineeNationality"
      ],
      "logic": "(traineeNationality) => traineeNationality || null"
    },
    {
      "targetField": "trainingProviderLabel",
      "dependencies": [],
      "logic": "() => \"実習実施者\""
    },
    {
      "targetField": "supervisingOrganizationLabel",
      "dependencies": [],
      "logic": "() => \"監理団体\""
    },
    {
      "targetField": "monthLabelJan",
      "dependencies": [],
      "logic": "() => \"１月\""
    },
    {
      "targetField": "monthLabelFeb",
      "dependencies": [],
      "logic": "() => \"２月\""
    },
    {
      "targetField": "monthLabelMar",
      "dependencies": [],
      "logic": "() => \"３月\""
    },
    {
      "targetField": "monthLabelApr",
      "dependencies": [],
      "logic": "() => \"４月\""
    },
    {
      "targetField": "monthLabelMay",
      "dependencies": [],
      "logic": "() => \"５月\""
    },
    {
      "targetField": "monthLabelJun",
      "dependencies": [],
      "logic": "() => \"６月\""
    },
    {
      "targetField": "monthLabelJul",
      "dependencies": [],
      "logic": "() => \"７月\""
    },
    {
      "targetField": "monthLabelAug",
      "dependencies": [],
      "logic": "() => \"８月\""
    },
    {
      "targetField": "monthLabelSep",
      "dependencies": [],
      "logic": "() => \"９月\""
    },
    {
      "targetField": "monthLabelOct",
      "dependencies": [],
      "logic": "() => \"１０月\""
    },
    {
      "targetField": "monthLabelNov",
      "dependencies": [],
      "logic": "() => \"１１月\""
    },
    {
      "targetField": "monthLabelDec",
      "dependencies": [],
      "logic": "() => \"１２月\""
    },
    {
      "targetField": "scheduledDaysLabel",
      "dependencies": [],
      "logic": "() => \"実習予定日数\""
    },
    {
      "targetField": "attendanceDaysLabel",
      "dependencies": [],
      "logic": "() => \"出勤日数\""
    },
    {
      "targetField": "attendanceRate2018",
      "dependencies": [
        "totalWorkingDays2018",
        "actualAttendanceDays2018"
      ],
      "logic": "(totalDays, actualDays) => { const t = Number(totalDays || 0); const a = Number(actualDays || 0); return t > 0 ? ((a / t) * 100).toFixed(1) : '0.0'; }"
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
      "targetField": "passFailResultText",
      "dependencies": [
        "passFailResultCode"
      ],
      "logic": "(passFailResultCode) => passFailResultCode === '1' ? '合格' : (passFailResultCode === '2' ? '不合格' : '')"
    },
    {
      "targetField": "supervisingOrganizationNote",
      "dependencies": [],
      "logic": "() => \"※　団体監理型の場合のみ記入すること。\""
    },
    {
      "targetField": "jobTypeLabel",
      "dependencies": [],
      "logic": "() => \"職種・作業\""
    },
    {
      "targetField": "totalScheduledTrainingDays",
      "dependencies": [
        "januaryScheduledDays",
        "februaryScheduledDays",
        "marchScheduledDays",
        "aprilScheduledDays",
        "mayScheduledDays"
      ],
      "logic": "(jan, feb, mar, apr, may) => Number(jan || 0) + Number(feb || 0) + Number(mar || 0) + Number(apr || 0) + Number(may || 0)"
    }
  ],
  "fieldMappings": {
    "身分事項 > 氏名": "qualificationInfo.name",
    "身分事項 > 性別": "qualificationInfo.gender",
    "身分事項 > 生年月日": "qualificationInfo.birthDate",
    "身分事項 > 国籍": "qualificationInfo.nationalityRegion",
    "所属機関等 > 実習実施者": "qualificationInfo.implementingOrganization",
    "所属機関等 > 監理団体": "qualificationInfo.supervisingOrganization",
    "技能実習 > 技能実習指導員の所見": "qualificationInfo.trainingInstructorComments",
    "所属機関等 > 実習実施責任者": "qualificationInfo.trainingImplementerResponsiblePerson",
    "身分事項 > 氏名（英字）": "qualificationInfo.traineeName",
    "所属機関等 > 実習実施機関名": "affiliationInfo.implementingOrganizationName",
    "所属機関等 > 監理団体名": "affiliationInfo.supervisingOrganizationName",
    "技能実習 > 職種・作業": "qualificationInfo.occupationWork",
    "評価・試験 > 出勤率（％）_期間1": "qualificationInfo.attendanceRatePeriod1",
    "評価・試験 > 出勤率（％）_期間2": "qualificationInfo.attendanceRatePeriod2",
    "評価・試験 > 出勤率（％）_期間3": "qualificationInfo.attendanceRatePeriod3",
    "評価・試験 > 出勤率（％）_期間4": "qualificationInfo.attendanceRatePeriod4",
    "評価・試験 > 出勤率（％）_期間5": "qualificationInfo.attendanceRatePeriod5",
    "評価・試験 > 欠勤日数": "qualificationInfo.absentDays",
    "評価・試験 > 有休取得日数": "qualificationInfo.paidLeaveDays",
    "評価・試験 > 出勤記録年": "qualificationInfo.attendanceYear",
    "評価・試験 > 総労働日数": "qualificationInfo.totalWorkingDays",
    "評価・試験 > 実労働日数": "qualificationInfo.actualWorkingDays",
    "評価・試験 > 全体出勤率": "qualificationInfo.overallAttendanceRate",
    "評価・試験 > 試験名・試験実施団体": "qualificationInfo.testNameOrganization",
    "評価・試験 > 受検日": "qualificationInfo.examDate",
    "評価・試験 > 合否": "qualificationInfo.passFailResultCode",
    "評価・試験 > 受検年": "qualificationInfo.testYear",
    "評価・試験 > 未受検理由": "qualificationInfo.reasonForNotTakingExam",
    "評価・試験 > 技能実習指導員の所見": "qualificationInfo.supervisorOpinion",
    "評価・試験 > 生活指導員の所見": "qualificationInfo.lifeInstructorComment",
    "評価・試験 > 技能実習責任者の所見": "qualificationInfo.supervisorComment",
    "評価・試験 > 監理責任者の所見": "qualificationInfo.supervisingOrganizationComment",
    "評価・試験 > 申告内容": "qualificationInfo.declarationStatement",
    "評価・試験 > 申告日": "qualificationInfo.declarationDate",
    "評価・試験 > 技能実習責任者署名": "qualificationInfo.supervisorSignatureLabel",
    "評価・試験 > 監理責任者署名": "qualificationInfo.supervisingOrganizationSignatureLabel",
    "評価・試験 > 試験名・実施団体": "qualificationInfo.examNameImplementingOrganization",
    "技能実習 > 指導員所見": "qualificationInfo.instructorCommentContent",
    "技能実習 > 生活指導員所見": "qualificationInfo.lifeInstructorCommentContent",
    "技能実習 > 責任者所見": "qualificationInfo.supervisorCommentContent",
    "技能実習 > 監理責任者所見": "qualificationInfo.supervisingOrgSupervisorCommentContent",
    "技能実習 > 技能実習責任者": "qualificationInfo.technicalInternshipSupervisor",
    "技能実習 > 監理責任者": "qualificationInfo.supervisingSupervisor",
    "技能実習 > 実習予定日数": "qualificationInfo.scheduledTrainingDays",
    "技能実習 > 出勤日数": "qualificationInfo.attendanceDays",
    "技能実習 > 欠勤日数": "qualificationInfo.absenceDays",
    "技能実習 > 有休取得日数": "qualificationInfo.paidLeaveDays",
    "技能実習 > 出勤率": "qualificationInfo.attendanceRate",
    "評価・試験 > 評価年月日": "qualificationInfo.evaluationDate",
    "所属機関等 > 技能実習責任者": "qualificationInfo.technicalInternshipSupervisor",
    "所属機関等 > 監理責任者": "qualificationInfo.supervisingSupervisor"
  }
} as const;

export type TechnicalInternEvaluationUiConfig = typeof technicalInternEvaluationUiConfig;
