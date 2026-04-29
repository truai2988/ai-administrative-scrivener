'use client';

import React from 'react';
import { AcademicBackgroundFields } from './applicant/AcademicBackgroundFields';
import { JobHistoryFields } from './applicant/JobHistoryFields';
import { CertificationFields } from './applicant/CertificationFields';

export function ApplicantSpecificInfoSubForm() {
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="subsection">
        <h3 className="subsection-title">修学歴</h3>
        <AcademicBackgroundFields />
      </div>

      <div className="subsection">
        <h3 className="subsection-title">職歴</h3>
        <JobHistoryFields />
      </div>

      <div className="subsection">
        <h3 className="subsection-title">資格・証明</h3>
        <CertificationFields />
      </div>
    </div>
  );
}
