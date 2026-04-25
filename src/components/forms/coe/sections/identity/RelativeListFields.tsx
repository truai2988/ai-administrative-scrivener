'use client';

import React from 'react';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormRadioGroup } from '@/components/forms/ui/FormRadio';
import { FormSelect } from '@/components/forms/ui/FormSelect';
import { coeFormOptions } from '@/lib/constants/coeFormOptions';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function RelativeListFields() {
  const { register, control, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const idErrors = errors.identityInfo;

  const familyInJapan = useWatch({ control, name: 'identityInfo.familyInJapan' });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'identityInfo.relatives',
  });

  const handleAddRelative = () => {
    if (fields.length < 6) {
      append({
        relationship: '',
        name: '',
        birthDate: '',
        nationality: '',
        cohabitation: '2',
        workplace: '',
        residenceCardNumber: '',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <FormField label="在日親族（父・母・配偶者・子・兄弟姉妹など）及び同居者の有無" required error={idErrors?.familyInJapan?.message}>
        <Controller
          name="identityInfo.familyInJapan"
          control={control}
          render={({ field }) => (
            <FormRadioGroup
              {...field}
              options={coeFormOptions.yesNo}
              error={!!idErrors?.familyInJapan}
            />
          )}
        />
      </FormField>

      {familyInJapan === '1' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-100 pt-6">
          {fields.map((item, index) => {
            const fieldError = idErrors?.relatives?.[index];
            return (
              <div key={item.id} className="relative p-5 bg-[rgba(15,23,42,0.4)] border border-slate-700/50 rounded-lg flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-300">在日親族 {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-900/30 p-1 rounded transition-colors flex items-center gap-1 text-xs"
                  >
                    <Trash2 size={14} /> 削除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="続柄" required error={fieldError?.relationship?.message}>
                    <Controller
                      name={`identityInfo.relatives.${index}.relationship` as const}
                      control={control}
                      render={({ field }) => (
                        <FormSelect
                          {...field}
                          options={coeFormOptions.relationship}
                          error={!!fieldError?.relationship}
                        />
                      )}
                    />
                  </FormField>
                  <FormField label="氏名" required error={fieldError?.name?.message}>
                    <FormInput
                      {...register(`identityInfo.relatives.${index}.name` as const)}
                      placeholder="例: WANG TAO"
                      error={!!fieldError?.name}
                    />
                  </FormField>
                  <FormField label="生年月日" required error={fieldError?.birthDate?.message} hint="YYYYMMDD">
                    <FormInput
                      {...register(`identityInfo.relatives.${index}.birthDate` as const)}
                      placeholder="YYYYMMDD"
                      maxLength={8}
                      error={!!fieldError?.birthDate}
                    />
                  </FormField>
                  <FormField label="国籍・地域" required error={fieldError?.nationality?.message}>
                    <Controller
                      name={`identityInfo.relatives.${index}.nationality` as const}
                      control={control}
                      render={({ field }) => (
                        <FormSelect
                          {...field}
                          options={coeFormOptions.nationality}
                          error={!!fieldError?.nationality}
                        />
                      )}
                    />
                  </FormField>
                  <FormField label="同居の有無" required error={fieldError?.cohabitation?.message}>
                    <Controller
                      name={`identityInfo.relatives.${index}.cohabitation` as const}
                      control={control}
                      render={({ field }) => (
                        <FormRadioGroup
                          {...field}
                          options={coeFormOptions.yesNo}
                          error={!!fieldError?.cohabitation}
                        />
                      )}
                    />
                  </FormField>
                  <FormField label="勤務先名称・通学先名称" error={fieldError?.workplace?.message}>
                    <FormInput
                      {...register(`identityInfo.relatives.${index}.workplace` as const)}
                      placeholder="例: 株式会社〇〇"
                      error={!!fieldError?.workplace}
                    />
                  </FormField>
                  <FormField label="在留カード番号" required error={fieldError?.residenceCardNumber?.message} className="md:col-span-2">
                    <FormInput
                      {...register(`identityInfo.relatives.${index}.residenceCardNumber` as const)}
                      placeholder="英数字12文字"
                      maxLength={12}
                      error={!!fieldError?.residenceCardNumber}
                    />
                  </FormField>
                </div>
              </div>
            );
          })}

          {fields.length < 6 && (
            <button
              type="button"
              onClick={handleAddRelative}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-700/50 text-slate-400 rounded-lg hover:bg-[rgba(15,23,42,0.4)] hover:border-slate-500 transition-colors text-sm font-medium"
            >
              <Plus size={16} /> 親族を追加する（最大6名まで）
            </button>
          )}
        </div>
      )}
    </div>
  );
}
