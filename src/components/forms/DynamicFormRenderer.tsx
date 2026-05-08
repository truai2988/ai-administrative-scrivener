'use client';

import React from 'react';
import { useFormContext, Controller, type FieldValues, type Path } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import type { FormUiConfig } from './types/uiConfigTypes';
import { useComputedRules } from '@/hooks/useComputedRules';
import { useClickToFillContext } from '@/contexts/ClickToFillContext';

interface DynamicFormRendererProps<TFieldValues extends FieldValues = FieldValues> {
  config: FormUiConfig;
  schema: Parameters<typeof zodResolver>[0];
  options?: Record<string, { value: string; label: string }[]>;
  onSubmit: (data: TFieldValues) => void;
  isSubmitting?: boolean;
}

// Zodスキーマから必須項目かどうかを判定するヘルパー
function isFieldRequired(schema: unknown, sectionKey: string, fieldKey: string): boolean {
  try {
    if (schema instanceof z.ZodObject) {
      // 1段目: セクションスキーマを取得
      let sectionSchema = schema.shape[sectionKey];
      if (!sectionSchema) return false;
      
      // optional()等でラップされている場合はunwrapする
      if (sectionSchema instanceof z.ZodOptional) {
        sectionSchema = sectionSchema.unwrap();
      }
      
      // 2段目: フィールドスキーマを取得
      if (sectionSchema instanceof z.ZodObject) {
        const fieldSchema = sectionSchema.shape[fieldKey];
        if (!fieldSchema) return false;
        if (fieldSchema instanceof z.ZodOptional) return false;
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function DynamicFormRenderer<TFieldValues extends FieldValues = FieldValues>({
  config,
  schema,
  options = {},
  onSubmit,
  isSubmitting = false
}: DynamicFormRendererProps<TFieldValues>) {
  const methods = useFormContext<TFieldValues>();
  const { control, handleSubmit, formState: { errors } } = methods;

  // Click-to-Fill コンテキスト（null の場合はフィルモード無効）
  const ctf = useClickToFillContext();
  const isInFillMode = ctf?.isInFillMode ?? false;

  // AIが生成した自動計算ルールの適用
  useComputedRules(config.computedRules || []);

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
                const fullPath = `${section.sectionKey}.${field.fieldKey}`;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const error = (errors as any)[section.sectionKey]?.[field.fieldKey];
                const required = isFieldRequired(schema, section.sectionKey, field.fieldKey);
                // options の取得（フラットキーでもネストキーでも取れるようにフォールバック）
                const fieldOptions = options[fullPath] || options[field.fieldKey] || [];

                // Click-to-Fill 用の onMouseDown ハンドラ
                const handleMouseDown = isInFillMode && ctf
                  ? (e: React.MouseEvent) => ctf.fillField(e, fullPath as Path<FieldValues>)
                  : undefined;

                // フィルモード中のスタイル
                const fillModeClass = isInFillMode
                  ? 'cursor-crosshair ring-2 ring-indigo-300 ring-offset-1 hover:ring-indigo-500 hover:bg-indigo-50/50 transition-all'
                  : '';

                return (
                  <div key={fullPath} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      {field.label}
                      {required && (
                        <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase">
                          必須
                        </span>
                      )}
                    </label>
                    
                    <Controller
                      name={fullPath as Path<TFieldValues>}
                      control={control}
                      render={({ field: { onChange, value, ref, name } }) => {
                        if (field.inputType === 'select') {
                          return (
                            <div className="relative">
                              <select
                                ref={ref}
                                name={name}
                                value={value || ''}
                                onChange={onChange}
                                onMouseDown={handleMouseDown}
                                suppressHydrationWarning
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer ${
                                  error ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 hover:border-slate-300'
                                } ${fillModeClass}`}
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
                            name={name}
                            type={field.inputType === 'number' ? 'number' : 'text'}
                            value={value || ''}
                            onChange={(e) => {
                              if (field.inputType === 'number') {
                                const val = e.target.value;
                                onChange(val === '' ? undefined : Number(val));
                              } else {
                                onChange(e);
                              }
                            }}
                            onMouseDown={handleMouseDown}
                            suppressHydrationWarning
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none ${
                              error ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 hover:border-slate-300'
                            } ${fillModeClass}`}
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
