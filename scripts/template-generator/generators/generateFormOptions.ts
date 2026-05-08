/**
 * generateFormOptions.ts
 * テンプレート登録システム — フォーム定数（プルダウン・ラジオボタン選択肢）生成エンジン
 *
 * AnalyzedFormDefinition に含まれる enumValues を抽出し、
 * UI のプルダウンやラジオボタンで使用する定数ファイルを生成する。
 *
 * 生成パターン（既存の coeFormOptions.ts に準拠）:
 *   export const xxxFormOptions = {
 *     gender: [
 *       { value: '1', label: '男' },
 *       { value: '2', label: '女' },
 *     ],
 *     ...
 *   };
 */

import type { AnalyzedFormDefinition, AnalyzedField } from '../types';

/** enum 値を正規化（オブジェクト配列 or 文字列配列どちらにも対応） */
function normalizeEnumValue(v: unknown): { value: string; label: string } {
  if (typeof v === 'object' && v !== null && 'value' in v) {
    const obj = v as { value: string; label?: string };
    return {
      value: String(obj.value),
      label: obj.label ? String(obj.label) : String(obj.value),
    };
  }
  const str = String(v);
  return { value: str, label: str };
}

/**
 * AnalyzedFormDefinition から フォーム定数ファイルの TypeScript ソースコードを生成する。
 *
 * @param definition - AI 解析結果
 * @returns TypeScript ソースコード文字列。enum フィールドが1つもなければ null。
 */
export function generateFormOptions(definition: AnalyzedFormDefinition): string | null {
  // 全セクションから enum を持つフィールドを収集
  const enumFields: Array<{ fieldKey: string; sectionKey: string; label: string; values: Array<{ value: string; label: string }> }> = [];

  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (field.enumValues && field.enumValues.length > 0) {
        const values = (field.enumValues as unknown[]).map(normalizeEnumValue);
        enumFields.push({
          fieldKey: field.fieldKey,
          sectionKey: section.sectionKey,
          label: field.label,
          values,
        });
      }
    }
  }

  if (enumFields.length === 0) return null;

  const lines: string[] = [];

  // ─── ファイルヘッダー ──────────────────────────────────────────
  lines.push('/**');
  lines.push(` * ${definition.formName} — フォーム定数定義（プルダウン・ラジオボタン選択肢）`);
  lines.push(' *');
  lines.push(' * ※ このファイルはテンプレート登録システムにより自動生成されました。');
  lines.push(' * ※ 選択肢のラベルやコード体系は原本に合わせて手動調整してください。');
  lines.push(' */');
  lines.push('');

  // 型定義
  lines.push('export interface FormOption {');
  lines.push('  value: string;');
  lines.push('  label: string;');
  lines.push('}');
  lines.push('');

  // メインオブジェクト
  const PascalKey = definition.formKey.charAt(0).toUpperCase() + definition.formKey.slice(1);
  lines.push(`export const ${definition.formKey}FormOptions = {`);

  // 重複キーを防ぐために使用済みキーを追跡
  const usedKeys = new Set<string>();

  for (const ef of enumFields) {
    // キーの一意性を確保（同名フィールドが別セクションにある場合）
    let optionKey = ef.fieldKey;
    if (usedKeys.has(optionKey)) {
      optionKey = `${ef.sectionKey}_${ef.fieldKey}`;
    }
    usedKeys.add(optionKey);

    lines.push(`  /** ${ef.label} */`);
    lines.push(`  ${optionKey}: [`);

    for (const val of ef.values) {
      const escapedLabel = val.label.replace(/'/g, "\\'");
      const escapedValue = val.value.replace(/'/g, "\\'");
      lines.push(`    { value: '${escapedValue}', label: '${escapedLabel}' },`);
    }

    lines.push('  ] as FormOption[],');
    lines.push('');
  }

  lines.push(`} as const;`);
  lines.push('');

  // 型エクスポート
  lines.push(`export type ${PascalKey}FormOptions = typeof ${definition.formKey}FormOptions;`);
  lines.push('');

  return lines.join('\n');
}
