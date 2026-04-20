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
import type { RenewalApplicationFormData, TabAssignments } from '@/lib/schemas/renewalApplicationSchema';
import { resolveTemplate } from '@/lib/constants/assignmentTemplates';

interface RenewalFormLoaderProps {
  /** 外国人一覧の Foreigner.id（Firestore foreigners コレクションのキー） */
  foreignerId: string;
}

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
  // データ取得・認証ガードはすべてカスタムフックに委譲
  const state = useRenewalFormData(foreignerId);

  if (state.phase === 'loading') {
    return <FormSkeleton />;
  }

  if (state.phase === 'error') {
    return <FormError message={state.message} foreignerId={foreignerId} />;
  }

  const { record, templatesRecord } = state;
  const initialValues = record?.formData as RenewalApplicationFormData | undefined;

  // ─── 担当者割り当ての初期値を決定 ────────────────────────────────────────
  // 既存レコードがある場合 → Firestoreに保存済みの値を使用（手動上書きを尊重）
  // 新規作成の場合（record === null） → 申請種別テンプレートを解決して自動セット
  // 空オブジェクト {} の場合は未設定とみなし、テンプレートを適用する
  const storedAssignments = record?.formData?.assignments as Record<string, any> | undefined;
  const hasValidAssignments = storedAssignments && Object.keys(storedAssignments).length > 0;

  const initialAssignments: TabAssignments = hasValidAssignments
    ? (storedAssignments as TabAssignments)
    : resolveTemplate('renewal', undefined, templatesRecord);

  return (
    <RenewalApplicationForm
      recordId={record?.id}
      foreignerId={foreignerId}
      initialValues={initialValues}
      initialAssignments={initialAssignments}
      templatesRecord={templatesRecord}
    />
  );
}
