import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';
import {
  formatZipCode,
  formatPhoneNumber,
  createCsvString,
} from '../csvUtils';
import { COE_SPECIFIC_HEADERS } from './coeSpecificHeaders';

/**
 * COE 申請情報入力(区分V).csv のデータを生成します。
 * 対象となる項目数は全297項目（インデックス 0〜296）です。
 *
 * @param data - CoeApplicationFormData (COE申請フォームの全データ)
 * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)
 */
export const generateCoeSpecificCsv = (data: CoeApplicationFormData): string => {
  const app = data.applicantSpecificInfo;
  const emp = data.employerInfo;
  const rep = data.legalRepresentative;
  const agency = data.agencyRep;

  // 297個の要素を持つ配列を初期化
  const row: string[] = new Array(297).fill('');

  // ═════════════════════════════════════════════════════════════════════════
  // 申請人に関する情報等 (index 0〜46)
  // ═════════════════════════════════════════════════════════════════════════

  // [0] 活動内容
  row[0] = app?.activityContent || '';
  // [1] 最終学歴_(1) プルダウン
  row[1] = app?.academicBackground || '';
  // [2] 最終学歴_(2) プルダウン
  row[2] = app?.academicBackgroundDetail || '';
  // [3] 最終学歴_(2) その他
  row[3] = app?.academicBackgroundOther || '';
  // [4] 学校名
  row[4] = app?.schoolName || '';
  // [5] 学部・課程又は専門課程名称
  row[5] = app?.facultyName || '';
  // [6] 卒業年月 (YYYYMM)
  row[6] = app?.graduationDate || '';
  // [7] 准看護師の免許取得年月日 (YYYYMMDD)
  row[7] = app?.nursingLicenseDate || '';

  // [8〜37] 経歴（大会出場歴）最大10件 x 3項目
  const competitions = app?.competitionHistory || [];
  for (let i = 0; i < 10; i++) {
    const offset = 8 + i * 3;
    const comp = competitions[i];
    if (comp) {
      row[offset]     = comp.competitionType || '';   // 大会の種類
      row[offset + 1] = comp.competitionName || '';   // 出場競技会名
      row[offset + 2] = comp.competitionYear || '';   // 大会出場年
    }
  }

  // [38] 在学中の大学名
  row[38] = app?.currentUniversity || '';
  // [39] 学部・課程
  row[39] = app?.currentFaculty || '';
  // [40] 具体的な在留目的
  row[40] = app?.purposeOfStay || '';
  // [41] 専攻・専門分野（大学院～短期大学）
  row[41] = app?.majorCategory || '';
  // [42] 専攻・専門分野_その他
  row[42] = app?.majorDetails || '';
  // [43] 専攻・専門分野（専門学校）
  row[43] = app?.majorCategoryCollege || '';
  // [44] 専攻・専門分野_その他（専門学校）
  row[44] = app?.majorDetailsCollege || '';
  // [45] 経営又は管理の実務経験年数
  row[45] = app?.businessExperienceYears || '';
  // [46] 業務の実務経験年数
  row[46] = app?.fieldExperienceYears || '';

  // ═════════════════════════════════════════════════════════════════════════
  // 職歴 (index 47〜119)
  // 47: 有無フラグ, 48〜119: 8件 x 9項目
  // 各職歴: 国・地域名, 入社不詳, 入社年月, 入社年, 退社不詳, 退社年月, 退社年, 勤務先英字, 勤務先漢字
  // ═════════════════════════════════════════════════════════════════════════

  // [47] 職歴の有無 (1=有, 2=無)
  row[47] = app?.hasJobHistory || '';

  const jobs = app?.jobHistory || [];
  for (let i = 0; i < 8; i++) {
    const offset = 48 + i * 9;
    const job = jobs[i];
    if (job) {
      row[offset]     = job.country || '';            // 国・地域名
      row[offset + 1] = job.startDateUnknown || '';   // 入社年月不詳
      row[offset + 2] = job.startDate || '';           // 入社年月 (YYYYMM)
      row[offset + 3] = job.startYear || '';           // 入社年（月不詳の場合 YYYY）
      row[offset + 4] = job.endDateUnknown || '';     // 退社年月不詳
      row[offset + 5] = job.endDate || '';             // 退社年月 (YYYYMM)
      row[offset + 6] = job.endYear || '';             // 退社年（月不詳の場合 YYYY）
      row[offset + 7] = job.companyNameEn || '';       // 勤務先名称（英字表記）
      row[offset + 8] = job.companyNameJa || '';       // 勤務先名称（漢字表記）
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 法定代理人 (index 120〜127)
  // ═════════════════════════════════════════════════════════════════════════

  // [120] 代理人_(1)氏名
  row[120] = rep?.name || '';
  // [121] 代理人_(2)本人との関係
  row[121] = rep?.relationship || '';
  // [122] 代理人_(3)郵便番号
  row[122] = formatZipCode(rep?.zipCode);
  // [123] 代理人_(3)住所(都道府県)
  row[123] = rep?.prefecture || '';
  // [124] 代理人_(3)住所(市区町村)
  row[124] = rep?.city || '';
  // [125] 代理人_(3)住所(町名丁目番地号等)
  row[125] = rep?.addressLines || '';
  // [126] 代理人_(3)電話番号
  row[126] = formatPhoneNumber(rep?.phone);
  // [127] 代理人_(3)携帯電話番号
  row[127] = formatPhoneNumber(rep?.mobilePhone);

  // ═════════════════════════════════════════════════════════════════════════
  // 取次者 (index 128〜134)
  // ═════════════════════════════════════════════════════════════════════════

  // [128] 取次者_(1)氏名
  row[128] = agency?.name || '';
  // [129] 取次者_(2)郵便番号
  row[129] = formatZipCode(agency?.zipCode);
  // [130] 取次者_(2)住所(都道府県)
  row[130] = agency?.prefecture || '';
  // [131] 取次者_(2)住所(市区町村)
  row[131] = agency?.city || '';
  // [132] 取次者_(2)住所(町名丁目番地号等)
  row[132] = agency?.addressLines || '';
  // [133] 取次者_(3)所属機関等
  row[133] = agency?.organization || '';
  // [134] 取次者_(3)電話番号
  row[134] = formatPhoneNumber(agency?.phone);

  // ═════════════════════════════════════════════════════════════════════════
  // 所属機関に関する情報等 (index 135〜296)
  // ═════════════════════════════════════════════════════════════════════════

  // [135] 契約の場合はいずれかの形態を選択
  row[135] = ''; // ※ スキーマに contractType フィールドなし
  // [136] 契約の場合_その他
  row[136] = ''; // ※ スキーマに contractTypeOther フィールドなし

  // [137〜140] 職種（主たる職種 + 他職種3つ）
  row[137] = emp?.mainOccupation || '';
  row[138] = emp?.subOccupation1 || '';
  row[139] = emp?.subOccupation2 || '';
  row[140] = emp?.subOccupation3 || '';

  // [141] 活動内容詳細
  row[141] = emp?.activityDetail || '';

  // [142〜147] 変更関連 ※ COE新規申請のため基本不要
  // row[142]〜row[147]: 空文字のまま（初期化済み）

  // [148] 支払った報酬の総額 ※ スキーマなし
  // [149] 児童保護誓約 ※ スキーマなし
  // [150] 旅券の種類 ※ スキーマなし
  // [151] 用務 ※ スキーマなし
  // [152] 現地職員 ※ スキーマなし
  // [153] 外務省身分証明票番号_有無 ※ スキーマなし
  // [154] 外務省身分証明票番号 ※ スキーマなし

  // [155〜159] 勤務先、所属機関又は通学先
  row[155] = emp?.companyNameJa || '';
  row[156] = emp?.branchName || '';
  row[157] = emp?.hasCorporateNumber || '';
  row[158] = emp?.corporateNumber || '';
  row[159] = emp?.employmentInsuranceNumber || '';

  // [160〜165] 業種（主 + 他2つ + 各その他）
  row[160] = emp?.mainIndustry || '';
  row[161] = emp?.mainIndustryOther || '';
  row[162] = emp?.subIndustry1 || '';
  row[163] = emp?.subIndustry1Other || '';
  row[164] = emp?.subIndustry2 || '';
  row[165] = emp?.subIndustry2Other || '';

  // [166〜170] 所在地・電話
  row[166] = formatZipCode(emp?.companyZipCode);
  row[167] = emp?.companyPref || '';
  row[168] = emp?.companyCity || '';
  row[169] = emp?.companyAddressLines || '';
  row[170] = formatPhoneNumber(emp?.companyPhone);

  // [171〜175] 資本金・売上・従業員数・外国人職員数・常勤職員数
  row[171] = emp?.capital || '';
  row[172] = emp?.annualRevenue || '';
  row[173] = emp?.employeeCount || '';
  row[174] = emp?.foreignEmployeeCount || '';
  row[175] = emp?.fullTimeEmployeeCount || '';

  // [176〜179] 技能実習生・インターンシップ生
  row[176] = emp?.trainee1Count || '';
  row[177] = emp?.trainee1Planned || '';
  row[178] = emp?.internCount || '';
  row[179] = emp?.internPlanned || '';

  // [180〜190] 職業紹介事業者 ※ スキーマに対応フィールドなし → 空文字パディング
  // row[180]〜row[190]: 空文字のまま（初期化済み）

  // [191〜196] 取次機関 ※ スキーマに対応フィールドなし → 空文字パディング
  // row[191]〜row[196]: 空文字のまま（初期化済み）

  // [197] 職務上の地位
  row[197] = emp?.hasPosition || '';
  // [198] 職務上の地位_役職名
  row[198] = emp?.positionTitle || '';
  // [199] 就労又は就学予定期間
  row[199] = emp?.employmentPeriod || '';
  // [200] 月額報酬
  row[200] = emp?.monthlySalary || '';

  // [201〜214] 雇用主個人情報 ※ スキーマに対応フィールドなし → 空文字パディング
  // row[201]〜row[214]: 空文字のまま（初期化済み）

  // ═════════════════════════════════════════════════════════════════════════
  // 雇用主の同居家族 (index 215〜254)
  // 5名 x 8項目 = 40項目
  // ═════════════════════════════════════════════════════════════════════════

  const families = emp?.cohabitingFamilies || [];
  for (let i = 0; i < 5; i++) {
    const offset = 215 + i * 8;
    const fam = families[i];
    if (fam) {
      row[offset]     = fam.relationship || '';        // 続柄
      row[offset + 1] = fam.relationshipOther || '';   // 続柄_その他
      row[offset + 2] = fam.name || '';                // 氏名
      row[offset + 3] = fam.birthDate || '';           // 生年月日
      row[offset + 4] = fam.nationality || '';         // 国籍・地域
      row[offset + 5] = fam.cohabitation || '';        // 同居の有無
      row[offset + 6] = fam.workplace || '';           // 勤務先名称
      row[offset + 7] = fam.residenceStatus || '';     // 在留資格
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 扶養者 (index 255〜274) ※ スキーマに対応フィールドなし → 全空文字
  // 日系四世受入れサポーター (index 275〜296) ※ スキーマに対応フィールドなし → 全空文字
  // ═════════════════════════════════════════════════════════════════════════
  // row[255]〜row[296]: 空文字のまま（初期化済み）

  return createCsvString(COE_SPECIFIC_HEADERS, row);
};
