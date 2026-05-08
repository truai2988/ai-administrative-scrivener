'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';
import { AttachmentProvider } from '@/contexts/AttachmentContext';
import { ClickToFillProvider } from '@/contexts/ClickToFillContext';
import { AiExtractionSidebar } from '@/components/AiExtractionSidebar';

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!formData) {
    return notFound();
  }

  // Schema-Drivenなフォーム初期化をラッパー側で行う（ProviderのスコープをAIサイドバーにも広げるため）
  const methods = useForm({
    resolver: zodResolver(formData.schema as any),
    defaultValues: formData.options?.defaultValues || {},
    mode: 'onChange',
  });

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
    <FormProvider {...methods}>
      <AttachmentProvider applicationId="new" collectionName="dynamic_applications" readonly={false}>
        <ClickToFillProvider>
          <div className="form-split-layout">
            <div className="form-main-content">
              <div className="w-full max-w-[900px] mx-auto py-12 px-6">
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
            </div>
            
            <div className="form-side-panel">
              <div className="h-screen sticky top-0 bg-slate-900 border-l border-slate-800 flex flex-col w-[380px]">
                <AiExtractionSidebar 
                  isOpen={isSidebarOpen}
                  onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
              </div>
            </div>
          </div>
        </ClickToFillProvider>
      </AttachmentProvider>
    </FormProvider>
  );
}
