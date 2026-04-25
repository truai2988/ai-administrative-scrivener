import rawDropdownsRenewal from './dropdowns_renewal.json';
import { mapOptions, getCityOptions, type SelectOption } from './sharedOptions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawFull = rawDropdownsRenewal as Record<string, any>;
const raw = rawFull as Record<string, string[]>;

// ════════════════════════════════════════════════════════════════════════════════
// 連動マップ: { parentPrefix: { parentLabel: childSuffix } }
// generate_renewal_cascade_maps.mjs で dropdowns_renewal.json に注入されたもの
// ════════════════════════════════════════════════════════════════════════════════
const cascadingMaps = (rawFull._CASCADING_MAPS || {}) as Record<string, Record<string, string>>;

/**
 * カスケード対応の親プレフィックスリテラル型
 * スペルミスによるランタイムエラーを防止する
 */
type RenewalCascadePrefix =
  | '_CC04'     // 特定技能分野 → 業務区分
  | '_CA94'     // 技能実習の職種 → 作業
  | '_CC02_3'   // 技能実習の職種(別テーブル) → 作業
  | '_CB19'     // 現に有する在留資格 → 在留期間
  | '_CB19_0'   // 希望する在留資格 → 在留期間
  | '_CC02_1'   // 主たる職種（特定技能1号）→ 詳細
  | '_CC02_5'   // 主たる職種（特定技能5）→ 詳細
  | '_CC13_1'   // 業種分類1 → 事業内容
  | '_CC13_2'   // 業種分類2 → 事業内容
  | '_CC52_1';  // 在留資格サブカテゴリ → 詳細区分

/**
 * 連動ドロップダウンの子リストを取得する汎用関数
 * @param parentPrefix 親リストのプレフィックス (e.g., '_CC04')
 * @param selectedParentValue 親で選択された値（ラベル文字列）
 * @returns 子リストの選択肢配列。親が未選択またはマッピングがない場合は空配列。
 */
export const getChildOptions = (parentPrefix: RenewalCascadePrefix, selectedParentValue: string | undefined): SelectOption[] => {
  if (!selectedParentValue) return [];
  const mapping = cascadingMaps[parentPrefix];
  if (!mapping) return [];
  const childSuffix = mapping[selectedParentValue];
  if (!childSuffix) return [];
  const childKey = `${parentPrefix}_${childSuffix}_L`;
  return mapOptions(raw[childKey] || []);
};

// ════════════════════════════════════════════════════════════════════════════════
// 連動ドロップダウン専用ラッパー関数
// 引数は string | undefined を許容し、undefined の場合は空配列 [] を返す
// ════════════════════════════════════════════════════════════════════════════════

/**
 * 特定技能の分野を選択した際に、対応する業務区分一覧を返す
 * 親: _CC04_L (19分野)  →  子: _CC04_XX_L (各分野の業務区分)
 */
export const getSpecifiedSkilledSubOptions = (selectedField: string | undefined): SelectOption[] =>
  getChildOptions('_CC04', selectedField);

/**
 * 技能実習の職種を選択した際に、対応する作業一覧を返す
 * 親: _CA94_L (93種の職種)  →  子: _CA94_XXX_L (各職種の作業)
 */
export const getTechnicalInternWorkOptions = (selectedOccupation: string | undefined): SelectOption[] =>
  getChildOptions('_CA94', selectedOccupation);

/**
 * 技能実習の職種（別テーブル: _CC02_3）を選択した際に、作業一覧を返す
 * 親: _CC02_3_L (92種の職種)  →  子: _CC02_3_LXX_L (各職種の作業)
 */
export const getTechnicalInternWorkOptions2 = (selectedOccupation: string | undefined): SelectOption[] =>
  getChildOptions('_CC02_3', selectedOccupation);

/**
 * 現に有する在留資格を選択した際に、対応する在留期間一覧を返す
 * 親: _CB19_L (34種の在留資格)  →  子: _CB19_TXX_L (各在留資格の在留期間)
 */
export const getStayPeriodByStatus = (selectedStatus: string | undefined): SelectOption[] =>
  getChildOptions('_CB19', selectedStatus);

/**
 * 希望する在留資格を選択した際に、対応する在留期間一覧を返す
 * 親: _CB19_0_L (34種の在留資格)  →  子: _CB19_0_TXX_L (各在留資格の在留期間)
 */
export const getDesiredStayPeriodByStatus = (selectedStatus: string | undefined): SelectOption[] =>
  getChildOptions('_CB19_0', selectedStatus);

/**
 * 主たる職種（特定技能1号）を選択した際に、対応する詳細一覧を返す
 * 親: _CC02_1_L (18種の職種)  →  子: _CC02_1_04XX_L (各職種の詳細)
 */
export const getOccupationSubOptions1 = (selectedOccupation: string | undefined): SelectOption[] =>
  getChildOptions('_CC02_1', selectedOccupation);

/**
 * 主たる職種（特定技能5）を選択した際に、対応する詳細一覧を返す
 * 親: _CC02_5_L (4種の職種)  →  子: _CC02_5_04XX_L (各職種の詳細)
 */
export const getOccupationSubOptions5 = (selectedOccupation: string | undefined): SelectOption[] =>
  getChildOptions('_CC02_5', selectedOccupation);

/**
 * 業種分類1を選択した際に、対応する事業内容一覧を返す
 * 親: _CC13_1_L (19種)  →  子: _CC13_1_04XX_L (各業種の事業内容)
 */
export const getIndustrySubOptions1 = (selectedIndustry: string | undefined): SelectOption[] =>
  getChildOptions('_CC13_1', selectedIndustry);

/**
 * 業種分類2を選択した際に、対応する事業内容一覧を返す
 * 親: _CC13_2_L (27種)  →  子: _CC13_2_04XX_L (各業種の事業内容)
 */
export const getIndustrySubOptions2 = (selectedIndustry: string | undefined): SelectOption[] =>
  getChildOptions('_CC13_2', selectedIndustry);

// ════════════════════════════════════════════════════════════════════════════════
// Renewalフォーム用選択肢定義
// ════════════════════════════════════════════════════════════════════════════════
export const renewalFormOptions = {
  prefectures: mapOptions(raw._C619_C || []),
  nationality: mapOptions(raw._CA61_2_C || []),
  entryPort: [] as SelectOption[],
  entryPurpose: [] as SelectOption[],
  mainOccupation: [] as SelectOption[],
  sector: [] as SelectOption[],
  dateUnknownFlags: mapOptions(raw._A002_C || []),
  monthUnknownFlags: [] as SelectOption[],
  residenceStatus: mapOptions(raw._C970_C || []),

  // === 在留資格（カスケード用の _L 版） ===
  /** 現に有する在留資格 (_CB19_L: 34件) — カスケードの親として使用 */
  currentResidenceStatusCascade: mapOptions(raw._CB19_L || []),

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
  ],
  relationship: mapOptions(raw._CB06_1_C || []),
  changeReason: [] as SelectOption[],

  // === 特定技能 ===
  /** 特定技能の分野 (_CC04_L: 19件) — カスケードの親として使用 */
  specifiedSkilledField: mapOptions(raw._CC04_L || []),

  // === 技能実習 ===
  /** 技能実習の職種 (_CA94_L: 93件) — カスケードの親として使用 */
  technicalInternOccupation: mapOptions(raw._CA94_L || []),

  // === 業種分類 ===
  /** 主たる職種（特定技能1号）(_CC02_1_L: 18件) */
  mainOccupation1: mapOptions(raw._CC02_1_L || []),
  /** 業種分類1 (_CC13_1_L: 19件) */
  industryClassification1: mapOptions(raw._CC13_1_L || []),
  /** 業種分類2 (_CC13_2_L: 27件) */
  industryClassification2: mapOptions(raw._CC13_2_L || []),

  // Helper function for getting cities
  getCityOptions,

  // カスケードラッパー関数を直接エクスポート
  getSpecifiedSkilledSubOptions,
  getTechnicalInternWorkOptions,
  getStayPeriodByStatus,
  getDesiredStayPeriodByStatus,
  getOccupationSubOptions1,
  getIndustrySubOptions1,
  getIndustrySubOptions2,
};
