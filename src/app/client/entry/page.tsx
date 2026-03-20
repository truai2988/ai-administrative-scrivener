import React from 'react';
import { ClientEntryForm } from '@/components/client/ClientEntryForm';

export const metadata = {
  title: '申請情報入力 | AI行政書士支援システム',
  description: '支援機関・本人向けの申請情報入力フォームです。',
};

export default function ClientEntryPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <ClientEntryForm />
    </main>
  );
}
