'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2, AlertCircle, Save } from 'lucide-react';
import type { FormUiConfig } from './types/uiConfigTypes';
import { useComputedRules } from '@/hooks/useComputedRules';

interface DynamicFormRendererProps {
  config: FormUiConfig;
  schema: z.ZodSchema<any>;
  options?: Record<string, { value: string; label: string }[]>;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

// Zodスキーマから必須項目かどうかを判定するヘルパー
function isFieldRequired(schema: z.ZodSchema<any>, fieldName: string): boolean {
  try {
    if (schema instanceof z.ZodObject) {
      const fieldSchema = schema.shape[fieldName];
      if (!fieldSchema) return false;
      // ZodOptionalでラップされている場合は必須ではない
      if (fieldSchema instanceof z.ZodOptional) return false;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function DynamicFormRenderer({
  config,
  schema,
  options = {},
  onSubmit,
  isSubmitting = false
}: DynamicFormRendererProps) {
  const methods = useFormContext();
  const { control, handleSubmit, formState: { errors } } = methods;

  // AIが生成した自動計算ルールの適用
  useComputedRules(control, methods.setValue, config.computedRules);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12 pb-24">
      {config.sections.map((section) => (
        <section key={section.sectionKey} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* セクションヘッダー */}
          <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {section.sectionLabel}
            </h2>
          </div>
          
          {/* フィールド一覧 */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {section.fields.map((field) => {
                const required = isFieldRequired(schema, field.fieldKey);
                const error = errors[field.fieldKey];
                const fieldOptions = options[field.fieldKey] || [];

                return (
                  <div key={field.fieldKey} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      {field.label}
                      {required && (
                        <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase">
                          必須
                        </span>
                      )}
                    </label>
                    
                    <Controller
                      name={field.fieldKey}
                      control={control}
                      render={({ field: { onChange, value, ref } }) => {
                        if (field.inputType === 'select') {
                          return (
                            <div className="relative">
                              <select
                                ref={ref}
                                value={value || ''}
                                onChange={onChange}
                                suppressHydrationWarning
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer ${
                                  error ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <option value="">選択してください</option>
                                {fieldOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        return (
                          <input
                            ref={ref}
                            type={field.inputType === 'number' ? 'number' : 'text'}
                            value={value || ''}
                            onChange={onChange}
                            suppressHydrationWarning
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none ${
                              error ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 hover:border-slate-300'
                            }`}
                            placeholder={`${field.label} を入力`}
                          />
                        );
                      }}
                    />
                    
                    {error && (
                      <p className="flex items-center gap-1.5 text-sm text-rose-600 font-medium mt-1">
                        <AlertCircle size={14} className="animate-pulse" />
                        {error.message as string}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* 提出ボタン領域 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 px-8 flex justify-end gap-4 z-50">
        <button
          type="button"
          className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
        >
          下書き保存
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={18} />
          {isSubmitting ? '保存中...' : '保存して次へ'}
        </button>
      </div>
    </form>
  );
}
