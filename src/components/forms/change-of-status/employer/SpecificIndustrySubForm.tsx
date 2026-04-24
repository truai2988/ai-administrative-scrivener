/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormSelect } from '../../ui/FormSelect';
import { changeFormOptions, getSpecifiedSkilledSubOptions } from '@/lib/constants/changeFormOptions';

export function SpecificIndustrySubForm() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const empError = errors.employerInfo;

  // Primitive array handling without useFieldArray
  const [industryCount, setIndustryCount] = useState(1);
  const [otherJobCount, setOtherJobCount] = useState(1);

  // Watch industry fields to trigger cascade updates
  const ind0 = watch('employerInfo.industryFields.0');
  const ind1 = watch('employerInfo.industryFields.1');
  const ind2 = watch('employerInfo.industryFields.2');
  
  const jc0 = watch('employerInfo.jobCategories.0');
  const jc1 = watch('employerInfo.jobCategories.1');
  const jc2 = watch('employerInfo.jobCategories.2');

  const jcOptions0 = getSpecifiedSkilledSubOptions(ind0);
  const jcOptions1 = getSpecifiedSkilledSubOptions(ind1);
  const jcOptions2 = getSpecifiedSkilledSubOptions(ind2);

  // Cascade reset logic
  useEffect(() => {
    if (ind0 && jcOptions0.length > 0 && jc0) {
      if (!jcOptions0.some(opt => opt.value === jc0)) {
        setValue('employerInfo.jobCategories.0', '');
      }
    }
  }, [ind0, jcOptions0, jc0, setValue]);

  useEffect(() => {
    if (ind1 && jcOptions1.length > 0 && jc1) {
      if (!jcOptions1.some(opt => opt.value === jc1)) {
        setValue('employerInfo.jobCategories.1', '');
      }
    }
  }, [ind1, jcOptions1, jc1, setValue]);

  useEffect(() => {
    if (ind2 && jcOptions2.length > 0 && jc2) {
      if (!jcOptions2.some(opt => opt.value === jc2)) {
        setValue('employerInfo.jobCategories.2', '');
      }
    }
  }, [ind2, jcOptions2, jc2, setValue]);


  return (
    <div className="subsection mt-8">
      <h3 className="subsection-title">特定産業分野・職種情報 (特定技能)</h3>

      {/* 特定産業分野・業務区分 */}
      <div className="mb-6 border p-4 rounded-md bg-slate-50 dark:bg-slate-800/50">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">特定産業分野と業務区分 (最大3組)</h4>
          <button
            type="button"
            onClick={() => setIndustryCount(prev => Math.min(prev + 1, 3))}
            disabled={industryCount >= 3}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-400 text-white px-2 py-1 rounded"
          >
            + 追加
          </button>
        </div>

        {[...Array(industryCount)].map((_, i) => {
          const isPrimary = i === 0;
          const options = i === 0 ? jcOptions0 : i === 1 ? jcOptions1 : jcOptions2;
          const indVal = i === 0 ? ind0 : i === 1 ? ind1 : ind2;

          return (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b last:border-b-0 last:pb-0 relative">
              <FormField label={isPrimary ? "特定産業分野 (主)" : "特定産業分野 (従)"} error={empError?.industryFields?.[i]?.message}>
                <FormSelect
                  {...register(`employerInfo.industryFields.${i}` as const)}
                  options={changeFormOptions.specifiedSkilledField}
                  error={!!empError?.industryFields?.[i]}
                />
              </FormField>
              <div className="flex gap-2">
                <FormField label="業務区分" className="flex-1" error={empError?.jobCategories?.[i]?.message}>
                  <FormSelect
                    {...register(`employerInfo.jobCategories.${i}` as const)}
                    options={options}
                    disabled={!indVal || options.length === 0}
                    error={!!empError?.jobCategories?.[i]}
                  />
                </FormField>
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue(`employerInfo.industryFields.${i}`, undefined as any);
                      setValue(`employerInfo.jobCategories.${i}`, undefined as any);
                      setIndustryCount(prev => prev - 1);
                    }}
                    className="mt-6 text-red-500 hover:text-red-700 p-2 h-fit"
                    title="削除"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 職種 */}
      <div className="mb-6 border p-4 rounded-md bg-slate-50 dark:bg-slate-800/50">
        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-4">職種</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField label="主たる職種" required error={empError?.mainJobType?.message}>
            <FormInput
              {...register('employerInfo.mainJobType')}
              placeholder="例: 加工"
              error={!!empError?.mainJobType}
            />
          </FormField>
        </div>

        <div className="mt-4 flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">従たる職種 (最大3件)</label>
          <button
            type="button"
            onClick={() => setOtherJobCount(prev => Math.min(prev + 1, 3))}
            disabled={otherJobCount >= 3}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-400 text-white px-2 py-1 rounded"
          >
            + 追加
          </button>
        </div>

        {[...Array(otherJobCount)].map((_, i) => (
          <div key={`otherJob_${i}`} className="flex gap-2 mb-2">
            <FormField label="" className="flex-1" error={empError?.otherJobTypes?.[i]?.message}>
              <FormInput
                {...register(`employerInfo.otherJobTypes.${i}` as const)}
                placeholder="その他の職種"
                error={!!empError?.otherJobTypes?.[i]}
              />
            </FormField>
            {i > 0 && (
              <button
                type="button"
                onClick={() => {
                  setValue(`employerInfo.otherJobTypes.${i}`, undefined as any);
                  setOtherJobCount(prev => prev - 1);
                }}
                className="text-red-500 hover:text-red-700 p-2"
                title="削除"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
