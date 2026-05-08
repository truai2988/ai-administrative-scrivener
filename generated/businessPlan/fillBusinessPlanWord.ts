import type { BusinessPlanFormData } from '@/lib/schemas/businessPlanSchema';
import * as fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

/**
 * 事業計画書 — Word 差し込み関数
 *
 * Webフォームの入力データを Word テンプレート内のプレースホルダーに差し込みます。
 * 出力されたバッファをファイルに保存するか、PDF変換に渡してください。
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されたスキャフォールドです。
 * ※ Wordテンプレート側に対応するプレースホルダータグを埋め込んでください。
 *
 * プレースホルダー数: 15 個
 *
 * @param data - BusinessPlanFormData（Zodスキーマから推定された入力データ）
 * @param templatePath - Wordテンプレートファイル（.docx）のパス
 * @returns 差し込み済みの .docx ファイルバッファ（Buffer）
 */
export const fillBusinessPlanWord = async (
  data: BusinessPlanFormData,
  templatePath: string,
): Promise<Buffer> => {

  // ─── テンプレート読み込み ──────────────────────────────────
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // 未定義タグをエラーにしない（段階的にタグを追加するため）
    nullGetter: () => '',
  });

  // ─── データマッピング ──────────────────────────────────────
  doc.render({
    // ═══ 申請者情報 ═══
    'applicantInfo.name': data.applicantInfo?.name || '', // (1) 氏名
    'applicantInfo.birthDate': data.applicantInfo?.birthDate || '', // (2) 生年月日
    'applicantInfo.nationality': data.applicantInfo?.nationality || '', // (3) 国籍
    'applicantInfo.address': data.applicantInfo?.address || '', // (4) 住所
    'applicantInfo.phoneNumber': data.applicantInfo?.phoneNumber || '', // (5) 電話番号
    // ═══ 事業概要 ═══
    'businessOverview.businessName': data.businessOverview?.businessName || '', // (1) 事業の名称
    'businessOverview.businessContent': data.businessOverview?.businessContent || '', // (2) 事業の内容
    'businessOverview.businessStartDate': data.businessOverview?.businessStartDate || '', // (3) 事業開始予定年月日
    'businessOverview.businessLocation': data.businessOverview?.businessLocation || '', // (4) 事業所の所在地
    'businessOverview.numberOfEmployees': data.businessOverview?.numberOfEmployees || '', // (5) 従業員数
    'businessOverview.capital': data.businessOverview?.capital || '', // (6) 資本金
    // ═══ 経歴・資格 ═══
    'careerQualifications.finalEducation': data.careerQualifications?.finalEducation || '', // (1) 最終学歴
    'careerQualifications.workHistory': data.careerQualifications?.workHistory || '', // (2) 職歴
    'careerQualifications.qualifications': data.careerQualifications?.qualifications || '', // (3) 保有資格
    'careerQualifications.japaneseProficiency': data.careerQualifications?.japaneseProficiency || '', // (4) 日本語能力
  });

  // ─── 出力生成 ──────────────────────────────────────────────
  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return buf;
};

// ═══════════════════════════════════════════════════════════════
// Word テンプレート用プレースホルダー一覧 (全15個)
// ═══════════════════════════════════════════════════════════════
//
// 原本の Word ファイルの各入力箇所に、以下のタグを埋め込んでください。
// タグは docxtemplater 形式: {タグ名} で記述します。
//
// ─── 申請者情報 ───
//   {applicantInfo.name}  ← "(1) 氏名"
//   {applicantInfo.birthDate}  ← "(2) 生年月日"
//   {applicantInfo.nationality}  ← "(3) 国籍"
//   {applicantInfo.address}  ← "(4) 住所"
//   {applicantInfo.phoneNumber}  ← "(5) 電話番号"
// ─── 事業概要 ───
//   {businessOverview.businessName}  ← "(1) 事業の名称"
//   {businessOverview.businessContent}  ← "(2) 事業の内容"
//   {businessOverview.businessStartDate}  ← "(3) 事業開始予定年月日"
//   {businessOverview.businessLocation}  ← "(4) 事業所の所在地"
//   {businessOverview.numberOfEmployees}  ← "(5) 従業員数"
//   {businessOverview.capital}  ← "(6) 資本金"
// ─── 経歴・資格 ───
//   {careerQualifications.finalEducation}  ← "(1) 最終学歴"
//   {careerQualifications.workHistory}  ← "(2) 職歴"
//   {careerQualifications.qualifications}  ← "(3) 保有資格"
//   {careerQualifications.japaneseProficiency}  ← "(4) 日本語能力"
//
