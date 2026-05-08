/**
 * generateWordFiller.ts
 * テンプレート登録システム — Word（docxtemplater）差し込み関数スキャフォールド生成エンジン
 *
 * AI 解析結果の「セクション/フィールド構造」から、
 * Zod スキーマのデータを Word テンプレートのプレースホルダーに差し込む関数を生成する。
 *
 * 生成パターン:
 *   export const fillXxxWord = async (data: XxxFormData, templatePath: string) => {
 *     const content = fs.readFileSync(templatePath, 'binary');
 *     const zip = new PizZip(content);
 *     const doc = new Docxtemplater(zip, { ... });
 *     doc.render({
 *       'identityInfo.applicantName': data.identityInfo?.applicantName || '',
 *       ...
 *     });
 *     return doc.getZip().generate({ type: 'nodebuffer' });
 *   };
 *
 * 用途: 計画書等のWord付属書類を「Webフォーム入力 → Wordテンプレートに差し込み → PDF出力」するフロー
 */

import type {
  AnalyzedFormDefinition,
  AnalyzedField,
  WordPlaceholderMapping,
} from '../types';

// ─── プレースホルダーマッピング構築 ───────────────────────────────────────────

/**
 * AI 解析結果から docxtemplater のプレースホルダータグリストを生成する。
 *
 * タグ命名規則:
 *   - 単純フィールド: "sectionKey.fieldKey" （例: identityInfo.nationality）
 *   - 繰り返しフィールド: "sectionKey.fieldKey" を配列ループタグとして使用
 */
function buildPlaceholderMappings(
  definition: AnalyzedFormDefinition,
): WordPlaceholderMapping[] {
  const mappings: WordPlaceholderMapping[] = [];

  for (const section of definition.sections) {
    for (const field of section.fields) {
      mappings.push({
        tag: `${section.sectionKey}.${field.fieldKey}`,
        accessPath: `data.${section.sectionKey}?.${field.fieldKey}`,
        label: field.label,
        fieldKey: field.fieldKey,
        sectionKey: section.sectionKey,
      });
    }
  }

  return mappings;
}

// ─── コード生成 ───────────────────────────────────────────────────────────────

/**
 * AnalyzedFormDefinition から Word 差し込み関数の TypeScript スキャフォールドを生成する。
 *
 * @param definition - AI 解析結果
 * @returns TypeScript ソースコード文字列
 */
export function generateWordFiller(definition: AnalyzedFormDefinition): string {
  const PascalKey = definition.formKey.charAt(0).toUpperCase() + definition.formKey.slice(1);
  const lines: string[] = [];

  // プレースホルダーマッピングを構築
  const mappings = buildPlaceholderMappings(definition);

  // ─── ファイルヘッダー ──────────────────────────────────────────
  lines.push(`import type { ${PascalKey}FormData } from './${definition.formKey}Schema';`);
  lines.push("import * as fs from 'fs';");
  lines.push("import PizZip from 'pizzip';");
  lines.push("import Docxtemplater from 'docxtemplater';");
  lines.push('');
  lines.push('/**');
  lines.push(` * ${definition.formName} — Word 差し込み関数`);
  lines.push(' *');
  lines.push(' * Webフォームの入力データを Word テンプレート内のプレースホルダーに差し込みます。');
  lines.push(' * 出力されたバッファをファイルに保存するか、PDF変換に渡してください。');
  lines.push(' *');
  lines.push(' * ※ このファイルはテンプレート登録システムにより自動生成されたスキャフォールドです。');
  lines.push(' * ※ Wordテンプレート側に対応するプレースホルダータグを埋め込んでください。');
  lines.push(' *');
  lines.push(` * プレースホルダー数: ${mappings.length} 個`);
  lines.push(' *');
  lines.push(` * @param data - ${PascalKey}FormData（Zodスキーマから推定された入力データ）`);
  lines.push(' * @param templatePath - Wordテンプレートファイル（.docx）のパス');
  lines.push(' * @returns 差し込み済みの .docx ファイルバッファ（Buffer）');
  lines.push(' */');

  lines.push(`export const fill${PascalKey}Word = async (`);
  lines.push(`  data: ${PascalKey}FormData,`);
  lines.push(`  templatePath: string,`);
  lines.push(`): Promise<Buffer> => {`);
  lines.push('');
  lines.push("  // ─── テンプレート読み込み ──────────────────────────────────");
  lines.push("  const content = fs.readFileSync(templatePath, 'binary');");
  lines.push('  const zip = new PizZip(content);');
  lines.push('  const doc = new Docxtemplater(zip, {');
  lines.push("    paragraphLoop: true,");
  lines.push("    linebreaks: true,");
  lines.push("    // 未定義タグをエラーにしない（段階的にタグを追加するため）");
  lines.push("    nullGetter: () => '',");
  lines.push('  });');
  lines.push('');

  // ─── データマッピングオブジェクトの生成 ──────────────────────
  lines.push('  // ─── データマッピング ──────────────────────────────────────');
  lines.push('  doc.render({');

  let currentSection = '';
  for (const m of mappings) {
    if (m.sectionKey !== currentSection) {
      currentSection = m.sectionKey;
      const sectionInfo = definition.sections.find(s => s.sectionKey === currentSection);
      lines.push(`    // ═══ ${sectionInfo?.sectionLabel || currentSection} ═══`);
    }

    // 繰り返しフィールドの検出
    const field = definition.sections
      .find(s => s.sectionKey === m.sectionKey)?.fields
      .find(f => f.fieldKey === m.fieldKey);

    if (field?.isRepeatable) {
      lines.push(`    // ※ 繰り返し項目: Word側で {#${m.tag}}...{/${m.tag}} ループを使用`);
      lines.push(`    '${m.tag}': ${m.accessPath} || [], // ${m.label}`);
    } else {
      lines.push(`    '${m.tag}': ${m.accessPath} || '', // ${m.label}`);
    }
  }

  lines.push('  });');
  lines.push('');

  // ─── バッファ生成 ──────────────────────────────────────────
  lines.push("  // ─── 出力生成 ──────────────────────────────────────────────");
  lines.push("  const buf = doc.getZip().generate({");
  lines.push("    type: 'nodebuffer',");
  lines.push("    compression: 'DEFLATE',");
  lines.push("  });");
  lines.push('');
  lines.push('  return buf;');
  lines.push('};');
  lines.push('');

  // ─── プレースホルダー一覧（Wordテンプレート作成ガイド） ──────
  lines.push('// ═══════════════════════════════════════════════════════════════');
  lines.push(`// Word テンプレート用プレースホルダー一覧 (全${mappings.length}個)`);
  lines.push('// ═══════════════════════════════════════════════════════════════');
  lines.push('//');
  lines.push('// 原本の Word ファイルの各入力箇所に、以下のタグを埋め込んでください。');
  lines.push('// タグは docxtemplater 形式: {タグ名} で記述します。');
  lines.push('//');

  currentSection = '';
  for (const m of mappings) {
    if (m.sectionKey !== currentSection) {
      currentSection = m.sectionKey;
      const sectionInfo = definition.sections.find(s => s.sectionKey === currentSection);
      lines.push(`// ─── ${sectionInfo?.sectionLabel || currentSection} ───`);
    }

    const field = definition.sections
      .find(s => s.sectionKey === m.sectionKey)?.fields
      .find(f => f.fieldKey === m.fieldKey);

    if (field?.isRepeatable) {
      lines.push(`//   {#${m.tag}}...{/${m.tag}}  ← "${m.label}" （繰り返し）`);
    } else {
      lines.push(`//   {${m.tag}}  ← "${m.label}"`);
    }
  }
  lines.push('//');
  lines.push('');

  return lines.join('\n');
}
