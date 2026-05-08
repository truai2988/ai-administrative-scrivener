import React from 'react';
import { FormRendererWrapper } from '@/components/forms/FormRendererWrapper';

export default async function GeneratedFormPage({ params }: { params: Promise<{ englishId: string }> }) {
  const resolvedParams = await params;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <FormRendererWrapper englishId={resolvedParams.englishId} />
    </div>
  );
}
