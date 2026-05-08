'use client';

import React from 'react';
import { notFound } from 'next/navigation';
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';

// === 各フォームの定義ファイル群 ===
import { generateSkillTraineeEvaluationCsv } from '@/components/forms/generated/skillTraineeEvaluation/generateSkillTraineeEvaluationCsv';
import { skillTraineeEvaluationSchema } from '@/components/forms/generated/skillTraineeEvaluation/skillTraineeEvaluationSchema';
import { skillTraineeEvaluationUiConfig } from '@/components/forms/generated/skillTraineeEvaluation/skillTraineeEvaluationUiConfig';
import { skillTraineeEvaluationFormOptions } from '@/components/forms/generated/skillTraineeEvaluation/skillTraineeEvaluationFormOptions';

// 将来的に追加されるフォームをここにマッピングする
export const formRegistry: Record<string, { config: any, schema: any, options: any, csvGenerator: any }> = {
  skillTraineeEvaluation: {
    config: skillTraineeEvaluationUiConfig,
    schema: skillTraineeEvaluationSchema,
    options: skillTraineeEvaluationFormOptions,
    csvGenerator: generateSkillTraineeEvaluationCsv,
  },
  // 今後他のフォームが生成されたら追加していく
};

export function FormRendererWrapper({ englishId }: { englishId: string }) {
  const formData = formRegistry[englishId];

  if (!formData) {
    return notFound();
  }

  const handleSubmit = async (data: any) => {
    console.log('--- フォーム送信データ ---', data);
    try {
      const csvContent = formData.csvGenerator(data);
      console.log('--- 生成されたCSV ---', csvContent);
      
      // クライアント側でCSVダウンロードをトリガー
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${englishId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('CSV生成エラー', e);
      alert('CSV生成中にエラーが発生しました。');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-black text-slate-800 mb-8 tracking-tight">
        {formData.config.formName}
      </h1>
      <DynamicFormRenderer
        config={formData.config}
        schema={formData.schema}
        options={formData.options}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
