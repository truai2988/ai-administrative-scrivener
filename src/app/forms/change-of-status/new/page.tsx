'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import '../../renewal/renewal-form.css';
import { ChangeOfStatusForm } from '@/components/forms/change-of-status/ChangeOfStatusForm';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function ChangeOfStatusFormWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const foreignerId = searchParams.get('foreignerId') || undefined;

  return (
    <ChangeOfStatusForm 
      foreignerId={foreignerId}
      onSubmit={() => {
        // 保存後のリダイレクトや遷移処理があればここに記述する
        router.push('/dashboard');
      }}
    />
  );
}

export default function NewChangeOfStatusApplicationPage() {
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
        <ChangeOfStatusFormWrapper />
      </Suspense>
    </main>
  );
}
