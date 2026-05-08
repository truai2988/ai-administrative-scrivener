import React from 'react';
import { TemplateSelectionClient } from '@/components/forms/TemplateSelectionClient';

export default async function TemplateSelectionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const foreignerId = typeof resolvedParams.foreignerId === 'string' ? resolvedParams.foreignerId : undefined;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <main className="w-full max-w-5xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
          新規書類作成
        </h1>
        <p className="text-slate-500 font-medium mb-8">
          作成する申請書類のテンプレートを選択してください。
        </p>
        <TemplateSelectionClient foreignerId={foreignerId} />
      </main>
    </div>
  );
}
