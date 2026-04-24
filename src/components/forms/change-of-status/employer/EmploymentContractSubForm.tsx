'use client';

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormRadioGroup } from '../../ui/FormRadio';

export function EmploymentContractSubForm() {
  const { register, control, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const empError = errors.employerInfo;

  const hasDifferentTreatment = useWatch({
    control,
    name: 'employerInfo.hasDifferentTreatment'
  });

  return (
    <div className="subsection">
      <h3 className="subsection-title">② 雇用契約・報酬等の内容</h3>
      
      <div className="cert-block">
        <h4 className="cert-block-label">雇用契約期間</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="始期" required error={empError?.contractStartDate?.message}>
            <FormInput
              type="date"
              {...register('employerInfo.contractStartDate')}
              error={!!empError?.contractStartDate}
            />
          </FormField>
          <FormField label="終期" required error={empError?.contractEndDate?.message}>
            <FormInput
              type="date"
              {...register('employerInfo.contractEndDate')}
              error={!!empError?.contractEndDate}
            />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="所定労働時間（週平均）" required error={empError?.weeklyWorkHours?.message}>
          <FormInput
            type="number"
            {...register('employerInfo.weeklyWorkHours', { valueAsNumber: true })}
            placeholder="例: 40"
            error={!!empError?.weeklyWorkHours}
          />
        </FormField>
        
        <FormField label="所定労働時間（月平均）" required error={empError?.monthlyWorkHours?.message}>
          <FormInput
            type="number"
            {...register('employerInfo.monthlyWorkHours', { valueAsNumber: true })}
            placeholder="例: 160"
            error={!!empError?.monthlyWorkHours}
          />
        </FormField>

        <FormField label="日本人と同等であることの有無" required error={empError?.equivalentWorkHours?.message} className="md:col-span-2 lg:col-span-3">
          <Controller
            name="employerInfo.equivalentWorkHours"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="employerInfo.equivalentWorkHours"
                options={[
                  { value: 'true', label: '同等である' },
                  { value: 'false', label: '同等ではない' },
                ]}
                value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                error={!!empError?.equivalentWorkHours}
              />
            )}
          />
        </FormField>
      </div>

      <div className="cert-block">
        <h4 className="cert-block-label">報酬額（基本給・諸手当含む）</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField label="月額報酬（円）" required error={empError?.monthlySalary?.message}>
            <FormInput
              type="number"
              {...register('employerInfo.monthlySalary', { valueAsNumber: true })}
              placeholder="例: 200000"
              error={!!empError?.monthlySalary}
            />
          </FormField>
          
          <FormField label="基本給の時間換算額（円）" required error={empError?.hourlyRate?.message}>
            <FormInput
              type="number"
              {...register('employerInfo.hourlyRate', { valueAsNumber: true })}
              placeholder="例: 1250"
              error={!!empError?.hourlyRate}
            />
          </FormField>

          <FormField label="同等の日本人の月額報酬（円）" required error={empError?.japaneseMonthlySalary?.message}>
            <FormInput
              type="number"
              {...register('employerInfo.japaneseMonthlySalary', { valueAsNumber: true })}
              placeholder="例: 200000"
              error={!!empError?.japaneseMonthlySalary}
            />
          </FormField>

          <FormField label="日本人と同等以上か" required error={empError?.equivalentSalary?.message} className="md:col-span-2">
            <Controller
              name="employerInfo.equivalentSalary"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="employerInfo.equivalentSalary"
                  options={[
                    { value: 'true', label: '同等以上である' },
                    { value: 'false', label: '同等未満である' },
                  ]}
                  value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                  onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                  error={!!empError?.equivalentSalary}
                />
              )}
            />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="報酬の支払方法" required error={empError?.paymentMethod?.message}>
          <Controller
            name="employerInfo.paymentMethod"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="employerInfo.paymentMethod"
                options={[
                  { value: 'bank_transfer', label: '口座振込' },
                  { value: 'cash', label: '現金' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={!!empError?.paymentMethod}
              />
            )}
          />
        </FormField>
        
        <FormField label="日本人と異なる待遇の有無" required error={empError?.hasDifferentTreatment?.message}>
          <Controller
            name="employerInfo.hasDifferentTreatment"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="employerInfo.hasDifferentTreatment"
                options={[
                  { value: 'true', label: '有' },
                  { value: 'false', label: '無' },
                ]}
                value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                error={!!empError?.hasDifferentTreatment}
              />
            )}
          />
        </FormField>

        {hasDifferentTreatment && (
          <FormField label="異なる待遇の内容" required error={empError?.differentTreatmentDetail?.message} className="md:col-span-2 lg:col-span-3 animate-in fade-in slide-in-from-top-1">
            <FormInput
              {...register('employerInfo.differentTreatmentDetail')}
              placeholder="異なる待遇の内容を具体的に記載してください"
              error={!!empError?.differentTreatmentDetail}
            />
          </FormField>
        )}
      </div>
    </div>
  );
}
