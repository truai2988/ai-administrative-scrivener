import { RenewalApplicationForm } from '@/types/renewalApplication';
import {
  boolToYesNo,
  formatDateToYYYYMMDD,
  formatZipCode,
  formatPhoneNumber,
  createCsvString,
} from './csvUtils';
import { SPECIFIC_HEADERS } from './specificHeaders';

/**
 * 申請情報入力(区分V).csv のデータを生成します。
 * 対象となる項目数は全264項目（インデックス 0〜263）です。
 * 
 * @param data - RenewalApplicationForm (申請フォームの全データ)
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateSpecificCsv = (data: RenewalApplicationForm): string => {
  const f = data.foreignerInfo;
  const emp = data.employerInfo;

  // 264個の要素を持つ配列を生成
  const row: string[] = new Array(264).fill('');

  // 0〜7: 技能水準
  row[0] = f.skillCertifications?.[0]?.method === 'exam' ? '試験合格' : '';
  row[1] = f.skillCertifications?.[0]?.examName || '';
  row[2] = f.skillCertifications?.[0]?.examLocation || '';
  row[3] = f.skillCertifications?.[1]?.examName || '';
  row[4] = f.skillCertifications?.[1]?.examLocation || '';
  row[5] = f.skillCertifications?.[2]?.examName || '';
  row[6] = f.skillCertifications?.[2]?.examLocation || '';
  row[7] = f.otherSkillCert || '';

  // 8〜15: 日本語能力
  row[8] = f.languageCertifications?.[0]?.method === 'exam' ? '試験合格' : '';
  row[9] = f.languageCertifications?.[0]?.examName || '';
  row[10] = f.languageCertifications?.[0]?.examLocation || '';
  row[11] = f.languageCertifications?.[1]?.examName || '';
  row[12] = f.languageCertifications?.[1]?.examLocation || '';
  row[13] = f.languageCertifications?.[2]?.examName || '';
  row[14] = f.languageCertifications?.[2]?.examLocation || '';
  row[15] = f.otherLanguageCert || '';

  // 16〜21: 良好に修了した技能実習2号 (UIスキーマに詳細プロパティなし)
  row[16] = '';
  row[17] = '';
  row[18] = '';
  row[19] = '';
  row[20] = '';
  row[21] = '';

  // 22〜23: 特定技能1号での通算在留期間
  row[22] = f.totalSpecificSkillStayYears !== undefined ? String(f.totalSpecificSkillStayYears) : '';
  row[23] = f.totalSpecificSkillStayMonths !== undefined ? String(f.totalSpecificSkillStayMonths) : '';

  // 24〜26: 保証金の徴収等
  row[24] = f.depositCharged !== undefined ? boolToYesNo(f.depositCharged) : '';
  row[25] = f.depositOrganizationName || '';
  row[26] = f.depositAmount !== undefined ? String(f.depositAmount) : '';

  // 27〜29: 外国の機関への費用支払等
  row[27] = f.feeCharged !== undefined ? boolToYesNo(f.feeCharged) : '';
  row[28] = f.foreignOrganizationName || '';
  row[29] = f.feeAmount !== undefined ? String(f.feeAmount) : '';

  // 30〜33: その他宣誓等のチェックボックス (UI未定義)
  row[30] = '';
  row[31] = '';
  row[32] = '';
  row[33] = '';

  // 34〜64: 職歴 (最大10枠)
  row[34] = emp.hasJobHistory !== undefined ? boolToYesNo(emp.hasJobHistory) : '';
  for (let i = 0; i < 10; i++) {
    const job = emp.jobHistory?.[i];
    row[35 + i * 3] = job ? job.startDate : '';
    row[36 + i * 3] = job ? (job.endDate || '') : '';
    row[37 + i * 3] = job ? job.companyName : '';
  }

  // 65〜72: 代理人
  row[65] = emp.agent?.name || '';
  row[66] = emp.agent?.relationship || '';
  row[67] = formatZipCode(emp.agent?.zipCode);
  row[68] = emp.agent?.addressPref || '';
  row[69] = emp.agent?.addressCity || '';
  row[70] = emp.agent?.addressStreet || '';
  row[71] = formatPhoneNumber(emp.agent?.phone);
  row[72] = formatPhoneNumber(emp.agent?.mobile);

  // 73〜79: 取次者
  row[73] = emp.intermediary?.name || '';
  row[74] = formatZipCode(emp.intermediary?.zipCode);
  row[75] = emp.intermediary?.addressPref || '';
  row[76] = emp.intermediary?.addressCity || '';
  row[77] = emp.intermediary?.addressStreet || '';
  row[78] = emp.intermediary?.organization || '';
  row[79] = formatPhoneNumber(emp.intermediary?.phone);

  // 80〜81: 雇用契約期間
  row[80] = formatDateToYYYYMMDD(emp.contractStartDate);
  row[81] = formatDateToYYYYMMDD(emp.contractEndDate);

  // 82〜87: 特定産業分野と業務区分 (最大3枠)
  row[82] = emp.industryFields?.[0] || '';
  row[83] = emp.jobCategories?.[0] || '';
  row[84] = emp.industryFields?.[1] || '';
  row[85] = emp.jobCategories?.[1] || '';
  row[86] = emp.industryFields?.[2] || '';
  row[87] = emp.jobCategories?.[2] || '';

  // 88〜91: 職種
  row[88] = emp.mainJobType || '';
  row[89] = emp.otherJobTypes?.[0] || '';
  row[90] = emp.otherJobTypes?.[1] || '';
  row[91] = emp.otherJobTypes?.[2] || '';

  // 92〜94: 労働時間
  row[92] = emp.weeklyWorkHours !== undefined ? String(emp.weeklyWorkHours) : '';
  row[93] = emp.monthlyWorkHours !== undefined ? String(emp.monthlyWorkHours) : '';
  row[94] = emp.equivalentWorkHours !== undefined ? boolToYesNo(emp.equivalentWorkHours) : '';

  // 95〜99: 報酬と支払方法
  row[95] = emp.monthlySalary !== undefined ? String(emp.monthlySalary) : '';
  row[96] = emp.hourlyRate !== undefined ? String(emp.hourlyRate) : '';
  row[97] = emp.japaneseMonthlySalary !== undefined ? String(emp.japaneseMonthlySalary) : '';
  row[98] = emp.equivalentSalary !== undefined ? boolToYesNo(emp.equivalentSalary) : '';
  row[99] = emp.paymentMethod === 'bank_transfer' ? '銀行振込' : emp.paymentMethod === 'cash' ? '現金持参' : '';

  // 100〜101: 待遇の差
  row[100] = emp.hasDifferentTreatment !== undefined ? boolToYesNo(emp.hasDifferentTreatment) : '';
  row[101] = emp.differentTreatmentDetail || '';

  // 102〜106: 特定技能基準等の誓約 (UI未定義)
  row[102] = '';
  row[103] = '';
  row[104] = '';
  row[105] = '';
  row[106] = '';

  // 107〜118: 派遣先 (UI未定義)
  row[107] = '';
  row[108] = '';
  row[109] = '';
  row[110] = '';
  row[111] = '';
  row[112] = '';
  row[113] = '';
  row[114] = '';
  row[115] = '';
  row[116] = '';
  row[117] = '';
  row[118] = '';

  // 119〜129: 職業紹介事業者 (UI未定義)
  row[119] = '';
  row[120] = '';
  row[121] = '';
  row[122] = '';
  row[123] = '';
  row[124] = '';
  row[125] = '';
  row[126] = '';
  row[127] = '';
  row[128] = '';
  row[129] = '';

  // 130〜136: 取次機関 (UI未定義)
  row[130] = '';
  row[131] = '';
  row[132] = '';
  row[133] = '';
  row[134] = '';
  row[135] = '';
  row[136] = '';

  // 137〜140: 所属機関（法人等）基本情報
  row[137] = emp.companyNameJa || '';
  row[138] = emp.hasCorporateNumber !== undefined ? boolToYesNo(emp.hasCorporateNumber) : '';
  row[139] = emp.corporateNumber || '';
  row[140] = emp.employmentInsuranceNumber || '';

  // 141〜146: 所属機関 業種 (UI未定義)
  row[141] = '';
  row[142] = '';
  row[143] = '';
  row[144] = '';
  row[145] = '';
  row[146] = '';

  // 147〜151: 所属機関 所在地・電話
  row[147] = formatZipCode(emp.companyZipCode);
  row[148] = emp.companyPref || '';
  row[149] = emp.companyCity || '';
  row[150] = emp.companyAddressLines || '';
  row[151] = formatPhoneNumber(emp.companyPhone);

  // 152〜155: 資本金、売上等
  row[152] = emp.capital !== undefined ? String(emp.capital) : '';
  row[153] = emp.annualRevenue !== undefined ? String(emp.annualRevenue) : '';
  row[154] = emp.employeeCount !== undefined ? String(emp.employeeCount) : '';
  row[155] = emp.representativeName || '';

  // 156〜160: 勤務事業所所在地
  row[156] = emp.workplaceName || '';
  row[157] = formatZipCode(emp.workplaceZipCode);
  row[158] = emp.workplacePref || '';
  row[159] = emp.workplaceCity || '';
  row[160] = emp.workplaceAddressLines || '';

  // 161〜163: 保険適用状況
  row[161] = emp.isSocialInsuranceApplicable !== undefined ? boolToYesNo(emp.isSocialInsuranceApplicable) : '';
  row[162] = emp.isLaborInsuranceApplicable !== undefined ? boolToYesNo(emp.isLaborInsuranceApplicable) : '';
  row[163] = emp.laborInsuranceNumber || '';

  // 164〜208: コンプライアンス・誓約関連 (大部分はUI未定義)
  row[164] = emp.complianceOaths?.hadLaborLawPenalty !== undefined ? boolToYesNo(emp.complianceOaths.hadLaborLawPenalty) : '';
  row[165] = '';
  row[166] = emp.complianceOaths?.hadIllegalDismissal !== undefined ? boolToYesNo(emp.complianceOaths.hadIllegalDismissal) : '';
  row[167] = '';
  row[168] = emp.complianceOaths?.hadMissingPersons !== undefined ? boolToYesNo(emp.complianceOaths.hadMissingPersons) : '';
  // 以降、残りのチェックボックス群はUI未定義のため空文字
  for (let i = 169; i <= 208; i++) {
    row[i] = '';
  }

  // 209: 登録支援機関への全部委託
  row[209] = emp.delegateSupportEntirely !== undefined ? boolToYesNo(emp.delegateSupportEntirely) : '';

  // 210〜215: 支援責任者等
  row[210] = emp.supportPersonnel?.supervisorName || '';
  row[211] = emp.supportPersonnel?.supervisorTitle || '';
  row[212] = ''; // 役職員の中から支援責任者を選任しているか (UI未定義)
  row[213] = emp.supportPersonnel?.officerName || '';
  row[214] = emp.supportPersonnel?.officerTitle || '';
  row[215] = ''; // 1名以上の支援担当者を選任か (UI未定義)

  // 216〜227: 支援業務の適正実施等 (一部UI定義あり)
  row[216] = ''; // (35) 次のいずれかに該当することの有無
  row[217] = emp.supportCapability?.hasExperience !== undefined ? boolToYesNo(emp.supportCapability.hasExperience) : '';
  row[218] = emp.supportCapability?.hasCounselor !== undefined ? boolToYesNo(emp.supportCapability.hasCounselor) : '';
  row[219] = ''; // (35)(3) その他事情の有無
  row[220] = ''; // (35)(3) 内容
  row[221] = emp.supportCapability?.canCommunicateInLanguage !== undefined ? boolToYesNo(emp.supportCapability.canCommunicateInLanguage) : '';
  row[222] = '';
  row[223] = '';
  row[224] = '';
  row[225] = '';
  row[226] = '';
  row[227] = '';

  // 228〜241: 支援計画の実施項目
  row[228] = emp.supportPlanItems?.airportPickUp !== undefined ? boolToYesNo(emp.supportPlanItems.airportPickUp) : '';
  row[229] = emp.supportPlanItems?.housingSupport !== undefined ? boolToYesNo(emp.supportPlanItems.housingSupport) : '';
  row[230] = emp.supportPlanItems?.contractSupport !== undefined ? boolToYesNo(emp.supportPlanItems.contractSupport) : '';
  row[231] = emp.supportPlanItems?.orientation !== undefined ? boolToYesNo(emp.supportPlanItems.orientation) : '';
  row[232] = emp.supportPlanItems?.publicProcedures !== undefined ? boolToYesNo(emp.supportPlanItems.publicProcedures) : '';
  row[233] = emp.supportPlanItems?.japaneseLearning !== undefined ? boolToYesNo(emp.supportPlanItems.japaneseLearning) : '';
  row[234] = emp.supportPlanItems?.consultation !== undefined ? boolToYesNo(emp.supportPlanItems.consultation) : '';
  row[235] = emp.supportPlanItems?.culturalExchange !== undefined ? boolToYesNo(emp.supportPlanItems.culturalExchange) : '';
  row[236] = emp.supportPlanItems?.careerSupport !== undefined ? boolToYesNo(emp.supportPlanItems.careerSupport) : '';
  row[237] = emp.supportPlanItems?.regularMeetings !== undefined ? boolToYesNo(emp.supportPlanItems.regularMeetings) : '';
  row[238] = ''; // (11) 写し交付 (UI未定義)
  row[239] = ''; // (12) 特有事情 (UI未定義)
  row[240] = ''; // (13) 適正在留に資するか (UI未定義)
  row[241] = ''; // (14) 告示適合 (UI未定義)

  // 242〜263: 登録支援機関
  row[242] = emp.supportAgency?.name || '';
  row[243] = emp.supportAgency?.hasCorporateNumber !== undefined ? boolToYesNo(emp.supportAgency.hasCorporateNumber) : '';
  row[244] = emp.supportAgency?.corporateNumber || '';
  row[245] = emp.supportAgency?.employmentInsuranceNumber || '';
  row[246] = formatZipCode(emp.supportAgency?.zipCode);
  row[247] = emp.supportAgency?.addressPref || '';
  row[248] = emp.supportAgency?.addressCity || '';
  row[249] = emp.supportAgency?.addressStreet || '';
  row[250] = formatPhoneNumber(emp.supportAgency?.phone);
  row[251] = emp.supportAgency?.representativeName || '';
  row[252] = emp.supportAgency?.registrationNumber || '';
  row[253] = formatDateToYYYYMMDD(emp.supportAgency?.registrationDate);
  row[254] = emp.supportAgency?.officeName || '';
  row[255] = ''; // 支援事業所の所在地(UI統合のためスキップ)
  row[256] = ''; 
  row[257] = ''; 
  row[258] = ''; 
  row[259] = emp.supportAgency?.supervisorName || '';
  row[260] = emp.supportAgency?.officerName || '';
  row[261] = emp.supportAgency?.availableLanguages || '';
  row[262] = emp.supportAgency?.monthlyFee !== undefined ? String(emp.supportAgency.monthlyFee) : '';
  row[263] = ''; // 予備、配列外アクセス防止用

  return createCsvString(SPECIFIC_HEADERS, row);
};
