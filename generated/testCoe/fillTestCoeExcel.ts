import type { TestCoeFormData } from './testCoeSchema';
import type { Workbook } from 'exceljs';

/**
 * テストCOE申請 — Excel 差し込み関数
 *
 * Webフォームの入力データを原本 Excel ファイルの特定セルに書き込みます。
 * 書き込み後の Workbook をPDF出力するフローで使用します。
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されたスキャフォールドです。
 * ※ セル番地やデータ変換ロジックは原本に合わせて手動調整してください。
 *
 * マッピング統計: 44 件マッチ / 0 件未特定 (全44件)
 *
 * @param data - TestCoeFormData（Zodスキーマから推定された入力データ）
 * @param workbook - ExcelJS の Workbook インスタンス（原本を読み込み済み）
 * @returns 書き込み済みの Workbook
 */
export const fillTestCoeExcel = async (
  data: TestCoeFormData,
  workbook: Workbook,
): Promise<Workbook> => {

  // ═══════════════════════════════════════════════════════════════
  // シート1: "申請書本体"
  // ═══════════════════════════════════════════════════════════════
  const ws1 = workbook.getWorksheet('申請書本体');
  if (!ws1) throw new Error('シート "申請書本体" が見つかりません');

  // ─── 身分事項 ───
  ws1.getCell('B4').value = data.identityInfo?.nationality || ''; // (1) 国籍・地域
  ws1.getCell('B5').value = data.identityInfo?.birthDate || ''; // (2) 生年月日
  ws1.getCell('B6').value = data.identityInfo?.nameEn || ''; // (3) 氏名（ローマ字）
  ws1.getCell('B7').value = data.identityInfo?.gender || ''; // (4) 性別
  ws1.getCell('B8').value = data.identityInfo?.birthPlace || ''; // (5) 出生地
  ws1.getCell('B9').value = data.identityInfo?.maritalStatus || ''; // (6) 配偶者の有無
  ws1.getCell('B10').value = data.identityInfo?.occupation || ''; // (7) 職業
  ws1.getCell('B11').value = data.identityInfo?.homeCountryAddress || ''; // (8) 本国における居住地
  ws1.getCell('B14').value = data.identityInfo?.zipCode || ''; // (9) 郵便番号
  ws1.getCell('B15').value = data.identityInfo?.prefecture || ''; // (10) 都道府県
  ws1.getCell('B16').value = data.identityInfo?.city || ''; // (11) 市区町村
  ws1.getCell('B17').value = data.identityInfo?.streetAddress || ''; // (12) 町名丁目番地号等
  ws1.getCell('B18').value = data.identityInfo?.phoneNumber || ''; // (13) 電話番号
  ws1.getCell('B19').value = data.identityInfo?.mobileNumber || ''; // (14) 携帯電話番号
  ws1.getCell('B20').value = data.identityInfo?.email || ''; // (15) メールアドレス
  // ─── 旅券情報 ───
  ws1.getCell('B23').value = data.passportInfo?.passportNumber || ''; // (16) 旅券番号
  ws1.getCell('B24').value = data.passportInfo?.passportExpiryDate || ''; // (17) 旅券有効期限
  ws1.getCell('B27').value = data.passportInfo?.purposeOfEntry || ''; // (18) 入国目的
  ws1.getCell('B28').value = data.passportInfo?.plannedEntryDate || ''; // (19) 入国予定年月日
  ws1.getCell('B29').value = data.passportInfo?.portOfEntry || ''; // (20) 上陸予定港
  ws1.getCell('B30').value = data.passportInfo?.plannedStayDuration || ''; // (21) 滞在予定期間

  // ═══════════════════════════════════════════════════════════════
  // シート2: "在日親族"
  // ═══════════════════════════════════════════════════════════════
  const ws2 = workbook.getWorksheet('在日親族');
  if (!ws2) throw new Error('シート "在日親族" が見つかりません');

  // ─── 家族情報 ───
  ws2.getCell('B2').value = data.familyInfo?.hasRelativesInJapan || ''; // 在日親族の有無
  // ─── 所属機関 ───
  ws2.getCell('H3').value = data.organizationInfo?.employerName || ''; // 勤務先
  // ─── 家族情報 ───
  ws2.getCell('X24').value = String(data.cohabitingFamily?.cohabitingFamily || '');
  ws2.getCell('B4').value = String(data.familyInfo?.relative || ''); // 親族1
  ws2.getCell('B5').value = String(data.familyInfo?.relative || ''); // 親族2
  ws2.getCell('B6').value = String(data.familyInfo?.relative || ''); // 親族3
  ws2.getCell('B7').value = String(data.familyInfo?.relative || ''); // 親族4
  ws2.getCell('B8').value = String(data.familyInfo?.relative || ''); // 親族5
  ws2.getCell('B9').value = String(data.familyInfo?.relative || ''); // 親族6
  ws2.getCell('B10').value = String(data.familyInfo?.relative || ''); // 親族7処分の内容

  // ═══════════════════════════════════════════════════════════════
  // シート3: "所属機関"
  // ═══════════════════════════════════════════════════════════════
  const ws3 = workbook.getWorksheet('所属機関');
  if (!ws3) throw new Error('シート "所属機関" が見つかりません');

  // ─── 所属機関 ───
  ws3.getCell('B2').value = data.organizationInfo?.organizationName || ''; // (1) 名称
  ws3.getCell('B3').value = data.organizationInfo?.branchName || ''; // (2) 支店・事業所名
  ws3.getCell('B4').value = data.organizationInfo?.hasCorporateNumber || ''; // (3) 法人番号の有無
  ws3.getCell('B5').value = data.organizationInfo?.corporateNumber || ''; // (4) 法人番号
  ws3.getCell('B6').value = data.organizationInfo?.industryType || ''; // (5) 業種
  ws3.getCell('B7').value = data.organizationInfo?.organizationZipCode || ''; // (6) 郵便番号
  ws3.getCell('B8').value = data.organizationInfo?.organizationPrefecture || ''; // (7) 所在地(都道府県)
  ws3.getCell('B9').value = data.organizationInfo?.organizationCity || ''; // (8) 所在地(市区町村)
  ws3.getCell('B10').value = data.organizationInfo?.organizationStreetAddress || ''; // (9) 所在地(町名丁目番地号等)
  ws3.getCell('B11').value = data.organizationInfo?.organizationPhoneNumber || ''; // (10) 電話番号
  ws3.getCell('B12').value = data.organizationInfo?.capitalAmount || ''; // (11) 資本金
  ws3.getCell('B13').value = data.organizationInfo?.numberOfEmployees || ''; // (12) 従業員数
  ws3.getCell('B14').value = data.organizationInfo?.monthlySalary || ''; // (13) 月額報酬

  return workbook;
};

// ─── ヘルパー: セルに値を書き込みつつ既存スタイルを保持 ──────────
// ※ ExcelJS ではセルの .value を直接書き換えるだけでスタイルは維持されます。
// ※ 日付変換やフォーマット処理が必要な場合は、以下のようなヘルパーを追加してください:
//
// function setCellDate(sheet: Worksheet, ref: string, yyyymmdd: string) {
//   if (!yyyymmdd || yyyymmdd.length !== 8) return;
//   const y = parseInt(yyyymmdd.slice(0, 4));
//   const m = parseInt(yyyymmdd.slice(4, 6)) - 1;
//   const d = parseInt(yyyymmdd.slice(6, 8));
//   sheet.getCell(ref).value = new Date(y, m, d);
// }
