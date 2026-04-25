import { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import {
  boolToYesNo,
  formatDateToYYYYMMDD,
  formatZipCode,
  formatPhoneNumber,
  createCsvString,
} from './csvUtils';

/**
 * 申請情報入力(在留期間更新許可申請).csv のデータを生成します。
 * 政府テンプレート準拠: 全76項目（インデックス 0〜75）
 * 
 * @param data - RenewalApplicationFormData (Zodスキーマ準拠の申請フォーム全データ)
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateBasicCsv = (data: RenewalApplicationFormData): string => {
  const f = data.foreignerInfo;

  // 政府テンプレート準拠: 76個の要素を持つ配列を生成
  const row: string[] = new Array(76).fill('');

  // 0: 身分事項_国籍・地域
  row[0] = f.nationality || '';
  // 1: 身分事項_生年月日
  row[1] = formatDateToYYYYMMDD(f.birthDate);
  // 2: 身分事項_氏名
  row[2] = f.nameEn || '';
  // 3: 身分事項_性別
  row[3] = f.gender === 'male' ? '男' : f.gender === 'female' ? '女' : '';
  // 4: 身分事項_配偶者の有無
  row[4] = f.maritalStatus === 'married' ? '有' : f.maritalStatus === 'unmarried' ? '無' : '';
  // 5: 身分事項_職業
  row[5] = f.occupation || '';
  // 6: 身分事項_本国における居住地
  row[6] = f.homeCountryAddress || '';
  // 7: 身分事項_日本における連絡先_郵便番号
  row[7] = formatZipCode(f.japanZipCode);
  // 8: 身分事項_日本における住居地(都道府県)
  row[8] = f.japanPrefecture || '';
  // 9: 身分事項_日本における住居地(市区町村)
  row[9] = f.japanCity || '';
  // 10: 身分事項_日本における住居地(町名丁目番地号等)
  row[10] = f.japanAddressLines || '';
  // 11: 身分事項_日本における連絡先_電話番号
  row[11] = formatPhoneNumber(f.phoneNumber);
  // 12: 身分事項_日本における連絡先_携帯電話番号
  row[12] = formatPhoneNumber(f.mobileNumber);
  // 13: 身分事項_メールアドレス
  row[13] = f.email || '';
  // 14: 身分事項_旅券_（1）番号
  row[14] = f.passportNumber || '';
  // 15: 身分事項_旅券_（2）有効期限
  row[15] = formatDateToYYYYMMDD(f.passportExpiryDate);
  // 16: 身分事項_現に有する在留資格
  row[16] = f.currentResidenceStatus || '';
  // 17: 身分事項_在留期間
  row[17] = f.currentStayPeriod || '';
  // 18: 身分事項_在留期間の満了日
  row[18] = formatDateToYYYYMMDD(f.stayExpiryDate);
  // 19: 身分事項_在留カードの有無
  row[19] = boolToYesNo(f.hasResidenceCard);
  // 20: 身分事項_在留カード番号
  row[20] = f.residenceCardNumber || '';
  // 21: 身分事項_ED番号（英字）
  row[21] = f.edNumberAlpha || '';
  // 22: 身分事項_ED番号（数字）
  row[22] = f.edNumberNumeric || '';
  
  // 23: 身分事項_希望する在留期間
  if (f.desiredStayPeriod === '4months') row[23] = '4か月';
  else if (f.desiredStayPeriod === '6months') row[23] = '6か月';
  else if (f.desiredStayPeriod === '1year') row[23] = '1年';
  else if (f.desiredStayPeriod === 'other') row[23] = f.desiredStayPeriodOther || '';

  // 24: 身分事項_更新の理由
  row[24] = f.renewalReason || '';
  // 25: 身分事項_犯罪を理由とする処分を受けたことの有無
  row[25] = boolToYesNo(f.criminalRecord);
  // 26: 身分事項_犯罪を理由とする処分を受けたことの有無_有_内容入力欄
  row[26] = f.criminalRecordDetail || '';
  
  // 27: 身分事項_在日親族及び同居者_有無
  row[27] = boolToYesNo(f.hasRelatives);

  // 28〜69: 親族・同居者 (最大6名 x 7項目 = 42項目)
  const relatives = f.relatives || [];
  for (let i = 0; i < 6; i++) {
    const offset = 28 + i * 7;
    const rel = relatives[i];
    if (rel) {
      row[offset] = rel.relationship || '';
      row[offset + 1] = rel.name || '';
      row[offset + 2] = formatDateToYYYYMMDD(rel.birthDate);
      row[offset + 3] = rel.nationality || '';
      row[offset + 4] = boolToYesNo(rel.cohabitation);
      row[offset + 5] = rel.workplace || '';
      row[offset + 6] = rel.residenceCardNumber || '';
    }
  }

  // 70: 受領方法等_在留カードの受領方法
  if (f.residenceCardReceiptMethod === 'window') {
    row[70] = '窓口での受領を希望';
  } else if (f.residenceCardReceiptMethod === 'post') {
    row[70] = '郵送による受領を希望';
  }

  // 71: 受領方法等_申請対象者の住居地
  row[71] = f.applicantResidencePlace || '';
  // 72: 受領方法等_受領官署
  row[72] = f.receivingOffice || '';
  // 73: 受領方法等_通知送信用メールアドレス
  row[73] = f.notificationEmail || '';
  // 74: 入力情報確認_申請に先立ち、申請者本人に申請の意思を確認してください。
  row[74] = boolToYesNo(f.checkIntent);
  // 75: 入力情報確認_フリー欄
  row[75] = f.freeFormat || '';

  // ヘッダー行 (政府テンプレート準拠: 76項目)
  const headers: string[] = [
    '身分事項_国籍・地域', '身分事項_生年月日', '身分事項_氏名', '身分事項_性別',
    '身分事項_配偶者の有無', '身分事項_職業', '身分事項_本国における居住地',
    '身分事項_日本における連絡先_郵便番号', '身分事項_日本における住居地(都道府県)',
    '身分事項_日本における住居地(市区町村)', '身分事項_日本における住居地(町名丁目番地号等)',
    '身分事項_日本における連絡先_電話番号', '身分事項_日本における連絡先_携帯電話番号',
    '身分事項_メールアドレス', '身分事項_旅券_（1）番号', '身分事項_旅券_（2）有効期限',
    '身分事項_現に有する在留資格', '身分事項_在留期間', '身分事項_在留期間の満了日',
    '身分事項_在留カードの有無', '身分事項_在留カード番号', '身分事項_ED番号（英字）',
    '身分事項_ED番号（数字）', '身分事項_希望する在留期間', '身分事項_更新の理由',
    '身分事項_犯罪を理由とする処分を受けたことの有無', '身分事項_犯罪を理由とする処分を受けたことの有無_有_内容入力欄',
    '身分事項_在日親族及び同居者_有無'
  ];

  for (let i = 1; i <= 6; i++) {
    headers.push(
      `身分事項_在日親族及び同居者${i}_在日親族及び同居者_続柄`,
      `身分事項_在日親族及び同居者${i}_在日親族及び同居者_氏名`,
      `身分事項_在日親族及び同居者${i}_在日親族及び同居者_生年月日`,
      `身分事項_在日親族及び同居者${i}_在日親族及び同居者_国籍・地域`,
      `身分事項_在日親族及び同居者${i}_在日親族及び同居者_同居の有無`,
      `身分事項_在日親族及び同居者${i}_在日親族及び同居者_勤務先名称・通学先名称`,
      `身分事項_在日親族及び同居者${i}_在日親族及び同居者_在留カード番号_特別永住者証明書番号`
    );
  }

  headers.push(
    '受領方法等_在留カードの受領方法',
    '受領方法等_申請対象者の住居地',
    '受領方法等_受領官署',
    '受領方法等_通知送信用メールアドレス',
    '入力情報確認_申請に先立ち、申請者本人に申請の意思を確認してください。',
    '入力情報確認_フリー欄',
  );

  return createCsvString(headers, row);
};
