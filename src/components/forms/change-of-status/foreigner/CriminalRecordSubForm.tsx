'use client';

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormRadioGroup } from '../../ui/FormRadio';

export function CriminalRecordSubForm() {
  const { control, register, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  
  // 犯罪歴の有無を監視し、段階的開示(Progressive Disclosure)に使用
  const hasCriminalRecord = useWatch({
    control,
    name: 'foreignerInfo.criminalRecord'
  });

  const infoError = errors.foreignerInfo;

  return (
    <div className="subsection">
      <h3 className="subsection-title">⑤ 犯罪歴等</h3>
      
      <div className="space-y-6">
        <FormField label="犯罪を理由とする処分を受けたことの有無" required error={infoError?.criminalRecord?.message}>
          <Controller
            name="foreignerInfo.criminalRecord"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="foreignerInfo.criminalRecord"
                options={[
                  { value: 'yes', label: '有' },
                  { value: 'no', label: '無' },
                ]}
                value={field.value ? 'yes' : 'no'}
                onChange={(val) => field.onChange(val === 'yes')}
                error={!!infoError?.criminalRecord}
              />
            )}
          />
        </FormField>

        {/* 段階的開示: 有の場合のみ表示 */}
        {hasCriminalRecord === true && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-2">
            <FormField label="処分の内容（有の場合）" required error={infoError?.criminalRecordDetail?.message}>
              <FormInput
                {...register('foreignerInfo.criminalRecordDetail')}
                placeholder="処分の内容を具体的に入力してください"
                error={!!infoError?.criminalRecordDetail}
              />
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}
