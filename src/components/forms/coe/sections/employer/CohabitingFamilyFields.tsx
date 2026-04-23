'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function CohabitingFamilyFields() {
  const { register, control, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const empErrors = errors.employerInfo;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'employerInfo.cohabitingFamilies',
  });

  const handleAddFamily = () => {
    if (fields.length < 6) {
      append({
        name: '',
        relationship: '',
        nationality: '',
        birthDate: '',
        occupation: '',
        income: '',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-slate-500">
        申請人が個人事業主などに雇用される場合で、雇用主の同居家族がいる場合は入力してください。（最大6名）
      </p>

      {fields.length > 0 && (
        <div className="flex flex-col gap-6">
          {fields.map((item, index) => {
            const fieldError = empErrors?.cohabitingFamilies?.[index];
            return (
              <div key={item.id} className="relative p-5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">家族 {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors flex items-center gap-1 text-xs"
                  >
                    <Trash2 size={14} /> 削除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="氏名" error={fieldError?.name?.message}>
                    <FormInput
                      {...register(`employerInfo.cohabitingFamilies.${index}.name` as const)}
                      placeholder="例: YAMADA TARO"
                      error={!!fieldError?.name}
                    />
                  </FormField>
                  <FormField label="続柄" error={fieldError?.relationship?.message}>
                    <FormInput
                      {...register(`employerInfo.cohabitingFamilies.${index}.relationship` as const)}
                      placeholder="例: 妻"
                      error={!!fieldError?.relationship}
                    />
                  </FormField>
                  <FormField label="国籍・地域" error={fieldError?.nationality?.message}>
                    <FormInput
                      {...register(`employerInfo.cohabitingFamilies.${index}.nationality` as const)}
                      placeholder="例: 日本"
                      error={!!fieldError?.nationality}
                    />
                  </FormField>
                  <FormField label="生年月日" error={fieldError?.birthDate?.message} hint="YYYYMMDD">
                    <FormInput
                      {...register(`employerInfo.cohabitingFamilies.${index}.birthDate` as const)}
                      placeholder="YYYYMMDD"
                      maxLength={8}
                      error={!!fieldError?.birthDate}
                    />
                  </FormField>
                  <FormField label="職業" error={fieldError?.occupation?.message}>
                    <FormInput
                      {...register(`employerInfo.cohabitingFamilies.${index}.occupation` as const)}
                      placeholder="例: 会社員"
                      error={!!fieldError?.occupation}
                    />
                  </FormField>
                  <FormField label="年収（円）" error={fieldError?.income?.message}>
                    <FormInput
                      {...register(`employerInfo.cohabitingFamilies.${index}.income` as const)}
                      placeholder="例: 3000000"
                      error={!!fieldError?.income}
                    />
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {fields.length < 6 && (
        <button
          type="button"
          onClick={handleAddFamily}
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> 家族を追加する（最大6名まで）
        </button>
      )}
    </div>
  );
}
