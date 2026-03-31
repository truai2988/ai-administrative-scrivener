'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { RenewalApplicationForm } from './RenewalApplicationForm';
import { renewalApplicationService, type RenewalApplicationRecord } from '@/services/renewalApplicationService';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import type { TabAssignments } from '@/lib/schemas/renewalApplicationSchema';
import { useAuth } from '@/contexts/AuthContext';

interface RenewalFormLoaderProps {
  /** 外国人一覧の Foreigner.id（Firestore foreigners コレクションのキー） */
  foreignerId: string;
}

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; record: RenewalApplicationRecord | null }
  | { phase: 'error'; message: string };

// ─── スケルトンUI ──────────────────────────────────────────────────────────────
function FormSkeleton() {
  return (
    <div className="renewal-form skeleton-form" aria-busy="true" aria-label="データ読み込み中">
      {/* ヘッダー */}
      <div className="form-header">
        <div className="skeleton-block" style={{ width: 120, height: 20, borderRadius: 6, marginBottom: 12 }} />
        <div className="skeleton-block" style={{ width: 280, height: 32, borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton-block" style={{ width: 200, height: 14, borderRadius: 6 }} />
      </div>

      {/* タブ */}
      <div className="tab-nav" role="tablist" style={{ gap: '0.5rem' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton-block"
            style={{ flex: 1, height: 48, borderRadius: 12 }}
          />
        ))}
      </div>

      {/* フィールドグリッド */}
      <div className="tab-panel">
        <div className="section-container">
          <div className="skeleton-block" style={{ width: 160, height: 22, marginBottom: 24, borderRadius: 6 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton-block" style={{ width: '60%', height: 12, borderRadius: 4, marginBottom: 8 }} />
                <div className="skeleton-block" style={{ width: '100%', height: 40, borderRadius: 8 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ローダーオーバーレイ */}
      <div className="skeleton-loader-badge">
        <Loader2 size={16} className="spin" />
        <span>申請データを読み込み中...</span>
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
      <a
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
      </a>
    </div>
  );
}

// ─── メインローダーコンポーネント ─────────────────────────────────────────────
export function RenewalFormLoader({ foreignerId }: RenewalFormLoaderProps) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 認証ロード中は待機
    if (authLoading) return;

    // 未ログイン → ログインページへ
    if (!currentUser) {
      router.push('/login');
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        const record = await renewalApplicationService.getByForeignerId(foreignerId);
        if (!cancelled) {
          setState({ phase: 'ready', record });
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '不明なエラーが発生しました';
          setState({ phase: 'error', message: msg });
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [foreignerId, currentUser, authLoading, router]);

  if (state.phase === 'loading') {
    return <FormSkeleton />;
  }

  if (state.phase === 'error') {
    return <FormError message={state.message} foreignerId={foreignerId} />;
  }

  // データあり → 既存値を渡して編集モード
  // データなし → 空フォームで新規作成（foreignerId は保存時に紐付け）
  const record = state.record;
  const initialValues = record?.formData as RenewalApplicationFormData | undefined;
  const initialAssignments = record?.formData?.assignments as TabAssignments | undefined;

  return (
    <RenewalApplicationForm
      recordId={record?.id}
      foreignerId={foreignerId}
      initialValues={initialValues}
      initialAssignments={initialAssignments}
    />
  );
}
