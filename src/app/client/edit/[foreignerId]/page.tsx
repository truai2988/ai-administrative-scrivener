import React from 'react';
import { ClientEditForm } from '@/components/client/ClientEditForm';

export default async function ClientEditPage({ params }: { params: Promise<{ foreignerId: string }> }) {
  const { foreignerId } = await params;

  return (
    <main className="min-h-screen bg-slate-50">
      <ClientEditForm foreignerId={foreignerId} />
    </main>
  );
}
