/**
 * generateCsvHeaders.ts
 * テンプレート登録システム — CSV ヘッダー定義生成エンジン
 *
 * AnalyzedFormDefinition から、既存の coeSpecificHeaders.ts パターンに
 * 準拠した CSV ヘッダー配列の TypeScript ソースコードを生成する。
 */

import type { AnalyzedFormDefinition, AnalyzedCsvFile } from '../types';

/**
 * 1つの CSV ファイル定義から export const XXX_HEADERS: string[] = [...] を生成
 */
function generateHeaderArray(csvFile: AnalyzedCsvFile, constName: string): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(` * ${csvFile.fileName} のヘッダー定義`);
  lines.push(` * 全${csvFile.headerCount}項目（インデックス 0〜${csvFile.headerCount - 1}）`);
  lines.push(' *');
  lines.push(' * ※ このファイルはテンプレート登録システムにより自動生成されました。手動編集しないでください。');
  lines.push(' */');
  lines.push(`export const ${constName}: string[] = [`);

  for (let i = 0; i < csvFile.headers.length; i++) {
    const header = csvFile.headers[i].replace(/'/g, "\\'");
    const isLast = i === csvFile.headers.length - 1;
    lines.push(`  '${header}'${isLast ? '' : ','} // [${i}]`);
  }

  lines.push('];');

  return lines.join('\n');
}

/**
 * AnalyzedFormDefinition 全体から CSV ヘッダー定義ファイルを生成する。
 *
 * @param definition - AI 解析結果
 * @returns Record<ファイル名, TypeScript ソースコード文字列>
 */
export function generateCsvHeaders(definition: AnalyzedFormDefinition): Record<string, string> {
  const results: Record<string, string> = {};

  if (!definition.csvFiles || definition.csvFiles.length === 0) {
    // CSV ファイル定義が無い場合、セクションのフィールドからヘッダーを生成
    const allHeaders = definition.sections.flatMap(s =>
      s.fields.filter(f => f.csvHeader).map(f => f.csvHeader)
    );

    if (allHeaders.length > 0) {
      const UPPER_KEY = definition.formKey
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()
        .replace(/^_/, '');

      const constName = `${UPPER_KEY}_HEADERS`;
      const csvFile: AnalyzedCsvFile = {
        fileName: `${definition.formName}.csv`,
        headerCount: allHeaders.length,
        headers: allHeaders,
      };

      results[`${definition.formKey}Headers.ts`] = generateHeaderArray(csvFile, constName);
    }

    return results;
  }

  // CSV ファイルごとにヘッダー定義を生成
  for (let i = 0; i < definition.csvFiles.length; i++) {
    const csvFile = definition.csvFiles[i];
    const UPPER_KEY = definition.formKey
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');

    const suffix = definition.csvFiles.length > 1 ? `_${i + 1}` : '';
    const constName = `${UPPER_KEY}${suffix}_HEADERS`;
    const fileName = `${definition.formKey}Headers${suffix}.ts`;

    results[fileName] = generateHeaderArray(csvFile, constName);
  }

  return results;
}
