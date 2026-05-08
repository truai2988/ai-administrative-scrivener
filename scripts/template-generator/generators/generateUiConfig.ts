import type { AnalyzedFormDefinition, FormUiConfig, UiSection, ComputedRule } from '../types';

/**
 * AIによる解析結果から、Schema-Driven UIのための Config オブジェクト（TypeScriptコード）を生成する
 */
export function generateUiConfig(definition: AnalyzedFormDefinition): string {
  const formKey = definition.formKey;
  const configName = `${formKey}UiConfig`;

  const sections: UiSection[] = definition.sections.map(sec => ({
    sectionKey: sec.sectionKey,
    sectionLabel: sec.sectionLabel,
    fields: sec.fields.map(f => ({
      fieldKey: f.fieldKey,
      label: f.label,
      inputType: f.zodType.includes('z.enum') ? 'select' : 
                 f.zodType.includes('z.number') ? 'number' : 'text'
    }))
  }));

  const computedRules: ComputedRule[] = [];
  definition.sections.forEach(sec => {
    sec.fields.forEach(f => {
      if (f.isComputed && f.computedLogic && f.dependencies) {
        computedRules.push({
          targetField: f.fieldKey,
          dependencies: f.dependencies,
          logic: f.computedLogic
        });
      }
    });
  });

  // Config オブジェクトを文字列化（関数部分は文字列としてそのまま出力させたいので特殊処理）
  let configStr = JSON.stringify({
    formKey: definition.formKey,
    formName: definition.formName,
    sections: sections,
    computedRules: computedRules
  }, null, 2);

  // JSON文字列内の computedRules の logic を文字列リテラルではなく生の関数コードとして展開する
  // 例: "logic": "(A) => A + 1"  -> logic: (A) => A + 1
  // ただし、AIは計算ロジックをJSの文字列として返す（"logic": "(A) => A + 1"）。
  // 設定ファイル上では関数文字列として保持し、レンダラー側で new Function や eval は使わず、
  // 安全に評価するなら文字列のまま保持するか、コードとして埋め込むか。
  // ユーザーの指示は「logic: '(A, B) => Number(A || 0) + Number(B || 0)'」のように文字列としての保持のようにも見えるが、
  // 例の記法を見ると「logic: '(A, B) => ...'」と文字列リテラルになっている。
  // したがってそのまま JSON.stringify の結果（文字列）でOKだが、出力コードをクリーンにするために
  // 必要な部分だけ調整する。

  return `/**
 * ${definition.formName} — Schema-Driven UI Config
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されました。
 * ※ UIの描画順序や自動計算ロジック（computedRules）を定義しています。
 */

import type { FormUiConfig } from '@/components/forms/types/uiConfigTypes';

export const ${configName} = ${configStr} as const;

export type ${configName.charAt(0).toUpperCase() + configName.slice(1)} = typeof ${configName};
`;
}
