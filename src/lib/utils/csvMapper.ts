/**
 * 入管公式CSVマッパー
 * 出入国在留管理庁「在留申請オンラインシステム」一括申請用CSVを生成する
 *
 * CSVは3つのシートに対応:
 *   sheet1: 申請情報入力(在留期間更新許可申請) - 78列
 *   sheet2: 申請情報入力(区分V) - 264列
 *   sheet3: 申請情報入力(同時申請) - 114列
 */

import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';

// ─── 値変換ユーティリティ ─────────────────────────────────────────────────────

/** 日付を YYYYMMDD 形式に変換 (YYYY-MM-DD → YYYYMMDD) */
const toCSVDate = (v: string | undefined): string =>
  v ? v.replace(/-/g, '') : '';

/** 年月を YYYYMM 形式に変換 (YYYY-MM → YYYYMM) */
const toCSVYearMonth = (v: string | undefined): string =>
  v ? v.replace(/-/g, '') : '';

/** Boolean → '有' / '無' */
const bool = (v: boolean | undefined): string => (v ? '有' : '無');

/** Boolean → '1' / '0' (誓約項目用) */
// const boolOne = (v: boolean | undefined): string => (v ? '1' : '0');

/** Boolean → '有り' / '無し' */
const boolAriNashi = (v: boolean | undefined): string => (v ? '有り' : '無し');

/** 性別変換 */
const gender = (v: 'male' | 'female'): string => (v === 'male' ? '男' : '女');

/** 配偶者変換 */
const marital = (v: 'married' | 'unmarried'): string =>
  v === 'married' ? '有' : '無';

/** 報酬の支払方法変換 */
const paymentMethod = (v: 'cash' | 'bank_transfer'): string =>
  v === 'cash' ? '現金' : '口座振込';

/** 希望在留期間変換 */
const desiredStayPeriod = (
  v: '4months' | '6months' | '1year' | 'other',
  other?: string
): string => {
  switch (v) {
    case '4months': return '4月';
    case '6months': return '6月';
    case '1year': return '1年';
    case 'other': return other ?? '';
  }
};

/** 在留カード受領方法変換 */
const receiptMethod = (v: 'window' | 'post'): string =>
  v === 'window' ? '窓口受領' : '郵送受領';

/** 技能評価区分変換 */
const skillEvalMethod = (v: 'exam' | 'technical_intern' | 'none'): string => {
  switch (v) {
    case 'exam': return '試験';
    case 'technical_intern': return '技能実習2号良好修了';
    case 'none': return '';
  }
};

// ─── Sheet1 ビルダー (78列) ──────────────────────────────────────────────────

function buildSheet1Row(f: RenewalApplicationFormData): string[] {
  const fi = f.foreignerInfo;
  const rel = fi.relatives ?? [];

  // 親族スロット最大6個
  const relSlots: (typeof rel[0] | null)[] = Array.from({ length: 6 }, (_, i) => rel[i] ?? null);
  const relCols: string[] = [];
  for (const r of relSlots) {
    relCols.push(r?.relationship ?? '');
    relCols.push(r?.name ?? '');
    relCols.push(r ? toCSVDate(r.birthDate) : '');
    relCols.push(r?.nationality ?? '');
    relCols.push(r ? bool(r.cohabitation) : '');
    relCols.push(r?.workplace ?? '');
    relCols.push(r?.residenceCardNumber ?? '');
  }

  return [
    /* [000] 論理項目名 */ '申請情報',
    /* [001] 国籍・地域 */ fi.nationality,
    /* [002] 生年月日 */ toCSVDate(fi.birthDate),
    /* [003] 氏名 */ fi.nameEn,
    /* [004] 性別 */ gender(fi.gender),
    /* [005] 配偶者の有無 */ marital(fi.maritalStatus),
    /* [006] 職業 */ fi.occupation,
    /* [007] 本国における居住地 */ fi.homeCountryAddress,
    /* [008] 日本における連絡先　郵便番号 */ fi.japanZipCode,
    /* [009] 日本における住居地(都道府県) */ fi.japanPrefecture,
    /* [010] 日本における住居地(市区町村) */ fi.japanCity,
    /* [011] 日本における住居地(町名丁目番地号等) */ fi.japanAddressLines,
    /* [012] 日本における連絡先　電話番号 */ fi.phoneNumber,
    /* [013] 日本における連絡先　携帯電話番号 */ fi.mobileNumber ?? '',
    /* [014] メールアドレス */ fi.email,
    /* [015] 旅券　（1）番号 */ fi.passportNumber,
    /* [016] 旅券　（2）有効期限 */ toCSVDate(fi.passportExpiryDate),
    /* [017] 現に有する在留資格 */ fi.currentResidenceStatus,
    /* [018] 在留期間 */ fi.currentStayPeriod,
    /* [019] 在留期間の満了日 */ toCSVDate(fi.stayExpiryDate),
    /* [020] 在留カードの有無 */ bool(fi.hasResidenceCard),
    /* [021] 在留カード番号 */ fi.residenceCardNumber,
    /* [022] ED番号（英字） */ fi.edNumberAlpha ?? '',
    /* [023] ED番号（数字） */ fi.edNumberNumeric ?? '',
    /* [024] 希望する在留期間 */ desiredStayPeriod(fi.desiredStayPeriod, fi.desiredStayPeriodOther),
    /* [025] 更新の理由 */ fi.renewalReason,
    /* [026] 犯罪を理由とする処分を受けたことの有無 */ bool(fi.criminalRecord),
    /* [027] 犯罪を理由とする処分を受けたことの有無　有　内容入力欄 */ fi.criminalRecordDetail ?? '',
    /* [028] 在日親族及び同居者　有無 */ bool(fi.hasRelatives),
    // 在日親族スロット [029]〜[070] (6人分 × 7列 = 42列)
    ...relCols,
    /* [071] 在留カードの受領方法 */ receiptMethod(fi.residenceCardReceiptMethod),
    /* [072] 申請対象者の住居地 */ fi.applicantResidencePlace ?? '',
    /* [073] 受領官署 */ fi.receivingOffice ?? '',
    /* [074] 通知送信用メールアドレス */ fi.notificationEmail ?? '',
    /* [075] 申請に先立ち申請意思を確認してください */ bool(fi.checkIntent),
    /* [076] フリー欄 */ fi.freeFormat ?? '',
    /* [077] (空) */ '',
  ];
}

// ─── Sheet2 ビルダー (264列) ─────────────────────────────────────────────────

function buildSheet2Row(f: RenewalApplicationFormData): string[] {
  const fi = f.foreignerInfo;
  const ei = f.employerInfo;
  const oath = ei.complianceOaths;

  // 技能・語学証明 (最大3枠)
  const skillCerts = fi.skillCertifications ?? [];
  const langCerts = fi.languageCertifications ?? [];

  // 職歴スロット最大10個
  const jobSlots = Array.from({ length: 10 }, (_, i) => ei.jobHistory?.[i] ?? null);
  const jobCols: string[] = [];
  for (const j of jobSlots) {
    jobCols.push(j ? toCSVYearMonth(j.startDate) : '');
    jobCols.push(j ? toCSVYearMonth(j.endDate ?? '') : '');
    jobCols.push(j?.companyName ?? '');
  }

  return [
    /* [000] 論理項目名 */ '申請情報',

    // ── 技能水準 3枠 [001]〜[007] ──────────────────────────────────────────
    /* [001] 技能水準 評価区分 */ skillEvalMethod(skillCerts[0]?.method ?? 'none'),
    /* [002] 技能水準 合格した試験名 (1) */ skillCerts[0]?.examName ?? '',
    /* [003] 技能水準 受験地 (1) */ skillCerts[0]?.examLocation ?? '',
    /* [004] 技能水準 合格した試験名 (2) */ skillCerts[1]?.examName ?? '',
    /* [005] 技能水準 受験地 (2) */ skillCerts[1]?.examLocation ?? '',
    /* [006] 技能水準 合格した試験名 (3) */ skillCerts[2]?.examName ?? '',
    /* [007] 技能水準 受験地 (3) */ skillCerts[2]?.examLocation ?? '',
    /* [008] 技能水準 その他の評価方法 */ fi.otherSkillCert ?? '',

    // ── 日本語能力 3枠 [009]〜[016] ────────────────────────────────────────
    /* [009] 日本語能力 評価区分 */ skillEvalMethod(langCerts[0]?.method ?? 'none'),
    /* [010] 日本語能力 合格した試験名 (1) */ langCerts[0]?.examName ?? '',
    /* [011] 日本語能力 受験地 (1) */ langCerts[0]?.examLocation ?? '',
    /* [012] 日本語能力 合格した試験名 (2) */ langCerts[1]?.examName ?? '',
    /* [013] 日本語能力 受験地 (2) */ langCerts[1]?.examLocation ?? '',
    /* [014] 日本語能力 合格した試験名 (3) */ langCerts[2]?.examName ?? '',
    /* [015] 日本語能力 受験地 (3) */ langCerts[2]?.examLocation ?? '',
    /* [016] 日本語能力 その他の評価方法 */ fi.otherLanguageCert ?? '',

    // ── 技能実習2号良好修了 [017]〜[022] ────────────────────────────────────
    /* [017] 良好に修了した技能実習2号 職種・作業 職種 (1) */ '',
    /* [018] 良好に修了した技能実習2号 職種・作業 作業 (1) */ '',
    /* [019] 良好に修了した技能実習2号 職種・作業 良好に修了したことの証明 (1) */ '',
    /* [020] 良好に修了した技能実習2号 職種・作業 職種 (2) */ '',
    /* [021] 良好に修了した技能実習2号 職種・作業 作業 (2) */ '',
    /* [022] 良好に修了した技能実習2号 職種・作業 良好に修了したことの証明 (2) */ '',

    // ── 通算在留期間 [023]〜[024] ────────────────────────────────────────────
    /* [023] 申請時における特定技能1号での通算在留期間(年数) */ String(fi.totalSpecificSkillStayYears ?? 0),
    /* [024] 申請時における特定技能1号での通算在留期間(月数) */ String(fi.totalSpecificSkillStayMonths ?? 0),

    // ── 保証金・費用 [025]〜[033] ────────────────────────────────────────────
    /* [025] 特定技能雇用契約に係る保証金の徴収その他財産管理又は違約金等の支払契約の有無 */ bool(fi.depositCharged),
    /* [026] 徴収・管理機関名 */ fi.depositOrganizationName ?? '',
    /* [027] 徴収金額・管理財産 */ fi.depositAmount ? String(fi.depositAmount) : '',
    /* [028] 取次ぎ又は活動準備に関する外国の機関への費用支払について、合意していることの有無 */ bool(fi.feeCharged),
    /* [029] 外国の機関名 */ fi.foreignOrganizationName ?? '',
    /* [030] 支払額 */ fi.feeAmount ? String(fi.feeAmount) : '',

    // ── 外国人側誓約 [031]〜[034] ────────────────────────────────────────────
    /* [031] 国籍国等において定められる本邦で行う活動に関連して遵守すべき手続を経ていることの有無 */ '有',
    /* [032] 本邦において定期的に負担する費用について、対価の内容を十分に理解して合意していることの有無 */ '有',
    /* [033] 技能実習によって本邦において修得、習熟又は熟達した技能等の本国への移転に努めることの有無 */ '有',
    /* [034] 申請人につき特定産業分野に特有の事情に鑑みて告示で定められる基準に適合していることの有無 */ '有',

    // ── 職歴 [035]〜[065] ─────────────────────────────────────────────────
    /* [035] 職歴の有無 */ bool(ei.hasJobHistory),
    /* [036]〜[065] 職歴10枠 (各3列) */ ...jobCols,

    // ── 代理人・取次者 [066]〜[080] (本実装では空欄) ───────────────────────
    /* [066] 代理人 (1)氏名 */ '',
    /* [067] 代理人 (2)本人との関係 */ '',
    /* [068] 代理人 (3)郵便番号 */ '',
    /* [069] 代理人 (3)住所(都道府県) */ '',
    /* [070] 代理人 (3)住所(市区町村) */ '',
    /* [071] 代理人 (3)住所(町名丁目番地号等) */ '',
    /* [072] 代理人 (3)電話番号 */ '',
    /* [073] 代理人 (3)携帯電話番号 */ '',
    /* [074] 取次者(1)氏名 */ '',
    /* [075] 取次者(2)郵便番号 */ '',
    /* [076] 取次者(2)住所(都道府県) */ '',
    /* [077] 取次者(2)住所(市区町村) */ '',
    /* [078] 取次者(2)住所(町名丁目番地号等) */ '',
    /* [079] 取次者(3)所属機関等 */ '',
    /* [080] 取次者(3)電話番号 */ '',

    // ── 特定技能雇用契約 [081]〜[137] ── ─────────────────────────────────

    /* [081] 雇用契約期間(始期) */ toCSVDate(ei.contractStartDate),
    /* [082] 雇用契約期間(終期) */ toCSVDate(ei.contractEndDate),
    /* [083] 従事すべき業務の内容 特定産業分野 (1) */ ei.industryFields[0] ?? '',
    /* [084] 従事すべき業務の内容 業務区分 (1) */ ei.jobCategories[0] ?? '',
    /* [085] 従事すべき業務の内容 特定産業分野 (2) */ ei.industryFields[1] ?? '',
    /* [086] 従事すべき業務の内容 業務区分 (2) */ ei.jobCategories[1] ?? '',
    /* [087] 従事すべき業務の内容 特定産業分野 (3) */ ei.industryFields[2] ?? '',
    /* [088] 従事すべき業務の内容 業務区分 (3) */ ei.jobCategories[2] ?? '',
    /* [089] 従事すべき業務の内容 職種 主たる職種 */ ei.mainJobType,
    /* [090] 従事すべき業務の内容 職種 他職種 (1) */ ei.otherJobTypes?.[0] ?? '',
    /* [091] 従事すべき業務の内容 職種 他職種 (2) */ ei.otherJobTypes?.[1] ?? '',
    /* [092] 従事すべき業務の内容 職種 他職種 (3) */ ei.otherJobTypes?.[2] ?? '',
    /* [093] 所定労働時間(週平均) */ String(ei.weeklyWorkHours),
    /* [094] 所定労働時間(月平均) */ String(ei.monthlyWorkHours),
    /* [095] 所定労働時間が通常の労働者の所定労働時間と同等であることの有無 */ bool(ei.equivalentWorkHours),
    /* [096] 月額報酬 */ String(ei.monthlySalary),
    /* [097] 基本給の時間換算額 */ String(ei.hourlyRate),
    /* [098] 同等の業務に従事する日本人の月額報酬 */ String(ei.japaneseMonthlySalary),
    /* [099] 報酬の額が日本人が従事する場合の報酬の額と同等以上であることの有無 */ bool(ei.equivalentSalary),
    /* [100] 報酬の支払方法 */ paymentMethod(ei.paymentMethod),
    /* [101] 外国人であることを理由に日本人と異なった待遇としている事項の有無 */ bool(ei.hasDifferentTreatment),
    /* [102] 異なった待遇の内容 */ ei.differentTreatmentDetail ?? '',
    /* [103] (7)一時帰国を希望した場合に必要な有給休暇を取得させるものとしていることの有無 */ '有',
    /* [104] (8)雇用関係につき告示で定められる基準に適合していることの有無 */ '有',
    /* [105] (9)外国人が帰国旅費を負担できないとき、旅費を負担し、その他必要な措置をすることの有無 */ '有',
    /* [106] (10)外国人の健康の状況その他の生活の状況を把握するために必要な措置を講ずることの有無 */ '有',
    /* [107] (11)特定産業分野に特有の事情に鑑みて告示で定められる基準に適合していることの有無 */ '有',
    // 派遣先・職業紹介事業者・取次機関 (今回対象外 - 空欄)
    /* [108] 派遣先 氏名又は名称 */ '',
    /* [109] 派遣先 法人番号の有無 */ '',
    /* [110] 派遣先 法人番号 */ '',
    /* [111] 派遣先 雇用保険適用事業所番号 */ '',
    /* [112] 派遣先 住所 郵便番号 */ '',
    /* [113] 派遣先 住所(都道府県) */ '',
    /* [114] 派遣先 住所(市区町村) */ '',
    /* [115] 派遣先 住所(町名丁目番地号等) */ '',
    /* [116] 派遣先 電話番号 */ '',
    /* [117] 派遣先 代表者の氏名 */ '',
    /* [118] 派遣先 派遣期間(始期) */ '',
    /* [119] 派遣先 派遣期間(終期) */ '',
    /* [120] 職業紹介事業者 氏名又は名称 */ '',
    /* [121] 職業紹介事業者 法人番号の有無 */ '',
    /* [122] 職業紹介事業者 法人番号 */ '',
    /* [123] 職業紹介事業者 雇用保険適用事業所番号 */ '',
    /* [124] 職業紹介事業者 住所 郵便番号 */ '',
    /* [125] 職業紹介事業者 住所(都道府県) */ '',
    /* [126] 職業紹介事業者 住所(市区町村) */ '',
    /* [127] 職業紹介事業者 住所(町名丁目番地号等) */ '',
    /* [128] 職業紹介事業者 電話番号 */ '',
    /* [129] 職業紹介事業者 許可・届出番号 */ '',
    /* [130] 職業紹介事業者 受理年月日 */ '',
    /* [131] 取次機関 氏名又は名称 */ '',
    /* [132] 取次機関 国・地域 */ '',
    /* [133] 取次機関 住所 郵便番号 */ '',
    /* [134] 取次機関 住所(都道府県) */ '',
    /* [135] 取次機関 住所(市区町村) */ '',
    /* [136] 取次機関 住所(町名丁目番地号等) */ '',
    /* [137] 取次機関 電話番号 */ '',

    // ── 特定技能所属機関 [138]〜[164] ───────────────────────────────────────
    /* [138] 特定技能所属機関 (1)氏名又は名称 */ ei.companyNameJa,
    /* [139] 特定技能所属機関 (2)法人番号の有無 */ bool(ei.hasCorporateNumber),
    /* [140] 特定技能所属機関 (2)法人番号 */ ei.hasCorporateNumber ? ei.corporateNumber : '',
    /* [141] 特定技能所属機関 (3)雇用保険適用事業所番号 */ ei.employmentInsuranceNumber ?? '',
    /* [142] 特定技能所属機関 (4)業種 主たる業種 */ '',
    /* [143] 特定技能所属機関 (4)業種 主たる業種 その他 */ '',
    /* [144] 特定技能所属機関 (4)業種 他業種 */ '',
    /* [145] 特定技能所属機関 (4)業種 他業種 その他 */ '',
    /* [146] 特定技能所属機関 (4)業種 他業種 (2) */ '',
    /* [147] 特定技能所属機関 (4)業種 他業種 その他 (2) */ '',
    /* [148] 特定技能所属機関 (5)住所（所在地） 郵便番号 */ ei.companyZipCode,
    /* [149] 特定技能所属機関 (5)住所（所在地）(都道府県) */ ei.companyPref,
    /* [150] 特定技能所属機関 (5)住所（所在地）(市区町村) */ ei.companyCity,
    /* [151] 特定技能所属機関 (5)住所（所在地）(町名丁目番地号等) */ ei.companyAddressLines,
    /* [152] 特定技能所属機関 (5)電話番号 */ ei.companyPhone,
    /* [153] 特定技能所属機関 (6)資本金 */ ei.capital ? String(ei.capital) : '',
    /* [154] 特定技能所属機関 (7)年間売上金額 */ ei.annualRevenue ? String(ei.annualRevenue) : '',
    /* [155] 特定技能所属機関 (8)常勤職員数 */ String(ei.employeeCount),
    /* [156] 特定技能所属機関 (9)代表者の氏名 */ ei.representativeName,
    /* [157] 特定技能所属機関 (10)勤務させる事業所名 */ ei.workplaceName,
    /* [158] 特定技能所属機関 (10)勤務させる事業所 所在地 郵便番号 */ ei.workplaceZipCode,
    /* [159] 特定技能所属機関 (10)勤務させる事業所 所在地(都道府県) */ ei.workplacePref,
    /* [160] 特定技能所属機関 (10)勤務させる事業所 所在地(市区町村) */ ei.workplaceCity,
    /* [161] 特定技能所属機関 (10)勤務させる事業所 所在地(町名丁目番地号等) */ ei.workplaceAddressLines,
    /* [162] (10)勤務させる事業所が健康保険及び厚生年金保険の適用事業所であることの有無 */ bool(ei.isSocialInsuranceApplicable),
    /* [163] (10)勤務させる事業所が労災保険及び雇用保険の適用事業所であることの有無 */ bool(ei.isLaborInsuranceApplicable),
    /* [164] 特定技能所属機関 (10)労働保険番号 */ ei.isLaborInsuranceApplicable ? (ei.laborInsuranceNumber ?? '') : '',

    // ── 所属機関側誓約 (11)〜(26) [165]〜[194] ──────────────────────────────
    // 誓約事項は、UI上で「該当する場合はチェック」形式のため
    // チェックされていない（=問題なし）→ '無' として出力する
    /* [165] (11)労働、社会保険及び租税に関する法令の規定に違反したことの有無 */ bool(oath.hadLaborLawPenalty.applies),
    /* [166] (11)有　内容入力欄 */ oath.hadLaborLawPenalty.detail ?? '',
    /* [167] (12)契約締結日前1年以内又は以後に、同種の業務の労働者を非自発的に離職させたことの有無 */ bool(oath.hadInvoluntaryDismissal.applies),
    /* [168] (12)有　内容入力欄 */ oath.hadInvoluntaryDismissal.detail ?? '',
    /* [169] (13)特定技能所属機関の責めに帰すべき事由により外国人の行方不明者を発生させたことの有無 */ bool(oath.hadMissingPersons.applies),
    /* [170] (13)有　内容入力欄 */ oath.hadMissingPersons.detail ?? '',
    // (14)〜(22) は管理者レベルの法的条件。デフォルト '無'（問題なし）
    /* [171] (14)機関・役員・支援責任者等が法令に違反して刑に処せられたことの有無 */ '無',
    /* [172] (14)有　内容入力欄 */ '',
    /* [173] (15)機関・役員・支援責任者等が精神の機能の障害を有することの有無 */ '無',
    /* [174] (15)有　内容入力欄 */ '',
    /* [175] (16)機関・役員・支援責任者等が破産手続開始の決定を受けて復権を得ないことの有無 */ '無',
    /* [176] (16)有　内容入力欄 */ '',
    /* [177] (17)機関・役員等が技能実習法第16条第1項の規定により実習認定を取り消されたことの有無 */ '無',
    /* [178] (17)有　内容入力欄 */ '',
    /* [179] (18)機関・役員・支援責任者等が実習認定を取り消された法人の役員であったことの有無 */ '無',
    /* [180] (18)有　内容入力欄 */ '',
    /* [181] (19)機関・役員・支援責任者等が法令に関し不正又は著しく不当な行為をしたことの有無 */ '無',
    /* [182] (19)有　内容入力欄 */ '',
    /* [183] (20)役員・支援責任者等が暴力団員であること又は5年以内に暴力団員であったことの有無 */ '無',
    /* [184] (20)有　内容入力欄 */ '',
    /* [185] (21)機関・役員・支援責任者等の法定代理人が(14)から(20)に該当することの有無 */ '無',
    /* [186] (21)有　内容入力欄 */ '',
    /* [187] (22)暴力団員又は５年以内に暴力団員であった者がその事業活動を支配する者であることの有無 */ '無',
    /* [188] (22)有　内容入力欄 */ '',
    // (23)〜(26) は積極的な義務。デフォルト '有'（実施する）
    /* [189] (23)外国人の活動内容に関する文書を契約終了の日から１年以上備えて置くことの有無 */ '有',
    /* [190] (24)契約に係る保証金の徴収その他財産管理又は違約金等の支払契約があることの認識の有無 */ '無',
    /* [191] (24)有　内容入力欄 */ '',
    /* [192] (25)特定技能雇用契約の不履行について違約金等の支払契約を締結していることの有無 */ '無',
    /* [193] (25)有　内容入力欄 */ '',
    /* [194] (26)１号特定技能外国人支援に要する費用について、外国人に負担させないことの有無 */ '有',

    // ── 所属機関(27) 派遣要件 [195]〜[204] (対象外 - 空欄) ──────────────
    /* [195] 特定技能所属機関 (27)次のいずれかに該当することの有無 */ '',
    /* [196] (27)(1)派遣先において従事する業務の属する特定産業分野に係る業務 */ '',
    /* [197] (27)(1)有　内容入力欄 */ '',
    /* [198] (27)(2)地方公共団体又は1に該当する者が資本金の過半数を出資していること */ '',
    /* [199] (27)(2)有　内容入力欄 */ '',
    /* [200] (27)(3)地方公共団体又は1に該当する者が業務執行に実質的に関与していること */ '',
    /* [201] (27)(3)有　内容入力欄 */ '',
    /* [202] (27)(4)農業であって国家戦略特別区域法の特定機関であること */ '',
    /* [203] (28)労働者派遣をすることとしている派遣先が(11)から(22)に該当していることの有無 */ '',
    /* [204] (28)有　内容入力欄 */ '',

    // ── 所属機関(29)〜(32) [205]〜[209] ─────────────────────────────────
    /* [205] (29)労災保険加入等の措置の有無 */ '有',
    /* [206] (29)有　内容入力欄 */ '',
    /* [207] (30)特定技能雇用契約を継続して履行する体制が適切に整備されていることの有無 */ '有',
    /* [208] (31)外国人に現実に支払われた報酬額を振込又は確認できる方法で支払われていることの有無 */ '有',
    /* [209] (32)特定技能雇用契約の適正な履行の確保につき告示で定められる基準に適合することの有無 */ '有',

    // ── 登録支援機関への全部委託 [210] ───────────────────────────────────
    /* [210] 特定技能1号での在留を希望し登録支援機関に1号特定技能外国人支援計画の全部の実施を委託することの有無 */ boolAriNashi(ei.delegateSupportEntirely),

    // ── 所属機関(33)(34)(35) 支援担当者 [211]〜[228] ─────────────────────
    /* [211] 特定技能所属機関 (33)支援責任者名 */ ei.supportPersonnel.supervisorName,
    /* [212] 特定技能所属機関 (33)所属・役職 */ ei.supportPersonnel.supervisorTitle,
    /* [213] 特定技能所属機関 (33)役員又は職員の中から支援責任者を選任していることの有無 */ '有',
    /* [214] 特定技能所属機関(34)支援担当者名 */ ei.supportPersonnel.officerName,
    /* [215] 特定技能所属機関(34)所属・役職 */ ei.supportPersonnel.officerTitle,
    /* [216] (34)役職員の中から業務に従事させる事業所ごとに1名以上の支援担当者を選任することの有無 */ '有',
    /* [217] 特定技能所属機関 (35)次のいずれかに該当することの有無 */ '有',
    /* [218] (35)(1)過去2年間において…受入れ又は管理を適正に行った実績を有すること */ '',
    /* [219] (35)(2)支援責任者及び支援担当者が…生活相談等に従事した経験を有すること */ '',
    /* [220] (35)(3)その他支援業務を適正に実施できる事情を有すること */ '',
    /* [221] (35)(3)有　内容入力欄 */ '',

    // ── 所属機関(36)〜(42) 支援計画 [222]〜[242] ────────────────────────
    /* [222] (36)支援計画に基づく支援を、外国人が理解できる言語で行う体制を有することの有無 */ '有',
    /* [223] (37)支援の状況に関する文書を作成し、契約終了の日から1年以上備えて置くことの有無 */ '有',
    /* [224] (38)支援責任者等が支援計画の中立な実施を行える立場の者であることの有無 */ '有',
    /* [225] (39)適合1号特定技能外国人支援計画に基づく1号特定技能外国人支援を怠ったことの有無 */ '無',
    /* [226] (39)有　内容入力欄 */ '',
    /* [227] (40)支援責任者等が外国人及びその監督者と定期的な面談を実施できる体制を有することの有無 */ '有',
    /* [228] (41)支援計画の適正な実施の確保につき告示で定める基準に適合することの有無 */ '有',

    // ── 1号特定技能外国人支援計画 (1)〜(14) [229]〜[242] ───────────────
    /* [229] (1)出入国時に港又は飛行場への送迎をすることとしていることの有無 */ '有',
    /* [230] (2)適切な住居の確保に係る支援をすることとしていることの有無 */ '有',
    /* [231] (3)金融機関における預金口座等の生活に必要な契約に係る支援をすることとしていることの有無 */ '有',
    /* [232] (4)本邦での生活一般に関する事項等を外国人が十分に理解できる言語により実施することの有無 */ '有',
    /* [233] (5)関係機関への同行その他の必要な措置を講ずることとしていることの有無 */ '有',
    /* [234] (6)日本語を学習する機会を提供することとしていることの有無 */ '有',
    /* [235] (7)外国人が理解できる言語により相談又は苦情の申出に対して必要な措置を講ずることの有無 */ '有',
    /* [236] (8)外国人と日本人の交流の促進に係る支援をすることとしていることの有無 */ '有',
    /* [237] (9)外国人が責めに帰すべき事由によらず契約を解除される場合は、転職支援をすることの有無 */ '有',
    /* [238] (10)支援責任者等が定期面談を実施し、問題発生時は関係行政機関に通報することの有無 */ '有',
    /* [239] (11)支援計画を作成し、当該外国人にその写しを交付することとしていることの有無 */ '有',
    /* [240] (12)特定産業分野に特有の事情に鑑みて告示で定められる事項を支援計画に記載することの有無 */ '有',
    /* [241] (13)支援の内容が外国人の適正な在留に資するものであって、かつ適切に実施できることの有無 */ '有',
    /* [242] (14)支援計画の内容につき告示で定められる基準に適合していることの有無 */ '有',

    // ── 登録支援機関 [243]〜[263] ────────────────────────────────────────
    /* [243] 登録支援機関 (1)氏名又は名称 */ ei.supportAgency?.name ?? '',
    /* [244] 登録支援機関 (2)法人番号の有無 */ ei.supportAgency?.hasCorporateNumber != null ? bool(ei.supportAgency.hasCorporateNumber) : '',
    /* [245] 登録支援機関 (2)法人番号 */ ei.supportAgency?.corporateNumber ?? '',
    /* [246] 登録支援機関 (3)雇用保険適用事業所番号 */ ei.supportAgency?.employmentInsuranceNumber ?? '',
    /* [247] 登録支援機関 (4)郵便番号 */ ei.supportAgency?.zipCode ?? '',
    /* [248] 登録支援機関 (4)所在地(都道府県) */ ei.supportAgency?.prefecture ?? '',
    /* [249] 登録支援機関 (4)所在地(市区町村) */ ei.supportAgency?.city ?? '',
    /* [250] 登録支援機関 (4)所在地(町名丁目番地号等) */ ei.supportAgency?.addressLines ?? '',
    /* [251] 登録支援機関 (4)電話番号 */ ei.supportAgency?.phone ?? '',
    /* [252] 登録支援機関 (5)代表者の氏名 */ ei.supportAgency?.representativeName ?? '',
    /* [253] 登録支援機関 (6)登録番号 */ ei.supportAgency?.registrationNumber ?? '',
    /* [254] 登録支援機関 (7)登録年月日 */ '',
    /* [255] 登録支援機関 (8)支援を行う事業所の名称 */ '',
    /* [256] 登録支援機関 (9)郵便番号 */ '',
    /* [257] 登録支援機関 (9)所在地(都道府県) */ '',
    /* [258] 登録支援機関 (9)所在地(市区町村) */ '',
    /* [259] 登録支援機関 (9)所在地(町名丁目番地号等) */ '',
    /* [260] 登録支援機関 (10)支援責任者名 */ '',
    /* [261] 登録支援機関 (11)支援担当者名 */ '',
    /* [262] 登録支援機関 (12)対応可能言語 */ '',
    /* [263] 登録支援機関 (13)支援委託手数料(月額/人) */ '',
  ];
}

// ─── Sheet3 ビルダー (114列) ─────────────────────────────────────────────────

function buildSheet3Row(f: RenewalApplicationFormData): string[] {
  const fi = f.foreignerInfo;
  const sim = f.simultaneousApplication;

  return [
    /* [000] 論理項目名 */ '申請情報',
    /* [001] 再入国許可申請 */ sim?.applyForReEntry ? '申請する' : '',
    /* [002] 資格外活動許可申請 */ sim?.applyForActivityOutsideStatus ? '申請する' : '',
    /* [003] 就労資格証明書交付申請 */ sim?.applyForAuthEmployment ? '申請する' : '',

    // 申請人共通情報 (同時申請書にも同一情報が必要)
    /* [004] 国籍・地域 */ fi.nationality,
    /* [005] 生年月日 */ toCSVDate(fi.birthDate),
    /* [006] 氏名 */ fi.nameEn,
    /* [007] 性別 */ gender(fi.gender),
    /* [008] 住居地　郵便番号 */ fi.japanZipCode,
    /* [009] 住居地(都道府県) */ fi.japanPrefecture,
    /* [010] 住居地(市区町村) */ fi.japanCity,
    /* [011] 住居地(町名丁目番地号等) */ fi.japanAddressLines,
    /* [012] 電話番号 */ fi.phoneNumber,
    /* [013] 携帯電話番号 */ fi.mobileNumber ?? '',
    /* [014] 旅券　(1)番号 */ fi.passportNumber,
    /* [015] 旅券　(2)有効期限 */ toCSVDate(fi.passportExpiryDate),
    /* [016] 現に有する在留資格 */ fi.currentResidenceStatus,
    /* [017] 在留期間 */ fi.currentStayPeriod,
    /* [018] 在留期間の満了日 */ toCSVDate(fi.stayExpiryDate),
    /* [019] 在留カードの有無 */ bool(fi.hasResidenceCard),
    /* [020] 在留カード番号 */ fi.residenceCardNumber,
    /* [021] ED番号(英字) */ fi.edNumberAlpha ?? '',
    /* [022] ED番号(数字) */ fi.edNumberNumeric ?? '',

    // 同時申請詳細 (再入国許可用 [023]〜[036])
    /* [023] 渡航目的 (1) */ '',
    /* [024] 渡航目的 (2) */ '',
    /* [025] 渡航目的　その他 */ '',
    /* [026] 予定渡航先国名 (1) */ '',
    /* [027] 予定渡航先国名 (2) */ '',
    /* [028] 出国予定年月日 (1) */ '',
    /* [029] 出国予定年月日 (2) */ '',
    /* [030] 出国予定の日本の(空)港 (1) */ '',
    /* [031] 出国予定の日本の(空)港 (2) */ '',
    /* [032] 再入国予定年月日 (1) */ '',
    /* [033] 再入国予定年月日 (2) */ '',
    /* [034] 再入国予定の日本の(空)港 (1) */ '',
    /* [035] 再入国予定の日本の(空)港 (2) */ '',
    /* [036] 希望する再入国許可 */ '',
    /* [037] 犯罪を理由とする処分を受けたことの有無 */ bool(fi.criminalRecord),
    /* [038] 犯罪を理由とする処分を受けたことの有無　有　内容入力欄 */ fi.criminalRecordDetail ?? '',
    /* [039] 確定前の刑事裁判の有無 */ '無',
    /* [040] 確定前の刑事裁判の有無　有　内容入力欄 */ '',
    /* [041] 旅券を取得することができない場合は、その理由 */ '',

    // 代理人・取次者 (再入国許可) [042]〜[056]
    /* [042] 法定代理人 (1)氏名 */ '', /* [043] */ '', /* [044] */ '', /* [045] */ '',
    /* [046] */ '', /* [047] */ '', /* [048] */ '', /* [049] */ '',
    /* [050] 取次者(1)氏名 */ '', /* [051] */ '', /* [052] */ '', /* [053] */ '',
    /* [054] */ '', /* [055] */ '', /* [056] */ '',

    // 資格外活動 [057]〜[079]
    /* [057] 現在の在留活動の内容 */ '',
    /* [058] 他に従事しようとする活動の内容 (1)職務の内容 (1) */ '',
    /* [059] 他に従事しようとする活動の内容 (1)職務の内容 (2) */ '',
    /* [060] 他に従事しようとする活動の内容 (1)職務の内容 (3) */ '',
    /* [061] 他に従事しようとする活動の内容 (2)雇用契約期間 */ '',
    /* [062] 他に従事しようとする活動の内容 (2)雇用契約期間(年数) */ '',
    /* [063] 他に従事しようとする活動の内容 (2)雇用契約期間(月数) */ '',
    /* [064] 他に従事しようとする活動の内容 (3)週間稼働時間 (1) */ '',
    /* [065] 他に従事しようとする活動の内容 (3)週間稼働時間 (2) */ '',
    /* [066] 他に従事しようとする活動の内容 (4)報酬 */ '',
    /* [067] 他に従事しようとする活動の内容 (4)月額報酬 */ '',
    /* [068] 勤務先 (1)名称 (1) */ '', /* [069] */ '',
    /* [070] 勤務先 (2)所在地 */ '', /* [071] */ '', /* [072] */ '', /* [073] */ '',
    /* [074] */ '', /* [075] */ '', /* [076] */ '',
    /* [077] 勤務先 (3)業種 (1) */ '', /* [078] */ '', /* [079] */ '',

    // 代理人・取次者 (資格外活動) [080]〜[094]
    /* [080] */ '', /* [081] */ '', /* [082] */ '', /* [083] */ '',
    /* [084] */ '', /* [085] */ '', /* [086] */ '', /* [087] */ '',
    /* [088] */ '', /* [089] */ '', /* [090] */ '', /* [091] */ '',
    /* [092] */ '', /* [093] */ '', /* [094] */ '',

    // 就労資格証明書 [095]〜[113]
    /* [095] 証明を希望する活動の内容 */ '',
    /* [096] 就労する期間(始期) */ '',
    /* [097] 就労する期間(終期) */ '',
    /* [098] 使用目的 */ '',

    // 代理人・取次者 (就労資格証明書) [099]〜[113]
    /* [099] */ '', /* [100] */ '', /* [101] */ '', /* [102] */ '',
    /* [103] */ '', /* [104] */ '', /* [105] */ '', /* [106] */ '',
    /* [107] */ '', /* [108] */ '', /* [109] */ '', /* [110] */ '',
    /* [111] */ '', /* [112] */ '', /* [113] */ '',
  ];
}

// ─── CSV文字列生成 ────────────────────────────────────────────────────────────

function escapeCSVField(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function rowToCSV(row: string[]): string {
  return row.map(escapeCSVField).join(',');
}

// ─── パブリックAPI ────────────────────────────────────────────────────────────

export interface ImmigrationCSVResult {
  sheet1: string; // 在留期間更新許可申請 CSV文字列
  sheet2: string; // 区分V CSV文字列
  sheet3: string; // 同時申請 CSV文字列
}

/** フォームデータを3枚のCSV文字列に変換する */
export function generateImmigrationCSV(
  formData: RenewalApplicationFormData
): ImmigrationCSVResult {
  const s1Row = buildSheet1Row(formData);
  const s2Row = buildSheet2Row(formData);
  const s3Row = buildSheet3Row(formData);

  return {
    sheet1: rowToCSV(s1Row) + '\r\n',
    sheet2: rowToCSV(s2Row) + '\r\n',
    sheet3: rowToCSV(s3Row) + '\r\n',
  };
}

/** Shift-JISエンコードしてBlobを生成する（ブラウザ向け） */
export async function generateImmigrationCSVBlob(
  formData: RenewalApplicationFormData,
  targetSheet: 'sheet1' | 'sheet2' | 'sheet3' = 'sheet2'
): Promise<Blob> {
  // encoding-japanese は dynamic import でブラウザでも使用可能
  const Encoding = (await import('encoding-japanese')).default;

  const csvStrings = generateImmigrationCSV(formData);
  const csvText = csvStrings[targetSheet];

  const unicodeArray = Array.from(csvText, (c) => c.charCodeAt(0));
  const sjisArray = Encoding.convert(unicodeArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });

  return new Blob([new Uint8Array(sjisArray)], {
    type: 'text/csv;charset=shift_jis;',
  });
}

/** 3枚全てのシートを別々のShift-JIS CSVファイルとして順番にダウンロードする */
export async function downloadImmigrationCSV(
  formData: RenewalApplicationFormData
): Promise<void> {
  const now      = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');

  const sheets: Array<{ key: 'sheet1' | 'sheet2' | 'sheet3'; label: string }> = [
    { key: 'sheet1', label: '申請情報入力(在留期間更新許可申請)' },
    { key: 'sheet2', label: '申請情報入力(区分V)' },
    { key: 'sheet3', label: '申請情報入力(同時申請)' },
  ];

  for (const sheet of sheets) {
    const blob     = await generateImmigrationCSVBlob(formData, sheet.key);
    const filename = `${sheet.label}_${yyyymmdd}.csv`;

    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // ブラウザの連続ダウンロードブロックを回避するため少し間隔を置く
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}
