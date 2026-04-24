import rawDropdownsRenewal from './dropdowns_renewal.json';
import { mapOptions, getCityOptions } from './sharedOptions';

const raw = rawDropdownsRenewal as Record<string, string[]>;

export const renewalFormOptions = {
  prefectures: mapOptions(raw._C619_C || []),
  nationality: mapOptions(raw._CA61_2_C || []),
  entryPort: [], // not used in renewal?
  entryPurpose: [], // not used in renewal?
  mainOccupation: [], // not used in renewal?
  sector: [], // not used in renewal?
  dateUnknownFlags: mapOptions(raw._A002_C || []),
  monthUnknownFlags: [], // not correctly extracted, maybe not needed
  residenceStatus: mapOptions(raw._C970_C || []),
  
  yesNo: [
    { label: raw._A021_C?.[0] || '有 Yes', value: '1' },
    { label: raw._A021_C?.[1] || '無 No', value: '2' },
  ],
  gender: [
    { label: raw._C611_C?.[0] || '男 male', value: 'male' },
    { label: raw._C611_C?.[1] || '女 female', value: 'female' },
  ],
  maritalStatus: [
    { label: '有', value: 'married' },
    { label: '無', value: 'unmarried' },
  ],
  desiredStayPeriod: [
    { value: '4months', label: '4ヶ月 (4 months)' },
    { value: '6months', label: '6ヶ月 (6 months)' },
    { value: '1year', label: '1年 (1 year)' },
    { value: 'other', label: 'その他 (Other)' },
  ],
  specificSkillCategory: [
    { value: '1', label: '1号 (Type 1)' },
    { value: '2', label: '2号 (Type 2)' },
  ],
  skillCertMethod: [
    { value: 'exam', label: '試験合格 (Passed Exam)' },
    { value: 'technical_intern', label: '技能実習2号良好修了 (Completed Technical Intern Training (ii))' },
    { value: 'none', label: '免除 (Exempt)' },
  ],
  receiptMethod: [
    { label: '窓口', value: 'window' },
    { label: '郵送', value: 'post' },
  ],
  checkIntent: [
    { label: '確認済', value: '1' },
    { label: '未確認', value: '2' },
  ],
  agentDeliveryInfo: [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
  ],
  paymentMethod: [
    { label: '現金 (Cash)', value: 'cash' },
    { label: '銀行振込 (Bank Transfer)', value: 'bank_transfer' },
  ],

  receivingOffice: [
    { label: '東京出入国在留管理局', value: '東京出入国在留管理局' },
    { label: '名古屋出入国在留管理局', value: '名古屋出入国在留管理局' },
    { label: '大阪出入国在留管理局', value: '大阪出入国在留管理局' },
  ], // usually not extracted cleanly
  relationship: mapOptions(raw._CB06_1_C || []),
  changeReason: [], // not used in renewal

  // Helper function for getting cities
  getCityOptions,
};
