import { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import {
  boolToYesNo,
  formatDateToYYYYMMDD,
  formatZipCode,
  formatPhoneNumber,
  createCsvString,
} from './csvUtils';
import { SIMULTANEOUS_HEADERS } from './simultaneousHeaders';

/**
 * 申請情報入力(同時申請).csv のデータを生成します。
 * 対象となる項目数は全114項目（インデックス 0〜113）です。
 * 共通項目は foreignerInfo (Single Source of Truth) から取得します。
 * 
 * @param data - RenewalApplicationFormData (申請フォームの全データ)
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateSimultaneousCsv = (data: RenewalApplicationFormData): string => {
  const f = data.foreignerInfo;
  const sim = data.simultaneousApplication;

  // 政府テンプレート準拠: 114個の要素を持つ配列を生成
  const row: string[] = new Array(114).fill('');

  if (!sim) {
    // 同時申請データが存在しない場合は空の行を返す
    return createCsvString(SIMULTANEOUS_HEADERS, row);
  }

  // 0: 空のヘッダー列
  row[0] = '';

  // 1〜3: 同時申請種別選択
  row[1] = boolToYesNo(sim.applyForReEntry);
  row[2] = boolToYesNo(sim.applyForActivityOutsideStatus);
  row[3] = boolToYesNo(sim.applyForAuthEmployment);

  // 4〜22: 共通項目（外国人情報から取得 - Single Source of Truth）
  row[4] = f.nationality || '';
  row[5] = formatDateToYYYYMMDD(f.birthDate);
  row[6] = f.nameEn || '';
  row[7] = f.gender === 'male' ? '男' : f.gender === 'female' ? '女' : '';
  row[8] = formatZipCode(f.japanZipCode);
  row[9] = f.japanPrefecture || '';
  row[10] = f.japanCity || '';
  row[11] = f.japanAddressLines || '';
  row[12] = formatPhoneNumber(f.phoneNumber);
  row[13] = formatPhoneNumber(f.mobileNumber);
  row[14] = f.passportNumber || '';
  row[15] = formatDateToYYYYMMDD(f.passportExpiryDate);
  row[16] = f.currentResidenceStatus || '';
  row[17] = f.currentStayPeriod || '';
  row[18] = formatDateToYYYYMMDD(f.stayExpiryDate);
  row[19] = f.hasResidenceCard !== undefined ? boolToYesNo(f.hasResidenceCard) : '';
  row[20] = f.residenceCardNumber || '';
  row[21] = f.edNumberAlpha || '';
  row[22] = f.edNumberNumeric || '';

  // ─── 再入国許可申請 (23〜56) ───
  if (sim.reEntryPermit) {
    const re = sim.reEntryPermit;
    row[23] = re.travelPurpose1 || '';
    row[24] = re.travelPurpose2 || '';
    row[25] = re.travelPurposeOther || '';
    row[26] = re.destinationCountry1 || '';
    row[27] = re.destinationCountry2 || '';
    row[28] = formatDateToYYYYMMDD(re.departureDatePrimary);
    row[29] = formatDateToYYYYMMDD(re.departureDateSecondary);
    row[30] = re.departurePortPrimary || '';
    row[31] = re.departurePortSecondary || '';
    row[32] = formatDateToYYYYMMDD(re.reEntryDatePrimary);
    row[33] = formatDateToYYYYMMDD(re.reEntryDateSecondary);
    row[34] = re.reEntryPortPrimary || '';
    row[35] = re.reEntryPortSecondary || '';
    row[36] = re.desiredPermitType === 'single' ? '一次再入国許可' : re.desiredPermitType === 'multiple' ? '数次再入国許可' : '';
    
    row[37] = re.hasCriminalRecord !== undefined ? boolToYesNo(re.hasCriminalRecord) : '';
    row[38] = re.criminalRecordDetail || '';
    row[39] = re.hasPendingCriminalCase !== undefined ? boolToYesNo(re.hasPendingCriminalCase) : '';
    row[40] = re.pendingCriminalCaseDetail || '';
    row[41] = re.noPassportReason || '';

    // 法定代理人 (42~49)
    row[42] = re.agent?.name || '';
    row[43] = re.agent?.relationship || '';
    row[44] = formatZipCode(re.agent?.zipCode);
    row[45] = re.agent?.prefecture || '';
    row[46] = re.agent?.city || '';
    row[47] = re.agent?.addressLines || '';
    row[48] = formatPhoneNumber(re.agent?.phone);
    row[49] = formatPhoneNumber(re.agent?.mobilePhone);

    // 取次者 (50~56)
    row[50] = re.agencyRep?.name || '';
    row[51] = formatZipCode(re.agencyRep?.zipCode);
    row[52] = re.agencyRep?.prefecture || '';
    row[53] = re.agencyRep?.city || '';
    row[54] = re.agencyRep?.addressLines || '';
    row[55] = re.agencyRep?.organization || '';
    row[56] = formatPhoneNumber(re.agencyRep?.phone);
  }

  // ─── 資格外活動許可申請 (57〜94) ───
  if (sim.activityOutsideStatus) {
    const act = sim.activityOutsideStatus;
    row[57] = act.currentActivityDescription || '';
    row[58] = act.newActivityJob1 || '';
    row[59] = act.newActivityJob2 || '';
    row[60] = act.newActivityJob3 || '';
    row[61] = act.newActivityContractYears !== undefined || act.newActivityContractMonths !== undefined ? '有' : '無'; // CSVテンプレートの"雇用契約期間"の有無
    row[62] = act.newActivityContractYears !== undefined ? String(act.newActivityContractYears) : '';
    row[63] = act.newActivityContractMonths !== undefined ? String(act.newActivityContractMonths) : '';
    row[64] = act.newActivityWeeklyHours1 !== undefined ? String(act.newActivityWeeklyHours1) : '';
    row[65] = act.newActivityWeeklyHours2 !== undefined ? String(act.newActivityWeeklyHours2) : '';
    row[66] = act.newActivityHasPayment !== undefined ? boolToYesNo(act.newActivityHasPayment) : '';
    row[67] = act.newActivityMonthlySalary !== undefined ? String(act.newActivityMonthlySalary) : '';
    row[68] = act.workplaceName1 || '';
    row[69] = act.workplaceName2 || '';
    row[70] = act.workplaceZipCode ? '有' : '無'; // 所在地見出し
    row[71] = formatZipCode(act.workplaceZipCode);
    row[72] = act.workplacePrefecture || '';
    row[73] = act.workplaceCity || '';
    row[74] = act.workplaceAddressLines || '';
    row[75] = formatPhoneNumber(act.workplacePhone1);
    row[76] = formatPhoneNumber(act.workplacePhone2);
    row[77] = act.workplaceIndustry1 || '';
    row[78] = act.workplaceIndustry2 || '';
    row[79] = act.workplaceIndustryOther || '';

    // 法定代理人 (80~87)
    row[80] = act.agent?.name || '';
    row[81] = act.agent?.relationship || '';
    row[82] = formatZipCode(act.agent?.zipCode);
    row[83] = act.agent?.prefecture || '';
    row[84] = act.agent?.city || '';
    row[85] = act.agent?.addressLines || '';
    row[86] = formatPhoneNumber(act.agent?.phone);
    row[87] = formatPhoneNumber(act.agent?.mobilePhone);

    // 取次者 (88~94)
    row[88] = act.agencyRep?.name || '';
    row[89] = formatZipCode(act.agencyRep?.zipCode);
    row[90] = act.agencyRep?.prefecture || '';
    row[91] = act.agencyRep?.city || '';
    row[92] = act.agencyRep?.addressLines || '';
    row[93] = act.agencyRep?.organization || '';
    row[94] = formatPhoneNumber(act.agencyRep?.phone);
  }

  // ─── 就労資格証明書交付申請 (95〜113) ───
  if (sim.authEmploymentCert) {
    const auth = sim.authEmploymentCert;
    row[95] = auth.certificationActivityDescription || '';
    row[96] = formatDateToYYYYMMDD(auth.employmentPeriodStart);
    row[97] = formatDateToYYYYMMDD(auth.employmentPeriodEnd);
    row[98] = auth.purpose || '';

    // 法定代理人 (99~106)
    row[99] = auth.agent?.name || '';
    row[100] = auth.agent?.relationship || '';
    row[101] = formatZipCode(auth.agent?.zipCode);
    row[102] = auth.agent?.prefecture || '';
    row[103] = auth.agent?.city || '';
    row[104] = auth.agent?.addressLines || '';
    row[105] = formatPhoneNumber(auth.agent?.phone);
    row[106] = formatPhoneNumber(auth.agent?.mobilePhone);

    // 取次者 (107~113)
    row[107] = auth.agencyRep?.name || '';
    row[108] = formatZipCode(auth.agencyRep?.zipCode);
    row[109] = auth.agencyRep?.prefecture || '';
    row[110] = auth.agencyRep?.city || '';
    row[111] = auth.agencyRep?.addressLines || '';
    row[112] = auth.agencyRep?.organization || '';
    row[113] = formatPhoneNumber(auth.agencyRep?.phone);
  }

  return createCsvString(SIMULTANEOUS_HEADERS, row);
};
