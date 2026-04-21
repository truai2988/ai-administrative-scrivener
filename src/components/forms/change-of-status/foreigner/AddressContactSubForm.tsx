'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';

export function AddressContactSubForm() {
  const { register, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const infoError = errors.foreignerInfo;

  return (
    <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both">
      <h4 className="text-md font-semibold text-slate-800 border-b border-slate-50 pb-2">② 本国における居住地・日本における連絡先</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="本国における居住地" required error={infoError?.homeCountryAddress?.message}>
          <FormInput
            {...register('foreignerInfo.homeCountryAddress')}
            placeholder="例: 中国〇〇省〇〇市..."
            error={!!infoError?.homeCountryAddress}
          />
        </FormField>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
        <h5 className="text-sm font-medium text-slate-700">日本における連絡先</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField label="郵便番号" required error={infoError?.japanZipCode?.message}>
            <FormInput
              {...register('foreignerInfo.japanZipCode')}
              placeholder="例: 1600000"
              error={!!infoError?.japanZipCode}
            />
          </FormField>
          
          <FormField label="都道府県" required error={infoError?.japanPrefecture?.message}>
            <FormInput
              {...register('foreignerInfo.japanPrefecture')}
              placeholder="例: 東京都"
              error={!!infoError?.japanPrefecture}
            />
          </FormField>

          <FormField label="市区町村" required error={infoError?.japanCity?.message}>
            <FormInput
              {...register('foreignerInfo.japanCity')}
              placeholder="例: 新宿区"
              error={!!infoError?.japanCity}
            />
          </FormField>

          <FormField label="番地・号等" required error={infoError?.japanAddressLines?.message} className="md:col-span-2 lg:col-span-3">
            <FormInput
              {...register('foreignerInfo.japanAddressLines')}
              placeholder="例: 〇〇1-2-3"
              error={!!infoError?.japanAddressLines}
            />
          </FormField>
          
          <FormField label="電話番号" required error={infoError?.phoneNumber?.message}>
            <FormInput
              {...register('foreignerInfo.phoneNumber')}
              placeholder="例: 03-1234-5678"
              error={!!infoError?.phoneNumber}
            />
          </FormField>

          <FormField label="携帯電話番号" error={infoError?.mobileNumber?.message}>
            <FormInput
              {...register('foreignerInfo.mobileNumber')}
              placeholder="例: 090-1234-5678"
              error={!!infoError?.mobileNumber}
            />
          </FormField>
        </div>
        <p className="text-xs text-slate-500">※ 電話番号または携帯電話番号のいずれかを入力してください。</p>
      </div>
    </section>
  );
}
