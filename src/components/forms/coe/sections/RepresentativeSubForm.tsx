'use client';

import React from 'react';
import { LegalRepresentativeFields } from './representative/LegalRepresentativeFields';
import { AgencyRepFields } from './representative/AgencyRepFields';

export function RepresentativeSubForm() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="subsection">
        <h3 className="subsection-title">法定代理人（申請人が16歳未満の場合等）</h3>
        <LegalRepresentativeFields />
      </div>

      <div className="subsection">
        <h3 className="subsection-title">取次者（行政書士等）</h3>
        <AgencyRepFields />
      </div>
    </div>
  );
}
