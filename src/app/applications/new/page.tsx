import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          ダッシュボードに戻る
        </Link>

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
