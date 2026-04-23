'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../renewal/renewal-form.css';
import { CoeApplicationForm } from '@/components/forms/coe/CoeApplicationForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function NewCoeApplicationPage() {
  const router = useRouter();
  const { loading } = useAuth();

  if (loading) {
    return (
      <main className="renewal-page flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="renewal-page">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          戻る
        </button>
      </div>
      <CoeApplicationForm />
    </main>
  );
}
