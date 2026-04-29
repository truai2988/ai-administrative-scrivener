'use client';

import React from 'react';
import { CompanyProfileSubForm } from './CompanyProfileSubForm';
import { EmploymentContractSubForm } from './EmploymentContractSubForm';
import { DispatchPlacementSubForm } from './DispatchPlacementSubForm';
import { ComplianceOathsSubForm } from './ComplianceOathsSubForm';
import { SupportPlanSubForm } from './SupportPlanSubForm';
import { SpecificIndustrySubForm } from './SpecificIndustrySubForm';

import { useFormContext } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';

export function EmployerInfoTab() {
  const { watch } = useFormContext<ChangeOfStatusApplicationFormData>();
  const desiredStatus = watch('foreignerInfo.desiredResidenceStatus');
  const isSpecificSkill = desiredStatus?.includes('特定技能');
  const isSpecificSkill1 = desiredStatus?.includes('特定技能１号');

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">


      <CompanyProfileSubForm />
      <EmploymentContractSubForm />
      {isSpecificSkill && <SpecificIndustrySubForm />}
      <DispatchPlacementSubForm />
      <ComplianceOathsSubForm />
      {isSpecificSkill1 && <SupportPlanSubForm />}
    </div>
  );
}
