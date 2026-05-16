'use client';

/**
 * RenewalFormLoader.tsx
 * 更新申請フォームの「ローダー」コンポーネント
 *
 * 責務: データ取得フックの結果に基づき UI を描き分けるのみ。
 *   - loading → スケルトン表示
 *   - error   → エラー表示
 *   - ready   → RenewalApplicationForm に初期値を渡して表示
 *
 * ビジネスロジックは useRenewalFormData フックに委譲している。
 */

import React from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { RenewalApplicationForm } from './RenewalApplicationForm';
import { useRenewalFormData } from '@/hooks/useRenewalFormData';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';

interface RenewalFormLoaderProps {
  /** 外国人一覧の Foreigner.id（Firestore foreigners コレクションのキー） */
  foreignerId: string;
}

// ─── スケルトンUI ──────────────────────────────────────────────────────────────
function FormSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="spin text-indigo-400" />
        <span className="text-sm font-medium text-slate-400">申請データを読み込み中...</span>
      </div>
    </div>
  );
}

// ─── エラーUI ─────────────────────────────────────────────────────────────────
function FormError({ message, foreignerId }: { message: string; foreignerId: string }) {
  return (
    <div className="renewal-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={28} style={{ color: '#ef4444' }} />
        </div>
        <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
          データの読み込みに失敗しました
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>{message}</p>
        <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>ID: {foreignerId}</p>
      </div>
      <Link
        href="/forms/renewal/new"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.5rem 1.25rem', background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: 8,
          color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
        }}
      >
        <FileText size={14} />
        新規フォームを開く
      </Link>
    </div>
  );
}

// ─── メインローダーコンポーネント ─────────────────────────────────────────────
export function RenewalFormLoader({ foreignerId }: RenewalFormLoaderProps) {
  const state = useRenewalFormData(foreignerId);

  if (state.phase === 'loading') {
    return <FormSkeleton />;
  }

  if (state.phase === 'error') {
    return <FormError message={state.message} foreignerId={foreignerId} />;
  }

  const { record } = state;
  const initialValues = record?.formData as RenewalApplicationFormData | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialAiDiagnostics = (record as any)?.aiDiagnostics?.diagnostics as import('@/types/aiDiagnostics').DiagnosticItem[] | undefined;

  return (
    <RenewalApplicationForm
      recordId={record?.id}
      foreignerId={foreignerId}
      initialValues={initialValues}
      initialAiDiagnostics={initialAiDiagnostics}
    />
  );
}
