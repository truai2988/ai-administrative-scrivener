import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import Encoding from 'encoding-japanese';
import {
  boolToYesNo,
  formatDateToYYYYMMDD,
  formatZipCode,
  formatPhoneNumber,
  createCsvString,
} from '../csvUtils';
import { CHANGE_SPECIFIC_HEADERS } from './changeSpecificHeaders';

/**
 * 申請情報入力(区分V).csv のデータを生成します。
 * 対象となる項目数は全265項目（インデックス 0〜264）です。
 */
export const generateChangeSpecificCsv = (data: ChangeOfStatusApplicationFormData): string => {
  const f = data.foreignerInfo;
  const emp = data.employerInfo;

  const row: string[] = new Array(265).fill('');

  // ─── 0〜7: 技能水準 ─────────────────────────────────────────────────────
  const sc = f.skillCertifications;
  row[0] = sc?.[0]?.method === 'exam' ? '特定技能評価試験 Specified Skilled Worker evaluation test' : sc?.[0]?.method === 'technical_intern' ? '技能実習２号を良好に修了 Successfully completed Technical Intern Training (ii)' : '';
  row[1] = sc?.[0]?.examName || '';
  row[2] = sc?.[0]?.examLocation || '';
  row[3] = sc?.[1]?.examName || '';
  row[4] = sc?.[1]?.examLocation || '';
  row[5] = sc?.[2]?.examName || '';
  row[6] = sc?.[2]?.examLocation || '';
  row[7] = f.otherSkillCert || '';

  // ─── 8〜15: 日本語能力 ──────────────────────────────────────────────────
  const lc = f.languageCertifications;
  row[8] = lc?.[0]?.method === 'exam' ? '日本語能力試験 Japanese language proficiency test' : lc?.[0]?.method === 'technical_intern' ? '試験免除 Test exemption' : '';
  row[9] = lc?.[0]?.examName || '';
  row[10] = lc?.[0]?.examLocation || '';
  row[11] = lc?.[1]?.examName || '';
  row[12] = lc?.[1]?.examLocation || '';
  row[13] = lc?.[2]?.examName || '';
  row[14] = lc?.[2]?.examLocation || '';
  row[15] = f.otherLanguageCert || '';

  // ─── 16〜21: 技能実習2号良好修了 (最大2件 x 3項目) ───────────────────────
  const ti = f.technicalInternRecords;
  if (ti?.[0]) { row[16] = ti[0].jobType || ''; row[17] = ti[0].workType || ''; row[18] = ti[0].completionProof || ''; }
  if (ti?.[1]) { row[19] = ti[1].jobType || ''; row[20] = ti[1].workType || ''; row[21] = ti[1].completionProof || ''; }

  // ─── 22〜23: 通算在留期間 ───────────────────────────────────────────────
  row[22] = f.totalSpecificSkillStayYears !== undefined ? String(f.totalSpecificSkillStayYears) : '';
  row[23] = f.totalSpecificSkillStayMonths !== undefined ? String(f.totalSpecificSkillStayMonths) : '';

  // ─── 24〜26: 保証金 ─────────────────────────────────────────────────────
  row[24] = boolToYesNo(f.depositCharged);
  row[25] = f.depositOrganizationName || '';
  row[26] = f.depositAmount !== undefined ? String(f.depositAmount) : '';

  // ─── 27〜29: 外国機関費用 ───────────────────────────────────────────────
  row[27] = boolToYesNo(f.feeCharged);
  row[28] = f.foreignOrganizationName || '';
  row[29] = f.feeAmount !== undefined ? String(f.feeAmount) : '';

  // ─── 30〜33: 国籍国手続き等 ────────────────────────────────────────────
  row[30] = boolToYesNo(f.followsHomeCountryProcedures);
  row[31] = boolToYesNo(f.agreesToLocalCosts);
  row[32] = boolToYesNo(f.effortsToTransferSkills);
  row[33] = boolToYesNo(f.meetsSpecificIndustryStandards);

  // ─── 34: 職歴の有無 ────────────────────────────────────────────────────
  row[34] = boolToYesNo(emp.hasJobHistory);

  // ─── 35〜64: 職歴 (最大10件 x 3項目) ──────────────────────────────────
  const jh = emp.jobHistory || [];
  for (let i = 0; i < 10; i++) {
    const base = 35 + i * 3;
    const job = jh[i];
    if (job) {
      row[base] = job.startDate?.replace('-', '') || '';
      row[base + 1] = job.endDate?.replace('-', '') || '';
      row[base + 2] = job.companyName || '';
    }
  }

  // ─── 65〜72: 代理人 ────────────────────────────────────────────────────
  const ag = f.agent;
  if (ag) {
    row[65] = ag.name || ''; row[66] = ag.relationship || '';
    row[67] = formatZipCode(ag.zipCode); row[68] = ag.prefecture || '';
    row[69] = ag.city || ''; row[70] = ag.addressLines || '';
    row[71] = formatPhoneNumber(ag.phone); row[72] = formatPhoneNumber(ag.mobilePhone);
  }

  // ─── 73〜79: 取次者 ────────────────────────────────────────────────────
  const ar = f.agencyRep;
  if (ar) {
    row[73] = ar.name || ''; row[74] = formatZipCode(ar.zipCode);
    row[75] = ar.prefecture || ''; row[76] = ar.city || '';
    row[77] = ar.addressLines || ''; row[78] = ar.organization || '';
    row[79] = formatPhoneNumber(ar.phone);
  }

  // ─── 80〜81: 雇用契約期間 ──────────────────────────────────────────────
  row[80] = formatDateToYYYYMMDD(emp.contractStartDate);
  row[81] = formatDateToYYYYMMDD(emp.contractEndDate);

  // ─── 82〜87: 特定産業分野・業務区分 (最大3組) ──────────────────────────
  const ind = emp.industryFields || [];
  const jc = emp.jobCategories || [];
  row[82] = ind[0] || ''; row[83] = jc[0] || '';
  row[84] = ind[1] || ''; row[85] = jc[1] || '';
  row[86] = ind[2] || ''; row[87] = jc[2] || '';

  // ─── 88〜91: 職種 ──────────────────────────────────────────────────────
  row[88] = emp.mainJobType || '';
  const oj = emp.otherJobTypes || [];
  row[89] = oj[0] || ''; row[90] = oj[1] || ''; row[91] = oj[2] || '';

  // ─── 92〜94: 労働時間 ──────────────────────────────────────────────────
  row[92] = emp.weeklyWorkHours !== undefined ? String(emp.weeklyWorkHours) : '';
  row[93] = emp.monthlyWorkHours !== undefined ? String(emp.monthlyWorkHours) : '';
  row[94] = boolToYesNo(emp.equivalentWorkHours);

  // ─── 95〜99: 報酬 ──────────────────────────────────────────────────────
  row[95] = emp.monthlySalary !== undefined ? String(emp.monthlySalary) : '';
  row[96] = emp.hourlyRate !== undefined ? String(emp.hourlyRate) : '';
  row[97] = emp.japaneseMonthlySalary !== undefined ? String(emp.japaneseMonthlySalary) : '';
  row[98] = boolToYesNo(emp.equivalentSalary);
  row[99] = emp.paymentMethod === 'bank_transfer' ? '振込' : emp.paymentMethod === 'cash' ? '現金' : '';

  // ─── 100〜101: 待遇差 ──────────────────────────────────────────────────
  row[100] = boolToYesNo(emp.hasDifferentTreatment);
  row[101] = emp.differentTreatmentDetail || '';

  // ─── 102〜106: 誓約 (7)〜(11) ──────────────────────────────────────────
  const co = emp.complianceOaths;
  row[102] = boolToYesNo(co?.allowsTemporaryReturn);
  row[103] = boolToYesNo(co?.meetsEmploymentStandards);
  row[104] = boolToYesNo(co?.coversReturnTravelCost);
  row[105] = boolToYesNo(co?.monitorsHealthAndLife);
  row[106] = boolToYesNo(co?.meetsSpecificIndustryEmploymentStandards);

  // ─── 107〜118: 派遣先 (12) ─────────────────────────────────────────────
  const dd = emp.dispatchDestination;
  if (dd) {
    row[107] = dd.name || '';
    row[108] = boolToYesNo(dd.hasCorporateNumber);
    row[109] = dd.corporateNumber || '';
    row[110] = dd.employmentInsuranceNumber || '';
    row[111] = formatZipCode(dd.zipCode);
    row[112] = dd.prefecture || ''; row[113] = dd.city || '';
    row[114] = dd.addressLines || '';
    row[115] = formatPhoneNumber(dd.phone);
    row[116] = dd.representativeName || '';
    row[117] = formatDateToYYYYMMDD(dd.periodStart);
    row[118] = formatDateToYYYYMMDD(dd.periodEnd);
  }

  // ─── 119〜129: 職業紹介事業者 (13) ────────────────────────────────────
  const pa = emp.placementAgency;
  if (pa) {
    row[119] = pa.name || '';
    row[120] = boolToYesNo(pa.hasCorporateNumber);
    row[121] = pa.corporateNumber || '';
    row[122] = pa.employmentInsuranceNumber || '';
    row[123] = formatZipCode(pa.zipCode);
    row[124] = pa.prefecture || ''; row[125] = pa.city || '';
    row[126] = pa.addressLines || '';
    row[127] = formatPhoneNumber(pa.phone);
    row[128] = pa.licenseNumber || '';
    row[129] = formatDateToYYYYMMDD(pa.acceptanceDate);
  }

  // ─── 130〜136: 取次機関 (14) ──────────────────────────────────────────
  const ia = emp.intermediaryAgency;
  if (ia) {
    row[130] = ia.name || '';
    row[131] = ia.country || '';
    row[132] = formatZipCode(ia.zipCode);
    row[133] = ia.prefecture || ''; row[134] = ia.city || '';
    row[135] = ia.addressLines || '';
    row[136] = formatPhoneNumber(ia.phone);
  }

  // ─── 137〜140: 所属機関基本 ────────────────────────────────────────────
  row[137] = emp.companyNameJa || '';
  row[138] = boolToYesNo(emp.hasCorporateNumber);
  row[139] = emp.corporateNumber || '';
  row[140] = emp.employmentInsuranceNumber || '';

  // ─── 141〜146: 業種 (最大3組: 主+その他×2) ────────────────────────────
  row[141] = emp.mainIndustry || '';
  row[142] = emp.mainIndustryOther || '';
  const oi = emp.otherIndustries || [];
  row[143] = oi[0]?.industry || ''; row[144] = oi[0]?.industryOther || '';
  row[145] = oi[1]?.industry || ''; row[146] = oi[1]?.industryOther || '';

  // ─── 147〜151: 所在地・電話 ────────────────────────────────────────────
  row[147] = formatZipCode(emp.companyZipCode);
  row[148] = emp.companyPref || ''; row[149] = emp.companyCity || '';
  row[150] = emp.companyAddressLines || '';
  row[151] = formatPhoneNumber(emp.companyPhone);

  // ─── 152〜155: 資本金等 ────────────────────────────────────────────────
  row[152] = emp.capital !== undefined ? String(emp.capital) : '';
  row[153] = emp.annualRevenue !== undefined ? String(emp.annualRevenue) : '';
  row[154] = emp.employeeCount !== undefined ? String(emp.employeeCount) : '';
  row[155] = emp.representativeName || '';

  // ─── 156〜163: 勤務事業所 ──────────────────────────────────────────────
  row[156] = emp.workplaceName || '';
  row[157] = formatZipCode(emp.workplaceZipCode);
  row[158] = emp.workplacePref || ''; row[159] = emp.workplaceCity || '';
  row[160] = emp.workplaceAddressLines || '';
  row[161] = boolToYesNo(emp.isSocialInsuranceApplicable);
  row[162] = boolToYesNo(emp.isLaborInsuranceApplicable);
  row[163] = emp.laborInsuranceNumber || '';

  // ─── 164〜195: 欠格事由 (11)〜(22) 各 applies + detail ────────────────
  row[164] = boolToYesNo(co?.hadLaborLawPenalty?.applies);
  row[165] = co?.hadLaborLawPenalty?.detail || '';
  row[166] = boolToYesNo(co?.hadInvoluntaryDismissal?.applies);
  row[167] = co?.hadInvoluntaryDismissal?.detail || '';
  row[168] = boolToYesNo(co?.hadMissingPersons?.applies);
  row[169] = co?.hadMissingPersons?.detail || '';
  row[170] = boolToYesNo(co?.hadCriminalPenalty?.applies);
  row[171] = co?.hadCriminalPenalty?.detail || '';
  row[172] = boolToYesNo(co?.hasMentalImpairment?.applies);
  row[173] = co?.hasMentalImpairment?.detail || '';
  row[174] = boolToYesNo(co?.hasBankruptcy?.applies);
  row[175] = co?.hasBankruptcy?.detail || '';
  row[176] = boolToYesNo(co?.hadTechnicalInternRevocation?.applies);
  row[177] = co?.hadTechnicalInternRevocation?.detail || '';
  row[178] = boolToYesNo(co?.wasOfficerOfRevokedEntity?.applies);
  row[179] = co?.wasOfficerOfRevokedEntity?.detail || '';
  row[180] = boolToYesNo(co?.hadIllegalAct?.applies);
  row[181] = co?.hadIllegalAct?.detail || '';
  row[182] = boolToYesNo(co?.hadGangsterRelation?.applies);
  row[183] = co?.hadGangsterRelation?.detail || '';
  row[184] = boolToYesNo(co?.legalRepresentativeQualifies?.applies);
  row[185] = co?.legalRepresentativeQualifies?.detail || '';
  row[186] = boolToYesNo(co?.isGangControlled?.applies);
  row[187] = co?.isGangControlled?.detail || '';

  // ─── 188〜193: (23)〜(26) ──────────────────────────────────────────────
  row[188] = boolToYesNo(co?.keepsActivityRecords);
  row[189] = boolToYesNo(co?.awaresOfGuaranteeContract?.applies);
  row[190] = co?.awaresOfGuaranteeContract?.detail || '';
  row[191] = boolToYesNo(co?.hasCompliancePenaltyContract?.applies);
  row[192] = co?.hasCompliancePenaltyContract?.detail || '';
  row[193] = boolToYesNo(co?.noSupportCostBurdenOnForeigner);

  // ─── 194〜201: 派遣機関要件 (27) ──────────────────────────────────────
  const dq = emp.dispatchQualification;
  row[194] = boolToYesNo(dq?.applies);
  row[195] = boolToYesNo(dq?.doesSpecificIndustryBusiness);
  row[196] = dq?.doesSpecificIndustryBusinessDetail || '';
  row[197] = boolToYesNo(dq?.publicBodyCapitalMajority);
  row[198] = dq?.publicBodyCapitalMajorityDetail || '';
  row[199] = boolToYesNo(dq?.publicBodyManagementInvolvement);
  row[200] = dq?.publicBodyManagementInvolvementDetail || '';
  row[201] = boolToYesNo(dq?.isAgricultureSpecialZoneEntity);

  // ─── 202〜203: (28) 派遣先欠格 ────────────────────────────────────────
  row[202] = boolToYesNo(emp.dispatchDestinationDisqualification?.applies);
  row[203] = emp.dispatchDestinationDisqualification?.detail || '';

  // ─── 204〜205: (29) 労災保険 ──────────────────────────────────────────
  row[204] = boolToYesNo(emp.hasWorkersCompMeasures?.applies);
  row[205] = emp.hasWorkersCompMeasures?.detail || '';

  // ─── 206〜208: (30)〜(32) ──────────────────────────────────────────────
  row[206] = boolToYesNo(co?.hasContractContinuationSystem);
  row[207] = boolToYesNo(co?.paysWageByTransfer);
  row[208] = boolToYesNo(co?.meetsAdditionalEmploymentStandards);

  // ─── 209: 登録支援機関委託 ─────────────────────────────────────────────
  const isType1 = typeof f.desiredResidenceStatus === 'string' && f.desiredResidenceStatus.includes('１号');

  row[209] = isType1 ? boolToYesNo(emp.delegateSupportEntirely) : '';

  // ─── 210〜215: 支援責任者・担当者 (33)(34) ────────────────────────────
  const sp = emp.supportPersonnel;
  row[210] = isType1 ? (sp?.supervisorName || '') : '';
  row[211] = isType1 ? (sp?.supervisorTitle || '') : '';
  row[212] = isType1 ? boolToYesNo(sp?.isSupervisorFromStaff) : '';
  row[213] = isType1 ? (sp?.officerName || '') : '';
  row[214] = isType1 ? (sp?.officerTitle || '') : '';
  row[215] = isType1 ? boolToYesNo(sp?.isOfficerFromStaff) : '';

  // ─── 216〜220: (35) 支援業務要件 ──────────────────────────────────────
  row[216] = isType1 ? boolToYesNo(emp.qualifiedForSupportWork) : '';
  row[217] = isType1 ? boolToYesNo(emp.supportWorkQualification1) : '';
  row[218] = isType1 ? boolToYesNo(emp.supportWorkQualification2) : '';
  row[219] = isType1 ? boolToYesNo(emp.supportWorkQualification3) : '';
  row[220] = isType1 ? (emp.supportWorkQualification3Detail || '') : '';

  // ─── 221〜227: (36)〜(41) ──────────────────────────────────────────────
  row[221] = isType1 ? boolToYesNo(emp.hasForeignLanguageSupportCapability) : '';
  row[222] = isType1 ? boolToYesNo(emp.keepsSupportRecords) : '';
  row[223] = isType1 ? boolToYesNo(emp.supportersNeutral) : '';
  row[224] = isType1 ? boolToYesNo(emp.hadSupportNeglect?.applies) : '';
  row[225] = isType1 ? (emp.hadSupportNeglect?.detail || '') : '';
  row[226] = isType1 ? boolToYesNo(emp.hasRegularMeetingCapability) : '';
  row[227] = isType1 ? boolToYesNo(emp.meetsSpecificIndustrySupportStandards) : '';

  // ─── 228〜243: 支援計画 (1)〜(16) ─────────────────────────────────────
  const plan = emp.supportPlan;
  row[228] = isType1 ? boolToYesNo(plan?.preGuidanceProvision) : '';
  row[229] = isType1 ? boolToYesNo(plan?.preGuidanceInPerson) : '';
  row[230] = isType1 ? boolToYesNo(plan?.airportPickup) : '';
  row[231] = isType1 ? boolToYesNo(plan?.housingSupport) : '';
  row[232] = isType1 ? boolToYesNo(plan?.financialContractSupport) : '';
  row[233] = isType1 ? boolToYesNo(plan?.lifeInfoProvision) : '';
  row[234] = isType1 ? boolToYesNo(plan?.adminProcedureEscort) : '';
  row[235] = isType1 ? boolToYesNo(plan?.japaneseLanguageLearning) : '';
  row[236] = isType1 ? boolToYesNo(plan?.complaintSupport) : '';
  row[237] = isType1 ? boolToYesNo(plan?.interculturalExchange) : '';
  row[238] = isType1 ? boolToYesNo(plan?.jobChangeSupport) : '';
  row[239] = isType1 ? boolToYesNo(plan?.regularInterviewAndReport) : '';
  row[240] = isType1 ? boolToYesNo(plan?.writtenPlanProvision) : '';
  row[241] = isType1 ? boolToYesNo(plan?.specificIndustryItems) : '';
  row[242] = isType1 ? boolToYesNo(plan?.implementationCapability) : '';
  row[243] = isType1 ? boolToYesNo(plan?.meetsRegulationStandards) : '';

  // ─── 244〜264: 登録支援機関 ────────────────────────────────────────────
  const sa = emp.supportAgency;
  row[244] = isType1 ? (sa?.name || '') : '';
  row[245] = isType1 ? boolToYesNo(sa?.hasCorporateNumber) : '';
  row[246] = isType1 ? (sa?.corporateNumber || '') : '';
  row[247] = isType1 ? (sa?.employmentInsuranceNumber || '') : '';
  row[248] = isType1 ? formatZipCode(sa?.zipCode) : '';
  row[249] = isType1 ? (sa?.prefecture || '') : '';
  row[250] = isType1 ? (sa?.city || '') : '';
  row[251] = isType1 ? (sa?.addressLines || '') : '';
  row[252] = isType1 ? formatPhoneNumber(sa?.phone) : '';
  row[253] = isType1 ? (sa?.representativeName || '') : '';
  row[254] = isType1 ? (sa?.registrationNumber || '') : '';
  row[255] = isType1 ? formatDateToYYYYMMDD(sa?.registrationDate) : '';
  row[256] = isType1 ? (sa?.supportOfficeName || '') : '';
  row[257] = isType1 ? formatZipCode(sa?.officeZipCode) : '';
  row[258] = isType1 ? (sa?.officePrefecture || '') : '';
  row[259] = isType1 ? (sa?.officeCity || '') : '';
  row[260] = isType1 ? (sa?.officeAddressLines || '') : '';
  row[261] = isType1 ? (sa?.supportSupervisorName || '') : '';
  row[262] = isType1 ? (sa?.supportOfficerName || '') : '';
  row[263] = isType1 ? (sa?.supportLanguages || '') : '';
  row[264] = isType1 ? (sa?.supportFeeMonthly !== undefined ? String(sa.supportFeeMonthly) : '') : '';

  return createCsvString(CHANGE_SPECIFIC_HEADERS, row);
};

export const downloadChangeSpecificCsv = (data: ChangeOfStatusApplicationFormData, filename = '申請情報入力(区分V).csv') => {
  const csvString = generateChangeSpecificCsv(data);
  
  const unicodeArray = Encoding.stringToCode(csvString);
  const sjisArray = Encoding.convert(unicodeArray, 'SJIS', 'UNICODE');
  const uint8Array = new Uint8Array(sjisArray);
  
  const blob = new Blob([uint8Array.buffer as ArrayBuffer], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  
  document.body.appendChild(a);
  a.click();
  
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
