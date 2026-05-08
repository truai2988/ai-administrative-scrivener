/**
 * generateZodSchema.ts
 * テンプレート登録システム — Zod スキーマ生成エンジン
 *
 * AnalyzedFormDefinition から、既存の coeApplicationSchema.ts パターンに
 * 準拠した Zod スキーマの TypeScript ソースコードを生成する。
 */

import type { AnalyzedFormDefinition, AnalyzedField, AnalyzedSection } from '../types';

/**
 * フィールド1つ分の Zod 定義コードを生成
 */
function generateFieldCode(field: AnalyzedField, indent: string = '  '): string {
  const lines: string[] = [];
  let zodChain = '';

  // ─── enum 値の正規化（AI がオブジェクト配列で返す場合がある） ───
  let enumStrings: string[] | undefined;
  if (field.enumValues && field.enumValues.length > 0) {
    enumStrings = field.enumValues.map((v: unknown) => {
      if (typeof v === 'string') return v;
      if (typeof v === 'object' && v !== null && 'value' in v) return String((v as { value: string }).value);
      return String(v);
    });
  }

  // ─── 基本型の決定 ───────────────────────────────────────────
  if (enumStrings && enumStrings.length > 0) {
    const vals = enumStrings.map(v => `'${v}'`).join(', ');
    zodChain = `z.enum([${vals}], { message: '選択してください' })`;
  } else if (field.zodType.includes('z.number')) {
    zodChain = 'z.number()';
  } else {
    zodChain = 'z.string()';
  }

  // ─── バリデーションチェーンの追加 ────────────────────────────
  if (field.isRequired && !enumStrings) {
    zodChain += `.min(1, '必須項目です')`;
  }

  if (field.validation.maxLength) {
    zodChain += `.max(${field.validation.maxLength}, '${field.validation.maxLength}文字以内で入力してください')`;
  }

  if (field.validation.regex) {
    const desc = field.validation.regexDescription || 'フォーマットエラー';
    zodChain += `.regex(/${field.validation.regex}/, '${desc}')`;
  }

  // optional の付与
  if (!field.isRequired && !enumStrings) {
    zodChain += '.optional()';
  }

  // .describe() で日本語説明を付与
  zodChain += `.describe('${field.description.replace(/'/g, "\\'")}')`;

  // CSV仕様コメントの付与
  const csvComment = field.csvSpec ? ` // CSV仕様: ${field.csvSpec}` : '';

  lines.push(`${indent}${field.fieldKey}: ${zodChain},${csvComment}`);

  return lines.join('\n');
}

/**
 * 繰り返しフィールドグループの z.array(z.object({...})) コードを生成
 */
function generateRepeatableGroup(fields: AnalyzedField[], indent: string = '  '): string {
  const innerFields = fields.map(f => generateFieldCode(f, indent + '    ')).join('\n');
  const maxCount = fields[0]?.repeatMax || 10;

  return `${indent}z.array(z.object({\n${innerFields}\n${indent}  })).max(${maxCount}).optional()`;
}

/**
 * セクション1つ分の export const xxxSchema = z.object({...}) を生成
 */
function generateSectionCode(section: AnalyzedSection): string {
  const lines: string[] = [];

  lines.push(`// ─── ${section.sectionLabel} (${section.sectionKey}) ${'─'.repeat(Math.max(0, 60 - section.sectionLabel.length * 2 - section.sectionKey.length))}──`);
  lines.push(`export const ${section.sectionKey}Schema = z.object({`);

  // 繰り返しフィールドをグループ化
  const repeatGroups = new Map<string, AnalyzedField[]>();
  const singleFields: AnalyzedField[] = [];

  for (const field of section.fields) {
    if (field.isRepeatable && field.repeatMax) {
      // 繰り返しグループのキーを推定（fieldKey からグループ名を抽出）
      const groupKey = field.fieldKey.replace(/\d+$/, '');
      if (!repeatGroups.has(groupKey)) {
        repeatGroups.set(groupKey, []);
      }
      repeatGroups.get(groupKey)!.push(field);
    } else {
      singleFields.push(field);
    }
  }

  // 単一フィールドを出力
  for (const field of singleFields) {
    lines.push(generateFieldCode(field));
  }

  // 繰り返しグループを出力
  for (const [groupKey, groupFields] of repeatGroups) {
    const label = groupFields[0]?.label?.replace(/\d+.*$/, '') || groupKey;
    lines.push(`  // ${label}（最大${groupFields[0].repeatMax}件）`);
    lines.push(`  ${groupKey}: ${generateRepeatableGroup(groupFields).trim()}.describe('${label}リスト'),`);
  }

  lines.push('});');
  lines.push('');

  return lines.join('\n');
}

/**
 * AnalyzedFormDefinition 全体から完全な Zod スキーマファイルを生成する。
 *
 * @param definition - AI 解析結果
 * @returns TypeScript ソースコード文字列
 */
export function generateZodSchema(definition: AnalyzedFormDefinition): string {
  const lines: string[] = [];

  // ─── ファイルヘッダー ──────────────────────────────────────────
  lines.push(`import { z } from 'zod';`);
  lines.push('');
  lines.push('// ═══════════════════════════════════════════════════════════════════════════════');
  lines.push(`// ${definition.formName} — Zod スキーマ定義`);
  lines.push('// ※ このファイルはテンプレート登録システムにより自動生成されました。');
  lines.push('// ※ 必要に応じてバリデーションルールや型を手動で調整してください。');
  lines.push('// ═══════════════════════════════════════════════════════════════════════════════');
  lines.push('');

  // ─── 共通バリデーター ──────────────────────────────────────────
  lines.push('// ─── 共通バリデーター ────────────────────────────────────────────────────────');
  lines.push("const requiredString = z.string().min(1, '必須項目です');");
  lines.push('');
  lines.push('const dateString8 = z');
  lines.push("  .string()");
  lines.push("  .regex(/^(|\\d{8})$/, '日付形式はYYYYMMDD(8桁)で入力してください');");
  lines.push('');
  lines.push("const dateString6 = z.string().regex(/^(|\\d{6})$/, '年月形式はYYYYMM(6桁)で入力してください');");
  lines.push('');
  lines.push("const zipCodeString = z.string().regex(/^(|\\d{7})$/, '郵便番号はハイフンなし7桁で入力してください');");
  lines.push('');
  lines.push("const phoneString = z.string().regex(/^(|\\d{1,12})$/, '半角数字12文字以内で入力してください');");
  lines.push('');
  lines.push('');

  // ─── セクション別スキーマ ──────────────────────────────────────
  for (const section of definition.sections) {
    lines.push(generateSectionCode(section));
  }

  // ─── ルートスキーマ ────────────────────────────────────────────
  const PascalKey = definition.formKey.charAt(0).toUpperCase() + definition.formKey.slice(1);

  lines.push('// ─── ルートスキーマ ──────────────────────────────────────────────────────────');
  lines.push(`export const ${definition.formKey}Schema = z.object({`);

  for (const section of definition.sections) {
    lines.push(`  ${section.sectionKey}: ${section.sectionKey}Schema.optional(),`);
  }

  lines.push('});');
  lines.push('');

  // ─── 型エクスポート ────────────────────────────────────────────
  lines.push('// ─── 型エクスポート ──────────────────────────────────────────────────────────');
  lines.push(`export type ${PascalKey}FormData = z.infer<typeof ${definition.formKey}Schema>;`);

  for (const section of definition.sections) {
    const sectionPascal = section.sectionKey.charAt(0).toUpperCase() + section.sectionKey.slice(1);
    lines.push(`export type ${sectionPascal} = z.infer<typeof ${section.sectionKey}Schema>;`);
  }

  lines.push('');

  // ─── テンプレート情報 ────────────────────────────────────────────
  if (definition.templateId) {
    lines.push('// ─── テンプレート情報 ────────────────────────────────────────────────────────');
    lines.push(`export const TEMPLATE_ID = '${definition.templateId}';`);
    lines.push(`export const FORM_NAME = '${definition.formName}';`);
    lines.push('');
  }

  return lines.join('\n');
}
