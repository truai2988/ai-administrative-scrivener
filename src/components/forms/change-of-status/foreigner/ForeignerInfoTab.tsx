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
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">


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
