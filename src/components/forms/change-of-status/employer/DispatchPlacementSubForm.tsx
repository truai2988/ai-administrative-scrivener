'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function DispatchPlacementSubForm() {
  const { register, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const empError = errors.employerInfo;

  // ローカルステートで展開/折畳状態を管理（段階的開示）
  const [showDispatch, setShowDispatch] = useState(false);
  const [showPlacement, setShowPlacement] = useState(false);
  const [showIntermediary, setShowIntermediary] = useState(false);

  // トグル時のハンドラー（閉じた時に値をリセットするかは業務要件によるが、今回はUIの開閉のみとする）
  
  return (
    <div className="subsection">
      <h3 className="subsection-title">③ 派遣先・引受先等の機関（該当する場合のみ）</h3>
      
      {/* 派遣先 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDispatch(!showDispatch)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <span className="font-medium text-sm text-slate-700">（派遣先がある場合）派遣先情報</span>
          {showDispatch ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
        </button>
        {showDispatch && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="氏名又は名称" error={empError?.dispatchDestination?.name?.message}>
                <FormInput {...register('employerInfo.dispatchDestination.name')} placeholder="例: 株式会社派遣先" />
              </FormField>
              <FormField label="代表者の氏名" error={empError?.dispatchDestination?.representativeName?.message}>
                <FormInput {...register('employerInfo.dispatchDestination.representativeName')} placeholder="例: 佐藤 派遣" />
              </FormField>
              <FormField label="法人番号" error={empError?.dispatchDestination?.corporateNumber?.message}>
                <FormInput {...register('employerInfo.dispatchDestination.corporateNumber')} placeholder="例: 1234567890123" />
              </FormField>
              <FormField label="電話番号" error={empError?.dispatchDestination?.phone?.message}>
                <FormInput {...register('employerInfo.dispatchDestination.phone')} placeholder="例: 03-0000-0000" />
              </FormField>
              <FormField label="派遣期間（始期）" error={empError?.dispatchDestination?.periodStart?.message}>
                <FormInput type="date" {...register('employerInfo.dispatchDestination.periodStart')} />
              </FormField>
              <FormField label="派遣期間（終期）" error={empError?.dispatchDestination?.periodEnd?.message}>
                <FormInput type="date" {...register('employerInfo.dispatchDestination.periodEnd')} />
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* 職業紹介事業者 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPlacement(!showPlacement)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <span className="font-medium text-sm text-slate-700">（職業紹介を利用した場合）職業紹介事業者情報</span>
          {showPlacement ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
        </button>
        {showPlacement && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="氏名又は名称" error={empError?.placementAgency?.name?.message}>
                <FormInput {...register('employerInfo.placementAgency.name')} placeholder="例: 株式会社紹介" />
              </FormField>
              <FormField label="法人番号" error={empError?.placementAgency?.corporateNumber?.message}>
                <FormInput {...register('employerInfo.placementAgency.corporateNumber')} placeholder="例: 1234567890123" />
              </FormField>
              <FormField label="許可・届出番号" error={empError?.placementAgency?.licenseNumber?.message}>
                <FormInput {...register('employerInfo.placementAgency.licenseNumber')} placeholder="例: 13-ユ-123456" />
              </FormField>
              <FormField label="電話番号" error={empError?.placementAgency?.phone?.message}>
                <FormInput {...register('employerInfo.placementAgency.phone')} placeholder="例: 03-1111-2222" />
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* 取次機関 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowIntermediary(!showIntermediary)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <span className="font-medium text-sm text-slate-700">（取次機関を利用した場合）外国の取次機関情報</span>
          {showIntermediary ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
        </button>
        {showIntermediary && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="氏名又は名称" error={empError?.intermediaryAgency?.name?.message}>
                <FormInput {...register('employerInfo.intermediaryAgency.name')} placeholder="例: 〇〇 Agency" />
              </FormField>
              <FormField label="国・地域" error={empError?.intermediaryAgency?.country?.message}>
                <FormInput {...register('employerInfo.intermediaryAgency.country')} placeholder="例: 中国" />
              </FormField>
              <FormField label="電話番号" error={empError?.intermediaryAgency?.phone?.message}>
                <FormInput {...register('employerInfo.intermediaryAgency.phone')} placeholder="例: +86-10-xxxx" />
              </FormField>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
