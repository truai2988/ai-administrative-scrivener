'use client';

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormRadioGroup } from '../../ui/FormRadio';

export function ActivityOutsideStatusSubForm() {
  const { register, control, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const simultaneousError = errors.simultaneousApplication;
  
  const applyForActivityOutsideStatus = useWatch({
    control,
    name: 'simultaneousApplication.applyForActivityOutsideStatus'
  });

  return (
    <div className="subsection">
      <div className="subsection-header-row">
        <div>
          <h3 className="subsection-title">資格外活動許可申請</h3>
          <p className="subsection-desc">現在の在留資格で認められた活動以外（アルバイト等）を行う場合に申請します。</p>
        </div>
        
        <div className="w-full md:w-auto">
          <Controller
            name="simultaneousApplication.applyForActivityOutsideStatus"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="simultaneousApplication.applyForActivityOutsideStatus"
                options={[
                  { value: 'true', label: '同時に申請する' },
                  { value: 'false', label: '申請しない' },
                ]}
                value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                error={!!simultaneousError?.applyForActivityOutsideStatus}
              />
            )}
          />
        </div>
      </div>

      {applyForActivityOutsideStatus === true && (
        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <FormField label="現在の在留活動の内容" error={simultaneousError?.activityOutsideStatus?.currentActivityDescription?.message} className="text-xs">
            <FormInput
              {...register('simultaneousApplication.activityOutsideStatus.currentActivityDescription')}
              placeholder="例: 日本語学校での就学、株式会社〇〇での就労など"
              error={!!simultaneousError?.activityOutsideStatus?.currentActivityDescription}
            />
          </FormField>

          <div className="cert-block">
            <h4 className="cert-block-label">他に従事しようとする活動</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField label="職務内容" error={simultaneousError?.activityOutsideStatus?.newActivityJob1?.message} className="md:col-span-2 text-xs">
                <FormInput
                  {...register('simultaneousApplication.activityOutsideStatus.newActivityJob1')}
                  placeholder="例: コンビニエンスストアでのレジ接客業務"
                  error={!!simultaneousError?.activityOutsideStatus?.newActivityJob1}
                />
              </FormField>

              <FormField label="週間稼働時間（見込み）" error={simultaneousError?.activityOutsideStatus?.newActivityWeeklyHours1?.message} className="text-xs">
                <FormInput
                  type="number"
                  {...register('simultaneousApplication.activityOutsideStatus.newActivityWeeklyHours1', { valueAsNumber: true })}
                  placeholder="例: 28"
                  error={!!simultaneousError?.activityOutsideStatus?.newActivityWeeklyHours1}
                />
              </FormField>
              
              <FormField label="報酬の有無" error={simultaneousError?.activityOutsideStatus?.newActivityHasPayment?.message} className="text-xs">
                <Controller
                  name="simultaneousApplication.activityOutsideStatus.newActivityHasPayment"
                  control={control}
                  render={({ field }) => (
                    <FormRadioGroup
                      name="simultaneousApplication.activityOutsideStatus.newActivityHasPayment"
                      options={[
                        { value: 'true', label: '有' },
                        { value: 'false', label: '無' },
                      ]}
                      value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                      onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                      error={!!simultaneousError?.activityOutsideStatus?.newActivityHasPayment}
                    />
                  )}
                />
              </FormField>

              <FormField label="月額報酬（見込み円）" error={simultaneousError?.activityOutsideStatus?.newActivityMonthlySalary?.message} className="text-xs">
                <FormInput
                  type="number"
                  {...register('simultaneousApplication.activityOutsideStatus.newActivityMonthlySalary', { valueAsNumber: true })}
                  placeholder="例: 100000"
                  error={!!simultaneousError?.activityOutsideStatus?.newActivityMonthlySalary}
                />
              </FormField>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <FormField label="雇用契約期間（年）" error={simultaneousError?.activityOutsideStatus?.newActivityContractYears?.message} className="text-xs">
                <FormInput
                  type="number"
                  {...register('simultaneousApplication.activityOutsideStatus.newActivityContractYears', { valueAsNumber: true })}
                  placeholder="例: 1"
                  error={!!simultaneousError?.activityOutsideStatus?.newActivityContractYears}
                />
              </FormField>
              <FormField label="雇用契約期間（月）" error={simultaneousError?.activityOutsideStatus?.newActivityContractMonths?.message} className="text-xs">
                <FormInput
                  type="number"
                  {...register('simultaneousApplication.activityOutsideStatus.newActivityContractMonths', { valueAsNumber: true })}
                  placeholder="例: 0"
                  error={!!simultaneousError?.activityOutsideStatus?.newActivityContractMonths}
                />
              </FormField>
            </div>
          </div>
          
          <div className="cert-block">
            <h4 className="cert-block-label">勤務先（アルバイト先等）</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField label="名称" error={simultaneousError?.activityOutsideStatus?.workplaceName1?.message} className="md:col-span-2 text-xs">
                <FormInput
                  {...register('simultaneousApplication.activityOutsideStatus.workplaceName1')}
                  placeholder="例: 株式会社〇〇"
                  error={!!simultaneousError?.activityOutsideStatus?.workplaceName1}
                />
              </FormField>
              
              <FormField label="業種" error={simultaneousError?.activityOutsideStatus?.workplaceIndustry1?.message} className="text-xs">
                <FormInput
                  {...register('simultaneousApplication.activityOutsideStatus.workplaceIndustry1')}
                  placeholder="例: 小売業"
                  error={!!simultaneousError?.activityOutsideStatus?.workplaceIndustry1}
                />
              </FormField>
              
              <FormField label="郵便番号" error={simultaneousError?.activityOutsideStatus?.workplaceZipCode?.message} className="text-xs">
                <FormInput
                  {...register('simultaneousApplication.activityOutsideStatus.workplaceZipCode')}
                  placeholder="例: 1234567"
                  error={!!simultaneousError?.activityOutsideStatus?.workplaceZipCode}
                />
              </FormField>
              
              <FormField label="都道府県" error={simultaneousError?.activityOutsideStatus?.workplacePrefecture?.message} className="text-xs">
                <FormInput
                  {...register('simultaneousApplication.activityOutsideStatus.workplacePrefecture')}
                  placeholder="例: 東京都"
                  error={!!simultaneousError?.activityOutsideStatus?.workplacePrefecture}
                />
              </FormField>
              
              <FormField label="電話番号" error={simultaneousError?.activityOutsideStatus?.workplacePhone1?.message} className="text-xs">
                <FormInput
                  {...register('simultaneousApplication.activityOutsideStatus.workplacePhone1')}
                  placeholder="例: 0312345678"
                  error={!!simultaneousError?.activityOutsideStatus?.workplacePhone1}
                />
              </FormField>

              <FormField label="市区町村" error={simultaneousError?.activityOutsideStatus?.workplaceCity?.message} className="text-xs">
                <FormInput
                  {...register('simultaneousApplication.activityOutsideStatus.workplaceCity')}
                  placeholder="例: 新宿区"
                  error={!!simultaneousError?.activityOutsideStatus?.workplaceCity}
                />
              </FormField>
              
              <FormField label="番地・建物名" error={simultaneousError?.activityOutsideStatus?.workplaceAddressLines?.message} className="md:col-span-2 text-xs">
                <FormInput
                  {...register('simultaneousApplication.activityOutsideStatus.workplaceAddressLines')}
                  placeholder="例: 〇〇1-2-3"
                  error={!!simultaneousError?.activityOutsideStatus?.workplaceAddressLines}
                />
              </FormField>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
