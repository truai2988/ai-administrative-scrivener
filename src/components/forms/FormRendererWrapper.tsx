'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';
import { AttachmentProvider } from '@/contexts/AttachmentContext';
import { ClickToFillProvider } from '@/contexts/ClickToFillContext';
import { AiExtractionSidebar } from '@/components/AiExtractionSidebar';
import { useUniversalAutoSave } from '@/hooks/useUniversalAutoSave';
import type { FormUiConfig } from '@/components/forms/types/uiConfigTypes';
import type { FieldValues } from 'react-hook-form';

// === 各フォームの定義ファイル群 ===
import { generateTechnicalInternEvaluationPart1Csv } from '@/components/forms/generated/technicalInternEvaluation/generateTechnicalInternEvaluationCsv';
import { technicalInternEvaluationSchema } from '@/components/forms/generated/technicalInternEvaluation/technicalInternEvaluationSchema';
import { technicalInternEvaluationUiConfig } from '@/components/forms/generated/technicalInternEvaluation/technicalInternEvaluationUiConfig';
import { technicalInternEvaluationFormOptions } from '@/components/forms/generated/technicalInternEvaluation/technicalInternEvaluationFormOptions';

// フォームレジストリのエントリ型
interface FormRegistryEntry {
  config: FormUiConfig;
  schema: Parameters<typeof zodResolver>[0];
  options: Record<string, { value: string; label: string }[]>;
  csvGenerator: (data: FieldValues) => string;
}

// 将来的に追加されるフォームをここにマッピングする
export const formRegistry: Record<string, FormRegistryEntry> = {
  technicalInternEvaluation: {
    config: technicalInternEvaluationUiConfig,
    schema: technicalInternEvaluationSchema,
    options: technicalInternEvaluationFormOptions,
    csvGenerator: generateTechnicalInternEvaluationPart1Csv,
  },
  // 今後他のフォームが生成されたら追加していく
};

export function FormRendererWrapper({ englishId }: { englishId: string }) {
  console.log("=== FormRendererWrapper DEBUG ===");
  console.log("Available keys:", Object.keys(formRegistry));
  console.log("Requested englishId:", englishId);
  const formData = formRegistry[englishId];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Schema-Drivenなフォーム初期化をラッパー側で行う（ProviderのスコープをAIサイドバーにも広げるため）
  const methods = useForm({
    resolver: formData ? zodResolver(formData.schema) : undefined,
    defaultValues: {},
    mode: 'onChange' as const,
  });

  // 汎用オートセーブ＆下書き復元機能の統合
  const { isAutoSaving, lastSavedAt, isDraftLoading } = useUniversalAutoSave(
    englishId,
    methods.control,
    methods.getValues,
    methods.reset
  );

  // formDataが見つからない場合はhooks呼び出し後にnotFoundを返す
  if (!formData) {
    return notFound();
  }

  const handleSubmit = async (data: FieldValues) => {
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
        <ClickToFillProvider staticMappings={formData.config.fieldMappings as Record<string, string> | undefined}>
          <div className="form-split-layout">
            <div className="form-main-content">
              <div className="w-full max-w-[900px] mx-auto py-12 px-6">
                {/* 戻るボタン */}
                <Link
                  href="/applications/new"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6 group"
                >
                  <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                  テンプレート一覧に戻る
                </Link>

                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                    {formData.config.formName}
                  </h1>
                  
                  {/* オートセーブステータス表示 */}
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                    {isDraftLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-indigo-500" />
                        データ読み込み中...
                      </>
                    ) : isAutoSaving ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />
                        自動保存中...
                      </>
                    ) : lastSavedAt ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}に保存
                      </>
                    ) : (
                      <>変更は自動保存されます</>
                    )}
                  </div>
                </div>
                <DynamicFormRenderer
                  config={formData.config}
                  schema={formData.schema}
                  options={formData.options}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
            
            <div className="form-side-panel">
              <div className="h-screen sticky top-0 bg-white border-l border-slate-200 flex flex-col w-[380px] overflow-y-auto">
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
