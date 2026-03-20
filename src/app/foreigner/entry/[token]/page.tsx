import React from 'react';
import { ForeignerEntryForm } from '@/components/foreigner/ForeignerEntryForm';

export default async function ForeignerEntryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm border-x border-slate-100">
        <ForeignerEntryForm token={token} />
      </div>
    </main>
  );
}
