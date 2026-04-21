'use client';

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormRadioGroup } from '../../ui/FormRadio';

export function ReEntryPermitSubForm() {
  const { register, control, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const simultaneousError = errors.simultaneousApplication;
  
  const applyForReEntry = useWatch({
    control,
    name: 'simultaneousApplication.applyForReEntry'
  });

  return (
    <div className="subsection">
      <div className="subsection-header-row">
        <div>
          <h3 className="subsection-title">再入国許可申請</h3>
          <p className="subsection-desc">日本を出国し再び入国する場合に必要な許可です。</p>
        </div>
        
        <div className="w-full md:w-auto">
          <Controller
            name="simultaneousApplication.applyForReEntry"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="simultaneousApplication.applyForReEntry"
                options={[
                  { value: 'true', label: '同時に申請する' },
                  { value: 'false', label: '申請しない' },
                ]}
                value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                error={!!simultaneousError?.applyForReEntry}
              />
            )}
          />
        </div>
      </div>

      {applyForReEntry === true && (
        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="cert-block">
            <h4 className="cert-block-label">渡航予定</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="出国予定年月日" error={simultaneousError?.reEntryPermit?.departureDatePrimary?.message} className="text-xs">
                <FormInput
                  type="date"
                  {...register('simultaneousApplication.reEntryPermit.departureDatePrimary')}
                  error={!!simultaneousError?.reEntryPermit?.departureDatePrimary}
                />
              </FormField>

              <FormField label="出国予定の港・空港" error={simultaneousError?.reEntryPermit?.departurePortPrimary?.message} className="text-xs">
                <FormInput
                  {...register('simultaneousApplication.reEntryPermit.departurePortPrimary')}
                  placeholder="例: 成田、関西"
                  error={!!simultaneousError?.reEntryPermit?.departurePortPrimary}
                />
              </FormField>

              <FormField label="再入国予定年月日" error={simultaneousError?.reEntryPermit?.reEntryDatePrimary?.message} className="text-xs">
                <FormInput
                  type="date"
                  {...register('simultaneousApplication.reEntryPermit.reEntryDatePrimary')}
                  error={!!simultaneousError?.reEntryPermit?.reEntryDatePrimary}
                />
              </FormField>

              <FormField label="再入国予定の港・空港" error={simultaneousError?.reEntryPermit?.reEntryPortPrimary?.message} className="text-xs">
                <FormInput
                  {...register('simultaneousApplication.reEntryPermit.reEntryPortPrimary')}
                  placeholder="例: 羽田、中部"
                  error={!!simultaneousError?.reEntryPermit?.reEntryPortPrimary}
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="渡航目的" error={simultaneousError?.reEntryPermit?.travelPurpose1?.message} className="text-xs">
              <FormInput
                {...register('simultaneousApplication.reEntryPermit.travelPurpose1')}
                placeholder="例: 帰省、出張など"
                error={!!simultaneousError?.reEntryPermit?.travelPurpose1}
              />
            </FormField>
            
            <FormField label="予定渡航先国名" error={simultaneousError?.reEntryPermit?.destinationCountry1?.message} className="text-xs">
              <FormInput
                {...register('simultaneousApplication.reEntryPermit.destinationCountry1')}
                placeholder="例: ベトナム、フィリピン"
                error={!!simultaneousError?.reEntryPermit?.destinationCountry1}
              />
            </FormField>

            <FormField label="希望する再入国許可" error={simultaneousError?.reEntryPermit?.desiredPermitType?.message} className="md:col-span-2 text-xs">
              <FormInput
                {...register('simultaneousApplication.reEntryPermit.desiredPermitType')}
                placeholder="例: 1回限り、数次"
                error={!!simultaneousError?.reEntryPermit?.desiredPermitType}
              />
            </FormField>
          </div>
          
          <div className="cert-block">
            <h4 className="cert-block-label">注意事項等の確認</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="犯罪を理由とする処分を受けたことの有無" error={simultaneousError?.reEntryPermit?.hasCriminalRecord?.message} className="text-xs">
                <Controller
                  name="simultaneousApplication.reEntryPermit.hasCriminalRecord"
                  control={control}
                  render={({ field }) => (
                    <FormRadioGroup
                      name="simultaneousApplication.reEntryPermit.hasCriminalRecord"
                      options={[
                        { value: 'true', label: '有' },
                        { value: 'false', label: '無' },
                      ]}
                      value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                      onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                      error={!!simultaneousError?.reEntryPermit?.hasCriminalRecord}
                    />
                  )}
                />
              </FormField>

              <FormField label="確定前の刑事裁判の有無" error={simultaneousError?.reEntryPermit?.hasPendingCriminalCase?.message} className="text-xs">
                <Controller
                  name="simultaneousApplication.reEntryPermit.hasPendingCriminalCase"
                  control={control}
                  render={({ field }) => (
                    <FormRadioGroup
                      name="simultaneousApplication.reEntryPermit.hasPendingCriminalCase"
                      options={[
                        { value: 'true', label: '有' },
                        { value: 'false', label: '無' },
                      ]}
                      value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                      onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                      error={!!simultaneousError?.reEntryPermit?.hasPendingCriminalCase}
                    />
                  )}
                />
              </FormField>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
