'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';

export function PassportStatusSubForm() {
  const { register, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const infoError = errors.foreignerInfo;

  return (
    <div className="subsection">
      <h3 className="subsection-title">③ 旅券・在留資格等の状況</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* パスポート情報 */}
        <div className="space-y-4">
          <h4 className="cert-block-label">旅券（パスポート）</h4>
          <FormField label="旅券番号" required error={infoError?.passportNumber?.message}>
            <FormInput
              {...register('foreignerInfo.passportNumber')}
              placeholder="例: AB1234567"
              error={!!infoError?.passportNumber}
            />
          </FormField>
          <FormField label="有効期限" required error={infoError?.passportExpiryDate?.message}>
            <FormInput
              type="date"
              {...register('foreignerInfo.passportExpiryDate')}
              error={!!infoError?.passportExpiryDate}
            />
          </FormField>
        </div>

        {/* 現在の在留状態 */}
        <div className="space-y-4">
          <h4 className="cert-block-label">現在の在留状態</h4>
          <FormField label="現に有する在留資格" required error={infoError?.currentResidenceStatus?.message}>
            <FormInput
              {...register('foreignerInfo.currentResidenceStatus')}
              placeholder="例: 技能実習〇号"
              error={!!infoError?.currentResidenceStatus}
            />
          </FormField>
          <FormField label="在留期間" required error={infoError?.currentStayPeriod?.message}>
            <FormInput
              {...register('foreignerInfo.currentStayPeriod')}
              placeholder="例: 1年"
              error={!!infoError?.currentStayPeriod}
            />
          </FormField>
          <FormField label="在留期間の満了日" required error={infoError?.stayExpiryDate?.message}>
            <FormInput
              type="date"
              {...register('foreignerInfo.stayExpiryDate')}
              error={!!infoError?.stayExpiryDate}
            />
          </FormField>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-50">
        <FormField label="在留カード番号" required error={infoError?.residenceCardNumber?.message} className="max-w-xs">
          <FormInput
            {...register('foreignerInfo.residenceCardNumber')}
            placeholder="例: AB12345678CD"
            maxLength={12}
            error={!!infoError?.residenceCardNumber}
          />
        </FormField>
      </div>
    </div>
  );
}
