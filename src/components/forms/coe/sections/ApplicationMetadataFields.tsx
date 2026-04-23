'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormRadioGroup } from '@/components/forms/ui/FormRadio';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function ApplicationMetadataFields() {
  const { register, control, formState: { errors } } = useFormContext<CoeApplicationFormData>();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="subsection">
        <h3 className="subsection-title">その他メタデータ</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="在留カードの受領方法" required error={errors.residenceCardReceiptMethod?.message}>
            <Controller
              name="residenceCardReceiptMethod"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { label: '窓口', value: '1' },
                    { label: '郵送', value: '2' },
                  ]}
                  error={!!errors.residenceCardReceiptMethod}
                />
              )}
            />
          </FormField>

          <FormField label="申請意思の確認" required error={errors.checkIntent?.message}>
            <Controller
              name="checkIntent"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { label: '確認済', value: '1' },
                    { label: '未確認', value: '2' },
                  ]}
                  error={!!errors.checkIntent}
                />
              )}
            />
          </FormField>

          <FormField label="フリー欄" error={errors.freeFormat?.message} className="md:col-span-2">
            <FormInput
              {...register('freeFormat')}
              placeholder="備考などがあれば入力してください"
              error={!!errors.freeFormat}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
