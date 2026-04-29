'use client';

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormRadioGroup } from '../../ui/FormRadio';

export function SupportPlanSubForm() {
  const { register, control, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const empError = errors.employerInfo;
  
  // 登録支援機関へ「全部委託」するかどうかで段階的開示
  const delegateSupportEntirely = useWatch({
    control,
    name: 'employerInfo.delegateSupportEntirely'
  });

  return (
    <div className="subsection">
      <div className="border-b border-slate-50 pb-2">
        <h3 className="subsection-title">1号特定技能外国人支援計画等</h3>
      </div>

      <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700/50">
        <FormField label="登録支援機関への支援の全部委託の有無" required error={empError?.delegateSupportEntirely?.message}>
          <Controller
            name="employerInfo.delegateSupportEntirely"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="employerInfo.delegateSupportEntirely"
                options={[
                  { value: 'true', label: '全部委託する' },
                  { value: 'false', label: '自社で支援する（一部委託含む）' },
                ]}
                value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                error={!!empError?.delegateSupportEntirely}
              />
            )}
          />
        </FormField>
      </div>

      {delegateSupportEntirely === true ? (
        // 全部委託する場合：登録支援機関の情報を表示
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
          <h4 className="cert-block-label">登録支援機関に関する情報</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField label="氏名又は名称" required error={empError?.supportAgency?.name?.message} className="md:col-span-2">
              <FormInput {...register('employerInfo.supportAgency.name')} placeholder="例: 一般社団法人〇〇支援機構" />
            </FormField>
            
            <FormField label="登録番号" required error={empError?.supportAgency?.registrationNumber?.message}>
              <FormInput {...register('employerInfo.supportAgency.registrationNumber')} placeholder="例: 19登-123456" />
            </FormField>

            <FormField label="支援委託手数料（月額/人）" error={empError?.supportAgency?.supportFeeMonthly?.message}>
              <FormInput type="number" {...register('employerInfo.supportAgency.supportFeeMonthly', { valueAsNumber: true })} placeholder="例: 25000" />
            </FormField>

            <FormField label="支援責任者名" required error={empError?.supportAgency?.supportSupervisorName?.message}>
              <FormInput {...register('employerInfo.supportAgency.supportSupervisorName')} placeholder="例: 佐藤 支援" />
            </FormField>
            
            <FormField label="対応可能言語" required error={empError?.supportAgency?.supportLanguages?.message}>
              <FormInput {...register('employerInfo.supportAgency.supportLanguages')} placeholder="例: ベトナム語、英語" />
            </FormField>
          </div>
        </div>
      ) : delegateSupportEntirely === false ? (
        // 自社で支援する場合：支援責任者・担当者の情報を表示
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
          <h4 className="cert-block-label">自社支援における体制確認（受入れ機関内部）</h4>
          
          <div className="bg-[rgba(15,23,42,0.4)] p-4 border border-white/10 rounded-lg space-y-4">
            <h6 className="text-sm font-medium text-slate-300">支援責任者</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="氏名" required error={empError?.supportPersonnel?.supervisorName?.message}>
                <FormInput {...register('employerInfo.supportPersonnel.supervisorName')} placeholder="例: 山田 責任" />
              </FormField>
              <FormField label="所属・役職" required error={empError?.supportPersonnel?.supervisorTitle?.message}>
                <FormInput {...register('employerInfo.supportPersonnel.supervisorTitle')} placeholder="例: 人事部長" />
              </FormField>
            </div>
          </div>

          <div className="bg-[rgba(15,23,42,0.4)] p-4 border border-white/10 rounded-lg space-y-4">
            <h6 className="text-sm font-medium text-slate-300">支援担当者</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="氏名" required error={empError?.supportPersonnel?.officerName?.message}>
                <FormInput {...register('employerInfo.supportPersonnel.officerName')} placeholder="例: 鈴木 担当" />
              </FormField>
              <FormField label="所属・役職" required error={empError?.supportPersonnel?.officerTitle?.message}>
                <FormInput {...register('employerInfo.supportPersonnel.officerTitle')} placeholder="例: 総務部 課長" />
              </FormField>
            </div>
          </div>
          
          {/* 具体的な支援内容 (1)〜(10)等の簡易チェック(UIの一部) */}
          <div className="pt-4 border-t border-slate-100">
            <FormField label="外国語による相談・苦情対応体制の有無" required error={empError?.hasForeignLanguageSupportCapability?.message}>
              <Controller
                name="employerInfo.hasForeignLanguageSupportCapability"
                control={control}
                render={({ field }) => (
                  <FormRadioGroup
                    name="employerInfo.hasForeignLanguageSupportCapability"
                    options={[
                      { value: 'true', label: '体制あり' },
                      { value: 'false', label: '体制なし' },
                    ]}
                    value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                    onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                    error={!!empError?.hasForeignLanguageSupportCapability}
                  />
                )}
              />
            </FormField>
          </div>
        </div>
      ) : null}
    </div>
  );
}
