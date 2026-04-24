'use client';

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormRadioGroup } from '@/components/forms/ui/FormRadio';
import { coeFormOptions } from '@/lib/constants/coeFormOptions';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function CertificationFields() {
  const { register, control, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const appErrors = errors.applicantSpecificInfo;

  const hasJapaneseCertification = useWatch({ control, name: 'applicantSpecificInfo.hasJapaneseCertification' });

  return (
    <div className="flex flex-col gap-6">
      <FormField label="日本語能力証明" required error={appErrors?.hasJapaneseCertification?.message}>
        <Controller
          name="applicantSpecificInfo.hasJapaneseCertification"
          control={control}
          render={({ field }) => (
            <FormRadioGroup
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={coeFormOptions.yesNo}
              error={!!appErrors?.hasJapaneseCertification}
            />
          )}
        />
      </FormField>

      {hasJapaneseCertification === '1' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-100 pt-6">
          <FormField label="試験名" error={appErrors?.japaneseCertificationName?.message}>
            <FormInput
              {...register('applicantSpecificInfo.japaneseCertificationName')}
              placeholder="例: 日本語能力試験"
              error={!!appErrors?.japaneseCertificationName}
            />
          </FormField>
          <FormField label="級" error={appErrors?.japaneseCertificationGrade?.message}>
            <FormInput
              {...register('applicantSpecificInfo.japaneseCertificationGrade')}
              placeholder="例: N1"
              error={!!appErrors?.japaneseCertificationGrade}
            />
          </FormField>
        </div>
      )}
    </div>
  );
}
