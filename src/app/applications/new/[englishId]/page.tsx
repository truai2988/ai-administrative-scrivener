import React from 'react';
import { FormRendererWrapper } from '@/components/forms/FormRendererWrapper';
import '@/app/forms/renewal/renewal-form.css';

export default async function GeneratedFormPage({ params }: { params: Promise<{ englishId: string }> }) {
  const resolvedParams = await params;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <FormRendererWrapper englishId={resolvedParams.englishId} />
    </div>
  );
}
