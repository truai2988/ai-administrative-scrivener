import { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
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
 * 政府テンプレート準拠: 全263項目（インデックス 0〜262）
 *
 * @param data - RenewalApplicationFormData (Zodスキーマ準拠の申請フォーム全データ)
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateSpecificCsv = (data: RenewalApplicationFormData): string => {
  const f = data.foreignerInfo;
  const emp = data.employerInfo;

  // 政府テンプレート準拠: 263個の要素を持つ配列を生成
  const row: string[] = new Array(263).fill('');

  // ═══ 0〜7: 技能水準 ═══
  row[0] = f.skillCertifications?.[0]?.method === 'exam' ? '試験合格' : '';
  row[1] = f.skillCertifications?.[0]?.examName || '';
  row[2] = f.skillCertifications?.[0]?.examLocation || '';
  row[3] = f.skillCertifications?.[1]?.examName || '';
  row[4] = f.skillCertifications?.[1]?.examLocation || '';
  row[5] = f.skillCertifications?.[2]?.examName || '';
  row[6] = f.skillCertifications?.[2]?.examLocation || '';
  row[7] = f.otherSkillCert || '';

  // ═══ 8〜15: 日本語能力 ═══
  row[8] = f.languageCertifications?.[0]?.method === 'exam' ? '試験合格' : '';
  row[9] = f.languageCertifications?.[0]?.examName || '';
  row[10] = f.languageCertifications?.[0]?.examLocation || '';
  row[11] = f.languageCertifications?.[1]?.examName || '';
  row[12] = f.languageCertifications?.[1]?.examLocation || '';
  row[13] = f.languageCertifications?.[2]?.examName || '';
  row[14] = f.languageCertifications?.[2]?.examLocation || '';
  row[15] = f.otherLanguageCert || '';

  // ═══ 16〜21: 良好に修了した技能実習2号 (Zodスキーマ: technicalInternRecords) ═══
  const internRecords = f.technicalInternRecords || [];
  row[16] = internRecords[0]?.jobType || '';
  row[17] = internRecords[0]?.workType || '';
  row[18] = internRecords[0]?.completionProof || '';
  row[19] = internRecords[1]?.jobType || '';
  row[20] = internRecords[1]?.workType || '';
  row[21] = internRecords[1]?.completionProof || '';

  // ═══ 22〜23: 特定技能1号での通算在留期間 ═══
  row[22] = f.totalSpecificSkillStayYears !== undefined ? String(f.totalSpecificSkillStayYears) : '';
  row[23] = f.totalSpecificSkillStayMonths !== undefined ? String(f.totalSpecificSkillStayMonths) : '';

  // ═══ 24〜26: 保証金の徴収等 ═══
  row[24] = f.depositCharged !== undefined ? boolToYesNo(f.depositCharged) : '';
  row[25] = f.depositOrganizationName || '';
  row[26] = f.depositAmount !== undefined ? String(f.depositAmount) : '';

  // ═══ 27〜29: 外国の機関への費用支払等 ═══
  row[27] = f.feeCharged !== undefined ? boolToYesNo(f.feeCharged) : '';
  row[28] = f.foreignOrganizationName || '';
  row[29] = f.feeAmount !== undefined ? String(f.feeAmount) : '';

  // ═══ 30〜33: 宣誓チェック (Zodスキーマ: foreignerInfo直下) ═══
  row[30] = f.followsHomeCountryProcedures !== undefined ? boolToYesNo(f.followsHomeCountryProcedures) : '';
  row[31] = f.agreesToLocalCosts !== undefined ? boolToYesNo(f.agreesToLocalCosts) : '';
  row[32] = f.effortsToTransferSkills !== undefined ? boolToYesNo(f.effortsToTransferSkills) : '';
  row[33] = f.meetsSpecificIndustryStandards !== undefined ? boolToYesNo(f.meetsSpecificIndustryStandards) : '';

  // ═══ 34〜64: 職歴 (最大10枠) ═══
  row[34] = emp.hasJobHistory !== undefined ? boolToYesNo(emp.hasJobHistory) : '';
  for (let i = 0; i < 10; i++) {
    const job = emp.jobHistory?.[i];
    row[35 + i * 3] = job ? job.startDate : '';
    row[36 + i * 3] = job ? (job.endDate || '') : '';
    row[37 + i * 3] = job ? job.companyName : '';
  }

  // ═══ 65〜72: 代理人 (Zodスキーマ: foreignerInfo.agent) ═══
  const agent = f.agent;
  row[65] = agent?.name || '';
  row[66] = agent?.relationship || '';
  row[67] = formatZipCode(agent?.zipCode);
  row[68] = agent?.prefecture || '';
  row[69] = agent?.city || '';
  row[70] = agent?.addressLines || '';
  row[71] = formatPhoneNumber(agent?.phone);
  row[72] = formatPhoneNumber(agent?.mobilePhone);

  // ═══ 73〜79: 取次者 (Zodスキーマ: foreignerInfo.agencyRep) ═══
  const rep = f.agencyRep;
  row[73] = rep?.name || '';
  row[74] = formatZipCode(rep?.zipCode);
  row[75] = rep?.prefecture || '';
  row[76] = rep?.city || '';
  row[77] = rep?.addressLines || '';
  row[78] = rep?.organization || '';
  row[79] = formatPhoneNumber(rep?.phone);

  // ═══ 80〜81: 雇用契約期間 ═══
  row[80] = formatDateToYYYYMMDD(emp.contractStartDate);
  row[81] = formatDateToYYYYMMDD(emp.contractEndDate);

  // ═══ 82〜87: 特定産業分野と業務区分 (最大3枠) ═══
  row[82] = emp.industryFields?.[0] || '';
  row[83] = emp.jobCategories?.[0] || '';
  row[84] = emp.industryFields?.[1] || '';
  row[85] = emp.jobCategories?.[1] || '';
  row[86] = emp.industryFields?.[2] || '';
  row[87] = emp.jobCategories?.[2] || '';

  // ═══ 88〜91: 職種 ═══
  row[88] = emp.mainJobType || '';
  row[89] = emp.otherJobTypes?.[0] || '';
  row[90] = emp.otherJobTypes?.[1] || '';
  row[91] = emp.otherJobTypes?.[2] || '';

  // ═══ 92〜94: 労働時間 ═══
  row[92] = emp.weeklyWorkHours !== undefined ? String(emp.weeklyWorkHours) : '';
  row[93] = emp.monthlyWorkHours !== undefined ? String(emp.monthlyWorkHours) : '';
  row[94] = emp.equivalentWorkHours !== undefined ? boolToYesNo(emp.equivalentWorkHours) : '';

  // ═══ 95〜99: 報酬と支払方法 ═══
  row[95] = emp.monthlySalary !== undefined ? String(emp.monthlySalary) : '';
  row[96] = emp.hourlyRate !== undefined ? String(emp.hourlyRate) : '';
  row[97] = emp.japaneseMonthlySalary !== undefined ? String(emp.japaneseMonthlySalary) : '';
  row[98] = emp.equivalentSalary !== undefined ? boolToYesNo(emp.equivalentSalary) : '';
  row[99] = emp.paymentMethod === 'bank_transfer' ? '銀行振込' : emp.paymentMethod === 'cash' ? '現金持参' : '';

  // ═══ 100〜101: 待遇の差 ═══
  row[100] = emp.hasDifferentTreatment !== undefined ? boolToYesNo(emp.hasDifferentTreatment) : '';
  row[101] = emp.differentTreatmentDetail || '';

  // ═══ 102〜106: 誓約 (7)〜(11) (Zodスキーマ: complianceOaths) ═══
  const oaths = emp.complianceOaths;
  row[102] = oaths?.allowsTemporaryReturn !== undefined ? boolToYesNo(oaths.allowsTemporaryReturn) : '';
  row[103] = oaths?.meetsEmploymentStandards !== undefined ? boolToYesNo(oaths.meetsEmploymentStandards) : '';
  row[104] = oaths?.coversReturnTravelCost !== undefined ? boolToYesNo(oaths.coversReturnTravelCost) : '';
  row[105] = oaths?.monitorsHealthAndLife !== undefined ? boolToYesNo(oaths.monitorsHealthAndLife) : '';
  row[106] = oaths?.meetsSpecificIndustryEmploymentStandards !== undefined ? boolToYesNo(oaths.meetsSpecificIndustryEmploymentStandards) : '';

  // ═══ 107〜118: 派遣先 (12) (Zodスキーマ: dispatchDestination) ═══
  const dispatch = emp.dispatchDestination;
  row[107] = dispatch?.name || '';
  row[108] = dispatch?.hasCorporateNumber !== undefined ? boolToYesNo(dispatch.hasCorporateNumber) : '';
  row[109] = dispatch?.corporateNumber || '';
  row[110] = dispatch?.employmentInsuranceNumber || '';
  row[111] = formatZipCode(dispatch?.zipCode);
  row[112] = dispatch?.prefecture || '';
  row[113] = dispatch?.city || '';
  row[114] = dispatch?.addressLines || '';
  row[115] = formatPhoneNumber(dispatch?.phone);
  row[116] = dispatch?.representativeName || '';
  row[117] = formatDateToYYYYMMDD(dispatch?.periodStart);
  row[118] = formatDateToYYYYMMDD(dispatch?.periodEnd);

  // ═══ 119〜129: 職業紹介事業者 (13) (Zodスキーマ: placementAgency) ═══
  const placement = emp.placementAgency;
  row[119] = placement?.name || '';
  row[120] = placement?.hasCorporateNumber !== undefined ? boolToYesNo(placement.hasCorporateNumber) : '';
  row[121] = placement?.corporateNumber || '';
  row[122] = placement?.employmentInsuranceNumber || '';
  row[123] = formatZipCode(placement?.zipCode);
  row[124] = placement?.prefecture || '';
  row[125] = placement?.city || '';
  row[126] = placement?.addressLines || '';
  row[127] = formatPhoneNumber(placement?.phone);
  row[128] = placement?.licenseNumber || '';
  row[129] = formatDateToYYYYMMDD(placement?.acceptanceDate);

  // ═══ 130〜136: 取次機関 (14) (Zodスキーマ: intermediaryAgency) ═══
  const intermediary = emp.intermediaryAgency;
  row[130] = intermediary?.name || '';
  row[131] = intermediary?.country || '';
  row[132] = formatZipCode(intermediary?.zipCode);
  row[133] = intermediary?.prefecture || '';
  row[134] = intermediary?.city || '';
  row[135] = intermediary?.addressLines || '';
  row[136] = formatPhoneNumber(intermediary?.phone);

  // ═══ 137〜140: 所属機関（法人等）基本情報 ═══
  row[137] = emp.companyNameJa || '';
  row[138] = emp.hasCorporateNumber !== undefined ? boolToYesNo(emp.hasCorporateNumber) : '';
  row[139] = emp.corporateNumber || '';
  row[140] = emp.employmentInsuranceNumber || '';

  // ═══ 141〜146: 所属機関 業種 (Zodスキーマ: mainIndustry, otherIndustries) ═══
  row[141] = emp.mainIndustry || '';
  row[142] = emp.mainIndustryOther || '';
  const otherIndustries = emp.otherIndustries || [];
  row[143] = otherIndustries[0]?.industry || '';
  row[144] = otherIndustries[0]?.industryOther || '';
  row[145] = otherIndustries[1]?.industry || '';
  row[146] = otherIndustries[1]?.industryOther || '';

  // ═══ 147〜151: 所属機関 所在地・電話 ═══
  row[147] = formatZipCode(emp.companyZipCode);
  row[148] = emp.companyPref || '';
  row[149] = emp.companyCity || '';
  row[150] = emp.companyAddressLines || '';
  row[151] = formatPhoneNumber(emp.companyPhone);

  // ═══ 152〜155: 資本金、売上等 ═══
  row[152] = emp.capital !== undefined ? String(emp.capital) : '';
  row[153] = emp.annualRevenue !== undefined ? String(emp.annualRevenue) : '';
  row[154] = emp.employeeCount !== undefined ? String(emp.employeeCount) : '';
  row[155] = emp.representativeName || '';

  // ═══ 156〜160: 勤務事業所所在地 ═══
  row[156] = emp.workplaceName || '';
  row[157] = formatZipCode(emp.workplaceZipCode);
  row[158] = emp.workplacePref || '';
  row[159] = emp.workplaceCity || '';
  row[160] = emp.workplaceAddressLines || '';

  // ═══ 161〜163: 保険適用状況 ═══
  row[161] = emp.isSocialInsuranceApplicable !== undefined ? boolToYesNo(emp.isSocialInsuranceApplicable) : '';
  row[162] = emp.isLaborInsuranceApplicable !== undefined ? boolToYesNo(emp.isLaborInsuranceApplicable) : '';
  row[163] = emp.laborInsuranceNumber || '';

  // ═══ 164〜193: 欠格事由 (11)〜(26) (Zodスキーマ: complianceOaths.*) ═══
  // 各項目は { applies: boolean, detail?: string } の disqualificationItemSchema
  row[164] = oaths?.hadLaborLawPenalty?.applies !== undefined ? boolToYesNo(oaths.hadLaborLawPenalty.applies) : '';
  row[165] = oaths?.hadLaborLawPenalty?.detail || '';
  row[166] = oaths?.hadInvoluntaryDismissal?.applies !== undefined ? boolToYesNo(oaths.hadInvoluntaryDismissal.applies) : '';
  row[167] = oaths?.hadInvoluntaryDismissal?.detail || '';
  row[168] = oaths?.hadMissingPersons?.applies !== undefined ? boolToYesNo(oaths.hadMissingPersons.applies) : '';
  row[169] = oaths?.hadMissingPersons?.detail || '';
  row[170] = oaths?.hadCriminalPenalty?.applies !== undefined ? boolToYesNo(oaths.hadCriminalPenalty.applies) : '';
  row[171] = oaths?.hadCriminalPenalty?.detail || '';
  row[172] = oaths?.hasMentalImpairment?.applies !== undefined ? boolToYesNo(oaths.hasMentalImpairment.applies) : '';
  row[173] = oaths?.hasMentalImpairment?.detail || '';
  row[174] = oaths?.hasBankruptcy?.applies !== undefined ? boolToYesNo(oaths.hasBankruptcy.applies) : '';
  row[175] = oaths?.hasBankruptcy?.detail || '';
  row[176] = oaths?.hadTechnicalInternRevocation?.applies !== undefined ? boolToYesNo(oaths.hadTechnicalInternRevocation.applies) : '';
  row[177] = oaths?.hadTechnicalInternRevocation?.detail || '';
  row[178] = oaths?.wasOfficerOfRevokedEntity?.applies !== undefined ? boolToYesNo(oaths.wasOfficerOfRevokedEntity.applies) : '';
  row[179] = oaths?.wasOfficerOfRevokedEntity?.detail || '';
  row[180] = oaths?.hadIllegalAct?.applies !== undefined ? boolToYesNo(oaths.hadIllegalAct.applies) : '';
  row[181] = oaths?.hadIllegalAct?.detail || '';
  row[182] = oaths?.hadGangsterRelation?.applies !== undefined ? boolToYesNo(oaths.hadGangsterRelation.applies) : '';
  row[183] = oaths?.hadGangsterRelation?.detail || '';
  row[184] = oaths?.legalRepresentativeQualifies?.applies !== undefined ? boolToYesNo(oaths.legalRepresentativeQualifies.applies) : '';
  row[185] = oaths?.legalRepresentativeQualifies?.detail || '';
  row[186] = oaths?.isGangControlled?.applies !== undefined ? boolToYesNo(oaths.isGangControlled.applies) : '';
  row[187] = oaths?.isGangControlled?.detail || '';
  // (23) 書類保管
  row[188] = oaths?.keepsActivityRecords !== undefined ? boolToYesNo(oaths.keepsActivityRecords) : '';
  // (24) 保証金認識
  row[189] = oaths?.awaresOfGuaranteeContract?.applies !== undefined ? boolToYesNo(oaths.awaresOfGuaranteeContract.applies) : '';
  row[190] = oaths?.awaresOfGuaranteeContract?.detail || '';
  // (25) 違約金契約
  row[191] = oaths?.hasCompliancePenaltyContract?.applies !== undefined ? boolToYesNo(oaths.hasCompliancePenaltyContract.applies) : '';
  row[192] = oaths?.hasCompliancePenaltyContract?.detail || '';
  // (26) 支援費用外国人負担なし
  row[193] = oaths?.noSupportCostBurdenOnForeigner !== undefined ? boolToYesNo(oaths.noSupportCostBurdenOnForeigner) : '';

  // ═══ 194〜201: 派遣機関要件 (27) (Zodスキーマ: dispatchQualification) ═══
  const dq = emp.dispatchQualification;
  row[194] = dq?.applies !== undefined ? boolToYesNo(dq.applies) : '';
  row[195] = dq?.doesSpecificIndustryBusiness !== undefined ? boolToYesNo(dq.doesSpecificIndustryBusiness) : '';
  row[196] = dq?.doesSpecificIndustryBusinessDetail || '';
  row[197] = dq?.publicBodyCapitalMajority !== undefined ? boolToYesNo(dq.publicBodyCapitalMajority) : '';
  row[198] = dq?.publicBodyCapitalMajorityDetail || '';
  row[199] = dq?.publicBodyManagementInvolvement !== undefined ? boolToYesNo(dq.publicBodyManagementInvolvement) : '';
  row[200] = dq?.publicBodyManagementInvolvementDetail || '';
  row[201] = dq?.isAgricultureSpecialZoneEntity !== undefined ? boolToYesNo(dq.isAgricultureSpecialZoneEntity) : '';

  // ═══ 202〜203: 派遣先欠格事由 (28) ═══
  const ddq = emp.dispatchDestinationDisqualification;
  row[202] = ddq?.applies !== undefined ? boolToYesNo(ddq.applies) : '';
  row[203] = ddq?.detail || '';

  // ═══ 204〜205: 労災保険等措置 (29) ═══
  const wc = emp.hasWorkersCompMeasures;
  row[204] = wc?.applies !== undefined ? boolToYesNo(wc.applies) : '';
  row[205] = wc?.detail || '';

  // ═══ 206〜208: (30)〜(32) 雇用契約継続等 ═══
  row[206] = oaths?.hasContractContinuationSystem !== undefined ? boolToYesNo(oaths.hasContractContinuationSystem) : '';
  row[207] = oaths?.paysWageByTransfer !== undefined ? boolToYesNo(oaths.paysWageByTransfer) : '';
  row[208] = oaths?.meetsAdditionalEmploymentStandards !== undefined ? boolToYesNo(oaths.meetsAdditionalEmploymentStandards) : '';

  // ═══ 209: 登録支援機関への全部委託 ═══
  row[209] = emp.delegateSupportEntirely !== undefined ? boolToYesNo(emp.delegateSupportEntirely) : '';

  // ═══ 210〜215: 支援責任者・担当者 (33)(34) ═══
  const sp = emp.supportPersonnel;
  row[210] = sp?.supervisorName || '';
  row[211] = sp?.supervisorTitle || '';
  row[212] = sp?.isSupervisorFromStaff !== undefined ? boolToYesNo(sp.isSupervisorFromStaff) : '';
  row[213] = sp?.officerName || '';
  row[214] = sp?.officerTitle || '';
  row[215] = sp?.isOfficerFromStaff !== undefined ? boolToYesNo(sp.isOfficerFromStaff) : '';

  // ═══ 216〜227: 支援業務の適正実施等 (35)〜(41) ═══
  row[216] = emp.qualifiedForSupportWork !== undefined ? boolToYesNo(emp.qualifiedForSupportWork) : '';
  row[217] = emp.supportWorkQualification1 !== undefined ? boolToYesNo(emp.supportWorkQualification1) : '';
  row[218] = emp.supportWorkQualification2 !== undefined ? boolToYesNo(emp.supportWorkQualification2) : '';
  row[219] = emp.supportWorkQualification3 !== undefined ? boolToYesNo(emp.supportWorkQualification3) : '';
  row[220] = emp.supportWorkQualification3Detail || '';
  row[221] = emp.hasForeignLanguageSupportCapability !== undefined ? boolToYesNo(emp.hasForeignLanguageSupportCapability) : '';
  row[222] = emp.keepsSupportRecords !== undefined ? boolToYesNo(emp.keepsSupportRecords) : '';
  row[223] = emp.supportersNeutral !== undefined ? boolToYesNo(emp.supportersNeutral) : '';
  row[224] = emp.hadSupportNeglect?.applies !== undefined ? boolToYesNo(emp.hadSupportNeglect.applies) : '';
  row[225] = emp.hadSupportNeglect?.detail || '';
  row[226] = emp.hasRegularMeetingCapability !== undefined ? boolToYesNo(emp.hasRegularMeetingCapability) : '';
  row[227] = emp.meetsSpecificIndustrySupportStandards !== undefined ? boolToYesNo(emp.meetsSpecificIndustrySupportStandards) : '';

  // ═══ 228〜241: 支援計画の実施項目 (1)〜(14) (Zodスキーマ: supportPlan) ═══
  const plan = emp.supportPlan;
  row[228] = plan?.airportPickup !== undefined ? boolToYesNo(plan.airportPickup) : '';
  row[229] = plan?.housingSupport !== undefined ? boolToYesNo(plan.housingSupport) : '';
  row[230] = plan?.financialContractSupport !== undefined ? boolToYesNo(plan.financialContractSupport) : '';
  row[231] = plan?.lifeInfoProvision !== undefined ? boolToYesNo(plan.lifeInfoProvision) : '';
  row[232] = plan?.adminProcedureEscort !== undefined ? boolToYesNo(plan.adminProcedureEscort) : '';
  row[233] = plan?.japaneseLanguageLearning !== undefined ? boolToYesNo(plan.japaneseLanguageLearning) : '';
  row[234] = plan?.complaintSupport !== undefined ? boolToYesNo(plan.complaintSupport) : '';
  row[235] = plan?.interculturalExchange !== undefined ? boolToYesNo(plan.interculturalExchange) : '';
  row[236] = plan?.jobChangeSupport !== undefined ? boolToYesNo(plan.jobChangeSupport) : '';
  row[237] = plan?.regularInterviewAndReport !== undefined ? boolToYesNo(plan.regularInterviewAndReport) : '';
  row[238] = plan?.writtenPlanProvision !== undefined ? boolToYesNo(plan.writtenPlanProvision) : '';
  row[239] = plan?.specificIndustryItems !== undefined ? boolToYesNo(plan.specificIndustryItems) : '';
  row[240] = plan?.implementationCapability !== undefined ? boolToYesNo(plan.implementationCapability) : '';
  row[241] = plan?.meetsRegulationStandards !== undefined ? boolToYesNo(plan.meetsRegulationStandards) : '';

  // ═══ 242〜262: 登録支援機関 (Zodスキーマ: supportAgency) ═══
  const sa = emp.supportAgency;
  row[242] = sa?.name || '';
  row[243] = sa?.hasCorporateNumber !== undefined ? boolToYesNo(sa.hasCorporateNumber) : '';
  row[244] = sa?.corporateNumber || '';
  row[245] = sa?.employmentInsuranceNumber || '';
  row[246] = formatZipCode(sa?.zipCode);
  row[247] = sa?.prefecture || '';
  row[248] = sa?.city || '';
  row[249] = sa?.addressLines || '';
  row[250] = formatPhoneNumber(sa?.phone);
  row[251] = sa?.representativeName || '';
  row[252] = sa?.registrationNumber || '';
  row[253] = formatDateToYYYYMMDD(sa?.registrationDate);
  row[254] = sa?.supportOfficeName || '';
  row[255] = formatZipCode(sa?.officeZipCode);
  row[256] = sa?.officePrefecture || '';
  row[257] = sa?.officeCity || '';
  row[258] = sa?.officeAddressLines || '';
  row[259] = sa?.supportSupervisorName || '';
  row[260] = sa?.supportOfficerName || '';
  row[261] = sa?.supportLanguages || '';
  row[262] = sa?.supportFeeMonthly !== undefined ? String(sa.supportFeeMonthly) : '';

  return createCsvString(SPECIFIC_HEADERS, row);
};
