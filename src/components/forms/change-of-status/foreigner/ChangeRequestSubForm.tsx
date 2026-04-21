'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';

export function ChangeRequestSubForm() {
  const { register, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const infoError = errors.foreignerInfo;

  return (
    <div className="subsection">
      <h3 className="subsection-title">④ 変更の希望・理由</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="希望する在留資格" required error={infoError?.desiredResidenceStatus?.message}>
          <FormInput
            {...register('foreignerInfo.desiredResidenceStatus')}
            placeholder="例: 特定技能1号"
            error={!!infoError?.desiredResidenceStatus}
          />
        </FormField>

        <FormField label="希望する在留期間" required error={infoError?.desiredStayPeriod?.message}>
          <FormInput
            {...register('foreignerInfo.desiredStayPeriod')}
            placeholder="例: 1year"
            error={!!infoError?.desiredStayPeriod}
          />
        </FormField>

        <FormField label="変更の理由" required error={infoError?.changeReason?.message} className="md:col-span-2 lg:col-span-3">
          <FormInput
            {...register('foreignerInfo.changeReason')}
            placeholder="例: 引続き就労するため"
            error={!!infoError?.changeReason}
          />
        </FormField>
      </div>
    </div>
  );
}
