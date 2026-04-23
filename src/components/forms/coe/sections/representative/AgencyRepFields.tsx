'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function AgencyRepFields() {
  const { register, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const repErrors = errors.agencyRep;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="氏名" error={repErrors?.name?.message} className="md:col-span-2">
        <FormInput
          {...register('agencyRep.name')}
          placeholder="例: 行政 書士"
          error={!!repErrors?.name}
        />
      </FormField>

      <FormField label="所属機関等" error={repErrors?.organization?.message} className="md:col-span-2">
        <FormInput
          {...register('agencyRep.organization')}
          placeholder="例: 〇〇行政書士法人"
          error={!!repErrors?.organization}
        />
      </FormField>

      <FormField label="郵便番号" error={repErrors?.zipCode?.message} hint="ハイフンなし7桁">
        <FormInput
          {...register('agencyRep.zipCode')}
          placeholder="例: 1000001"
          maxLength={7}
          error={!!repErrors?.zipCode}
        />
      </FormField>
      <FormField label="都道府県" error={repErrors?.prefecture?.message}>
        <FormInput
          {...register('agencyRep.prefecture')}
          placeholder="例: 東京都"
          error={!!repErrors?.prefecture}
        />
      </FormField>
      <FormField label="市区町村" error={repErrors?.city?.message}>
        <FormInput
          {...register('agencyRep.city')}
          placeholder="例: 千代田区"
          error={!!repErrors?.city}
        />
      </FormField>
      <FormField label="町名丁目番地号等" error={repErrors?.addressLines?.message}>
        <FormInput
          {...register('agencyRep.addressLines')}
          placeholder="例: 千代田1-1-1"
          error={!!repErrors?.addressLines}
        />
      </FormField>
      <FormField label="電話番号" error={repErrors?.phone?.message} hint="ハイフンなし">
        <FormInput
          {...register('agencyRep.phone')}
          placeholder="例: 0312345678"
          type="tel"
          error={!!repErrors?.phone}
        />
      </FormField>
    </div>
  );
}
