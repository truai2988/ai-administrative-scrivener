'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormSelect } from '@/components/forms/ui/FormSelect';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';
import { coeFormOptions } from '@/lib/constants/coeFormOptions';

export function ContactInfoFields() {
  const { register, formState: { errors }, control, watch, setValue } = useFormContext<CoeApplicationFormData>();
  const idErrors = errors.identityInfo;

  const selectedPrefecture = watch('identityInfo.japanPrefecture');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="郵便番号" required error={idErrors?.japanZipCode?.message} hint="ハイフンなし7桁">
        <FormInput
          {...register('identityInfo.japanZipCode')}
          placeholder="例: 1000001"
          maxLength={7}
          error={!!idErrors?.japanZipCode}
        />
      </FormField>

      <FormField label="都道府県" required error={idErrors?.japanPrefecture?.message}>
        <Controller
          name="identityInfo.japanPrefecture"
          control={control}
          render={({ field }) => (
            <FormSelect
              {...field}
              options={coeFormOptions.prefectures}
              error={!!idErrors?.japanPrefecture}
              onChange={(e) => {
                field.onChange(e);
                setValue('identityInfo.japanCity', ''); // 都道府県が変わったら市区町村をクリア
              }}
            />
          )}
        />
      </FormField>

      <FormField label="市区町村" required error={idErrors?.japanCity?.message}>
        <Controller
          name="identityInfo.japanCity"
          control={control}
          render={({ field }) => (
            <FormSelect
              {...field}
              options={selectedPrefecture ? coeFormOptions.getCityOptions(selectedPrefecture) : []}
              error={!!idErrors?.japanCity}
              disabled={!selectedPrefecture}
            />
          )}
        />
      </FormField>

      <FormField label="町名丁目番地号等" required error={idErrors?.japanAddressLines?.message}>
        <FormInput
          {...register('identityInfo.japanAddressLines')}
          placeholder="例: 千代田1-1-1"
          error={!!idErrors?.japanAddressLines}
        />
      </FormField>

      <FormField label="電話番号" required error={idErrors?.phoneNumber?.message} hint="ハイフンなし">
        <FormInput
          {...register('identityInfo.phoneNumber')}
          placeholder="例: 0312345678"
          type="tel"
          error={!!idErrors?.phoneNumber}
        />
      </FormField>

      <FormField label="携帯電話番号" error={idErrors?.mobileNumber?.message} hint="ハイフンなし">
        <FormInput
          {...register('identityInfo.mobileNumber')}
          placeholder="例: 09012345678"
          type="tel"
          error={!!idErrors?.mobileNumber}
        />
      </FormField>

      <FormField label="メールアドレス" error={idErrors?.email?.message} className="md:col-span-2">
        <FormInput
          {...register('identityInfo.email')}
          placeholder="例: sample@example.com"
          type="email"
          error={!!idErrors?.email}
        />
      </FormField>
    </div>
  );
}
