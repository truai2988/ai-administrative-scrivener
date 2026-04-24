'use client';

/**
 * useAiDiagnostics
 *
 * AI診断APIを呼び出し、結果を状態管理するカスタムフック。
 * RenewalApplicationForm から利用します。
 */

import { useState, useCallback } from 'react';
import type { AiDiagnosticsState, DiagnosticItem } from '@/types/aiDiagnostics';
import { getIdToken } from '@/lib/firebase/auth';


// ─── 初期状態 ──────────────────────────────────────────────────────────────────
const INITIAL_STATE: AiDiagnosticsState = {
  status: 'idle',
  diagnostics: [],
  counts: { critical: 0, warning: 0, suggestion: 0 },
};

function calcCounts(diagnostics: DiagnosticItem[]) {
  return {
    critical: diagnostics.filter((d) => d.level === 'critical').length,
    warning: diagnostics.filter((d) => d.level === 'warning').length,
    suggestion: diagnostics.filter((d) => d.level === 'suggestion').length,
  };
}

// ─── フック ────────────────────────────────────────────────────────────────────
interface UseAiDiagnosticsOptions {
  /** 保存済み申請書のレコードID。未保存の場合は undefined */
  recordId?: string;
}

export function useAiDiagnostics({ recordId }: UseAiDiagnosticsOptions) {
  const [state, setState] = useState<AiDiagnosticsState>(INITIAL_STATE);

  /**
   * AI診断を実行する。
   * - recordId がある場合: /api/applications/[id]/ai-check（Firestoreからデータ取得）
   * - recordId がない場合: /api/applications/unsaved/ai-check（bodyにformDataを含める）
   */
  const runCheck = useCallback(
    async (formData: Record<string, unknown>) => {
      setState((prev) => ({ ...prev, status: 'loading', errorMessage: undefined }));

      try {
        // IDトークン取得
        const idToken = await getIdToken();
        if (!idToken) {
          setState((prev) => ({
            ...prev,
            status: 'error',
            errorMessage: 'ログインセッションが切れています。再度ログインしてください。',
          }));
          return;
        }

        const targetId = recordId ?? 'unsaved';
        const url = `/api/applications/${targetId}/ai-check`;

        const body: Record<string, unknown> =
          targetId === 'unsaved' ? { formData } : {};

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg =
            (errData as { error?: string }).error ??
            `サーバーエラーが発生しました (HTTP ${res.status})`;
          setState((prev) => ({
            ...prev,
            status: 'error',
            errorMessage: errMsg,
          }));
          return;
        }

        const data = (await res.json()) as { diagnostics: DiagnosticItem[] };
        const diagnostics = data.diagnostics ?? [];

        setState({
          status: 'success',
          diagnostics,
          counts: calcCounts(diagnostics),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'ネットワークエラーが発生しました';
        setState((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: message,
        }));
      }
    },
    [recordId]
  );

  /** 状態をリセットして Drawer を閉じる */
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    runCheck,
    reset,
  };
}
