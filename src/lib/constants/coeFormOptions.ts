import rawDropdowns from '../../../scripts/data-extraction/dropdowns.json';
import { mapOptions, getCityOptions } from './sharedOptions';

export const coeFormOptions = {
  // 都道府県
  prefectures: mapOptions(rawDropdowns._CA69_1_L),

  // 国籍・地域
  nationality: mapOptions(rawDropdowns._CA61_L),
  
  // 入国予定港
  entryPort: mapOptions(rawDropdowns._A024_L),

  // 在留資格・入国目的
  entryPurpose: mapOptions(rawDropdowns._C970_L),
  residenceStatus: mapOptions(rawDropdowns._C970_L), // Fallback if used
  
  // 主たる職種
  mainOccupation: mapOptions(rawDropdowns._CC02_4_L),
  
  // 分野（特定技能などの分野）
  sector: mapOptions(rawDropdowns._CA93_L),

  // 生年月日に不明な点は無い / 年月日不詳 などのフラグ
  dateUnknownFlags: mapOptions(rawDropdowns._A002_L),
  
  // 月不詳などのフラグ
  monthUnknownFlags: mapOptions(rawDropdowns._A028_L),

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

  receivingOffice: [],
  relationship: [],
  changeReason: [],

  // Helper function for getting cities
  getCityOptions,
};
