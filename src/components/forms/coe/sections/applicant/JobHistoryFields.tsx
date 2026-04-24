'use client';

import React from 'react';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormSelect } from '@/components/forms/ui/FormSelect';
import { FormRadioGroup } from '@/components/forms/ui/FormRadio';
import { coeFormOptions } from '@/lib/constants/coeFormOptions';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function JobHistoryFields() {
  const { register, control, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const appErrors = errors.applicantSpecificInfo;

  const hasJobHistory = useWatch({ control, name: 'applicantSpecificInfo.hasJobHistory' });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'applicantSpecificInfo.jobHistory',
  });

  const handleAddJob = () => {
    if (fields.length < 8) {
      append({
        startDate: '',
        endDate: '',
        companyNameEn: '',
        companyNameJa: '',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <FormField label="職歴の有無" required error={appErrors?.hasJobHistory?.message}>
        <Controller
          name="applicantSpecificInfo.hasJobHistory"
          control={control}
          render={({ field }) => (
            <FormRadioGroup
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={[
                { label: '有', value: '1' },
                { label: '無', value: '2' },
              ]}
              error={!!appErrors?.hasJobHistory}
            />
          )}
        />
      </FormField>

      {hasJobHistory === '1' && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-100 pt-6">
          {fields.map((item, index) => {
            const fieldError = appErrors?.jobHistory?.[index];
            return (
              <div key={item.id} className="relative p-5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">職歴 {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors flex items-center gap-1 text-xs"
                  >
                    <Trash2 size={14} /> 削除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="国・地域名" error={fieldError?.country?.message}>
                    <Controller
                      name={`applicantSpecificInfo.jobHistory.${index}.country` as const}
                      control={control}
                      render={({ field }) => (
                        <FormSelect
                          {...field}
                          options={coeFormOptions.nationality}
                          error={!!fieldError?.country}
                        />
                      )}
                    />
                  </FormField>
                  <div className="hidden md:block" />

                  <FormField label="入社年月不詳" error={fieldError?.startDateUnknown?.message}>
                    <Controller
                      name={`applicantSpecificInfo.jobHistory.${index}.startDateUnknown` as const}
                      control={control}
                      render={({ field }) => (
                        <FormSelect
                          {...field}
                          options={coeFormOptions.monthUnknownFlags}
                          error={!!fieldError?.startDateUnknown}
                        />
                      )}
                    />
                  </FormField>
                  <div className="hidden md:block" />

                  <FormField label="入社年月" error={fieldError?.startDate?.message} hint="YYYYMM (6桁)">
                    <FormInput
                      {...register(`applicantSpecificInfo.jobHistory.${index}.startDate` as const)}
                      placeholder="YYYYMM"
                      maxLength={6}
                      error={!!fieldError?.startDate}
                    />
                  </FormField>
                  <FormField label="入社年（月不詳の場合）" error={fieldError?.startYear?.message} hint="YYYY (4桁)">
                    <FormInput
                      {...register(`applicantSpecificInfo.jobHistory.${index}.startYear` as const)}
                      placeholder="YYYY"
                      maxLength={4}
                      error={!!fieldError?.startYear}
                    />
                  </FormField>

                  <FormField label="退社年月不詳" error={fieldError?.endDateUnknown?.message}>
                    <Controller
                      name={`applicantSpecificInfo.jobHistory.${index}.endDateUnknown` as const}
                      control={control}
                      render={({ field }) => (
                        <FormSelect
                          {...field}
                          options={coeFormOptions.monthUnknownFlags}
                          error={!!fieldError?.endDateUnknown}
                        />
                      )}
                    />
                  </FormField>
                  <div className="hidden md:block" />

                  <FormField label="退社年月" error={fieldError?.endDate?.message} hint="YYYYMM (現在も在籍中の場合は空白)">
                    <FormInput
                      {...register(`applicantSpecificInfo.jobHistory.${index}.endDate` as const)}
                      placeholder="YYYYMM"
                      maxLength={6}
                      error={!!fieldError?.endDate}
                    />
                  </FormField>
                  <FormField label="退社年（月不詳の場合）" error={fieldError?.endYear?.message} hint="YYYY (4桁)">
                    <FormInput
                      {...register(`applicantSpecificInfo.jobHistory.${index}.endYear` as const)}
                      placeholder="YYYY"
                      maxLength={4}
                      error={!!fieldError?.endYear}
                    />
                  </FormField>

                  <FormField label="勤務先名称（英字表記）" error={fieldError?.companyNameEn?.message} className="md:col-span-2">
                    <FormInput
                      {...register(`applicantSpecificInfo.jobHistory.${index}.companyNameEn` as const)}
                      placeholder="例: XXXX Corporation"
                      maxLength={200}
                      error={!!fieldError?.companyNameEn}
                    />
                  </FormField>
                  <FormField label="勤務先名称（漢字表記）" error={fieldError?.companyNameJa?.message} className="md:col-span-2">
                    <FormInput
                      {...register(`applicantSpecificInfo.jobHistory.${index}.companyNameJa` as const)}
                      placeholder="例: 株式会社〇〇"
                      maxLength={60}
                      error={!!fieldError?.companyNameJa}
                    />
                  </FormField>
                </div>
              </div>
            );
          })}

          {fields.length < 8 && (
            <button
              type="button"
              onClick={handleAddJob}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-sm font-medium"
            >
              <Plus size={16} /> 職歴を追加する（最大8件まで）
            </button>
          )}
        </div>
      )}
    </div>
  );
}
