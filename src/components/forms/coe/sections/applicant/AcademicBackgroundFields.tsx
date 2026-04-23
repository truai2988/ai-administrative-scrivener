'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormSelect } from '@/components/forms/ui/FormSelect';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function AcademicBackgroundFields() {
  const { register, control, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const appErrors = errors.applicantSpecificInfo;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="修学歴" required error={appErrors?.academicBackground?.message}>
        <Controller
          name="applicantSpecificInfo.academicBackground"
          control={control}
          render={({ field }) => (
            <FormSelect
              {...field}
              options={[
                { label: '大学院（博士）', value: '1' },
                { label: '大学院（修士）', value: '2' },
                { label: '大学', value: '3' },
                { label: '短期大学', value: '4' },
                { label: '専門学校', value: '5' },
                { label: '高等学校', value: '6' },
                { label: 'その他', value: '7' },
              ]}
              error={!!appErrors?.academicBackground}
            />
          )}
        />
      </FormField>

      <FormField label="学校名" required error={appErrors?.schoolName?.message}>
        <FormInput
          {...register('applicantSpecificInfo.schoolName')}
          placeholder="例: 〇〇大学"
          error={!!appErrors?.schoolName}
        />
      </FormField>

      <FormField label="卒業年月日" error={appErrors?.graduationDate?.message} hint="YYYYMMDD">
        <FormInput
          {...register('applicantSpecificInfo.graduationDate')}
          placeholder="YYYYMMDD"
          maxLength={8}
          error={!!appErrors?.graduationDate}
        />
      </FormField>

      <FormField label="専攻" error={appErrors?.majorCategory?.message}>
        <Controller
          name="applicantSpecificInfo.majorCategory"
          control={control}
          render={({ field }) => (
            <FormSelect
              {...field}
              options={[
                { label: '文系', value: '1' },
                { label: '理系', value: '2' },
                { label: '芸術・体育系', value: '3' },
                { label: 'その他', value: '4' },
              ]}
              error={!!appErrors?.majorCategory}
            />
          )}
        />
      </FormField>

      <FormField label="専攻詳細" error={appErrors?.majorDetails?.message} className="md:col-span-2">
        <FormInput
          {...register('applicantSpecificInfo.majorDetails')}
          placeholder="その他の場合や具体的な専攻名を入力"
          error={!!appErrors?.majorDetails}
        />
      </FormField>
    </div>
  );
}
