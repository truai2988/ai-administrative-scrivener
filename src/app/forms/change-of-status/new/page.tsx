'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../renewal/renewal-form.css';
import { ChangeOfStatusForm } from '@/components/forms/change-of-status/ChangeOfStatusForm';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function NewChangeOfStatusApplicationPage() {
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
      <ChangeOfStatusForm 
        onSubmit={() => {
          // 保存後のリダイレクトや遷移処理があればここに記述する
          router.push('/dashboard');
        }}
      />
    </main>
  );
}
