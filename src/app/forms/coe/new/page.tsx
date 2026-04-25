'use client';

import React from 'react';
import '../../renewal/renewal-form.css';
import { CoeApplicationForm } from '@/components/forms/coe/CoeApplicationForm';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function NewCoeApplicationPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <main className="renewal-page" style={{ alignItems: 'center' }}>
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="renewal-page">
      <CoeApplicationForm />
    </main>
  );
}
