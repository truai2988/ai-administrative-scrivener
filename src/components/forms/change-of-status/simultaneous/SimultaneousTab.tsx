'use client';

import React from 'react';
import { ReEntryPermitSubForm } from './ReEntryPermitSubForm';
import { ActivityOutsideStatusSubForm } from './ActivityOutsideStatusSubForm';
import { AuthEmploymentCertSubForm } from './AuthEmploymentCertSubForm';

export function SimultaneousTab() {

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">


      <ReEntryPermitSubForm />
      <ActivityOutsideStatusSubForm />
      <AuthEmploymentCertSubForm />
    </div>
  );
}
