'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import '../../renewal/renewal-form.css';
import { CoeApplicationForm } from '@/components/forms/coe/CoeApplicationForm';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function CoeFormWrapper() {
  const searchParams = useSearchParams();
  const foreignerId = searchParams.get('foreignerId') || undefined;
  return <CoeApplicationForm foreignerId={foreignerId} />;
}

export default function NewCoeApplicationPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <main className="renewal-page" style={{ alignItems: 'center' }}>
        <div className="flex flex-col items-center gap-2 text-slate-400 mt-20">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="renewal-page">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin mx-auto mt-20 text-indigo-500" />}>
        <CoeFormWrapper />
      </Suspense>
    </main>
  );
}
