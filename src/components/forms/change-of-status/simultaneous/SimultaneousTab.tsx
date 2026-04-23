'use client';

import React from 'react';
import { ReEntryPermitSubForm } from './ReEntryPermitSubForm';
import { ActivityOutsideStatusSubForm } from './ActivityOutsideStatusSubForm';
import { AuthEmploymentCertSubForm } from './AuthEmploymentCertSubForm';

export function SimultaneousTab() {

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="cert-block">
        <h3 className="text-lg font-medium text-slate-800">同時申請（任意）</h3>
        <p className="text-sm text-slate-500 mt-1">
          在留資格変更許可申請と同時に特別な許可申請を行う場合は、該当する申請情報のスイッチを「同時に申請する」にして入力してください。
        </p>
      </div>

      <ReEntryPermitSubForm />
      <ActivityOutsideStatusSubForm />
      <AuthEmploymentCertSubForm />
    </div>
  );
}
