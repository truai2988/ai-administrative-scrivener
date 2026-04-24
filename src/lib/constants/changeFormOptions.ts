import rawDropdownsChange from './dropdowns_change.json';
import { mapOptions, getCityOptions } from './sharedOptions';

const raw = rawDropdownsChange as Record<string, string[]>;

export const changeFormOptions = {
  prefectures: mapOptions(raw._C619_C || []),
  nationality: mapOptions(raw._CA61_2_C || []),
  entryPort: [], // not used in change
  entryPurpose: [], // not used in change
  mainOccupation: [], // not used in change
  sector: [], // not used in change
  dateUnknownFlags: mapOptions(raw._A002_C || []),
  monthUnknownFlags: [], // not correctly extracted, maybe not needed
  residenceStatus: mapOptions(raw._C970_C || []),
  
  yesNo: [
    { label: raw._A021_C?.[0] || '有 Yes', value: '1' },
    { label: raw._A021_C?.[1] || '無 No', value: '2' },
  ],
  gender: [
    { label: raw._C611_C?.[0] || '男 male', value: '1' },
    { label: raw._C611_C?.[1] || '女 female', value: '2' },
  ],
  receiptMethod: [
    { label: '窓口', value: '1' },
    { label: '郵送', value: '2' },
  ],
  checkIntent: [
    { label: '確認済', value: '1' },
    { label: '未確認', value: '2' },
  ],

  receivingOffice: [], // usually not extracted cleanly
  relationship: mapOptions(raw._CB06_1_C || []),
  changeReason: [], // usually not extracted cleanly

  // Helper function for getting cities
  getCityOptions,
};
