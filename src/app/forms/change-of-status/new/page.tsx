'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../renewal/renewal-form.css';
import { ChangeOfStatusForm } from '@/components/forms/change-of-status/ChangeOfStatusForm';

export default function NewChangeOfStatusApplicationPage() {
  const router = useRouter();

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
