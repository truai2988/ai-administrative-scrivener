'use client';

import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch, type Path, type PathValue, type FieldValues } from 'react-hook-form';
import type { ComputedRule } from '@/components/forms/types/uiConfigTypes';

export function useComputedRules<TFieldValues extends FieldValues = FieldValues>(
  rules: readonly ComputedRule[]
) {
  const { control, setValue, getValues } = useFormContext<TFieldValues>();

  // すべてのルールが依存しているフィールドのユニークなリストを作成
  const allDependencies = useMemo(() => {
    const deps = new Set<string>();
    rules.forEach(rule => {
      rule.dependencies.forEach(dep => deps.add(dep));
    });
    return Array.from(deps) as Path<TFieldValues>[];
  }, [rules]);

  // 全依存フィールドの値を監視
  const watchedValuesArray = useWatch({
    control,
    name: allDependencies,
  });

  // 値の安定した文字列表現を作成（無限ループ防止）
  const watchedValuesStr = JSON.stringify(watchedValuesArray);

  // 値が変更されたら各ルールを評価
  useEffect(() => {
    if (rules.length === 0) return;

    // フィールド名 -> 値 のマップを作成
    const map: Record<string, unknown> = {};
    allDependencies.forEach((dep, index) => {
      map[dep] = watchedValuesArray[index];
    });

    rules.forEach(rule => {
      try {
        // AIが生成したアロー関数文字列（例: "(A, B) => A + B"）を評価して関数オブジェクトにする
        // ※ eval() を避け、new Function を用いて安全にカプセル化
        const evaluator = new Function(`return ${rule.logic}`)();
        
        // 依存フィールドの値を引数として準備
        const args = rule.dependencies.map(dep => map[dep]);
        
        // 計算実行
        const result = evaluator(...args);

        const target = rule.targetField as Path<TFieldValues>;
        const currentValue = getValues(target);
        let newValue: unknown;

        // NaN や Infinity を防ぐフォールバック処理
        if (typeof result === 'number' && (!isFinite(result) || isNaN(result))) {
          newValue = '0';
        } else if (result === undefined || result === null) {
          newValue = '';
        } else {
          newValue = String(result);
        }

        // 現在の値と異なる場合のみ更新（無限ループ防止）
        if (String(currentValue) !== String(newValue)) {
          setValue(target, newValue as PathValue<TFieldValues, Path<TFieldValues>>, { shouldValidate: true, shouldDirty: true });
        }
      } catch (error) {
        console.warn(`[ComputedRule Error] target: ${rule.targetField}`, error);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValuesStr, rules, setValue, getValues, allDependencies]);
}
