'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormField } from '@/components/forms/ui/FormField';
import { FormInput } from '@/components/forms/ui/FormInput';
import { FormSelect } from '@/components/forms/ui/FormSelect';
import { FormRadioGroup } from '@/components/forms/ui/FormRadio';
import { coeFormOptions } from '@/lib/constants/coeFormOptions';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';

export function CompanyBasicFields() {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<CoeApplicationFormData>();
  const empErrors = errors.employerInfo;

  const hasCorporateNumber = watch('employerInfo.hasCorporateNumber');
  const selectedPrefecture = watch('employerInfo.companyPref');

  return (
    <div className="flex flex-col gap-8">
      {/* 会社名・法人番号 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="氏名又は名称" required error={empErrors?.companyNameJa?.message} className="md:col-span-2">
          <FormInput
            {...register('employerInfo.companyNameJa')}
            placeholder="例: 株式会社〇〇"
            error={!!empErrors?.companyNameJa}
          />
        </FormField>
        <FormField label="支店・事業所名" error={empErrors?.branchName?.message} className="md:col-span-2">
          <FormInput
            {...register('employerInfo.branchName')}
            placeholder="例: 東京支店"
            maxLength={60}
            error={!!empErrors?.branchName}
          />
        </FormField>
        
        <FormField label="法人番号の有無" required error={empErrors?.hasCorporateNumber?.message}>
          <Controller
            name="employerInfo.hasCorporateNumber"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={coeFormOptions.yesNo}
                error={!!empErrors?.hasCorporateNumber}
              />
            )}
          />
        </FormField>

        {hasCorporateNumber === '1' && (
          <FormField label="法人番号" required error={empErrors?.corporateNumber?.message} hint="13桁">
            <FormInput
              {...register('employerInfo.corporateNumber')}
              placeholder="例: 1234567890123"
              maxLength={13}
              error={!!empErrors?.corporateNumber}
            />
          </FormField>
        )}

        <FormField label="雇用保険適用事業所番号" error={empErrors?.employmentInsuranceNumber?.message} hint="11桁">
          <FormInput
            {...register('employerInfo.employmentInsuranceNumber')}
            placeholder="例: 12345678901"
            maxLength={11}
            error={!!empErrors?.employmentInsuranceNumber}
          />
        </FormField>
        
        <FormField label="主たる業種" error={empErrors?.mainIndustry?.message}>
          <Controller
            name="employerInfo.mainIndustry"
            control={control}
            render={({ field }) => (
              <FormSelect
                {...field}
                options={[
                  { label: '製造業', value: '1' },
                  { label: '建設業', value: '2' },
                  { label: '情報通信業', value: '3' },
                  { label: 'その他', value: '4' },
                ]}
                error={!!empErrors?.mainIndustry}
              />
            )}
          />
        </FormField>
        <FormField label="その他の業種" error={empErrors?.mainIndustryOther?.message}>
          <FormInput
            {...register('employerInfo.mainIndustryOther')}
            placeholder="例: 小売業"
            error={!!empErrors?.mainIndustryOther}
          />
        </FormField>
      </div>

      {/* 所在地 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
        <FormField label="所在地 郵便番号" required error={empErrors?.companyZipCode?.message} hint="ハイフンなし7桁">
          <FormInput
            {...register('employerInfo.companyZipCode')}
            placeholder="例: 1000001"
            maxLength={7}
            error={!!empErrors?.companyZipCode}
          />
        </FormField>
        <FormField label="所在地 都道府県" required error={empErrors?.companyPref?.message}>
          <Controller
            name="employerInfo.companyPref"
            control={control}
            render={({ field }) => (
              <FormSelect
                {...field}
                options={coeFormOptions.prefectures}
                error={!!empErrors?.companyPref}
                onChange={(e) => {
                  field.onChange(e);
                  setValue('employerInfo.companyCity', ''); // 都道府県が変わったら市区町村をクリア
                }}
              />
            )}
          />
        </FormField>
        <FormField label="所在地 市区町村" required error={empErrors?.companyCity?.message}>
          <Controller
            name="employerInfo.companyCity"
            control={control}
            render={({ field }) => (
              <FormSelect
                {...field}
                options={selectedPrefecture ? coeFormOptions.getCityOptions(selectedPrefecture) : []}
                error={!!empErrors?.companyCity}
                disabled={!selectedPrefecture}
              />
            )}
          />
        </FormField>
        <FormField label="所在地 町名丁目番地号等" required error={empErrors?.companyAddressLines?.message}>
          <FormInput
            {...register('employerInfo.companyAddressLines')}
            placeholder="例: 千代田1-1-1"
            error={!!empErrors?.companyAddressLines}
          />
        </FormField>
        <FormField label="電話番号" required error={empErrors?.companyPhone?.message} hint="ハイフンなし">
          <FormInput
            {...register('employerInfo.companyPhone')}
            placeholder="例: 0312345678"
            type="tel"
            error={!!empErrors?.companyPhone}
          />
        </FormField>
      </div>

      {/* 規模・区分V情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
        <FormField label="資本金（円）" error={empErrors?.capital?.message}>
          <FormInput
            {...register('employerInfo.capital')}
            placeholder="例: 10000000"
            error={!!empErrors?.capital}
          />
        </FormField>
        <FormField label="年間売上金額（円）" error={empErrors?.annualRevenue?.message}>
          <FormInput
            {...register('employerInfo.annualRevenue')}
            placeholder="例: 50000000"
            error={!!empErrors?.annualRevenue}
          />
        </FormField>
        <FormField label="常勤職員数" required error={empErrors?.employeeCount?.message}>
          <FormInput
            {...register('employerInfo.employeeCount')}
            placeholder="例: 10"
            maxLength={5}
            error={!!empErrors?.employeeCount}
          />
        </FormField>
        <FormField label="うち外国人職員数" error={empErrors?.foreignEmployeeCount?.message}>
          <FormInput
            {...register('employerInfo.foreignEmployeeCount')}
            placeholder="例: 2"
            maxLength={5}
            error={!!empErrors?.foreignEmployeeCount}
          />
        </FormField>
        <FormField label="技能実習生数" error={empErrors?.trainee1Count?.message}>
          <FormInput
            {...register('employerInfo.trainee1Count')}
            placeholder="例: 0"
            maxLength={5}
            error={!!empErrors?.trainee1Count}
          />
        </FormField>
        <FormField label="主たる職種" error={empErrors?.mainOccupation?.message}>
          <Controller
            name="employerInfo.mainOccupation"
            control={control}
            render={({ field }) => (
              <FormSelect
                {...field}
                options={coeFormOptions.mainOccupation}
                error={!!empErrors?.mainOccupation}
              />
            )}
          />
        </FormField>
        <FormField label="役職の有無" error={empErrors?.hasPosition?.message}>
          <Controller
            name="employerInfo.hasPosition"
            control={control}
            render={({ field }) => (
              <FormSelect
                {...field}
                options={coeFormOptions.yesNo}
                error={!!empErrors?.hasPosition}
              />
            )}
          />
        </FormField>
        <FormField label="役職名" error={empErrors?.positionTitle?.message}>
          <FormInput
            {...register('employerInfo.positionTitle')}
            placeholder="例: 部長"
            maxLength={60}
            error={!!empErrors?.positionTitle}
          />
        </FormField>
        <FormField label="月額報酬（円）" error={empErrors?.monthlySalary?.message}>
          <FormInput
            {...register('employerInfo.monthlySalary')}
            placeholder="例: 200000"
            error={!!empErrors?.monthlySalary}
          />
        </FormField>
      </div>
    </div>
  );
}
