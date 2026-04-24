import rawDropdowns from '../../../scripts/data-extraction/dropdowns.json';
import { mapOptions, getCityOptions, type SelectOption } from './sharedOptions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawFull = rawDropdowns as Record<string, any>;
const raw = rawFull as Record<string, string[]>;

// ════════════════════════════════════════════════════════════════════════════════
// 連動マップ: { parentPrefix: { parentLabel: childSuffix } }
// generate_coe_cascade_maps.mjs で dropdowns.json に注入されたもの
// ════════════════════════════════════════════════════════════════════════════════
const cascadingMaps = (rawFull._CASCADING_MAPS || {}) as Record<string, Record<string, string>>;

/**
 * カスケード対応の親プレフィックスリテラル型
 * スペルミスによるランタイムエラーを防止する
 */
type CascadeParentPrefix = '_CA94' | '_CC02_3' | '_CC04';

/**
 * 連動ドロップダウンの子リストを取得する汎用関数
 * @param parentPrefix 親リストのプレフィックス (e.g., '_CA94')
 * @param selectedParentValue 親で選択された値（ラベル文字列）
 * @returns 子リストの選択肢配列。親が未選択またはマッピングがない場合は空配列。
 */
export const getChildOptions = (parentPrefix: CascadeParentPrefix, selectedParentValue: string | undefined): SelectOption[] => {
  if (!selectedParentValue) return [];
  const mapping = cascadingMaps[parentPrefix];
  if (!mapping) return [];
  const childSuffix = mapping[selectedParentValue];
  if (!childSuffix) return [];
  const childKey = `${parentPrefix}_${childSuffix}_L`;
  return mapOptions(raw[childKey] || []);
};

// ════════════════════════════════════════════════════════════════════════════════
// COEフォーム用選択肢定義
// ════════════════════════════════════════════════════════════════════════════════
export const coeFormOptions = {
  // === 基本情報 ===
  /** 都道府県 (47件) */
  prefectures: mapOptions(raw._CA69_1_L),
  /** 国籍・地域 */
  nationality: mapOptions(raw._CA61_L),
  /** 入国予定港 */
  entryPort: mapOptions(raw._A024_L),
  /** 在留資格・入国目的 */
  entryPurpose: mapOptions(raw._C970_L),
  /** 在留資格（フォールバック） */
  residenceStatus: mapOptions(raw._C970_L),

  // === フラグ・汎用 ===
  /** 生年月日不明フラグ */
  dateUnknownFlags: mapOptions(raw._A002_L),
  /** 月不詳フラグ */
  monthUnknownFlags: mapOptions(raw._A028_L),
  /** 有/無 (1=有 Yes, 2=無 No) */
  yesNo: [
    { label: raw._A021_L?.[0] || '有 Yes', value: '1' },
    { label: raw._A021_L?.[1] || '無 No', value: '2' },
  ],
  /** 性別 (1=男, 2=女) */
  gender: [
    { label: raw._C611_L?.[0] || '男 male', value: '1' },
    { label: raw._C611_L?.[1] || '女 female', value: '2' },
  ],

  // === 受領・確認 ===
  /** 在留資格認定証明書の受領方法 */
  receiptMethod: [
    { label: '窓口', value: '1' },
    { label: '郵送', value: '2' },
  ],
  /** 申請意思の確認 */
  checkIntent: [
    { label: '確認済', value: '1' },
    { label: '未確認', value: '2' },
  ],

  // === 学歴・専攻 ===
  /** 最終学歴 (_CA79_L: 8件) */
  finalEducation: mapOptions(raw._CA79_L || []),
  /** 専攻・専門分野 (_CA80_L: 24件) */
  majorField: mapOptions(raw._CA80_L || []),
  /** 専修学校の分類 (_CA93_L: 9件) */
  vocationalSchoolCategory: mapOptions(raw._CA93_L || []),

  // === 企業・業種 ===
  /** 業種分類 (_CC13_4_L: 4件) */
  industryClassification: mapOptions(raw._CC13_4_L || []),
  /** 主たる職種 (_CC02_4_L: 9件) */
  mainOccupation: mapOptions(raw._CC02_4_L),
  /** 分野 */
  sector: mapOptions(raw._CA93_L),

  // === 特定技能 ===
  /** 特定技能の分野 (_CC04_L: 19件) */
  specifiedSkilledField: mapOptions(raw._CC04_L || []),

  // === 技能実習 ===
  /** 技能実習の職種 (_CA94_L: 93件) */
  technicalInternOccupation: mapOptions(raw._CA94_L || []),
  /** 技能実習の作業（フラット） (_CC02_3_L: 92件) */
  technicalInternWork: mapOptions(raw._CC02_3_L || []),

  // === プレースホルダー（未使用・将来用） ===
  receivingOffice: [] as SelectOption[],
  relationship: [] as SelectOption[],
  changeReason: [] as SelectOption[],

  // Helper function for getting cities
  getCityOptions,
};

// ════════════════════════════════════════════════════════════════════════════════
// 連動ドロップダウン専用ラッパー関数
// 親の選択値に応じて子リストを動的に返す
// ════════════════════════════════════════════════════════════════════════════════

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
 * 特定技能の分野を選択した際に、対応する業務区分一覧を返す
 * 親: _CC04_L (19分野)  →  子: _CC04_XX_L (各分野の業務区分)
 */
export const getSpecifiedSkilledSubOptions = (selectedField: string | undefined): SelectOption[] =>
  getChildOptions('_CC04', selectedField);
