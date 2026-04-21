'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../../renewal/renewal-form.css';
import { ChangeOfStatusForm } from '@/components/forms/change-of-status/ChangeOfStatusForm';

export default function NewChangeOfStatusApplicationPage() {
  const router = useRouter();

  return (
    <div className="renewal-page max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
      <ChangeOfStatusForm 
        onSubmit={() => {
          // 保存後のリダイレクトや遷移処理があればここに記述する
          router.push('/dashboard');
        }}
      />
    </div>
  );
}
