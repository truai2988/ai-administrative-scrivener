import rawDropdowns from '../../../dropdowns.json';
import rawDropdownsRenewal from './dropdowns_renewal.json';
import rawDropdownsChange from './dropdowns_change.json';

export interface SelectOption {
  label: string;
  value: string;
}

const mapOptions = (arr: string[] | undefined): SelectOption[] => 
  Array.isArray(arr) ? arr.map(item => ({ label: item, value: item })) : [];

export const formOptions = {
  // 国籍・地域
  nationality: mapOptions((rawDropdownsChange as Record<string, string[]>).nationality || rawDropdowns._CA61_L),
  
  // 入国予定港
  entryPort: mapOptions(rawDropdowns._A024_L),

  // 在留資格・入国目的
  entryPurpose: mapOptions(rawDropdowns._C970_L),
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

  // --- 更新申請(Renewal)固有のリスト ---
  receivingOffice: mapOptions((rawDropdownsRenewal as Record<string, string[]>).receivingOffice || []),
  relationship: mapOptions((rawDropdownsRenewal as Record<string, string[]>).relationship || []),

  // --- 変更申請(Change)固有のリスト ---
  changeReason: mapOptions((rawDropdownsChange as Record<string, string[]>).reasonForChange || []),
};
