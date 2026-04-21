'use client';

import React from 'react';
import { CompanyProfileSubForm } from './CompanyProfileSubForm';
import { EmploymentContractSubForm } from './EmploymentContractSubForm';
import { DispatchPlacementSubForm } from './DispatchPlacementSubForm';
import { ComplianceOathsSubForm } from './ComplianceOathsSubForm';
import { SupportPlanSubForm } from './SupportPlanSubForm';

export function EmployerInfoTab() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="cert-block">
        <h3 className="text-lg font-medium text-slate-800">所属機関等作成用（特定技能）</h3>
        <p className="text-sm text-slate-500 mt-1">
          所属機関の基本情報、雇用契約、欠格事由の確認、および1号特定技能外国人支援計画等を入力します。
        </p>
      </div>

      <CompanyProfileSubForm />
      <EmploymentContractSubForm />
      <DispatchPlacementSubForm />
      <ComplianceOathsSubForm />
      <SupportPlanSubForm />
    </div>
  );
}
