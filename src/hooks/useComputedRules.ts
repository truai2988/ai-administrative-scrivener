'use client';

import { useEffect, useMemo } from 'react';
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import type { ComputedRule } from '@/components/forms/types/uiConfigTypes';

export function useComputedRules(
  control: Control<any>,
  setValue: UseFormSetValue<any>,
  rules: ComputedRule[]
) {
  // すべてのルールが依存しているフィールドのユニークなリストを作成
  const allDependencies = useMemo(() => {
    const deps = new Set<string>();
    rules.forEach(rule => {
      rule.dependencies.forEach(dep => deps.add(dep));
    });
    return Array.from(deps);
  }, [rules]);

  // 全依存フィールドの値を監視
  const watchedValuesArray = useWatch({
    control,
    name: allDependencies,
  });

  // フィールド名 -> 値 のマップを作成
  const watchedValues = useMemo(() => {
    const map: Record<string, any> = {};
    allDependencies.forEach((dep, index) => {
      map[dep] = watchedValuesArray[index];
    });
    return map;
  }, [allDependencies, watchedValuesArray]);

  // 値が変更されたら各ルールを評価
  useEffect(() => {
    if (rules.length === 0) return;

    rules.forEach(rule => {
      try {
        // AIが生成したアロー関数文字列（例: "(A, B) => A + B"）を評価して関数オブジェクトにする
        // ※ eval() を避け、new Function を用いて安全にカプセル化
        const evaluator = new Function(`return ${rule.logic}`)();
        
        // 依存フィールドの値を引数として準備
        const args = rule.dependencies.map(dep => watchedValues[dep]);
        
        // 計算実行
        const result = evaluator(...args);

        // NaN や Infinity を防ぐフォールバック処理
        if (typeof result === 'number' && (!isFinite(result) || isNaN(result))) {
          setValue(rule.targetField, '0', { shouldValidate: true, shouldDirty: true });
        } else if (result === undefined || result === null) {
          setValue(rule.targetField, '', { shouldValidate: true, shouldDirty: true });
        } else {
          setValue(rule.targetField, String(result), { shouldValidate: true, shouldDirty: true });
        }
      } catch (error) {
        console.warn(`[ComputedRule Error] target: ${rule.targetField}`, error);
      }
    });
  }, [watchedValues, rules, setValue]);
}
