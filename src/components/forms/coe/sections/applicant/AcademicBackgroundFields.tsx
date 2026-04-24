'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormSelect } from '@/components/forms/ui/FormSelect';
import { coeFormOptions } from '@/lib/constants/coeFormOptions';
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
              options={coeFormOptions.finalEducation}
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
              options={coeFormOptions.majorField}
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

      {/* 追加されたフィールド */}
      <FormField label="学部・課程又は専門課程名称" error={appErrors?.facultyName?.message} className="md:col-span-2">
        <FormInput
          {...register('applicantSpecificInfo.facultyName')}
          placeholder="例: 経済学部"
          maxLength={50}
          error={!!appErrors?.facultyName}
        />
      </FormField>

      <FormField label="専攻・専門分野（専門学校）" error={appErrors?.majorCategoryCollege?.message}>
        <Controller
          name="applicantSpecificInfo.majorCategoryCollege"
          control={control}
          render={({ field }) => (
            <FormSelect
              {...field}
              options={coeFormOptions.vocationalSchoolCategory}
              error={!!appErrors?.majorCategoryCollege}
            />
          )}
        />
      </FormField>

      <FormField label="専攻詳細（専門学校・その他の場合）" error={appErrors?.majorDetailsCollege?.message}>
        <FormInput
          {...register('applicantSpecificInfo.majorDetailsCollege')}
          placeholder="具体的な専攻名を入力"
          error={!!appErrors?.majorDetailsCollege}
        />
      </FormField>

      <FormField label="准看護師の免許取得年月日" error={appErrors?.nursingLicenseDate?.message} hint="YYYYMMDD">
        <FormInput
          {...register('applicantSpecificInfo.nursingLicenseDate')}
          placeholder="YYYYMMDD"
          maxLength={8}
          error={!!appErrors?.nursingLicenseDate}
        />
      </FormField>
      <div className="hidden md:block" />

      <FormField label="経営又は管理の実務経験年数" error={appErrors?.businessExperienceYears?.message}>
        <FormInput
          {...register('applicantSpecificInfo.businessExperienceYears')}
          placeholder="例: 5"
          maxLength={3}
          error={!!appErrors?.businessExperienceYears}
        />
      </FormField>

      <FormField label="業務の実務経験年数" error={appErrors?.fieldExperienceYears?.message}>
        <FormInput
          {...register('applicantSpecificInfo.fieldExperienceYears')}
          placeholder="例: 3"
          maxLength={3}
          error={!!appErrors?.fieldExperienceYears}
        />
      </FormField>

      <FormField label="在学中の大学名" error={appErrors?.currentUniversity?.message}>
        <FormInput
          {...register('applicantSpecificInfo.currentUniversity')}
          placeholder="例: 〇〇大学"
          maxLength={60}
          error={!!appErrors?.currentUniversity}
        />
      </FormField>

      <FormField label="在学中の学部・課程" error={appErrors?.currentFaculty?.message}>
        <FormInput
          {...register('applicantSpecificInfo.currentFaculty')}
          placeholder="例: 経済学部"
          maxLength={40}
          error={!!appErrors?.currentFaculty}
        />
      </FormField>

      <FormField label="具体的な在留目的" error={appErrors?.purposeOfStay?.message} className="md:col-span-2">
        <FormInput
          {...register('applicantSpecificInfo.purposeOfStay')}
          placeholder="具体的な在留目的、滞在費支弁方法などを入力"
          maxLength={600}
          error={!!appErrors?.purposeOfStay}
        />
      </FormField>
    </div>
  );
}
