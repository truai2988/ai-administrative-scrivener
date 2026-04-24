'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormSelect } from '@/components/forms/ui/FormSelect';
import { formOptions } from '@/lib/constants/formOptions';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function BasicProfileFields() {
  const { register, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const idErrors = errors.identityInfo;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="国籍・地域" required error={idErrors?.nationality?.message}>
        <FormSelect
          {...register('identityInfo.nationality')}
          options={formOptions.nationality}
          error={!!idErrors?.nationality}
        />
      </FormField>

      <FormField label="生年月日" required error={idErrors?.birthDate?.message} hint="半角数字8桁 (例: 19900101)">
        <FormInput
          {...register('identityInfo.birthDate')}
          placeholder="YYYYMMDD"
          maxLength={8}
          error={!!idErrors?.birthDate}
        />
      </FormField>

      <FormField label="氏名 (英字)" required error={idErrors?.nameEn?.message} hint="パスポート通りに入力">
        <FormInput
          {...register('identityInfo.nameEn')}
          placeholder="例: WANG WEI"
          error={!!idErrors?.nameEn}
          className="uppercase"
        />
      </FormField>

      <FormField label="氏名 (母国語/漢字)" error={idErrors?.nameKanji?.message}>
        <FormInput
          {...register('identityInfo.nameKanji')}
          placeholder="例: 王 偉"
          error={!!idErrors?.nameKanji}
        />
      </FormField>

      <FormField label="性別" required error={idErrors?.gender?.message}>
        <FormSelect
          {...register('identityInfo.gender')}
          options={formOptions.gender}
          error={!!idErrors?.gender}
        />
      </FormField>

      <FormField label="出生地" required error={idErrors?.birthPlace?.message}>
        <FormInput
          {...register('identityInfo.birthPlace')}
          placeholder="例: 北京市"
          error={!!idErrors?.birthPlace}
        />
      </FormField>

      <FormField label="配偶者の有無" required error={idErrors?.maritalStatus?.message}>
        <FormSelect
          {...register('identityInfo.maritalStatus')}
          options={formOptions.yesNo}
          error={!!idErrors?.maritalStatus}
        />
      </FormField>

      <FormField label="職業" required error={idErrors?.occupation?.message} hint="40文字以内">
        <FormInput
          {...register('identityInfo.occupation')}
          placeholder="例: エンジニア"
          maxLength={40}
          error={!!idErrors?.occupation}
        />
      </FormField>

      <FormField label="本国における居住地" required error={idErrors?.homeCountryAddress?.message} className="md:col-span-2">
        <FormInput
          {...register('identityInfo.homeCountryAddress')}
          placeholder="例: 中華人民共和国北京市〇〇区〇〇1-2-3"
          error={!!idErrors?.homeCountryAddress}
        />
      </FormField>
    </div>
  );
}
