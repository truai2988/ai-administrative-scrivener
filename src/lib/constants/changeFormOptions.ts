import rawDropdownsChange from './dropdowns_change.json';
import { mapOptions, getCityOptions, type SelectOption } from './sharedOptions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawFull = rawDropdownsChange as Record<string, any>;
const raw = rawFull as Record<string, string[]>;

// 連動マップ: { parentPrefix: { parentLabel: childSuffix } }
const cascadingMaps = (rawFull._CASCADING_MAPS || {}) as Record<string, Record<string, string>>;

/**
 * 連動ドロップダウンの子リストを取得する汎用関数
 * @param parentPrefix 親リストのプレフィックス (e.g., '_CA94')
 * @param selectedParentValue 親で選択された値（ラベル文字列）
 * @returns 子リストの選択肢配列。親が未選択またはマッピングがない場合は空配列。
 */
export const getChildOptions = (parentPrefix: string, selectedParentValue: string | undefined): SelectOption[] => {
  if (!selectedParentValue) return [];
  const mapping = cascadingMaps[parentPrefix];
  if (!mapping) return [];
  const childSuffix = mapping[selectedParentValue];
  if (!childSuffix) return [];
  const childKey = `${parentPrefix}_${childSuffix}_L`;
  return mapOptions(raw[childKey] || []);
};

export const changeFormOptions = {
  // === 基本情報 ===
  /** 都道府県 (55件) */
  prefectures: mapOptions(raw._C619_C || []),
  /** 国籍・地域 (197件) */
  nationality: mapOptions(raw._CA61_C || []),
  /** 性別: 男 male / 女 female */
  gender: [
    { label: raw._C611_C?.[0] || '男 male', value: '1' },
    { label: raw._C611_C?.[1] || '女 female', value: '2' },
  ],
  /** 配偶者の有無: 有 Yes / 無 No */
  yesNo: [
    { label: raw._A021_C?.[0] || '有 Yes', value: '1' },
    { label: raw._A021_C?.[1] || '無 No', value: '2' },
  ],
  /** 有 Yes / 無 No (_A045) */
  yesNoA045: mapOptions(raw._A045_C || []),
  /** 生年月日の不明フラグ (4件) */
  dateUnknownFlags: mapOptions(raw._A002_C || []),
  /** 月不詳フラグ (2件) */
  monthUnknownFlags: mapOptions(raw._A028_C || []),
  /** 携行時期不明フラグ (4件) */
  carryDateUnknownFlags: mapOptions(raw._A033_C || []),

  // === 在留資格・在留期間 ===
  /** 在留資格＋在留期間 (324件) */
  residenceStatus: mapOptions(raw._C970_C || []),
  /** 申請メニュー選択 (26件) */
  menuSelection: mapOptions(raw.MENU_SEL || []),
  /** 変更を希望する在留資格 (_CB19_0: 34件 - 全カテゴリ網羅) */
  desiredStatusOfResidence1: mapOptions(raw._CB19_0_C || []),
  /** 現に有する在留資格 (_CB19_L: 36件) */
  currentStatusOfResidence: mapOptions(raw._CB19_C || []),
  /** 在留資格 - 親族 (_CB19_3: 39件) */
  statusOfResidence3: mapOptions(raw._CB19_3_C || []),
  /** 在留資格 - 家族 (_CB19_4: 39件) */
  statusOfResidence4: mapOptions(raw._CB19_4_C || []),
  /** 在留資格 - 一般 (_CB19_5: 35件) */
  statusOfResidence5: mapOptions(raw._CB19_5_C || []),
  /** 在留資格 - 公用等 (_CB19_2: 9件) */
  statusOfResidence2: mapOptions(raw._CB19_2_C || []),

  // === 届出・申請関連 ===
  /** 受取方法: 郵送 / 窓口 */
  receiptMethod: mapOptions(raw._CB22_C || []),
  /** 申請の意思確認 */
  checkIntent: mapOptions(raw._A019_C || []),
  /** 同時申請 (3件) */
  simultaneousApplication: mapOptions(raw._CB24_C || []),
  /** 地方出入国在留管理局 (66件) */
  receivingOffice: mapOptions(raw._CB52_C || []),

  // === 家族・身元関係 ===
  /** 続柄 - 日本人の配偶者等 (_CB06_1: 7件) */
  relationship1: mapOptions(raw._CB06_1_C || []),
  /** 続柄 - 在日親族 (_CB06_2: 29件) */
  relationship2: mapOptions(raw._CB06_2_C || []),
  /** 続柄 - 一般 (_CB06_3: 29件) */
  relationship3: mapOptions(raw._CB06_3_C || []),
  /** 続柄 - 招へい人等 (_CB06: 16件) */
  relationship: mapOptions(raw._CB06_C || []),
  /** 身元保証人との関係 */
  guarantorRelationship: mapOptions(raw._A052_C || []),

  // === 学歴・職歴 ===
  /** 最終学歴 (_CA79: 8件) */
  finalEducation: mapOptions(raw._CA79_C || []),
  /** 最終学歴 - 拡張 (_CA79_1: 9件) */
  finalEducation1: mapOptions(raw._CA79_1_C || []),
  /** 専攻・専門分野 (_CA80: 24件) */
  majorField: mapOptions(raw._CA80_C || []),
  /** 専攻・専門分野 - 拡張 (_CA80_1: 25件) */
  majorField1: mapOptions(raw._CA80_1_C || []),
  /** 職業従事内容 (_CC02_6: 90件) */
  occupationType: mapOptions(raw._CC02_6_C || []),
  /** 雇用形態 (_CA81: 4件) */
  employmentType: mapOptions(raw._CA81_C || []),

  // === 教育機関関連 ===
  /** 在籍する教育機関の種類 (_CA91: 24件) */
  educationalInstitutionType: mapOptions(raw._CA91_C || []),
  /** 専修学校の分類 (_CA93: 9件) */
  vocationalSchoolCategory: mapOptions(raw._CA93_C || []),
  /** 昼夜間区分 (_CB21: 5件) */
  dayEveningClass: mapOptions(raw._CB21_C || []),
  /** 卒業・在学状況 (_CB26: 4件) */
  graduationStatus: mapOptions(raw._CB26_C || []),
  /** 他校在籍有無 (_CB50: 2件) */
  otherSchoolEnrollment: mapOptions(raw._CB50_C || []),

  // === 特定技能関連 ===
  /** 特定技能分野 (_CC04: 19件) */
  specifiedSkilledField: mapOptions(raw._CC04_C || []),
  /** 技能水準の証明方法 (_CC06: 6件) */
  skillProofMethod: mapOptions(raw._CC06_C || []),
  /** 技能実習修了の証明方法 (_CC07: 2件) */
  internTrainingProofMethod: mapOptions(raw._CC07_C || []),
  /** 報酬の支払方法 (_CC08: 2件) */
  paymentMethod: mapOptions(raw._CC08_C || []),
  /** 技能評価試験 (_CC09: 48件) */
  skillEvaluationTest: mapOptions(raw._CC09_C || []),
  /** 日本語能力試験 (_CC10: 4件) */
  japaneseLanguageTest: mapOptions(raw._CC10_C || []),

  // === 技能実習関連 ===
  /** 技能実習区分 (_CA83: 6件) */
  technicalInternCategory: mapOptions(raw._CA83_C || []),
  /** 基準該当区分 (_CA84: 10件) */
  criterionCategory: mapOptions(raw._CA84_C || []),
  /** 技能実習の職種 (_CA94: 93件) */
  technicalInternOccupation: mapOptions(raw._CA94_C || []),
  /** 技能実習の作業 - 技能実習の職種に連動（INDIRECT）のため、フラット化 (_CC02_3: 92件) */
  technicalInternWork: mapOptions(raw._CC02_3_C || []),
  /** 監理事業区分 (_CB42: 2件) */
  supervisingBusinessType: mapOptions(raw._CB42_C || []),

  // === 興行関連 ===
  /** 興行の内容 (_CB05: 11件) */
  entertainmentContent: mapOptions(raw._CB05_C || []),
  /** 国際大会出場歴 (_CB29: 3件) */
  internationalCompetition: mapOptions(raw._CB29_C || []),

  // === 経費支弁 ===
  /** 経費支弁方法 (_CB07: 5件) */
  expensePaymentMethod: mapOptions(raw._CB07_C || []),
  /** 経費支弁方法 - 在外 (_CB07_1: 4件) */
  expensePaymentMethod1: mapOptions(raw._CB07_1_C || []),
  /** 経費支弁方法 - 在日 (_CB07_2: 5件) */
  expensePaymentMethod2: mapOptions(raw._CB07_2_C || []),
  /** 経費支弁元の種別 (_CA87: 3件) */
  expenseSourceType: mapOptions(raw._CA87_C || []),

  // === 文化活動・芸術関連 ===
  /** 文化活動の種類 (_CB14_1: 4件) */
  culturalActivityType: mapOptions(raw._CB14_1_C || []),
  /** 芸術活動の分類 (_CB14: 7件) */
  artisticCategory: mapOptions(raw._CB14_C || []),

  // === 企業関連 ===
  /** 企業内転勤の関係 (_CB15: 5件) */
  intraCompanyRelation: mapOptions(raw._CB15_C || []),
  /** 事業所の保有形態 (_CB17: 2件) */
  officeOwnershipType: mapOptions(raw._CB17_C || []),
  /** 業種分類 (_CC13_4: 45件) */
  industryClassification: mapOptions(raw._CC13_4_C || []),
  /** 国・地方公共団体区分 (_CC01: 6件) */
  governmentOrganizationType: mapOptions(raw._CC01_C || []),
  /** 事業内容分類 (_CB01: 4件) */
  businessContentType: mapOptions(raw._CB01_C || []),
  /** 常勤/非常勤 (_CB47: 2件) */
  fullTimePartTime: mapOptions(raw._CB47_C || []),

  // === 再入国許可 ===
  /** 再入国許可の種類 (_CB04: 2件) */
  reEntryPermitType: mapOptions(raw._CB04_C || []),
  /** 短期滞在の目的 (_CB25: 5件) */
  shortStayPurpose: mapOptions(raw._CB25_C || []),

  // === 高度専門職ポイント ===
  /** 学歴ポイント - イ (_CC21: 4件) */
  hspEducationA: mapOptions(raw._CC21_C || []),
  /** 学歴ポイント - ロ (_CC21_1: 5件) */
  hspEducationB: mapOptions(raw._CC21_1_C || []),
  /** 学歴ポイント - ハ (_CC21_2: 4件) */
  hspEducationC: mapOptions(raw._CC21_2_C || []),
  /** 職歴ポイント - イ (_CC22: 4件) */
  hspCareerA: mapOptions(raw._CC22_C || []),
  /** 職歴ポイント - ロ (_CC22_1: 5件) */
  hspCareerB: mapOptions(raw._CC22_1_C || []),
  /** 職歴ポイント - ハ (_CC22_2: 5件) */
  hspCareerC: mapOptions(raw._CC22_2_C || []),
  /** 年齢ポイント (_CC23: 4件) */
  hspAge: mapOptions(raw._CC23_C || []),
  /** 年収ポイント (_CC24_1: 6件) */
  hspAnnualSalary: mapOptions(raw._CC24_1_C || []),
  /** 地位ポイント (_CC26: 3件) */
  hspPosition: mapOptions(raw._CC26_C || []),
  /** 発明ポイント (_CC27: 3件) */
  hspPatent: mapOptions(raw._CC27_C || []),
  /** 日本語能力ポイント (_CC28: 5件) */
  hspJapanese: mapOptions(raw._CC28_C || []),
  /** ボーナスポイント5 (_CC29_1: 2件) */
  hspBonus5: mapOptions(raw._CC29_1_C || []),
  /** ボーナスポイント10 (_CC29: 2件) */
  hspBonus10: mapOptions(raw._CC29_C || []),
  /** 高度専門職の在留年数 (_CC30: 7件) */
  hspResidenceYears: mapOptions(raw._CC30_C || []),

  // === その他 ===
  /** パスポートの種類 (_CA92: 3件) */
  passportType: mapOptions(raw._CA92_C || []),
  /** 翻訳・通訳等の業務内容 (_CA76: 3件) */
  translationInterpretation: mapOptions(raw._CA76_C || []),
  /** 送出機関 (_CA78: 5件) */
  sendingOrganizationType: mapOptions(raw._CA78_C || []),
  /** 卒業後の予定 (_CA86: 4件) */
  afterGraduationPlan: mapOptions(raw._CA86_C || []),
  /** 入国目的 (_CB25: 5件) */
  entryPurpose: mapOptions(raw._CB25_C || []),
  /** はい/いいえ (_CB48: 2件) */
  yesNoJapanese: mapOptions(raw._CB48_C || []),
  /** 名前が異なるか (_A029: 2件) */
  nameDifference: mapOptions(raw._A029_C || []),
  /** 未定/有 (_A036: 2件) */
  undecidedOrYes: mapOptions(raw._A036_C || []),
  /** 委託有無 (_A051: 2件) */
  entrustment: mapOptions(raw._A051_C || []),
  /** 本邦/外国 (_CC33: 2件) */
  japanOrForeign: mapOptions(raw._CC33_C || []),
  /** 希望する活動開始時期 (_CC34: 4件) */
  activityStartTiming: mapOptions(raw._CC34_C || []),
  /** 身分関係 (_CC35: 3件) */
  familyRelationshipType: mapOptions(raw._CC35_C || []),
  /** 契約期間の定め (_CC36: 2件) */
  contractPeriodType: mapOptions(raw._CC36_C || []),
  /** 年 (0-5) (_A025_1: 6件) */
  yearDigits5: mapOptions(raw._A025_1_C || []),
  /** 年 (0-40) (_A025: 41件) */
  yearDigits40: mapOptions(raw._A025_C || []),
  /** 月 (0-11) (_A026: 12件) */
  monthDigits: mapOptions(raw._A026_C || []),
  /** 国籍 - 拡張 日本含む (_CB79: 198件) */
  nationalityWithJapan: mapOptions(raw._CB79_C || []),
  /** 都道府県 - 簡易版 (_CA69_1: 47件) */
  prefecturesSimple: mapOptions(raw._CA69_1_C || []),

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

/**
 * 高度専門職ポイント：年齢区分を選択した際に、対応する年収ポイント一覧を返す
 * 親: _CC23_L (4区分)  →  子: _CC23_XX_L (各年齢帯の年収ポイント)
 */
export const getHspAnnualSalaryByAge = (selectedAgeRange: string | undefined): SelectOption[] =>
  getChildOptions('_CC23', selectedAgeRange);

/**
 * 在留資格変更希望を選択した際に、対応する在留期間の選択肢を返す
 * 親: _CB19_1_L (22種の在留資格)  →  子: _CB19_1_TXX_L (各資格の在留期間)
 */
export const getStayPeriodByStatus = (selectedStatus: string | undefined): SelectOption[] =>
  getChildOptions('_CB19_1', selectedStatus);

/**
 * 在留資格サブカテゴリ（身分系）を選択した際に、詳細区分を返す
 * 親: _CC52_1_L (3種)  →  子: _CC52_1_XXXX_L (各カテゴリの詳細)
 */
export const getStatusSubcategoryOptions = (selectedCategory: string | undefined): SelectOption[] =>
  getChildOptions('_CC52_1', selectedCategory);

// ════════════════════════════════════════════════════════════════════════════════
// 高度専門職ポイント計算: イ/ロ/ハ 類型切り替え
//
// 高度専門職は3つの類型があり、選択した類型によって
// 学歴・職歴・年収ポイントの選択肢（配点）が異なる。
//   イ = 高度学術研究活動     → _CC21_L, _CC22_L,   _CC23_L (年齢) → _CC23_XX_L (年収)
//   ロ = 高度専門・技術活動   → _CC21_1_L, _CC22_1_L, _CC23_L (年齢) → _CC23_XX_L (年収)
//   ハ = 高度経営・管理活動   → _CC21_2_L, _CC22_2_L, _CC23_L (年齢) → _CC23_XX_L (年収)
// ════════════════════════════════════════════════════════════════════════════════

/** 高度専門職の類型 */
export type HspCategory = 'i' | 'ro' | 'ha';

/**
 * 高度専門職の類型に応じた「学歴」ポイント選択肢を返す
 * - イ: _CC21_L (博士30点, 修士20点, 大卒10点)
 * - ロ: _CC21_1_L (博士30点, MBA25点, 修士20点, 大卒10点)
 * - ハ: _CC21_2_L (MBA25点, 博士/修士20点, 大卒10点)
 */
export const getHspEducationOptions = (category: HspCategory | undefined): SelectOption[] => {
  if (!category) return mapOptions(raw._CC21_C || []);
  switch (category) {
    case 'i':  return mapOptions(raw._CC21_C || []);
    case 'ro': return mapOptions(raw._CC21_1_C || []);
    case 'ha': return mapOptions(raw._CC21_2_C || []);
    default:   return mapOptions(raw._CC21_C || []);
  }
};

/**
 * 高度専門職の類型に応じた「職歴」ポイント選択肢を返す
 * - イ: _CC22_L (7年以上15点, 5-7年10点, 3-5年5点)
 * - ロ: _CC22_1_L (10年以上20点, 7-10年15点, 5-7年10点, 3-5年5点)
 * - ハ: _CC22_2_L (10年以上25点, 7-10年20点, 5-7年15点, 3-5年10点)
 */
export const getHspCareerOptions = (category: HspCategory | undefined): SelectOption[] => {
  if (!category) return mapOptions(raw._CC22_C || []);
  switch (category) {
    case 'i':  return mapOptions(raw._CC22_C || []);
    case 'ro': return mapOptions(raw._CC22_1_C || []);
    case 'ha': return mapOptions(raw._CC22_2_C || []);
    default:   return mapOptions(raw._CC22_C || []);
  }
};

/**
 * 高度専門職ポイント計算に必要な全リストを類型に応じてまとめて返す
 * UIで一括取得する際に便利
 */
export const getHspPointOptions = (category: HspCategory | undefined) => ({
  education: getHspEducationOptions(category),
  career: getHspCareerOptions(category),
  age: changeFormOptions.hspAge,
  /** 年収は年齢区分に連動 - getHspAnnualSalaryByAge() を別途呼び出す */
  position: changeFormOptions.hspPosition,
  patent: changeFormOptions.hspPatent,
  japanese: changeFormOptions.hspJapanese,
  bonus5: changeFormOptions.hspBonus5,
  bonus10: changeFormOptions.hspBonus10,
  residenceYears: changeFormOptions.hspResidenceYears,
});
