'use client';

import React from 'react';
import { CompanyBasicFields } from './employer/CompanyBasicFields';
import { CohabitingFamilyFields } from './employer/CohabitingFamilyFields';

export function EmployerInfoSubForm() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="subsection">
        <h3 className="subsection-title">所属機関等（雇用主）の基本情報</h3>
        <CompanyBasicFields />
      </div>

      <div className="subsection">
        <h3 className="subsection-title">雇用主の同居家族</h3>
        <CohabitingFamilyFields />
      </div>
    </div>
  );
}
