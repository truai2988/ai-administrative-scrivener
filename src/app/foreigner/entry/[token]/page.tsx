import React from 'react';
import { ForeignerEntryForm } from '@/components/foreigner/ForeignerEntryForm';

export default async function ForeignerEntryPage(
  { params, searchParams }: { params: Promise<{ token: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { token } = await params;
  const sp = await searchParams;
  const unionId = typeof sp.u === 'string' ? sp.u : undefined;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm border-x border-slate-100">
        <ForeignerEntryForm token={token} unionId={unionId} />
      </div>
    </main>
  );
}
