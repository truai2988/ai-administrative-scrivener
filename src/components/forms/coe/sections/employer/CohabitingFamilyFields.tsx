'use client';

import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormSelect } from '@/components/forms/ui/FormSelect';
import { coeFormOptions } from '@/lib/constants/coeFormOptions';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function CohabitingFamilyFields() {
  const { register, control, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const empErrors = errors.employerInfo;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'employerInfo.cohabitingFamilies',
  });

  const handleAddFamily = () => {
    if (fields.length < 5) {
      append({
        name: '',
        relationship: '',
        relationshipOther: '',
        nationality: '',
        birthDate: '',
        cohabitation: '',
        workplace: '',
        residenceStatus: '',
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
              <div key={item.id} className="relative p-5 bg-[rgba(15,23,42,0.4)] border border-slate-700/50 rounded-lg flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-300">家族 {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-900/30 p-1 rounded transition-colors flex items-center gap-1 text-xs"
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
                    <Controller
                      name={`employerInfo.cohabitingFamilies.${index}.relationship` as const}
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
                  <FormField label="続柄（その他）" error={fieldError?.relationshipOther?.message}>
                    <FormInput
                      {...register(`employerInfo.cohabitingFamilies.${index}.relationshipOther` as const)}
                      placeholder="その他の続柄を入力"
                      maxLength={40}
                      error={!!fieldError?.relationshipOther}
                    />
                  </FormField>
                  <FormField label="国籍・地域" error={fieldError?.nationality?.message}>
                    <Controller
                      name={`employerInfo.cohabitingFamilies.${index}.nationality` as const}
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
                  <FormField label="生年月日" error={fieldError?.birthDate?.message} hint="YYYYMMDD">
                    <FormInput
                      {...register(`employerInfo.cohabitingFamilies.${index}.birthDate` as const)}
                      placeholder="YYYYMMDD"
                      maxLength={8}
                      error={!!fieldError?.birthDate}
                    />
                  </FormField>
                  <FormField label="同居の有無" error={fieldError?.cohabitation?.message}>
                    <Controller
                      name={`employerInfo.cohabitingFamilies.${index}.cohabitation` as const}
                      control={control}
                      render={({ field }) => (
                        <FormSelect
                          {...field}
                          options={coeFormOptions.yesNo}
                          error={!!fieldError?.cohabitation}
                        />
                      )}
                    />
                  </FormField>
                  <FormField label="勤務先名称・通学先名称" error={fieldError?.workplace?.message}>
                    <FormInput
                      {...register(`employerInfo.cohabitingFamilies.${index}.workplace` as const)}
                      placeholder="例: 株式会社〇〇"
                      maxLength={60}
                      error={!!fieldError?.workplace}
                    />
                  </FormField>
                  <FormField label="在留資格" error={fieldError?.residenceStatus?.message}>
                    <Controller
                      name={`employerInfo.cohabitingFamilies.${index}.residenceStatus` as const}
                      control={control}
                      render={({ field }) => (
                        <FormSelect
                          {...field}
                          options={coeFormOptions.residenceStatus}
                          error={!!fieldError?.residenceStatus}
                        />
                      )}
                    />
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {fields.length < 5 && (
        <button
          type="button"
          onClick={handleAddFamily}
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-700/50 text-slate-400 rounded-lg hover:bg-[rgba(15,23,42,0.4)] hover:border-slate-500 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> 家族を追加する（最大5名まで）
        </button>
      )}
    </div>
  );
}
