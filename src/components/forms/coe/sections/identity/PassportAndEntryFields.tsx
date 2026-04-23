'use client';

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormRadioGroup } from '@/components/forms/ui/FormRadio';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function PassportAndEntryFields() {
  const { register, control, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const idErrors = errors.identityInfo;

  // Watch for progressive disclosure
  const pastApplicationRecord = useWatch({ control, name: 'identityInfo.pastApplicationRecord' });
  const criminalRecord = useWatch({ control, name: 'identityInfo.criminalRecord' });
  const departureOrderHistory = useWatch({ control, name: 'identityInfo.departureOrderHistory' });

  return (
    <div className="flex flex-col gap-8">
      {/* 旅券 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="旅券番号" error={idErrors?.passportNumber?.message}>
          <FormInput
            {...register('identityInfo.passportNumber')}
            placeholder="例: TZ1234567"
            error={!!idErrors?.passportNumber}
          />
        </FormField>
        <FormField label="旅券有効期限" error={idErrors?.passportExpiryDate?.message} hint="YYYYMMDD">
          <FormInput
            {...register('identityInfo.passportExpiryDate')}
            placeholder="YYYYMMDD"
            maxLength={8}
            error={!!idErrors?.passportExpiryDate}
          />
        </FormField>
      </div>

      {/* 入国予定 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
        <FormField label="入国目的（在留資格）" required error={idErrors?.entryPurpose?.message}>
          <FormInput
            {...register('identityInfo.entryPurpose')}
            placeholder="例: V"
            maxLength={2}
            error={!!idErrors?.entryPurpose}
          />
        </FormField>
        <FormField label="入国目的（その他）" error={idErrors?.entryPurposeOther?.message}>
          <FormInput
            {...register('identityInfo.entryPurposeOther')}
            placeholder="その他の場合のみ入力"
            error={!!idErrors?.entryPurposeOther}
          />
        </FormField>
        <FormField label="入国予定港" required error={idErrors?.entryPort?.message}>
          <FormInput
            {...register('identityInfo.entryPort')}
            placeholder="例: 成田空港"
            error={!!idErrors?.entryPort}
          />
        </FormField>
        <FormField label="入国予定年月日" required error={idErrors?.entryDate?.message} hint="YYYYMMDD">
          <FormInput
            {...register('identityInfo.entryDate')}
            placeholder="YYYYMMDD"
            maxLength={8}
            error={!!idErrors?.entryDate}
          />
        </FormField>
        <FormField label="滞在予定期間" required error={idErrors?.stayPeriod?.message}>
          <FormInput
            {...register('identityInfo.stayPeriod')}
            placeholder="例: 5年"
            error={!!idErrors?.stayPeriod}
          />
        </FormField>
        <FormField label="査証申請予定地" required error={idErrors?.visaApplicationPlace?.message}>
          <FormInput
            {...register('identityInfo.visaApplicationPlace')}
            placeholder="例: 在上海日本国総領事館"
            error={!!idErrors?.visaApplicationPlace}
          />
        </FormField>
        <FormField label="同伴者の有無" required error={idErrors?.accompanyingPersons?.message}>
          <Controller
            name="identityInfo.accompanyingPersons"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={[
                  { label: '有', value: '1' },
                  { label: '無', value: '2' },
                ]}
                error={!!idErrors?.accompanyingPersons}
              />
            )}
          />
        </FormField>
      </div>

      {/* 過去の履歴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
        <FormField label="過去の出入国歴 回数" error={idErrors?.pastEntryCount?.message}>
          <FormInput
            {...register('identityInfo.pastEntryCount')}
            placeholder="例: 2"
            error={!!idErrors?.pastEntryCount}
          />
        </FormField>
        <div className="hidden md:block"></div>
        <FormField label="直近の出入国歴（入国）" error={idErrors?.latestEntryDate?.message} hint="YYYYMMDD">
          <FormInput
            {...register('identityInfo.latestEntryDate')}
            placeholder="YYYYMMDD"
            maxLength={8}
            error={!!idErrors?.latestEntryDate}
          />
        </FormField>
        <FormField label="直近の出入国歴（出国）" error={idErrors?.latestDepartureDate?.message} hint="YYYYMMDD">
          <FormInput
            {...register('identityInfo.latestDepartureDate')}
            placeholder="YYYYMMDD"
            maxLength={8}
            error={!!idErrors?.latestDepartureDate}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
        <FormField label="過去の在留資格認定証明書交付申請歴" required error={idErrors?.pastApplicationRecord?.message}>
          <Controller
            name="identityInfo.pastApplicationRecord"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={[
                  { label: '有', value: '1' },
                  { label: '無', value: '2' },
                ]}
                error={!!idErrors?.pastApplicationRecord}
              />
            )}
          />
        </FormField>
        
        {pastApplicationRecord === '1' && (
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <FormField label="過去の申請回数" error={idErrors?.pastApplicationCount?.message}>
              <FormInput
                {...register('identityInfo.pastApplicationCount')}
                placeholder="例: 1"
                error={!!idErrors?.pastApplicationCount}
              />
            </FormField>
            <FormField label="うち不交付となった回数" error={idErrors?.pastApplicationApprovalCount?.message}>
              <FormInput
                {...register('identityInfo.pastApplicationApprovalCount')}
                placeholder="例: 0"
                error={!!idErrors?.pastApplicationApprovalCount}
              />
            </FormField>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
        <FormField label="犯罪を理由とする処分の有無" required error={idErrors?.criminalRecord?.message}>
          <Controller
            name="identityInfo.criminalRecord"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={[
                  { label: '有', value: '1' },
                  { label: '無', value: '2' },
                ]}
                error={!!idErrors?.criminalRecord}
              />
            )}
          />
        </FormField>

        {criminalRecord === '1' && (
          <div className="col-span-1 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <FormField label="処分の内容" error={idErrors?.criminalRecordDetail?.message}>
              <FormInput
                {...register('identityInfo.criminalRecordDetail')}
                placeholder="処分の内容を具体的に入力してください"
                error={!!idErrors?.criminalRecordDetail}
              />
            </FormField>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
        <FormField label="退去強制又は出国命令による出国の有無" required error={idErrors?.departureOrderHistory?.message}>
          <Controller
            name="identityInfo.departureOrderHistory"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={[
                  { label: '有', value: '1' },
                  { label: '無', value: '2' },
                ]}
                error={!!idErrors?.departureOrderHistory}
              />
            )}
          />
        </FormField>

        {departureOrderHistory === '1' && (
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <FormField label="回数" error={idErrors?.departureOrderCount?.message}>
              <FormInput
                {...register('identityInfo.departureOrderCount')}
                placeholder="例: 1"
                error={!!idErrors?.departureOrderCount}
              />
            </FormField>
            <FormField label="直近の出国日" error={idErrors?.latestDepartureOrderDate?.message} hint="YYYYMMDD">
              <FormInput
                {...register('identityInfo.latestDepartureOrderDate')}
                placeholder="YYYYMMDD"
                maxLength={8}
                error={!!idErrors?.latestDepartureOrderDate}
              />
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}
