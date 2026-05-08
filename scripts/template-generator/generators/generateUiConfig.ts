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

  // fieldMappings: AIが推論した初期マッピング（breadcrumbKey → sectionKey.fieldKey）
  const fieldMappings: Record<string, string> = definition.initialFieldMappings || {};

  // Config オブジェクトを構築
  const configObj: FormUiConfig = {
    formKey: definition.formKey,
    formName: definition.formName,
    sections: sections,
    computedRules: computedRules,
  };

  // fieldMappings が存在する場合のみプロパティに含める
  if (Object.keys(fieldMappings).length > 0) {
    configObj.fieldMappings = fieldMappings;
  }

  const configStr = JSON.stringify(configObj, null, 2);

  return `/**
 * ${definition.formName} — Schema-Driven UI Config
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されました。
 * ※ UIの描画順序や自動計算ロジック（computedRules）を定義しています。
 * ※ fieldMappings はAI書類読み取りの自動入力に使用されます。
 */

import type { FormUiConfig } from '@/components/forms/types/uiConfigTypes';

export const ${configName} = ${configStr} as const;

export type ${configName.charAt(0).toUpperCase() + configName.slice(1)} = typeof ${configName};
`;
}
