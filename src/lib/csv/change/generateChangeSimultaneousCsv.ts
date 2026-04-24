import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import {
  boolToYesNo,
  formatDateToYYYYMMDD,
  formatZipCode,
  formatPhoneNumber,
  createCsvString,
} from '../csvUtils';

/**
 * 申請情報入力(同時申請).csv のデータを生成します。
 * 対象となる項目数は全113項目（インデックス 0〜112）です。
 *
 * @param data - ChangeOfStatusApplicationFormData (在留資格変更申請フォームの全データ)
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateChangeSimultaneousCsv = (data: ChangeOfStatusApplicationFormData): string => {
  const f = data.foreignerInfo;
  const sim = data.simultaneousApplication;

  // 113個の要素を持つ配列を生成
  const row: string[] = new Array(113).fill('');

  if (!sim) {
    return createCsvString(CHANGE_SIMULTANEOUS_HEADERS, row);
  }

  // 0: 空ヘッダー列
  row[0] = '';
  // 1: 再入国許可申請の有無
  row[1] = boolToYesNo(sim.applyForReEntry);
  // 2: 資格外活動許可申請の有無
  row[2] = boolToYesNo(sim.applyForActivityOutsideStatus);
  // 3: 就労資格証明書交付申請の有無
  row[3] = boolToYesNo(sim.applyForAuthEmployment);

  // ─── 共通項目（外国人情報） (4〜22) ──────────────────────────────────────
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

  // ─── 再入国許可申請 (23〜56) ──────────────────────────────────────────────
  const re = sim.reEntryPermit;
  if (re) {
    // 23: 渡航目的1
    row[23] = re.travelPurpose1 || '';
    // 24: 渡航目的2
    row[24] = re.travelPurpose2 || '';
    // 25: 渡航目的_その他
    row[25] = re.travelPurposeOther || '';
    // 26: 予定渡航先国名1
    row[26] = re.destinationCountry1 || '';
    // 27: 予定渡航先国名2
    row[27] = re.destinationCountry2 || '';
    // 28: 出国予定年月日(主)
    row[28] = formatDateToYYYYMMDD(re.departureDatePrimary);
    // 29: 出国予定年月日(副)
    row[29] = formatDateToYYYYMMDD(re.departureDateSecondary);
    // 30: 出国予定の日本の(空)港
    row[30] = re.departurePortPrimary || '';
    // 31: 再入国予定年月日(主)
    row[31] = formatDateToYYYYMMDD(re.reEntryDatePrimary);
    // 32: 再入国予定年月日(副)
    row[32] = formatDateToYYYYMMDD(re.reEntryDateSecondary);
    // 33: 再入国予定の日本の(空)港(主)
    row[33] = re.reEntryPortPrimary || '';
    // 34: 再入国予定の日本の(空)港(副)
    row[34] = re.reEntryPortSecondary || '';
    // 35: 希望する再入国許可
    row[35] = re.desiredPermitType || '';
    // 36: 犯罪を理由とする処分を受けたことの有無
    row[36] = boolToYesNo(re.hasCriminalRecord);
    // 37: 犯罪を理由とする処分を受けたことの有無_有_内容入力欄
    row[37] = re.criminalRecordDetail || '';
    // 38: 確定前の刑事裁判の有無
    row[38] = boolToYesNo(re.hasPendingCriminalCase);
    // 39: 確定前の刑事裁判の有無_有_内容入力欄
    row[39] = re.pendingCriminalCaseDetail || '';
    // 40: 旅券を取得することができない場合は、その理由
    row[40] = re.noPassportReason || '';
  }

  // 41〜48: 再入国許可 法定代理人
  const reAgent = sim.reEntryPermit?.agent;
  if (reAgent) {
    row[41] = reAgent.name || '';
    row[42] = reAgent.relationship || '';
    row[43] = formatZipCode(reAgent.zipCode);
    row[44] = reAgent.prefecture || '';
    row[45] = reAgent.city || '';
    row[46] = reAgent.addressLines || '';
    row[47] = formatPhoneNumber(reAgent.phone);
    row[48] = formatPhoneNumber(reAgent.mobilePhone);
  }

  // 49〜55: 再入国許可 取次者
  const reRep = sim.reEntryPermit?.agencyRep;
  if (reRep) {
    row[49] = reRep.name || '';
    row[50] = formatZipCode(reRep.zipCode);
    row[51] = reRep.prefecture || '';
    row[52] = reRep.city || '';
    row[53] = reRep.addressLines || '';
    row[54] = reRep.organization || '';
    row[55] = formatPhoneNumber(reRep.phone);
  }

  // ─── 資格外活動許可申請 (56〜93) ──────────────────────────────────────────
  const act = sim.activityOutsideStatus;
  if (act) {
    // 56: 現在の在留活動の内容
    row[56] = act.currentActivityDescription || '';
    // 57〜59: 他に従事しようとする活動の内容_(1)職務の内容 (最大3件)
    row[57] = act.newActivityJob1 || '';
    row[58] = act.newActivityJob2 || '';
    row[59] = act.newActivityJob3 || '';
    // 60: 雇用契約期間（有無/種別）
    row[60] = (act.newActivityContractYears !== undefined || act.newActivityContractMonths !== undefined) ? '有' : '';
    // 61: 雇用契約期間(年数)
    row[61] = act.newActivityContractYears !== undefined ? String(act.newActivityContractYears) : '';
    // 62: 雇用契約期間(月数)
    row[62] = act.newActivityContractMonths !== undefined ? String(act.newActivityContractMonths) : '';
    // 63: 週間稼働時間1
    row[63] = act.newActivityWeeklyHours1 !== undefined ? String(act.newActivityWeeklyHours1) : '';
    // 64: 週間稼働時間2
    row[64] = act.newActivityWeeklyHours2 !== undefined ? String(act.newActivityWeeklyHours2) : '';
    // 65: 報酬(有無)
    row[65] = boolToYesNo(act.newActivityHasPayment);
    // 66: 月額報酬
    row[66] = act.newActivityMonthlySalary !== undefined ? String(act.newActivityMonthlySalary) : '';
    // 67: 勤務先_(1)名称1
    row[67] = act.workplaceName1 || '';
    // 68: 勤務先_(1)名称2
    row[68] = act.workplaceName2 || '';
    // 69: 勤務先_(2)所在地（概要）
    row[69] = ''; // CSVヘッダーは「所在地」だが、分割入力なので以下で個別設定
    // 70: 勤務先_(2)郵便番号
    row[70] = formatZipCode(act.workplaceZipCode);
    // 71: 勤務先_(2)所在地(都道府県)
    row[71] = act.workplacePrefecture || '';
    // 72: 勤務先_(2)所在地(市区町村)
    row[72] = act.workplaceCity || '';
    // 73: 勤務先_(2)所在地(町名丁目番地号等)
    row[73] = act.workplaceAddressLines || '';
    // 74: 勤務先_(2)電話番号1
    row[74] = formatPhoneNumber(act.workplacePhone1);
    // 75: 勤務先_(2)電話番号2
    row[75] = formatPhoneNumber(act.workplacePhone2);
    // 76: 勤務先_(3)業種1
    row[76] = act.workplaceIndustry1 || '';
    // 77: 勤務先_(3)業種2
    row[77] = act.workplaceIndustry2 || '';
    // 78: 勤務先_(3)業種_その他
    row[78] = act.workplaceIndustryOther || '';
  }

  // 79〜86: 資格外活動 法定代理人
  const actAgent = sim.activityOutsideStatus?.agent;
  if (actAgent) {
    row[79] = actAgent.name || '';
    row[80] = actAgent.relationship || '';
    row[81] = formatZipCode(actAgent.zipCode);
    row[82] = actAgent.prefecture || '';
    row[83] = actAgent.city || '';
    row[84] = actAgent.addressLines || '';
    row[85] = formatPhoneNumber(actAgent.phone);
    row[86] = formatPhoneNumber(actAgent.mobilePhone);
  }

  // 87〜93: 資格外活動 取次者
  const actRep = sim.activityOutsideStatus?.agencyRep;
  if (actRep) {
    row[87] = actRep.name || '';
    row[88] = formatZipCode(actRep.zipCode);
    row[89] = actRep.prefecture || '';
    row[90] = actRep.city || '';
    row[91] = actRep.addressLines || '';
    row[92] = actRep.organization || '';
    row[93] = formatPhoneNumber(actRep.phone);
  }

  // ─── 就労資格証明書交付申請 (94〜112) ─────────────────────────────────────
  const cert = sim.authEmploymentCert;
  if (cert) {
    // 94: 証明を希望する活動の内容
    row[94] = cert.certificationActivityDescription || '';
    // 95: 就労する期間(始期)
    row[95] = formatDateToYYYYMMDD(cert.employmentPeriodStart);
    // 96: 就労する期間(終期)
    row[96] = formatDateToYYYYMMDD(cert.employmentPeriodEnd);
    // 97: 使用目的
    row[97] = cert.purpose || '';
  }

  // 98〜105: 就労資格 法定代理人
  const certAgent = sim.authEmploymentCert?.agent;
  if (certAgent) {
    row[98] = certAgent.name || '';
    row[99] = certAgent.relationship || '';
    row[100] = formatZipCode(certAgent.zipCode);
    row[101] = certAgent.prefecture || '';
    row[102] = certAgent.city || '';
    row[103] = certAgent.addressLines || '';
    row[104] = formatPhoneNumber(certAgent.phone);
    row[105] = formatPhoneNumber(certAgent.mobilePhone);
  }

  // 106〜112: 就労資格 取次者
  const certRep = sim.authEmploymentCert?.agencyRep;
  if (certRep) {
    row[106] = certRep.name || '';
    row[107] = formatZipCode(certRep.zipCode);
    row[108] = certRep.prefecture || '';
    row[109] = certRep.city || '';
    row[110] = certRep.addressLines || '';
    row[111] = certRep.organization || '';
    row[112] = formatPhoneNumber(certRep.phone);
  }

  return createCsvString(CHANGE_SIMULTANEOUS_HEADERS, row);
};

// ─── ヘッダー定数 (113項目) ──────────────────────────────────────────────────
const CHANGE_SIMULTANEOUS_HEADERS: string[] = [
  '',                                                                 // 0
  '同時申請_再入国許可申請の有無',                                        // 1
  '同時申請_資格外活動許可申請の有無',                                     // 2
  '同時申請_就労資格証明書交付申請の有無',                                  // 3
  '共通_国籍・地域',                                                    // 4
  '共通_生年月日',                                                     // 5
  '共通_氏名',                                                        // 6
  '共通_性別',                                                        // 7
  '共通_住居地_郵便番号',                                               // 8
  '共通_住居地(都道府県)',                                               // 9
  '共通_住居地(市区町村)',                                               // 10
  '共通_住居地(町名丁目番地号等)',                                        // 11
  '共通_電話番号',                                                     // 12
  '共通_携帯電話番号',                                                  // 13
  '共通_旅券番号',                                                     // 14
  '共通_旅券有効期限',                                                  // 15
  '共通_現に有する在留資格',                                             // 16
  '共通_在留期間',                                                     // 17
  '共通_在留期間の満了日',                                               // 18
  '共通_在留カードの有無',                                               // 19
  '共通_在留カード番号',                                                 // 20
  '共通_ED番号（英字）',                                                // 21
  '共通_ED番号（数字）',                                                // 22
  '_再入国許可申請_渡航目的1',                                           // 23
  '_再入国許可申請_渡航目的2',                                           // 24
  '_再入国許可申請_渡航目的_その他',                                       // 25
  '_再入国許可申請_予定渡航先国名1',                                       // 26
  '_再入国許可申請_予定渡航先国名2',                                       // 27
  '_再入国許可申請_出国予定年月日(主)',                                     // 28
  '_再入国許可申請_出国予定年月日(副)',                                     // 29
  '_再入国許可申請_出国予定の日本の(空)港',                                  // 30
  '_再入国許可申請_再入国予定年月日',                                      // 31
  '_再入国許可申請_再入国予定年月日',                                      // 32
  '_再入国許可申請_再入国予定の日本の(空)港',                                // 33
  '_再入国許可申請_再入国予定の日本の(空)港',                                // 34
  '_再入国許可申請_希望する再入国許可',                                     // 35
  '_再入国許可申請_犯罪を理由とする処分を受けたことの有無',                     // 36
  '_再入国許可申請_犯罪を理由とする処分を受けたことの有無_有_内容入力欄',          // 37
  '_再入国許可申請_確定前の刑事裁判の有無',                                  // 38
  '_再入国許可申請_確定前の刑事裁判の有無_有_内容入力欄',                       // 39
  '_再入国許可申請_旅券を取得することができない場合は、その理由',                 // 40
  '_再入国許可申請_法定代理人_(1)氏名',                                    // 41
  '_再入国許可申請_法定代理人_(2)本人との関係',                              // 42
  '_再入国許可申請_法定代理人_(3)郵便番号',                                 // 43
  '_再入国許可申請_法定代理人_(3)住所(都道府県)',                            // 44
  '_再入国許可申請_法定代理人_(3)住所(市区町村)',                            // 45
  '_再入国許可申請_法定代理人_(3)住所(町名丁目番地号等)',                      // 46
  '_再入国許可申請_法定代理人_(3)電話番号',                                 // 47
  '_再入国許可申請_法定代理人_(3)携帯電話番号',                              // 48
  '_再入国許可申請_取次者_(1)氏名',                                       // 49
  '_再入国許可申請_取次者_(2)郵便番号',                                    // 50
  '_再入国許可申請_取次者_(2)住所(都道府県)',                               // 51
  '_再入国許可申請_取次者_(2)住所(市区町村)',                               // 52
  '_再入国許可申請_取次者_(2)住所(町名丁目番地号等)',                         // 53
  '_再入国許可申請_取次者_(3)所属機関等',                                   // 54
  '_再入国許可申請_取次者_(3)電話番号',                                    // 55
  '_資格外活動許可申請_現在の在留活動の内容',                                // 56
  '_資格外活動許可申請_他に従事しようとする活動の内容_(1)職務の内容',             // 57
  '_資格外活動許可申請_他に従事しようとする活動の内容_(1)職務の内容',             // 58
  '_資格外活動許可申請_他に従事しようとする活動の内容_(1)職務の内容',             // 59
  '_資格外活動許可申請_他に従事しようとする活動の内容_(2)雇用契約期間',           // 60
  '_資格外活動許可申請_他に従事しようとする活動の内容_(2)雇用契約期間(年数)',       // 61
  '_資格外活動許可申請_他に従事しようとする活動の内容_(2)雇用契約期間(月数)',       // 62
  '_資格外活動許可申請_他に従事しようとする活動の内容_(3)週間稼働時間',           // 63
  '_資格外活動許可申請_他に従事しようとする活動の内容_(3)週間稼働時間',           // 64
  '_資格外活動許可申請_他に従事しようとする活動の内容_(4)報酬',                 // 65
  '_資格外活動許可申請_他に従事しようとする活動の内容_(4)月額報酬',              // 66
  '_資格外活動許可申請_勤務先_(1)名称',                                    // 67
  '_資格外活動許可申請_勤務先_(1)名称',                                    // 68
  '_資格外活動許可申請_勤務先_(2)所在地',                                   // 69
  '_資格外活動許可申請_勤務先_(2)郵便番号',                                 // 70
  '_資格外活動許可申請_勤務先_(2)所在地(都道府県)',                           // 71
  '_資格外活動許可申請_勤務先_(2)所在地(市区町村)',                           // 72
  '_資格外活動許可申請_勤務先_(2)所在地(町名丁目番地号等)',                     // 73
  '_資格外活動許可申請_勤務先_(2)電話番号',                                 // 74
  '_資格外活動許可申請_勤務先_(2)電話番号',                                 // 75
  '_資格外活動許可申請_勤務先_(3)業種',                                    // 76
  '_資格外活動許可申請_勤務先_(3)業種',                                    // 77
  '_資格外活動許可申請_勤務先_(3)業種_その他',                              // 78
  '_資格外活動許可申請_法定代理人_(1)氏名',                                 // 79
  '_資格外活動許可申請_法定代理人_(2)本人との関係',                           // 80
  '_資格外活動許可申請_法定代理人_(3)郵便番号',                              // 81
  '_資格外活動許可申請_法定代理人_(3)住所(都道府県)',                          // 82
  '_資格外活動許可申請_法定代理人_(3)住所(市区町村)',                          // 83
  '_資格外活動許可申請_法定代理人_(3)住所(町名丁目番地号等)',                    // 84
  '_資格外活動許可申請_法定代理人_(3)電話番号',                               // 85
  '_資格外活動許可申請_法定代理人_(3)携帯電話番号',                            // 86
  '_資格外活動許可申請_取次者_(1)氏名',                                     // 87
  '_資格外活動許可申請_取次者_(2)郵便番号',                                  // 88
  '_資格外活動許可申請_取次者_(2)住所(都道府県)',                              // 89
  '_資格外活動許可申請_取次者_(2)住所(市区町村)',                              // 90
  '_資格外活動許可申請_取次者_(2)住所(町名丁目番地号等)',                        // 91
  '_資格外活動許可申請_取次者_(3)所属機関等',                                 // 92
  '_資格外活動許可申請_取次者_(3)電話番号',                                  // 93
  '就労資格証明書交付申請_証明を希望する活動の内容',                            // 94
  '就労資格証明書交付申請_就労する期間(始期)',                                 // 95
  '就労資格証明書交付申請_就労する期間(終期)',                                 // 96
  '就労資格証明書交付申請_使用目的',                                         // 97
  '就労資格証明書交付申請_法定代理人_(1)氏名',                                // 98
  '就労資格証明書交付申請_法定代理人_(2)本人との関係',                          // 99
  '就労資格証明書交付申請_法定代理人_(3)郵便番号',                             // 100
  '就労資格証明書交付申請_法定代理人_(3)住所(都道府県)',                         // 101
  '就労資格証明書交付申請_法定代理人_(3)住所(市区町村)',                         // 102
  '就労資格証明書交付申請_法定代理人_(3)住所(町名丁目番地号等)',                   // 103
  '就労資格証明書交付申請_法定代理人_(3)電話番号',                              // 104
  '就労資格証明書交付申請_法定代理人_(3)携帯電話番号',                           // 105
  '就労資格証明書交付申請_取次者_(1)氏名',                                    // 106
  '就労資格証明書交付申請_取次者_(2)郵便番号',                                 // 107
  '就労資格証明書交付申請_取次者_(2)住所(都道府県)',                            // 108
  '就労資格証明書交付申請_取次者_(2)住所(市区町村)',                            // 109
  '就労資格証明書交付申請_取次者_(2)住所(町名丁目番地号等)',                      // 110
  '就労資格証明書交付申請_取次者_(3)所属機関等',                               // 111
  '就労資格証明書交付申請_取次者_(3)電話番号',                                 // 112
];
