'use client';

import React from 'react';
import { BasicInfoSubForm } from './BasicInfoSubForm';
import { AddressContactSubForm } from './AddressContactSubForm';
import { PassportStatusSubForm } from './PassportStatusSubForm';
import { ChangeRequestSubForm } from './ChangeRequestSubForm';
import { SpecificSkillCertSubForm } from './SpecificSkillCertSubForm';
import { CriminalRecordSubForm } from './CriminalRecordSubForm';
import { RelativesSubForm } from './RelativesSubForm';

import { useFormContext } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';

export function ForeignerInfoTab() {
  const { watch } = useFormContext<ChangeOfStatusApplicationFormData>();
  const desiredStatus = watch('foreignerInfo.desiredResidenceStatus');
  
  const isSpecificSkill = desiredStatus?.includes('特定技能');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="cert-block">
        <h3 className="text-lg font-medium text-slate-800">申請人等作成用（外国人本人情報）</h3>
        <p className="text-sm text-slate-500 mt-1">
          申請書のエクセル「申請人等作成用1〜3」に対応する項目を入力します。
        </p>
      </div>

      <BasicInfoSubForm />
      <AddressContactSubForm />
      <PassportStatusSubForm />
      <ChangeRequestSubForm />
      {isSpecificSkill && <SpecificSkillCertSubForm />}
      <CriminalRecordSubForm />
      <RelativesSubForm />
    </div>
  );
}
