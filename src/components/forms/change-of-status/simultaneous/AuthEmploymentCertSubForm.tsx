'use client';

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormRadioGroup } from '../../ui/FormRadio';

export function AuthEmploymentCertSubForm() {
  const { register, control, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const simultaneousError = errors.simultaneousApplication;
  
  const applyForAuthEmployment = useWatch({
    control,
    name: 'simultaneousApplication.applyForAuthEmployment'
  });

  return (
    <div className="subsection">
      <div className="subsection-header-row">
        <div>
          <h3 className="subsection-title">就労資格証明書交付申請</h3>
          <p className="subsection-desc">転職活動時など、就労可能な資格を有することを証明する書類が必要な場合に申請します。</p>
        </div>
        
        <div className="w-full md:w-auto">
          <Controller
            name="simultaneousApplication.applyForAuthEmployment"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="simultaneousApplication.applyForAuthEmployment"
                options={[
                  { value: 'true', label: '同時に申請する' },
                  { value: 'false', label: '申請しない' },
                ]}
                value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                error={!!simultaneousError?.applyForAuthEmployment}
              />
            )}
          />
        </div>
      </div>

      {applyForAuthEmployment === true && (
        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="証明を希望する活動の内容" error={simultaneousError?.authEmploymentCert?.certificationActivityDescription?.message} className="md:col-span-2 text-xs">
              <FormInput
                {...register('simultaneousApplication.authEmploymentCert.certificationActivityDescription')}
                placeholder="例: 株式会社〇〇でのシステムエンジニアとしての業務"
                error={!!simultaneousError?.authEmploymentCert?.certificationActivityDescription}
              />
            </FormField>

            <FormField label="就労する期間（始期）" error={simultaneousError?.authEmploymentCert?.employmentPeriodStart?.message} className="text-xs">
              <FormInput
                type="date"
                {...register('simultaneousApplication.authEmploymentCert.employmentPeriodStart')}
                error={!!simultaneousError?.authEmploymentCert?.employmentPeriodStart}
              />
            </FormField>
            
            <FormField label="就労する期間（終期）" error={simultaneousError?.authEmploymentCert?.employmentPeriodEnd?.message} className="text-xs">
              <FormInput
                type="date"
                {...register('simultaneousApplication.authEmploymentCert.employmentPeriodEnd')}
                error={!!simultaneousError?.authEmploymentCert?.employmentPeriodEnd}
              />
            </FormField>

            <FormField label="使用目的" error={simultaneousError?.authEmploymentCert?.purpose?.message} className="md:col-span-2 text-xs">
              <FormInput
                {...register('simultaneousApplication.authEmploymentCert.purpose')}
                placeholder="例: 転職先の企業に提出するため"
                error={!!simultaneousError?.authEmploymentCert?.purpose}
              />
            </FormField>
          </div>
        </div>
      )}
    </div>
  );
}
