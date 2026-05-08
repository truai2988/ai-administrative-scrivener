/**
 * generateExcelFiller.ts
 * テンプレート登録システム — Excel 差し込み関数スキャフォールド生成エンジン
 *
 * パーサーが取得した「セル番地（cellRef）」と AI 解析結果の「セクション/フィールド構造」を
 * 突き合わせ、Zod スキーマのデータを原本 Excel の特定セルに書き込む関数を生成する。
 *
 * 生成パターン:
 *   export const fillXxxExcel = async (data: XxxFormData, workbook: ExcelJS.Workbook) => {
 *     const sheet = workbook.getWorksheet('Sheet1');
 *     sheet.getCell('B5').value = data.identityInfo?.applicantName || '';
 *     ...
 *     return workbook;
 *   };
 *
 * 用途: 評価調書などの付属書類を「Webフォーム入力 → 原本Excelに差し込み → PDF出力」するフロー
 */

import type {
  AnalyzedFormDefinition,
  AnalyzedField,
  ParsedFormStructure,
  ParsedField,
  CellMapping,
} from '../types';

// ─── ラベルマッチング ─────────────────────────────────────────────────────────

/**
 * パーサーのフィールド（セル番地付き）と AI 解析結果のフィールド（英語キー付き）を
 * 日本語ラベルの類似度で突き合わせ、CellMapping のリストを生成する。
 */
function buildCellMappings(
  parsed: ParsedFormStructure,
  definition: AnalyzedFormDefinition,
): CellMapping[] {
  const mappings: CellMapping[] = [];

  // AI 解析結果をラベルでインデックス化
  const analyzedByLabel = new Map<string, { sectionKey: string; field: AnalyzedField }>();
  for (const section of definition.sections) {
    for (const field of section.fields) {
      // 完全一致用
      analyzedByLabel.set(field.label, { sectionKey: section.sectionKey, field });
      // ラベルから括弧番号を除去したキーも登録（"(1) 国籍・地域" → "国籍・地域"）
      const stripped = field.label.replace(/^[（(]\d+[)）]\s*/, '');
      if (stripped !== field.label) {
        analyzedByLabel.set(stripped, { sectionKey: section.sectionKey, field });
      }
    }
  }

  // パーサーの各フィールドについて、AI 解析結果とのマッチングを試行
  for (const parsedField of parsed.fields) {
    if (!parsedField.cellRef || !parsedField.sheetName) continue;

    // ① 完全一致
    let match = analyzedByLabel.get(parsedField.label);

    // ② 括弧番号除去後で一致
    if (!match) {
      const stripped = parsedField.label.replace(/^[（(]\d+[)）]\s*/, '');
      match = analyzedByLabel.get(stripped);
    }

    // ③ 部分一致（ラベルのどちらかが他方を含む）
    if (!match) {
      for (const [label, info] of analyzedByLabel) {
        if (parsedField.label.includes(label) || label.includes(parsedField.label)) {
          match = info;
          break;
        }
      }
    }

    if (match) {
      mappings.push({
        sheetName: parsedField.sheetName,
        cellRef: parsedField.cellRef,
        accessPath: `data.${match.sectionKey}?.${match.field.fieldKey}`,
        label: parsedField.label,
        fieldKey: match.field.fieldKey,
        sectionKey: match.sectionKey,
      });
    } else {
      // マッチング不明 — TODO コメントとして出力
      mappings.push({
        sheetName: parsedField.sheetName,
        cellRef: parsedField.cellRef,
        accessPath: `'' /* TODO: マッピング未特定 — "${parsedField.label}" */`,
        label: parsedField.label,
        fieldKey: '__unknown__',
        sectionKey: '__unknown__',
      });
    }
  }

  return mappings;
}

// ─── コード生成 ───────────────────────────────────────────────────────────────

/**
 * AnalyzedFormDefinition + ParsedFormStructure から
 * Excel 差し込み関数の TypeScript スキャフォールドを生成する。
 *
 * @param definition - AI 解析結果
 * @param parsed - パーサー出力（セル番地情報を含む）
 * @returns TypeScript ソースコード文字列
 */
export function generateExcelFiller(
  definition: AnalyzedFormDefinition,
  parsed: ParsedFormStructure,
): string {
  const PascalKey = definition.formKey.charAt(0).toUpperCase() + definition.formKey.slice(1);
  const lines: string[] = [];

  // セルマッピングを構築
  const mappings = buildCellMappings(parsed, definition);

  // マッピング統計
  const matched = mappings.filter(m => m.fieldKey !== '__unknown__').length;
  const unmatched = mappings.filter(m => m.fieldKey === '__unknown__').length;

  // ─── ファイルヘッダー ──────────────────────────────────────────
  lines.push(`import type { ${PascalKey}FormData } from '@/lib/schemas/${definition.formKey}Schema';`);
  lines.push("import type { Workbook } from 'exceljs';");
  lines.push('');
  lines.push('/**');
  lines.push(` * ${definition.formName} — Excel 差し込み関数`);
  lines.push(' *');
  lines.push(' * Webフォームの入力データを原本 Excel ファイルの特定セルに書き込みます。');
  lines.push(' * 書き込み後の Workbook をPDF出力するフローで使用します。');
  lines.push(' *');
  lines.push(' * ※ このファイルはテンプレート登録システムにより自動生成されたスキャフォールドです。');
  lines.push(' * ※ セル番地やデータ変換ロジックは原本に合わせて手動調整してください。');
  lines.push(' *');
  lines.push(` * マッピング統計: ${matched} 件マッチ / ${unmatched} 件未特定 (全${mappings.length}件)`);
  lines.push(' *');
  lines.push(` * @param data - ${PascalKey}FormData（Zodスキーマから推定された入力データ）`);
  lines.push(' * @param workbook - ExcelJS の Workbook インスタンス（原本を読み込み済み）');
  lines.push(` * @returns 書き込み済みの Workbook`);
  lines.push(' */');

  lines.push(`export const fill${PascalKey}Excel = async (`);
  lines.push(`  data: ${PascalKey}FormData,`);
  lines.push(`  workbook: Workbook,`);
  lines.push(`): Promise<Workbook> => {`);

  // シートごとにグルーピング
  const bySheet = new Map<string, CellMapping[]>();
  for (const m of mappings) {
    if (!bySheet.has(m.sheetName)) {
      bySheet.set(m.sheetName, []);
    }
    bySheet.get(m.sheetName)!.push(m);
  }

  // 各シートの書き込みコードを生成
  let sheetIdx = 0;
  for (const [sheetName, sheetMappings] of bySheet) {
    sheetIdx++;
    const varName = `ws${sheetIdx}`;

    lines.push('');
    lines.push(`  // ═══════════════════════════════════════════════════════════════`);
    lines.push(`  // シート${sheetIdx}: "${sheetName}"`);
    lines.push(`  // ═══════════════════════════════════════════════════════════════`);
    lines.push(`  const ${varName} = workbook.getWorksheet('${sheetName.replace(/'/g, "\\'")}');`);
    lines.push(`  if (!${varName}) throw new Error('シート "${sheetName}" が見つかりません');`);
    lines.push('');

    // セクションごとにグルーピングして出力
    let currentSection = '';
    for (const m of sheetMappings) {
      if (m.sectionKey !== currentSection && m.sectionKey !== '__unknown__') {
        currentSection = m.sectionKey;
        const sectionInfo = definition.sections.find(s => s.sectionKey === currentSection);
        lines.push(`  // ─── ${sectionInfo?.sectionLabel || currentSection} ───`);
      }

      if (m.fieldKey === '__unknown__') {
        // マッチング不明
        lines.push(`  // ⚠️ [${m.cellRef}] "${m.label}" — マッピング未特定`);
        lines.push(`  // ${varName}.getCell('${m.cellRef}').value = ${m.accessPath};`);
      } else {
        // マッチング済み
        lines.push(`  ${varName}.getCell('${m.cellRef}').value = ${m.accessPath} || ''; // ${m.label}`);
      }
    }
  }

  lines.push('');
  lines.push('  return workbook;');
  lines.push('};');
  lines.push('');

  // ─── ヘルパー関数（セルスタイル保持のユーティリティ） ──────────
  lines.push('// ─── ヘルパー: セルに値を書き込みつつ既存スタイルを保持 ──────────');
  lines.push('// ※ ExcelJS ではセルの .value を直接書き換えるだけでスタイルは維持されます。');
  lines.push('// ※ 日付変換やフォーマット処理が必要な場合は、以下のようなヘルパーを追加してください:');
  lines.push('//');
  lines.push('// function setCellDate(sheet: Worksheet, ref: string, yyyymmdd: string) {');
  lines.push('//   if (!yyyymmdd || yyyymmdd.length !== 8) return;');
  lines.push('//   const y = parseInt(yyyymmdd.slice(0, 4));');
  lines.push('//   const m = parseInt(yyyymmdd.slice(4, 6)) - 1;');
  lines.push('//   const d = parseInt(yyyymmdd.slice(6, 8));');
  lines.push('//   sheet.getCell(ref).value = new Date(y, m, d);');
  lines.push('// }');
  lines.push('');

  return lines.join('\n');
}
