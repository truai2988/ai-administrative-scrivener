/**
 * generateCsvMapper.ts
 * テンプレート登録システム — CSV マッパー関数スキャフォールド生成エンジン
 *
 * AnalyzedFormDefinition の セクション/フィールド構造と CSV ヘッダー配列を突き合わせ、
 * 入力データ → CSV 行変換マッパー関数の TypeScript スキャフォールドを生成する。
 *
 * 生成パターン（既存の generateCoeMainCsv.ts に準拠）:
 *   export const generateXxxCsv = (data: XxxFormData): string => {
 *     const row: string[] = new Array(N).fill('');
 *     row[0] = data.identityInfo?.nationality || '';
 *     ...
 *     return createCsvString(XXX_HEADERS, row);
 *   };
 */

import type { AnalyzedFormDefinition, AnalyzedField, AnalyzedCsvFile } from '../types';

/**
 * フィールドの formData アクセスパス（オプショナルチェーン付き）を生成
 *
 * 例: data.identityInfo?.nationality || ''
 */
function buildAccessPath(sectionKey: string, field: AnalyzedField): string {
  return `data.${sectionKey}?.${field.fieldKey}`;
}

/**
 * CSVヘッダーとフィールドの対応マッピングを構築
 *
 * AI が返した csvHeader と headers 配列を突き合わせてインデックスを特定する。
 * 完全一致しない場合は部分一致も試行する。
 */
function buildHeaderFieldMap(
  headers: string[],
  sections: AnalyzedFormDefinition['sections'],
): Array<{ index: number; header: string; sectionKey: string; field: AnalyzedField } | null> {
  const result: Array<{ index: number; header: string; sectionKey: string; field: AnalyzedField } | null> = [];

  // フィールドの csvHeader → フィールド情報のルックアップテーブル
  const fieldLookup = new Map<string, { sectionKey: string; field: AnalyzedField }>();
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.csvHeader) {
        fieldLookup.set(field.csvHeader, { sectionKey: section.sectionKey, field });
        // snake_case → 正規化した比較用キーも登録
        fieldLookup.set(field.csvHeader.toLowerCase(), { sectionKey: section.sectionKey, field });
      }
    }
  }

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];

    // 完全一致
    let match = fieldLookup.get(header) || fieldLookup.get(header.toLowerCase());

    // 部分一致（ヘッダーにフィールドのキーが含まれる、または逆）
    if (!match) {
      for (const [csvHeader, info] of fieldLookup) {
        if (header.includes(csvHeader) || csvHeader.includes(header)) {
          match = info;
          break;
        }
      }
    }

    if (match) {
      result.push({ index: i, header, sectionKey: match.sectionKey, field: match.field });
    } else {
      result.push(null); // マッピング不明
    }
  }

  return result;
}

/**
 * AnalyzedFormDefinition から CSV マッパー関数のスキャフォールドを生成する。
 *
 * @param definition - AI 解析結果
 * @returns TypeScript ソースコード文字列
 */
export function generateCsvMapper(definition: AnalyzedFormDefinition): string {
  const lines: string[] = [];
  const PascalKey = definition.formKey.charAt(0).toUpperCase() + definition.formKey.slice(1);
  const UPPER_KEY = definition.formKey
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/^_/, '');

  // ─── ファイルヘッダー ──────────────────────────────────────────
  lines.push(`import type { ${PascalKey}FormData } from './${definition.formKey}Schema';`);
  lines.push(`import { createCsvString } from '@/lib/csv/csvUtils';`);
  lines.push('');
  lines.push('/**');
  lines.push(` * ${definition.formName} の CSV データを生成します。`);
  lines.push(' *');
  lines.push(' * ※ このファイルはテンプレート登録システムにより自動生成されたスキャフォールドです。');
  lines.push(' * ※ 各 row[N] の値変換ロジック（日付フォーマット、ハイフン除去等）は手動で調整してください。');
  lines.push(' *');
  lines.push(` * @param data - ${PascalKey}FormData`);
  lines.push(' * @returns CSVフォーマットの文字列 (ヘッダー1行 + データ1行)');
  lines.push(' */');

  // CSV ファイルが定義されている場合
  if (definition.csvFiles && definition.csvFiles.length > 0) {
    for (let fileIdx = 0; fileIdx < definition.csvFiles.length; fileIdx++) {
      const csvFile = definition.csvFiles[fileIdx];
      const suffix = definition.csvFiles.length > 1 ? `_${fileIdx + 1}` : '';
      const funcName = `generate${PascalKey}${suffix ? `Part${fileIdx + 1}` : ''}Csv`;
      const headerCount = csvFile.headers.length;

      // ヘッダーとフィールドのマッピング
      const mapping = buildHeaderFieldMap(csvFile.headers, definition.sections);

      lines.push(`export const ${funcName} = (data: ${PascalKey}FormData): string => {`);
      lines.push(`  // ${csvFile.fileName} — 全${headerCount}項目`);
      lines.push(`  const row: string[] = new Array(${headerCount}).fill('');`);
      lines.push('');

      // セクションごとにグルーピングして出力
      let currentSection = '';
      for (let i = 0; i < mapping.length; i++) {
        const m = mapping[i];
        const header = csvFile.headers[i];

        if (m) {
          // セクション変更時のコメント
          if (m.sectionKey !== currentSection) {
            currentSection = m.sectionKey;
            const sectionInfo = definition.sections.find(s => s.sectionKey === currentSection);
            lines.push(`  // ═══ ${sectionInfo?.sectionLabel || currentSection} ═══`);
          }

          // 繰り返しフィールドの場合
          if (m.field.isRepeatable) {
            lines.push(`  // [${i}] ${header} — ※ 繰り返し項目: ${m.field.fieldKey} からマッピングが必要です`);
            lines.push(`  row[${i}] = ''; // TODO: data.${m.sectionKey}?.${m.field.fieldKey}?.[N] の展開ロジックを実装`);
          } else {
            lines.push(`  // [${i}] ${header}`);
            lines.push(`  row[${i}] = String(${buildAccessPath(m.sectionKey, m.field)} ?? '');`);
          }
        } else {
          // マッピング不明
          lines.push(`  // [${i}] ${header}`);
          lines.push(`  row[${i}] = ''; // TODO: マッピング未特定 — 手動で割り当ててください`);
        }
      }

      lines.push('');

      // ヘッダー定義（インライン）
      lines.push('  // ─── ヘッダー定義 ──────────────────────────────────────');
      lines.push('  const headers: string[] = [');
      for (let i = 0; i < csvFile.headers.length; i++) {
        const h = csvFile.headers[i].replace(/'/g, "\\'");
        const isLast = i === csvFile.headers.length - 1;
        lines.push(`    '${h}'${isLast ? '' : ','} // [${i}]`);
      }
      lines.push('  ];');
      lines.push('');
      lines.push('  return createCsvString(headers, row);');
      lines.push('};');
      lines.push('');
    }
  } else {
    // CSV ファイル定義がない場合 — フィールドから直接マッパーを生成
    const funcName = `generate${PascalKey}Csv`;

    // 全フィールドをフラットに列挙
    const allFields: Array<{ sectionKey: string; field: AnalyzedField }> = [];
    for (const section of definition.sections) {
      for (const field of section.fields) {
        if (!field.isRepeatable) {
          allFields.push({ sectionKey: section.sectionKey, field });
        }
      }
    }

    // 繰り返しフィールドを末尾に追加
    for (const section of definition.sections) {
      for (const field of section.fields) {
        if (field.isRepeatable && field.repeatMax) {
          for (let n = 0; n < field.repeatMax; n++) {
            allFields.push({ sectionKey: section.sectionKey, field });
          }
        }
      }
    }

    const totalCount = allFields.length;

    lines.push(`export const ${funcName} = (data: ${PascalKey}FormData): string => {`);
    lines.push(`  const row: string[] = new Array(${totalCount}).fill('');`);
    lines.push('');

    let currentSection = '';
    for (let i = 0; i < allFields.length; i++) {
      const { sectionKey, field } = allFields[i];

      if (sectionKey !== currentSection) {
        currentSection = sectionKey;
        const sectionInfo = definition.sections.find(s => s.sectionKey === currentSection);
        lines.push(`  // ═══ ${sectionInfo?.sectionLabel || currentSection} ═══`);
      }

      if (field.isRepeatable) {
        lines.push(`  // [${i}] ${field.csvHeader || field.fieldKey} — 繰り返し項目`);
        lines.push(`  row[${i}] = ''; // TODO: data.${sectionKey}?.${field.fieldKey}?.[N]`);
      } else {
        lines.push(`  // [${i}] ${field.csvHeader || field.fieldKey}`);
        lines.push(`  row[${i}] = String(${buildAccessPath(sectionKey, field)} ?? '');`);
      }
    }

    lines.push('');

    // ヘッダーをフィールドの csvHeader から生成
    lines.push('  const headers: string[] = [');
    for (let i = 0; i < allFields.length; i++) {
      const { field } = allFields[i];
      const h = (field.csvHeader || field.fieldKey).replace(/'/g, "\\'");
      const isLast = i === allFields.length - 1;
      lines.push(`    '${h}'${isLast ? '' : ','} // [${i}]`);
    }
    lines.push('  ];');
    lines.push('');
    lines.push('  return createCsvString(headers, row);');
    lines.push('};');
    lines.push('');
  }

  return lines.join('\n');
}
