'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormSelect } from '../../ui/FormSelect';
import { changeFormOptions } from '@/lib/constants/changeFormOptions';

export function ChangeRequestSubForm() {
  const { register, watch, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const infoError = errors.foreignerInfo;
  const desiredStayPeriod = watch('foreignerInfo.desiredStayPeriod');

  return (
    <div className="subsection">
      <h3 className="subsection-title">④ 変更の希望・理由</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="希望する在留資格" required error={infoError?.desiredResidenceStatus?.message}>
          <FormSelect
            {...register('foreignerInfo.desiredResidenceStatus')}
            options={changeFormOptions.residenceStatus}
            error={!!infoError?.desiredResidenceStatus}
          />
        </FormField>

        <FormField label="希望する在留期間" required error={infoError?.desiredStayPeriod?.message}>
          <FormSelect
            {...register('foreignerInfo.desiredStayPeriod')}
            options={[
              { value: '4months', label: '4ヶ月' },
              { value: '6months', label: '6ヶ月' },
              { value: '1year', label: '1年' },
              { value: 'other', label: 'その他' },
            ]}
            error={!!infoError?.desiredStayPeriod}
          />
        </FormField>

        {desiredStayPeriod === 'other' && (
          <FormField label="希望する在留期間（その他）" required error={infoError?.desiredStayPeriodOther?.message}>
            <FormInput
              {...register('foreignerInfo.desiredStayPeriodOther')}
              placeholder="例: 3年"
              error={!!infoError?.desiredStayPeriodOther}
            />
          </FormField>
        )}

        <FormField label="変更の理由" required error={infoError?.changeReason?.message} className="md:col-span-2 lg:col-span-3">
          <FormSelect
            {...register('foreignerInfo.changeReason')}
            options={changeFormOptions.changeReason}
            error={!!infoError?.changeReason}
          />
        </FormField>
      </div>
    </div>
  );
}
