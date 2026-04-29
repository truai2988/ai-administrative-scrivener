'use client';

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormRadioGroup } from '../../ui/FormRadio';

export function CompanyProfileSubForm() {
  const { register, control, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const empError = errors.employerInfo;

  const hasCorporateNumber = useWatch({
    control,
    name: 'employerInfo.hasCorporateNumber'
  });

  return (
    <div className="subsection">
      <h3 className="subsection-title">所属機関（雇用主）の基本情報</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="法人等名（氏名又は名称）" required error={empError?.companyNameJa?.message} className="md:col-span-2">
          <FormInput
            {...register('employerInfo.companyNameJa')}
            placeholder="例: 株式会社〇〇"
            error={!!empError?.companyNameJa}
          />
        </FormField>

        <FormField label="代表者の氏名" required error={empError?.representativeName?.message}>
          <FormInput
            {...register('employerInfo.representativeName')}
            placeholder="例: 鈴木 太郎"
            error={!!empError?.representativeName}
          />
        </FormField>

        <FormField label="法人番号の有無" required error={empError?.hasCorporateNumber?.message}>
          <Controller
            name="employerInfo.hasCorporateNumber"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="employerInfo.hasCorporateNumber"
                options={[
                  { value: 'true', label: '有' },
                  { value: 'false', label: '無' },
                ]}
                value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                error={!!empError?.hasCorporateNumber}
              />
            )}
          />
        </FormField>

        {hasCorporateNumber && (
          <FormField label="法人番号" required error={empError?.corporateNumber?.message} className="animate-in fade-in slide-in-from-top-1">
            <FormInput
              {...register('employerInfo.corporateNumber')}
              placeholder="例: 1234567890123"
              maxLength={13}
              error={!!empError?.corporateNumber}
            />
          </FormField>
        )}

        <FormField label="雇用保険適用事業所番号" required error={empError?.employmentInsuranceNumber?.message}>
          <FormInput
            {...register('employerInfo.employmentInsuranceNumber')}
            placeholder="例: 12345678901"
            maxLength={11}
            error={!!empError?.employmentInsuranceNumber}
          />
        </FormField>
      </div>

      <div className="cert-block">
        <h4 className="cert-block-label">所在地</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField label="郵便番号" required error={empError?.companyZipCode?.message}>
            <FormInput
              {...register('employerInfo.companyZipCode')}
              placeholder="例: 1234567"
              maxLength={7}
              error={!!empError?.companyZipCode}
            />
          </FormField>
          
          <FormField label="都道府県" required error={empError?.companyPref?.message}>
            <FormInput
              {...register('employerInfo.companyPref')}
              placeholder="例: 東京都"
              error={!!empError?.companyPref}
            />
          </FormField>

          <FormField label="市区町村" required error={empError?.companyCity?.message}>
            <FormInput
              {...register('employerInfo.companyCity')}
              placeholder="例: 新宿区"
              error={!!empError?.companyCity}
            />
          </FormField>

          <FormField label="番地・建物名" required error={empError?.companyAddressLines?.message} className="md:col-span-2 lg:col-span-3">
            <FormInput
              {...register('employerInfo.companyAddressLines')}
              placeholder="例: 〇〇1-2-3 〇〇ビル1F"
              error={!!empError?.companyAddressLines}
            />
          </FormField>

          <FormField label="電話番号" required error={empError?.companyPhone?.message}>
            <FormInput
              {...register('employerInfo.companyPhone')}
              placeholder="例: 03-1234-5678"
              error={!!empError?.companyPhone}
            />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField label="資本金（円）" error={empError?.capital?.message}>
          <FormInput
            type="number"
            {...register('employerInfo.capital', { valueAsNumber: true })}
            placeholder="例: 10000000"
            error={!!empError?.capital}
          />
        </FormField>
        
        <FormField label="年間売上金額（円）" error={empError?.annualRevenue?.message}>
          <FormInput
            type="number"
            {...register('employerInfo.annualRevenue', { valueAsNumber: true })}
            placeholder="例: 500000000"
            error={!!empError?.annualRevenue}
          />
        </FormField>

        <FormField label="常勤職員数（人）" required error={empError?.employeeCount?.message}>
          <FormInput
            type="number"
            {...register('employerInfo.employeeCount', { valueAsNumber: true })}
            placeholder="例: 50"
            error={!!empError?.employeeCount}
          />
        </FormField>
      </div>
    </div>
  );
}
