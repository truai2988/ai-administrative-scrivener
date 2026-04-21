'use client';

import React from 'react';
import { useFormContext, Controller, useWatch, Path } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormRadioGroup } from '../../ui/FormRadio';

export function ComplianceOathsSubForm() {
  const { register, control, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const oathsError = errors.employerInfo?.complianceOaths;

  // 欠格事由チェック用コンポーネント
  const DisqualificationItem = ({ 
    name, 
    label, 
    error 
  }: { 
    name: string; 
    label: string; 
    error?: { applies?: { message?: string }, detail?: { message?: string } };
  }) => {
    const applies = useWatch({ control, name: `${name}.applies` as Path<ChangeOfStatusApplicationFormData> });
    
    return (
      <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100/50 transition-colors">
        <FormField label={label} required error={error?.applies?.message}>
          <Controller
            name={`${name}.applies` as Path<ChangeOfStatusApplicationFormData>}
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name={`${name}.applies`}
                options={[
                  { value: 'true', label: '該当する（有）' },
                  { value: 'false', label: '該当しない（無）' },
                ]}
                value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
                onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
                error={!!error?.applies}
              />
            )}
          />
        </FormField>
        
        {/* レスポンスに応じて段階的開示 */}
        {applies === true && (
          <div className="mt-4 pt-4 border-t border-red-200 animate-in fade-in slide-in-from-top-1">
            <FormField label="該当する内容の詳細" error={error?.detail?.message}>
              <FormInput
                {...register(`${name}.detail` as Path<ChangeOfStatusApplicationFormData>)}
                placeholder="内容を具体的に記載してください"
                error={!!error?.detail}
                className="bg-white border-red-300 focus:ring-red-500"
              />
            </FormField>
            <p className="text-xs text-red-500 mt-2 font-medium">※該当する場合、審査に重大な影響を及ぼす可能性があります。</p>
          </div>
        )}
      </div>
    );
  };

  // 単純な誓約・確認(boolean)コンポーネント
  const OathItem = ({ name, label, error }: { name: string, label: string, error?: { message?: string } }) => (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between gap-4">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="shrink-0">
        <Controller
          name={name as Path<ChangeOfStatusApplicationFormData>}
          control={control}
          render={({ field }) => (
            <FormRadioGroup
              name={name}
              options={[
                { value: 'true', label: 'はい' },
                { value: 'false', label: 'いいえ' },
              ]}
              value={field.value === true ? 'true' : field.value === false ? 'false' : ''}
              onChange={(v) => field.onChange(v === 'true' ? true : v === 'false' ? false : undefined)}
              error={!!error}
            />
          )}
        />
      </div>
    </div>
  );

  return (
    <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
      <div className="border-b border-slate-50 pb-2">
        <h4 className="text-md font-semibold text-slate-800">④ 特定技能所属機関の欠格事由・誓約等</h4>
        <p className="text-xs text-slate-500 mt-1">該当する場合は詳細を記載してください。</p>
      </div>
      
      {/* 欠格事由グループ (Gridを用いたスッキリとしたレイアウト) */}
      <h5 className="text-sm font-semibold text-slate-700 mt-6 border-l-4 border-slate-400 pl-2">欠格事由の確認</h5>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DisqualificationItem name="employerInfo.complianceOaths.hadLaborLawPenalty" label="(11) 労働・社会保険・租税法令違反による罰則等" error={oathsError?.hadLaborLawPenalty} />
        <DisqualificationItem name="employerInfo.complianceOaths.hadInvoluntaryDismissal" label="(12) 非自発的離職者の発生" error={oathsError?.hadInvoluntaryDismissal} />
        <DisqualificationItem name="employerInfo.complianceOaths.hadMissingPersons" label="(13) 行方不明者の発生" error={oathsError?.hadMissingPersons} />
        <DisqualificationItem name="employerInfo.complianceOaths.hadCriminalPenalty" label="(14) 禁錮以上の刑等の処分" error={oathsError?.hadCriminalPenalty} />
        <DisqualificationItem name="employerInfo.complianceOaths.hasMentalImpairment" label="(15) 精神の機能の障害" error={oathsError?.hasMentalImpairment} />
        <DisqualificationItem name="employerInfo.complianceOaths.hasBankruptcy" label="(16) 破産手続開始の決定" error={oathsError?.hasBankruptcy} />
        <DisqualificationItem name="employerInfo.complianceOaths.hadTechnicalInternRevocation" label="(17) 技能実習の認定の取消し" error={oathsError?.hadTechnicalInternRevocation} />
        <DisqualificationItem name="employerInfo.complianceOaths.wasOfficerOfRevokedEntity" label="(18) 認定取消し法人の役員であった" error={oathsError?.wasOfficerOfRevokedEntity} />
      </div>

      <h5 className="text-sm font-semibold text-slate-700 mt-8 border-l-4 border-slate-400 pl-2">法令遵守・体制に関する誓約</h5>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OathItem name="employerInfo.complianceOaths.keepsActivityRecords" label="(23) 書類（活動内容等）の1年以上の保存・保管体制の有無" error={oathsError?.keepsActivityRecords} />
        <OathItem name="employerInfo.complianceOaths.allowsTemporaryReturn" label="(7) 一時帰国を希望した場合に有給休暇を取得させる体制" error={oathsError?.allowsTemporaryReturn} />
        <OathItem name="employerInfo.complianceOaths.meetsEmploymentStandards" label="(8) 雇用契約が基準に適合していること" error={oathsError?.meetsEmploymentStandards} />
        <OathItem name="employerInfo.complianceOaths.coversReturnTravelCost" label="(9) 帰国旅費を負担できない場合の負担措置" error={oathsError?.coversReturnTravelCost} />
        <OathItem name="employerInfo.complianceOaths.monitorsHealthAndLife" label="(10) 健康状況等その他の生活の状況を把握する体制" error={oathsError?.monitorsHealthAndLife} />
        <OathItem name="employerInfo.complianceOaths.hasContractContinuationSystem" label="(30) 継続して雇用契約を履行する体制の有無" error={oathsError?.hasContractContinuationSystem} />
        <OathItem name="employerInfo.complianceOaths.paysWageByTransfer" label="(31) 報酬を預貯金口座への振込等により適正に支払うこと" error={oathsError?.paysWageByTransfer} />
      </div>
    </section>
  );
}
