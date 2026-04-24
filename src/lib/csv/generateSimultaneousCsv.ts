import { RenewalApplicationForm } from '@/types/renewalApplication';
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
 * 
 * @param data - RenewalApplicationForm (申請フォームの全データ)
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateSimultaneousCsv = (data: RenewalApplicationForm): string => {
  const f = data.foreignerInfo;
  const emp = data.employerInfo;
  const sim = data.simultaneousApplication;

  // 114個の要素を持つ配列を生成
  const row: string[] = new Array(114).fill('');

  if (!sim) {
    // 同時申請データが存在しない場合は空行を返す（必要に応じてヘッダーのみ返すなども可）
    return createCsvString(SIMULTANEOUS_HEADERS, row);
  }

  // 0: 空のヘッダー列
  row[0] = '';

  // 1〜3: 同時申請種別選択
  row[1] = boolToYesNo(sim.applyForReEntry);
  row[2] = boolToYesNo(sim.applyForActivityOutsideStatus);
  row[3] = boolToYesNo(sim.applyForAuthEmployment);

  // 4〜22: 共通項目（外国人情報）
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
  row[19] = boolToYesNo(f.hasResidenceCard);
  row[20] = f.residenceCardNumber || '';
  row[21] = f.edNumberAlpha || '';
  row[22] = f.edNumberNumeric || '';

  // ─── 再入国許可申請 (23〜56) ───
  if (sim.reEntryDetails) {
    row[23] = sim.reEntryDetails.purpose || '';
    row[24] = ''; // 重複列スキップ
    row[25] = ''; // 渡航目的_その他
    row[26] = sim.reEntryDetails.destinationCountry || '';
    row[27] = ''; // 重複列スキップ
    row[28] = formatDateToYYYYMMDD(sim.reEntryDetails.departureDate);
    row[29] = ''; // 重複列スキップ
    row[30] = sim.reEntryDetails.departurePort || '';
    row[31] = ''; // 重複列スキップ
    row[32] = formatDateToYYYYMMDD(sim.reEntryDetails.arrivalDate);
    row[33] = ''; // 重複列スキップ
    row[34] = sim.reEntryDetails.arrivalPort || '';
    row[35] = ''; // 重複列スキップ
    row[36] = sim.reEntryDetails.permitType === 'single' ? '一次再入国許可' : sim.reEntryDetails.permitType === 'multiple' ? '数次再入国許可' : '';
  }
  
  row[37] = boolToYesNo(f.criminalRecord);
  row[38] = f.criminalRecordDetail || '';
  row[39] = ''; // 確定前の刑事裁判の有無 (UI未定義)
  row[40] = ''; // 内容入力欄
  row[41] = ''; // 旅券を取得することができない理由 (UI未定義)

  // 法定代理人 (再入国) -> AgentInfo
  if (emp.agent) {
    row[42] = emp.agent.name || '';
    row[43] = emp.agent.relationship || '';
    row[44] = formatZipCode(emp.agent.zipCode);
    row[45] = emp.agent.addressPref || '';
    row[46] = emp.agent.addressCity || '';
    row[47] = emp.agent.addressStreet || '';
    row[48] = formatPhoneNumber(emp.agent.phone);
    row[49] = formatPhoneNumber(emp.agent.mobile);
  }

  // 取次者 (再入国) -> IntermediaryInfo
  if (emp.intermediary) {
    row[50] = emp.intermediary.name || '';
    row[51] = formatZipCode(emp.intermediary.zipCode);
    row[52] = emp.intermediary.addressPref || '';
    row[53] = emp.intermediary.addressCity || '';
    row[54] = emp.intermediary.addressStreet || '';
    row[55] = emp.intermediary.organization || '';
    row[56] = formatPhoneNumber(emp.intermediary.phone);
  }

  // ─── 資格外活動許可申請 (57〜94) ───
  if (sim.activityOutsideDetails) {
    row[57] = sim.activityOutsideDetails.currentActivity || '';
    row[58] = sim.activityOutsideDetails.otherActivityJob || '';
    row[59] = ''; // 重複列スキップ
    row[60] = ''; // 重複列スキップ
    row[61] = ''; // 雇用契約期間 (UIは単一の時間等で管理)
    row[62] = ''; // 年数
    row[63] = ''; // 月数
    row[64] = sim.activityOutsideDetails.otherActivityHours ? String(sim.activityOutsideDetails.otherActivityHours) : '';
    row[65] = ''; // 重複列スキップ
    row[66] = sim.activityOutsideDetails.otherActivitySalary ? String(sim.activityOutsideDetails.otherActivitySalary) : '';
    row[67] = ''; // 重複列スキップ
    row[68] = sim.activityOutsideDetails.employerName || '';
    row[69] = ''; // 重複列スキップ
    row[70] = sim.activityOutsideDetails.employerAddress || ''; // UIで一つにまとめている所在地
    row[71] = ''; // 分割郵便番号スキップ
    row[72] = ''; // 分割都道府県スキップ
    row[73] = ''; // 分割市区町村スキップ
    row[74] = ''; // 分割町名等スキップ
    row[75] = formatPhoneNumber(sim.activityOutsideDetails.employerPhone);
    row[76] = ''; // 重複列スキップ
    row[77] = ''; // 業種 (UI未定義)
    row[78] = ''; // 重複列スキップ
    row[79] = ''; // 業種_その他
  }

  // 法定代理人 (資格外活動) -> AgentInfo を再利用
  if (emp.agent) {
    row[80] = emp.agent.name || '';
    row[81] = emp.agent.relationship || '';
    row[82] = formatZipCode(emp.agent.zipCode);
    row[83] = emp.agent.addressPref || '';
    row[84] = emp.agent.addressCity || '';
    row[85] = emp.agent.addressStreet || '';
    row[86] = formatPhoneNumber(emp.agent.phone);
    row[87] = formatPhoneNumber(emp.agent.mobile);
  }

  // 取次者 (資格外活動) -> IntermediaryInfo を再利用
  if (emp.intermediary) {
    row[88] = emp.intermediary.name || '';
    row[89] = formatZipCode(emp.intermediary.zipCode);
    row[90] = emp.intermediary.addressPref || '';
    row[91] = emp.intermediary.addressCity || '';
    row[92] = emp.intermediary.addressStreet || '';
    row[93] = emp.intermediary.organization || '';
    row[94] = formatPhoneNumber(emp.intermediary.phone);
  }

  // ─── 就労資格証明書交付申請 (95〜113) ───
  if (sim.authEmploymentDetails) {
    row[95] = sim.authEmploymentDetails.proofActivity || '';
    row[96] = formatDateToYYYYMMDD(sim.authEmploymentDetails.workingStartDate);
    row[97] = formatDateToYYYYMMDD(sim.authEmploymentDetails.workingEndDate);
    row[98] = sim.authEmploymentDetails.usagePurpose || '';
  }

  // 法定代理人 (就労資格) -> AgentInfo を再利用
  if (emp.agent) {
    row[99] = emp.agent.name || '';
    row[100] = emp.agent.relationship || '';
    row[101] = formatZipCode(emp.agent.zipCode);
    row[102] = emp.agent.addressPref || '';
    row[103] = emp.agent.addressCity || '';
    row[104] = emp.agent.addressStreet || '';
    row[105] = formatPhoneNumber(emp.agent.phone);
    row[106] = formatPhoneNumber(emp.agent.mobile);
  }

  // 取次者 (就労資格) -> IntermediaryInfo を再利用
  if (emp.intermediary) {
    row[107] = emp.intermediary.name || '';
    row[108] = formatZipCode(emp.intermediary.zipCode);
    row[109] = emp.intermediary.addressPref || '';
    row[110] = emp.intermediary.addressCity || '';
    row[111] = emp.intermediary.addressStreet || '';
    row[112] = emp.intermediary.organization || '';
    row[113] = formatPhoneNumber(emp.intermediary.phone);
  }

  return createCsvString(SIMULTANEOUS_HEADERS, row);
};
