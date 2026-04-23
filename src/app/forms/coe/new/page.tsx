'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../renewal/renewal-form.css';
import { CoeApplicationForm } from '@/components/forms/coe/CoeApplicationForm';
import { ArrowLeft } from 'lucide-react';

export default function NewCoeApplicationPage() {
  const router = useRouter();

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
