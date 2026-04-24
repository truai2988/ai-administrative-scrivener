import rawDropdowns from '../../../dropdowns.json';
import rawDropdownsRenewal from './dropdowns_renewal.json';
import rawDropdownsChange from './dropdowns_change.json';
import citiesMapData from '../../../cities_map.json';

export interface SelectOption {
  label: string;
  value: string;
}

const mapOptions = (arr: string[] | undefined): SelectOption[] => 
  Array.isArray(arr) ? arr.map(item => ({ label: item, value: item })) : [];

export const citiesMap = citiesMapData as Record<string, string[]>;

export const getCityOptions = (prefecture: string): SelectOption[] => {
  const cities = citiesMap[prefecture];
  return mapOptions(cities);
};

export const formOptions = {
  // 都道府県
  prefectures: mapOptions(rawDropdowns._CA69_1_L),

  // 国籍・地域
  nationality: mapOptions((rawDropdownsChange as Record<string, string[]>).nationality || rawDropdowns._CA61_L),
  
  // 入国予定港
  entryPort: mapOptions(rawDropdowns._A024_L),

  // 在留資格・入国目的
  entryPurpose: mapOptions(rawDropdowns._C970_L),
  
  // 主たる職種 (技術・人文知識・国際業務、技能 など)
  // _CC02_4_L, _CC11_2_L などを汎用職種として利用（ここでは _CC02_4_L を採用）
  mainOccupation: mapOptions(rawDropdowns._CC02_4_L),
  
  // 分野（特定技能などの分野）
  sector: mapOptions(rawDropdowns._CA93_L), // もしくは _CC04_L などを必要に応じて

  // 生年月日に不明な点は無い / 年月日不詳 などのフラグ
  dateUnknownFlags: mapOptions(rawDropdowns._A002_L),
  
  // 月不詳などのフラグ
  monthUnknownFlags: mapOptions(rawDropdowns._A028_L),

  // 変更申請用の在留資格マスタ (Book2の MENU_SEL を使用)
  residenceStatus: mapOptions((rawDropdownsChange as Record<string, string[]>).desiredStatus || []),

  // 1=有, 2=無 の汎用ラジオ/セレクトマッピング
  yesNo: [
    { label: rawDropdowns._A021_L?.[0] || '有 Yes', value: '1' },
    { label: rawDropdowns._A021_L?.[1] || '無 No', value: '2' },
  ],

  // 性別 (1=男, 2=女)
  gender: [
    { label: rawDropdowns._C611_L?.[0] || '男 male', value: '1' },
    { label: rawDropdowns._C611_L?.[1] || '女 female', value: '2' },
  ],

  // 在留資格認定証明書の受領方法 (1=窓口, 2=郵送)
  receiptMethod: [
    { label: '窓口', value: '1' },
    { label: '郵送', value: '2' },
  ],

  // 申請意思の確認 (1=確認済, 2=未確認)
  checkIntent: [
    { label: '確認済', value: '1' },
    { label: '未確認', value: '2' },
  ],

  // --- 更新申請(Renewal)固有のリスト ---
  receivingOffice: mapOptions((rawDropdownsRenewal as Record<string, string[]>).receivingOffice || []),
  relationship: mapOptions(rawDropdowns._CB06_L || (rawDropdownsRenewal as Record<string, string[]>).relationship || []),

  // --- 変更申請(Change)固有のリスト ---
  changeReason: mapOptions((rawDropdownsChange as Record<string, string[]>).reasonForChange || []),
};
