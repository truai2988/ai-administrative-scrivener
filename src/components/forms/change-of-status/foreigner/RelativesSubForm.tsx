'use client';

import React from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';

export function RelativesSubForm() {
  const { control, register, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  
  // 在日親族の有無を監視
  const hasRelatives = useWatch({
    control,
    name: 'foreignerInfo.hasRelatives'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'foreignerInfo.relatives'
  });

  // 「有」でない場合は非表示（段階的開示）
  if (hasRelatives !== true) {
    return null;
  }

  const relativesErrors = errors.foreignerInfo?.relatives;

  return (
    <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div>
          <h4 className="text-md font-semibold text-slate-800">⑥ 在日親族（父・母・配偶者・子・兄弟姉妹など）及び同居者</h4>
          <p className="text-xs text-slate-500 mt-1">※滞在予定の親族も含む</p>
        </div>
        <button
          type="button"
          onClick={() => append({
            relationship: '',
            name: '',
            birthDate: '',
            nationality: '',
            cohabitation: false,
            residenceCardNumber: '',
            workplace: ''
          })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          追加
        </button>
      </div>
      
      <div className="space-y-6">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
            「追加」ボタンから在日親族情報を登録してください。
          </div>
        ) : (
          fields.map((field, index) => {
            const error = relativesErrors?.[index];
            return (
              <div key={field.id} className="relative bg-slate-50 p-4 pt-6 rounded-lg border border-slate-200 space-y-4">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  aria-label="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <h5 className="text-sm font-medium text-slate-700 block md:hidden mb-4 border-b border-slate-200 pb-2">親族 {index + 1}</h5>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField label="続柄" required error={error?.relationship?.message}>
                    <FormInput
                      {...register(`foreignerInfo.relatives.${index}.relationship` as const)}
                      placeholder="例: 配偶者"
                      error={!!error?.relationship}
                    />
                  </FormField>

                  <FormField label="氏名" required error={error?.name?.message}>
                    <FormInput
                      {...register(`foreignerInfo.relatives.${index}.name` as const)}
                      placeholder="例: 山田 花子"
                      error={!!error?.name}
                    />
                  </FormField>

                  <FormField label="生年月日" required error={error?.birthDate?.message}>
                    <FormInput
                      type="date"
                      {...register(`foreignerInfo.relatives.${index}.birthDate` as const)}
                      error={!!error?.birthDate}
                    />
                  </FormField>

                  <FormField label="国籍・地域" required error={error?.nationality?.message}>
                    <FormInput
                      {...register(`foreignerInfo.relatives.${index}.nationality` as const)}
                      placeholder="例: 中国"
                      error={!!error?.nationality}
                    />
                  </FormField>

                  <FormField label="在留カード番号等" error={error?.residenceCardNumber?.message}>
                    <FormInput
                      {...register(`foreignerInfo.relatives.${index}.residenceCardNumber` as const)}
                      placeholder="例: AB12345678CD"
                      maxLength={12}
                      error={!!error?.residenceCardNumber}
                    />
                  </FormField>

                  <FormField label="勤務先・通学先名称" error={error?.workplace?.message}>
                    <FormInput
                      {...register(`foreignerInfo.relatives.${index}.workplace` as const)}
                      placeholder="例: 株式会社〇〇"
                      error={!!error?.workplace}
                    />
                  </FormField>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
