'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormRadioGroup } from '../../ui/FormRadio';

export function BasicInfoSubForm() {
  const { register, control, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const infoError = errors.foreignerInfo;

  return (
    <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
      <h4 className="text-md font-semibold text-slate-800 border-b border-slate-50 pb-2">① 基本属性</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="国籍・地域" required error={infoError?.nationality?.message}>
          <FormInput
            {...register('foreignerInfo.nationality')}
            placeholder="例: 中国"
            error={!!infoError?.nationality}
          />
        </FormField>

        <FormField label="生年月日" required error={infoError?.birthDate?.message}>
          <FormInput
            type="date"
            {...register('foreignerInfo.birthDate')}
            error={!!infoError?.birthDate}
          />
        </FormField>

        <FormField label="性別" required error={infoError?.gender?.message}>
          <Controller
            name="foreignerInfo.gender"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="foreignerInfo.gender"
                options={[
                  { value: 'male', label: '男' },
                  { value: 'female', label: '女' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={!!infoError?.gender}
              />
            )}
          />
        </FormField>

        <FormField
          label="氏名（ローマ字）"
          required
          hint="例: KOU OTUHEI（姓・名の順）"
          error={infoError?.nameEn?.message}
        >
          <FormInput
            {...register('foreignerInfo.nameEn')}
            placeholder="例: KOU OTUHEI"
            error={!!infoError?.nameEn}
          />
        </FormField>

        <FormField
          label="氏名（漢字など母国語）"
          hint="母国語での氏名（任意）"
          error={infoError?.nameKanji?.message}
        >
          <FormInput
            {...register('foreignerInfo.nameKanji')}
            placeholder="例: 甲 乙丙"
            error={!!infoError?.nameKanji}
          />
        </FormField>

        <FormField label="出生地" required error={infoError?.birthPlace?.message}>
          <FormInput
            {...register('foreignerInfo.birthPlace')}
            placeholder="例: 〇〇省〇〇市"
            error={!!infoError?.birthPlace}
          />
        </FormField>

        <FormField label="配偶者の有無" required error={infoError?.maritalStatus?.message}>
          <Controller
            name="foreignerInfo.maritalStatus"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="foreignerInfo.maritalStatus"
                options={[
                  { value: 'married', label: '有' },
                  { value: 'unmarried', label: '無' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={!!infoError?.maritalStatus}
              />
            )}
          />
        </FormField>

        <FormField label="職業" required error={infoError?.occupation?.message}>
          <FormInput
            {...register('foreignerInfo.occupation')}
            placeholder="例: 会社員"
            error={!!infoError?.occupation}
          />
        </FormField>
      </div>
    </section>
  );
}
