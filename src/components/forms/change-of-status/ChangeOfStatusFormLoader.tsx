'use client';

/**
 * ChangeOfStatusFormLoader.tsx
 * 変更許可申請フォームのローダーコンポーネント
 * 
 * 責務:
 * 1. useChangeOfStatusFormData を使ってデータを取得
 * 2. ロード中はスケルトンUIを表示
 * 3. 取得完了後、AI診断結果の初期状態を抽出し、フォーム本体へプロパティとして渡す
 */

import React, { useMemo } from 'react';
import { useChangeOfStatusFormData } from '@/hooks/useChangeOfStatusFormData';
import { ChangeOfStatusForm } from './ChangeOfStatusForm';
import { Loader2, AlertCircle } from 'lucide-react';

function FormSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <span className="text-sm font-medium text-slate-400">申請データを読み込み中...</span>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center">
          <AlertCircle size={28} className="text-rose-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          データの読み込みに失敗しました
        </h2>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
import { type DiagnosticItem } from '@/types/aiDiagnostics';

interface ChangeOfStatusFormLoaderProps {
  foreignerId: string;
}

export function ChangeOfStatusFormLoader({ foreignerId }: ChangeOfStatusFormLoaderProps) {
  const state = useChangeOfStatusFormData(foreignerId);

  // 既存レコードがあれば、その中の aiDiagnostics から初期診断結果を抽出
  const initialAiDiagnostics = useMemo<DiagnosticItem[]>(() => {
    if (state.phase === 'ready' && state.record?.aiDiagnostics?.diagnostics) {
      return state.record.aiDiagnostics.diagnostics;
    }
    return [];
  }, [state]);

  if (state.phase === 'loading') {
    return <FormSkeleton />;
  }

  if (state.phase === 'error') {
    return <ErrorState message={state.message} />;
  }

  if (state.phase === 'ready') {
    const { record } = state;
    const initialValues = record?.formData ? { ...record.formData } : {};
    if (record?.attachments) {
      (initialValues as Record<string, unknown>).attachments = record.attachments;
    }

    return (
      <ChangeOfStatusForm
        foreignerId={foreignerId}
        recordId={record?.id}
        initialValues={initialValues}
        initialAiDiagnostics={initialAiDiagnostics}
      />
    );
  }

  return null;
}
