import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import {
  boolToYesNo,
  formatDateToYYYYMMDD,
  formatZipCode,
  formatPhoneNumber,
  createCsvString,
} from '../csvUtils';

/**
 * 申請情報入力(在留資格変更許可申請).csv のデータを生成します。
 * 対象となる項目数は全78項目（インデックス 0〜77）です。
 *
 * @param data - ChangeOfStatusApplicationFormData (在留資格変更申請フォームの全データ)
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateChangeBasicCsv = (data: ChangeOfStatusApplicationFormData): string => {
  const f = data.foreignerInfo;

  // 必須要件: 78個の要素を持つ配列を生成
  const row: string[] = new Array(78).fill('');

  // ─── 身分事項 (0〜28) ──────────────────────────────────────────────────────
  // 0: 身分事項_国籍・地域
  row[0] = f.nationality || '';
  // 1: 身分事項_生年月日
  row[1] = formatDateToYYYYMMDD(f.birthDate);
  // 2: 身分事項_氏名
  row[2] = f.nameEn || '';
  // 3: 身分事項_性別
  row[3] = f.gender === 'male' ? '男' : f.gender === 'female' ? '女' : '';
  // 4: 身分事項_出生地
  row[4] = f.birthPlace || '';
  // 5: 身分事項_配偶者の有無
  row[5] = f.maritalStatus === 'married' ? '有' : f.maritalStatus === 'unmarried' ? '無' : '';
  // 6: 身分事項_職業
  row[6] = f.occupation || '';
  // 7: 身分事項_本国における居住地
  row[7] = f.homeCountryAddress || '';
  // 8: 身分事項_日本における連絡先_郵便番号
  row[8] = formatZipCode(f.japanZipCode);
  // 9: 身分事項_日本における連絡先_住居地(都道府県)
  row[9] = f.japanPrefecture || '';
  // 10: 身分事項_日本における連絡先_住居地(市区町村)
  row[10] = f.japanCity || '';
  // 11: 身分事項_日本における連絡先_住居地(町名丁目番地号等)
  row[11] = f.japanAddressLines || '';
  // 12: 身分事項_日本における連絡先_電話番号
  row[12] = formatPhoneNumber(f.phoneNumber);
  // 13: 身分事項_日本における連絡先_携帯電話番号
  row[13] = formatPhoneNumber(f.mobileNumber);
  // 14: 身分事項_メールアドレス
  row[14] = f.email || '';
  // 15: 身分事項_旅券_(1)番号
  row[15] = f.passportNumber || '';
  // 16: 身分事項_旅券_(2)有効期限
  row[16] = formatDateToYYYYMMDD(f.passportExpiryDate);
  // 17: 身分事項_現に有する在留資格
  row[17] = f.currentResidenceStatus || '';
  // 18: 身分事項_在留期間
  row[18] = f.currentStayPeriod || '';
  // 19: 身分事項_在留期間の満了日
  row[19] = formatDateToYYYYMMDD(f.stayExpiryDate);
  // 20: 身分事項_在留カードの有無
  row[20] = boolToYesNo(f.hasResidenceCard);
  // 21: 身分事項_在留カード番号
  row[21] = f.residenceCardNumber || '';
  // 22: 身分事項_ED番号（英字）
  row[22] = f.edNumberAlpha || '';
  // 23: 身分事項_ED番号（数字）
  row[23] = f.edNumberNumeric || '';
  // 24: 身分事項_希望する在留資格
  row[24] = f.desiredResidenceStatus || '';
  // 25: 身分事項_希望する在留期間
  row[25] = f.desiredStayPeriod === 'その他' ? (f.desiredStayPeriodOther || '') : (f.desiredStayPeriod || '');
  // 26: 身分事項_変更の理由
  row[26] = f.changeReason || '';
  // 27: 身分事項_犯罪を理由とする処分を受けたことの有無
  row[27] = boolToYesNo(f.criminalRecord);
  // 28: 身分事項_犯罪を理由とする処分を受けたことの有無_有_内容入力欄
  row[28] = f.criminalRecordDetail || '';

  // ─── 在日親族及び同居者 (29〜71) ──────────────────────────────────────────
  // 29: 身分事項_在日親族及び同居者_有無
  row[29] = boolToYesNo(f.hasRelatives);

  // 30〜71: 親族・同居者 (最大6名 x 7項目 = 42項目)
  const relatives = f.relatives || [];
  for (let i = 0; i < 6; i++) {
    const offset = 30 + i * 7;
    const rel = relatives[i];
    if (rel) {
      // offset+0: 続柄
      row[offset] = rel.relationship || '';
      // offset+1: 氏名
      row[offset + 1] = rel.name || '';
      // offset+2: 生年月日
      row[offset + 2] = formatDateToYYYYMMDD(rel.birthDate);
      // offset+3: 国籍・地域
      row[offset + 3] = rel.nationality || '';
      // offset+4: 同居の有無
      row[offset + 4] = boolToYesNo(rel.cohabitation);
      // offset+5: 勤務先名称・通学先名称
      row[offset + 5] = rel.workplace || '';
      // offset+6: 在留カード番号_特別永住者証明書番号
      row[offset + 6] = rel.residenceCardNumber || '';
    }
    // else: 初期化済みの空文字を維持
  }

  // ─── 受領方法等 (72〜77) ──────────────────────────────────────────────────
  // 72: 受領方法等_在留カードの受領方法
  if (f.residenceCardReceiptMethod === 'window') {
    row[72] = '窓口での受領を希望';
  } else if (f.residenceCardReceiptMethod === 'post') {
    row[72] = '郵送による受領を希望';
  }
  // 73: 受領方法等_申請対象者の住居地
  row[73] = f.applicantResidencePlace || '';
  // 74: 受領方法等_受領官署
  row[74] = f.receivingOffice || '';
  // 75: 受領方法等_通知送信用メールアドレス
  row[75] = f.notificationEmail || '';
  // 76: 入力情報確認_申請に先立ち、申請者本人に申請の意思を確認してください。
  row[76] = boolToYesNo(f.checkIntent);
  // 77: 入力情報確認_フリー欄
  row[77] = f.freeFormat || '';

  // ─── ヘッダー行 (78項目) ──────────────────────────────────────────────────
  const headers: string[] = [
    '身分事項_国籍・地域',                          // 0
    '身分事項_生年月日',                             // 1
    '身分事項_氏名',                                // 2
    '身分事項_性別',                                // 3
    '身分事項_出生地',                               // 4
    '身分事項_配偶者の有無',                          // 5
    '身分事項_職業',                                // 6
    '身分事項_本国における居住地',                      // 7
    '身分事項_日本における連絡先_郵便番号',               // 8
    '身分事項_日本における連絡先_住居地(都道府県)',         // 9
    '身分事項_日本における連絡先_住居地(市区町村)',         // 10
    '身分事項_日本における連絡先_住居地(町名丁目番地号等)',   // 11
    '身分事項_日本における連絡先_電話番号',               // 12
    '身分事項_日本における連絡先_携帯電話番号',            // 13
    '身分事項_メールアドレス',                         // 14
    '身分事項_旅券_(1)番号',                          // 15
    '身分事項_旅券_(2)有効期限',                       // 16
    '身分事項_現に有する在留資格',                      // 17
    '身分事項_在留期間',                             // 18
    '身分事項_在留期間の満了日',                       // 19
    '身分事項_在留カードの有無',                       // 20
    '身分事項_在留カード番号',                         // 21
    '身分事項_ED番号（英字）',                        // 22
    '身分事項_ED番号（数字）',                        // 23
    '身分事項_希望する在留資格',                       // 24
    '身分事項_希望する在留期間',                       // 25
    '身分事項_変更の理由',                            // 26
    '身分事項_犯罪を理由とする処分を受けたことの有無',       // 27
    '身分事項_犯罪を理由とする処分を受けたことの有無_有_内容入力欄', // 28
    '身分事項_在日親族及び同居者_有無',                   // 29
  ];

  // 親族ヘッダー (6名 x 7項目 = 42ヘッダー)
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
    '受領方法等_在留カードの受領方法',                   // 72
    '受領方法等_申請対象者の住居地',                     // 73
    '受領方法等_受領官署',                              // 74
    '受領方法等_通知送信用メールアドレス',                 // 75
    '入力情報確認_申請に先立ち、申請者本人に申請の意思を確認してください。', // 76
    '入力情報確認_フリー欄',                            // 77
  );

  return createCsvString(headers, row);
};
