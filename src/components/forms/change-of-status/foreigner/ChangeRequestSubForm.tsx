'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormSelect } from '../../ui/FormSelect';
import { changeFormOptions, getStayPeriodByStatus } from '@/lib/constants/changeFormOptions';

export function ChangeRequestSubForm() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const infoError = errors.foreignerInfo;
  const desiredResidenceStatus = watch('foreignerInfo.desiredResidenceStatus');
  const desiredStayPeriod = watch('foreignerInfo.desiredStayPeriod');

  const stayPeriodOptions = getStayPeriodByStatus(desiredResidenceStatus);

  // カスケード連動：希望する在留資格が変わった際、選択済みの在留期間が新しい選択肢に含まれていなければリセット
  useEffect(() => {
    if (stayPeriodOptions.length > 0 && desiredStayPeriod) {
      const isValid = stayPeriodOptions.some(opt => opt.value === desiredStayPeriod);
      if (!isValid && desiredStayPeriod !== 'その他') {
        setValue('foreignerInfo.desiredStayPeriod', '');
      }
    }
  }, [desiredResidenceStatus, stayPeriodOptions, desiredStayPeriod, setValue]);

  return (
    <div className="subsection">
      <h3 className="subsection-title">変更の希望・理由</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="希望する在留資格" required error={infoError?.desiredResidenceStatus?.message}>
          <FormSelect
            {...register('foreignerInfo.desiredResidenceStatus')}
            options={changeFormOptions.desiredStatusOfResidence1}
            error={!!infoError?.desiredResidenceStatus}
          />
        </FormField>

        <FormField label="希望する在留期間" required error={infoError?.desiredStayPeriod?.message}>
          <FormSelect
            {...register('foreignerInfo.desiredStayPeriod')}
            options={stayPeriodOptions}
            disabled={!desiredResidenceStatus || stayPeriodOptions.length === 0}
            error={!!infoError?.desiredStayPeriod}
          />
        </FormField>

        {desiredStayPeriod === 'その他' && (
          <FormField label="希望する在留期間（その他）" required error={infoError?.desiredStayPeriodOther?.message}>
            <FormInput
              {...register('foreignerInfo.desiredStayPeriodOther')}
              placeholder="例: 3年"
              error={!!infoError?.desiredStayPeriodOther}
            />
          </FormField>
        )}

        <FormField label="変更の理由" required error={infoError?.changeReason?.message} className="md:col-span-2 lg:col-span-3">
          <FormInput
            {...register('foreignerInfo.changeReason')}
            placeholder="例: 就労活動を行うため"
            error={!!infoError?.changeReason}
          />
        </FormField>
      </div>
    </div>
  );
}
