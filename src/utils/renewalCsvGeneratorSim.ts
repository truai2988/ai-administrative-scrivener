import Encoding from 'encoding-japanese';
import { z } from 'zod';
import { simultaneousApplicationSchema } from '@/lib/schemas/renewalApplicationSchema';

type SimultaneousApplication = z.infer<typeof simultaneousApplicationSchema>;

const escapeCsvString = (val: string | number | boolean | null | undefined): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatBoolean = (val: boolean | undefined): string => {
  if (val === undefined) return '';
  return val ? '有' : '無';
};

const formatGender = (val: 'male' | 'female' | undefined): string => {
  if (val === 'male') return '男';
  if (val === 'female') return '女';
  return '';
};

export const generateRenewalCsvSimultaneous = (data: SimultaneousApplication | undefined): Uint8Array => {
    const headers = [
    '',
    '共通項目_同時申請種別選択_再入国許可申請_Re-entry_permit',
    '共通項目_同時申請種別選択_資格外活動許可申請_Permit_to_engage_in_activity_other_than_that_permitted_by_the_status_of_residence_previous',
    '共通項目_同時申請種別選択_就労資格証明書交付申請_Certificate_of_authorized_employment',
    '共通項目_国籍・地域',
    '共通項目_生年月日',
    '共通項目_氏名',
    '共通項目_性別',
    '共通項目_住居地_郵便番号',
    '共通項目_住居地(都道府県)',
    '共通項目_住居地(市区町村)',
    '共通項目_住居地(町名丁目番地号等)',
    '共通項目_電話番号',
    '共通項目_携帯電話番号',
    '共通項目_旅券_(1)番号',
    '共通項目_旅券_(2)有効期限',
    '共通項目_現に有する在留資格',
    '共通項目_在留期間',
    '共通項目_在留期間の満了日',
    '共通項目_在留カードの有無',
    '共通項目_在留カード番号_/_特別永住者証明書番号',
    '共通項目_ED番号(英字)',
    '共通項目_ED番号(数字)',
    '_再入国許可申請_渡航目的',
    '_再入国許可申請_渡航目的',
    '_再入国許可申請_渡航目的_その他',
    '_再入国許可申請_予定渡航先国名',
    '_再入国許可申請_予定渡航先国名',
    '_再入国許可申請_出国予定年月日',
    '_再入国許可申請_出国予定年月日',
    '_再入国許可申請_出国予定の日本の(空)港',
    '_再入国許可申請_出国予定の日本の(空)港',
    '_再入国許可申請_再入国予定年月日',
    '_再入国許可申請_再入国予定年月日',
    '_再入国許可申請_再入国予定の日本の(空)港',
    '_再入国許可申請_再入国予定の日本の(空)港',
    '_再入国許可申請_希望する再入国許可',
    '_再入国許可申請_犯罪を理由とする処分を受けたことの有無',
    '_再入国許可申請_犯罪を理由とする処分を受けたことの有無_有_内容入力欄',
    '_再入国許可申請_確定前の刑事裁判の有無',
    '_再入国許可申請_確定前の刑事裁判の有無_有_内容入力欄',
    '_再入国許可申請_旅券を取得することができない場合は、その理由',
    '_再入国許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(1)氏名',
    '_再入国許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(2)本人との関係',
    '_再入国許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)郵便番号',
    '_再入国許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)住所(都道府県)',
    '_再入国許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)住所(市区町村)',
    '_再入国許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)住所(町名丁目番地号等)',
    '_再入国許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)電話番号',
    '_再入国許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)携帯電話番号',
    '_再入国許可申請_取次者_取次者(オンラインシステム利用者)_(1)氏名',
    '_再入国許可申請_取次者_取次者_(2)郵便番号',
    '_再入国許可申請_取次者_取次者_(2)住所(都道府県)',
    '_再入国許可申請_取次者_取次者_(2)住所(市区町村)',
    '_再入国許可申請_取次者_取次者_(2)住所(町名丁目番地号等)',
    '_再入国許可申請_取次者_取次者_(3)所属機関等',
    '_再入国許可申請_取次者_取次者_(3)電話番号',
    '_資格外活動許可申請_現在の在留活動の内容',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(1)職務の内容',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(1)職務の内容',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(1)職務の内容',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(2)雇用契約期間',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(2)雇用契約期間(年数)',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(2)雇用契約期間(月数)',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(3)週間稼働時間',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(3)週間稼働時間',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(4)報酬',
    '_資格外活動許可申請_他に従事しようとする活動の内容_(4)月額報酬',
    '_資格外活動許可申請_勤務先_(1)名称',
    '_資格外活動許可申請_勤務先_(1)名称',
    '_資格外活動許可申請_勤務先_(2)所在地',
    '_資格外活動許可申請_勤務先_(2)郵便番号',
    '_資格外活動許可申請_勤務先_(2)所在地(都道府県)',
    '_資格外活動許可申請_勤務先_(2)所在地(市区町村)',
    '_資格外活動許可申請_勤務先_(2)所在地(町名丁目番地号等)',
    '_資格外活動許可申請_勤務先_(2)電話番号',
    '_資格外活動許可申請_勤務先_(2)電話番号',
    '_資格外活動許可申請_勤務先_(3)業種',
    '_資格外活動許可申請_勤務先_(3)業種',
    '_資格外活動許可申請_勤務先_(3)業種_その他',
    '_資格外活動許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(1)氏名',
    '_資格外活動許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(2)本人との関係',
    '_資格外活動許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)郵便番号',
    '_資格外活動許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)住所(都道府県)',
    '_資格外活動許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)住所(市区町村)',
    '_資格外活動許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)住所(町名丁目番地号等)',
    '_資格外活動許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)電話番号',
    '_資格外活動許可申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)携帯電話番号',
    '_資格外活動許可申請_取次者_取次者(オンラインシステム利用者)_(1)氏名',
    '_資格外活動許可申請_取次者_取次者_(2)郵便番号',
    '_資格外活動許可申請_取次者_取次者_(2)住所(都道府県)',
    '_資格外活動許可申請_取次者_取次者_(2)住所(市区町村)',
    '_資格外活動許可申請_取次者_取次者_(2)住所(町名丁目番地号等)',
    '_資格外活動許可申請_取次者_取次者_(3)所属機関等',
    '_資格外活動許可申請_取次者_取次者_(3)電話番号',
    '就労資格証明書交付申請_証明を希望する活動の内容',
    '就労資格証明書交付申請_就労する期間(始期)',
    '就労資格証明書交付申請_就労する期間(終期)',
    '就労資格証明書交付申請_使用目的',
    '就労資格証明書交付申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(1)氏名',
    '就労資格証明書交付申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(2)本人との関係',
    '就労資格証明書交付申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)郵便番号',
    '就労資格証明書交付申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)住所(都道府県)',
    '就労資格証明書交付申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)住所(市区町村)',
    '就労資格証明書交付申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)住所(町名丁目番地号等)',
    '就労資格証明書交付申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)電話番号',
    '就労資格証明書交付申請_法定代理人（法定代理人による申請の場合に記入）_法定代理人_(3)携帯電話番号',
    '就労資格証明書交付申請_取次者_取次者(オンラインシステム利用者)_(1)氏名',
    '就労資格証明書交付申請_取次者_取次者_(2)郵便番号',
    '就労資格証明書交付申請_取次者_取次者_(2)住所(都道府県)',
    '就労資格証明書交付申請_取次者_取次者_(2)住所(市区町村)',
    '就労資格証明書交付申請_取次者_取次者_(2)住所(町名丁目番地号等)',
    '就労資格証明書交付申請_取次者_取次者_(3)所属機関等',
    '就労資格証明書交付申請_取次者_取次者_(3)電話番号',
  ];

  if (!data) {
    // データがない場合は空の列を出力
    const rowData = Array(headers.length).fill('');
    const csvString = [headers.map(escapeCsvString).join(','), rowData.join(',')].join('\n');
    const unicodeArray = Encoding.stringToCode(csvString);
    const sjisArray = Encoding.convert(unicodeArray, 'SJIS', 'UNICODE');
    return new Uint8Array(sjisArray);
  }

  const { commonInfo = {}, reEntryPermit = {}, activityOutsideStatus = {}, authEmploymentCert = {} } = data;

  const rowData = [
    // 0-2 同時申請種別選択
    formatBoolean(data.applyForReEntry),
    formatBoolean(data.applyForActivityOutsideStatus),
    formatBoolean(data.applyForAuthEmployment),
    
    // 3-21 共通項目
    commonInfo.nationality,
    commonInfo.birthDate,
    commonInfo.nameEn,
    formatGender(commonInfo.gender),
    commonInfo.zipCode,
    commonInfo.prefecture,
    commonInfo.city,
    commonInfo.addressLines,
    commonInfo.phone,
    commonInfo.mobilePhone,
    commonInfo.passportNumber,
    commonInfo.passportExpiryDate,
    commonInfo.currentResidenceStatus,
    commonInfo.currentStayPeriod,
    commonInfo.stayExpiryDate,
    formatBoolean(commonInfo.hasResidenceCard),
    commonInfo.residenceCardNumber,
    commonInfo.edNumberAlpha,
    commonInfo.edNumberNumeric,

    // 22-55 再入国許可申請
    reEntryPermit.travelPurpose1, // _再入国許可申請_渡航目的
    reEntryPermit.travelPurpose2, // _再入国許可申請_渡航目的 (重複)
    reEntryPermit.travelPurposeOther, // _再入国許可申請_渡航目的_その他
    reEntryPermit.destinationCountry1, // 予定渡航先国名
    reEntryPermit.destinationCountry2, // 重複
    reEntryPermit.departureDatePrimary, // 出国予定年月日
    reEntryPermit.departureDateSecondary, // 重複
    reEntryPermit.departurePortPrimary, // 出国予定港
    reEntryPermit.departurePortSecondary, // 重複
    reEntryPermit.reEntryDatePrimary, // 再入国予定年月日
    reEntryPermit.reEntryDateSecondary, // 重複
    reEntryPermit.reEntryPortPrimary, // 再入国予定港
    reEntryPermit.reEntryPortSecondary, // 重複
    reEntryPermit.desiredPermitType, // 希望する再入国許可
    formatBoolean(reEntryPermit.hasCriminalRecord), // 犯罪処分
    reEntryPermit.criminalRecordDetail, // 犯罪処分詳細
    formatBoolean(reEntryPermit.hasPendingCriminalCase), // 確定前刑事裁判
    reEntryPermit.pendingCriminalCaseDetail, // 確定前刑事裁判詳細
    reEntryPermit.noPassportReason, // 旅券取得不可理由
    reEntryPermit.agent?.name, // 法定代理人
    reEntryPermit.agent?.relationship,
    reEntryPermit.agent?.zipCode,
    reEntryPermit.agent?.prefecture,
    reEntryPermit.agent?.city,
    reEntryPermit.agent?.addressLines,
    reEntryPermit.agent?.phone,
    reEntryPermit.agent?.mobilePhone,
    reEntryPermit.agencyRep?.name, // 取次者
    reEntryPermit.agencyRep?.zipCode,
    reEntryPermit.agencyRep?.prefecture,
    reEntryPermit.agencyRep?.city,
    reEntryPermit.agencyRep?.addressLines,
    reEntryPermit.agencyRep?.organization,
    reEntryPermit.agencyRep?.phone,

    // 56-93 資格外活動許可申請
    activityOutsideStatus.currentActivityDescription, // 現在の在留活動の内容
    activityOutsideStatus.newActivityJob1, // 他に従事しようとする活動_職務の内容 (1)
    activityOutsideStatus.newActivityJob2, // 他に従事しようとする活動_職務の内容 (1) 重複枠
    activityOutsideStatus.newActivityJob3, // 他に従事しようとする活動_職務の内容 (1) 重複枠
    "", // 雇用契約期間 (プレースホルダーとして空)
    activityOutsideStatus.newActivityContractYears, // 雇用契約期間(年数)
    activityOutsideStatus.newActivityContractMonths, // 雇用契約期間(月数)
    activityOutsideStatus.newActivityWeeklyHours1, // 週間稼働時間
    activityOutsideStatus.newActivityWeeklyHours2, // 週間稼働時間 (重複)
    formatBoolean(activityOutsideStatus.newActivityHasPayment), // 報酬
    activityOutsideStatus.newActivityMonthlySalary, // 月額報酬
    activityOutsideStatus.workplaceName1, // 勤務先名称
    activityOutsideStatus.workplaceName2, // 勤務先名称 (重複)
    "", // 勤務先(2)所在地 (プレースホルダー)
    activityOutsideStatus.workplaceZipCode, // 郵便番号
    activityOutsideStatus.workplacePrefecture, // 都道府県
    activityOutsideStatus.workplaceCity, // 市区町村
    activityOutsideStatus.workplaceAddressLines, // 住所
    activityOutsideStatus.workplacePhone1, // 電話番号
    activityOutsideStatus.workplacePhone2, // 電話番号 (重複)
    activityOutsideStatus.workplaceIndustry1, // 業種
    activityOutsideStatus.workplaceIndustry2, // 業種 (重複)
    activityOutsideStatus.workplaceIndustryOther, // 業種_その他
    activityOutsideStatus.agent?.name, // 法定代理人
    activityOutsideStatus.agent?.relationship,
    activityOutsideStatus.agent?.zipCode,
    activityOutsideStatus.agent?.prefecture,
    activityOutsideStatus.agent?.city,
    activityOutsideStatus.agent?.addressLines,
    activityOutsideStatus.agent?.phone,
    activityOutsideStatus.agent?.mobilePhone,
    activityOutsideStatus.agencyRep?.name, // 取次者
    activityOutsideStatus.agencyRep?.zipCode,
    activityOutsideStatus.agencyRep?.prefecture,
    activityOutsideStatus.agencyRep?.city,
    activityOutsideStatus.agencyRep?.addressLines,
    activityOutsideStatus.agencyRep?.organization,
    activityOutsideStatus.agencyRep?.phone,

    // 94-112 就労資格証明書交付申請
    authEmploymentCert.certificationActivityDescription, // 証明を希望する活動の内容
    authEmploymentCert.employmentPeriodStart, // 就労する期間(始期)
    authEmploymentCert.employmentPeriodEnd, // 就労する期間(終期)
    authEmploymentCert.purpose, // 使用目的
    authEmploymentCert.agent?.name, // 法定代理人
    authEmploymentCert.agent?.relationship,
    authEmploymentCert.agent?.zipCode,
    authEmploymentCert.agent?.prefecture,
    authEmploymentCert.agent?.city,
    authEmploymentCert.agent?.addressLines,
    authEmploymentCert.agent?.phone,
    authEmploymentCert.agent?.mobilePhone,
    authEmploymentCert.agencyRep?.name, // 取次者
    authEmploymentCert.agencyRep?.zipCode,
    authEmploymentCert.agencyRep?.prefecture,
    authEmploymentCert.agencyRep?.city,
    authEmploymentCert.agencyRep?.addressLines,
    authEmploymentCert.agencyRep?.organization,
    authEmploymentCert.agencyRep?.phone,
  ];

  const csvString = [
    headers.map(escapeCsvString).join(','),
    rowData.map(escapeCsvString).join(','),
  ].join('\n');

  const unicodeArray = Encoding.stringToCode(csvString);
  const sjisArray = Encoding.convert(unicodeArray, 'SJIS', 'UNICODE');
  return new Uint8Array(sjisArray);
};

export const downloadRenewalCsvSimultaneous = (data: SimultaneousApplication | undefined, filename = '申請情報入力(同時申請)_1.csv') => {
  const uint8Array = generateRenewalCsvSimultaneous(data);
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
