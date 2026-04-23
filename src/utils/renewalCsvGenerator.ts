import Encoding from 'encoding-japanese';
import { z } from 'zod';
import { foreignerInfoSchema } from '@/lib/schemas/renewalApplicationSchema';
import { formOptions } from '@/lib/constants/formOptions';

type ForeignerInfo = z.infer<typeof foreignerInfoSchema>;

/**
 * selectのvalue（ID等）からラベル文字列を引くヘルパー
 */
const getLabel = (value: string | undefined | null, options: { value: string, label: string }[]) => {
  if (!value) return '';
  const option = options.find(o => o.value === value);
  return option ? option.label : value;
};

/**
 * CSVの各フィールドを適切にエスケープする
 */
const escapeCsvString = (val: string | number | boolean | null | undefined): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // カンマ、ダブルクォート、改行が含まれる場合はダブルクォートで囲む
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * booleanを「有」「無」に変換する
 */
const formatBoolean = (val: boolean | undefined): string => {
  if (val === undefined) return '';
  return val ? '有' : '無';
};

/**
 * 性別を変換する
 */
const formatGender = (val: 'male' | 'female' | undefined): string => {
  if (val === 'male') return '男';
  if (val === 'female') return '女';
  return '';
};

/**
 * 配偶者の有無を変換する
 */
const formatMaritalStatus = (val: 'married' | 'unmarried' | undefined): string => {
  if (val === 'married') return '有';
  if (val === 'unmarried') return '無';
  return '';
};

/**
 * 受領方法を変換する
 */
const formatReceiptMethod = (val: 'window' | 'post' | undefined): string => {
  if (val === 'window') return '窓口等での受領を希望';
  if (val === 'post') return '郵送による受領を希望';
  return '';
};

/**
 * 在留期間更新許可申請_1（外国人本人情報）のデータを政府指定のCSV（Shift-JIS）に変換するジェネレーター
 * @param data Zodでバリデーション済みのデータ
 * @returns Shift-JISエンコードされたCSVのUint8Array
 */
export const generateRenewalCsv = (data: ForeignerInfo): Uint8Array => {
  // 1行ヘッダーの正確な定義 (109項目)
  const headers = [
    '身分事項_国籍・地域',
    '身分事項_生年月日',
    '身分事項_氏名',
    '身分事項_性別',
    '身分事項_配偶者の有無',
    '身分事項_職業',
    '身分事項_本国における居住地',
    '身分事項_日本における連絡先_郵便番号',
    '身分事項_日本における住居地(都道府県)',
    '身分事項_日本における住居地(市区町村)',
    '身分事項_日本における住居地(町名丁目番地号等)',
    '身分事項_日本における連絡先_電話番号',
    '身分事項_日本における連絡先_携帯電話番号',
    '身分事項_メールアドレス',
    '身分事項_旅券_（1）番号',
    '身分事項_旅券_（2）有効期限',
    '身分事項_現に有する在留資格',
    '身分事項_在留期間',
    '身分事項_在留期間の満了日',
    '身分事項_在留カードの有無',
    '身分事項_在留カード番号',
    '身分事項_ED番号（英字）',
    '身分事項_ED番号（数字）',
    '身分事項_希望する在留期間',
    '身分事項_更新の理由',
    '身分事項_犯罪を理由とする処分を受けたことの有無',
    '身分事項_犯罪を理由とする処分を受けたことの有無_有_内容入力欄',
    '身分事項_在日親族及び同居者_有無',
    // 在日親族及び同居者1〜6
    ...Array.from({ length: 6 }).flatMap((_, index) => [
      `身分事項_在日親族及び同居者${index + 1}_在日親族及び同居者_続柄`,
      `身分事項_在日親族及び同居者${index + 1}_在日親族及び同居者_氏名`,
      `身分事項_在日親族及び同居者${index + 1}_在日親族及び同居者_生年月日`,
      `身分事項_在日親族及び同居者${index + 1}_在日親族及び同居者_国籍・地域`,
      `身分事項_在日親族及び同居者${index + 1}_在日親族及び同居者_同居の有無`,
      `身分事項_在日親族及び同居者${index + 1}_在日親族及び同居者_勤務先名称・通学先名称`,
      `身分事項_在日親族及び同居者${index + 1}_在日親族及び同居者_在留カード番号_特別永住者証明書番号`,
    ]),
    '受領方法等_在留カードの受領方法',
    '受領方法等_申請対象者の住居地',
    '受領方法等_受領官署',
    '受領方法等_通知送信用メールアドレス',
    '入力情報確認_申請に先立ち、申請者本人に申請の意思を確認してください。',
    '入力情報確認_フリー欄',
  ];

  // 親族情報を6人分パディング
  const relatives = Array.from({ length: 6 }).map((_, i) => data.relatives?.[i] || {});

  // 1行のデータ行を作成
  const rowData = [
    getLabel(data.nationality, formOptions.nationality),
    data.birthDate,
    data.nameEn,
    formatGender(data.gender),
    formatMaritalStatus(data.maritalStatus),
    data.occupation,
    data.homeCountryAddress,
    data.japanZipCode,
    data.japanPrefecture,
    data.japanCity,
    data.japanAddressLines,
    data.phoneNumber,
    data.mobileNumber,
    data.email,
    data.passportNumber,
    data.passportExpiryDate,
    getLabel(data.currentResidenceStatus, formOptions.residenceStatus),
    data.currentStayPeriod,
    data.stayExpiryDate,
    formatBoolean(data.hasResidenceCard),
    data.residenceCardNumber,
    data.edNumberAlpha,
    data.edNumberNumeric,
    data.desiredStayPeriod === 'other' ? data.desiredStayPeriodOther : data.desiredStayPeriod,
    data.renewalReason,
    formatBoolean(data.criminalRecord),
    data.criminalRecordDetail,
    formatBoolean(data.hasRelatives),
    // 親族情報1〜6の展開
    ...relatives.flatMap(r => [
      r.relationship,
      r.name,
      r.birthDate,
      r.nationality,
      r.cohabitation !== undefined ? formatBoolean(r.cohabitation) : '',
      r.workplace,
      r.residenceCardNumber,
    ]),
    formatReceiptMethod(data.residenceCardReceiptMethod),
    data.applicantResidencePlace,
    data.receivingOffice,
    data.notificationEmail,
    formatBoolean(data.checkIntent),
    data.freeFormat,
  ];

  // CSV文字列の生成（ヘッダーとデータの結合）
  const csvString = [
    headers.map(escapeCsvString).join(','),
    rowData.map(escapeCsvString).join(','),
  ].join('\n');

  // String を Unicode CharCode配列に変換
  const unicodeArray = Encoding.stringToCode(csvString);
  
  // Shift-JIS に変換（Windows Excel等での文字化け防止）
  const sjisArray = Encoding.convert(unicodeArray, 'SJIS', 'UNICODE');
  
  return new Uint8Array(sjisArray);
};

/**
 * ブラウザ上でCSVをダウンロードするためのヘルパー関数
 * @param data Zodでバリデーション済みのデータ
 * @param filename ダウンロードするファイル名 (省略時は default.csv)
 */
export const downloadRenewalCsv = (data: ForeignerInfo, filename = '申請情報入力(在留期間更新許可申請)_1.csv') => {
  const uint8Array = generateRenewalCsv(data);
  const blob = new Blob([uint8Array.buffer as ArrayBuffer], { type: 'text/csv' });
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  
  document.body.appendChild(a);
  a.click();
  
  // クリーンアップ
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
