'use client';

/**
 * useAiDiagnostics
 *
 * AI診断APIを呼び出し、結果を状態管理するカスタムフック。
 * RenewalApplicationForm / CoeApplicationForm / ChangeOfStatusFormから共通で利用します。
 */

import { useState, useCallback, useEffect } from 'react';
import type { AiDiagnosticsState, DiagnosticItem } from '@/types/aiDiagnostics';
import { getIdToken } from '@/lib/firebase/auth';


// ─── 初期状態 ──────────────────────────────────────────────────────────────────
export interface AiDiagnosticsStateExpanded extends AiDiagnosticsState {
  isPanelOpen: boolean;
}

const INITIAL_STATE: AiDiagnosticsStateExpanded = {
  status: 'idle',
  diagnostics: [],
  counts: { critical: 0, warning: 0, suggestion: 0 },
  isPanelOpen: false,
};

function calcCounts(diagnostics: DiagnosticItem[]) {
  return {
    critical: diagnostics.filter((d) => d.level === 'critical').length,
    warning: diagnostics.filter((d) => d.level === 'warning').length,
    suggestion: diagnostics.filter((d) => d.level === 'suggestion').length,
  };
}

// ─── フック ────────────────────────────────────────────────────────────────────────

/** 申請書の種別。API側で取得先コレクションとプロンプトの切り替えに使用 */
export type AiCheckApplicationType = 'renewal' | 'coe' | 'change_of_status';

interface UseAiDiagnosticsOptions {
  /** 保存済み申請書のレコードID。未保存の場合は undefined */
  recordId?: string;
  /** 申請書の種別（デフォルト: 'renewal'） */
  applicationType?: AiCheckApplicationType;
  /** 初期データとして読み込まれた過去の診断結果（ある場合） */
  initialDiagnostics?: DiagnosticItem[];
}

export function useAiDiagnostics({ recordId, applicationType = 'renewal', initialDiagnostics }: UseAiDiagnosticsOptions) {
  const [state, setState] = useState<AiDiagnosticsStateExpanded>(() => {
    console.log('[useAiDiagnostics] Initializing state. initialDiagnostics:', initialDiagnostics?.length);
    if (initialDiagnostics && initialDiagnostics.length > 0) {
      return {
        status: 'success',
        diagnostics: initialDiagnostics,
        counts: calcCounts(initialDiagnostics),
        isPanelOpen: false,
      };
    }
    return INITIAL_STATE;
  });

  // initialDiagnostics がマウント後に渡された場合や更新された場合に状態を同期する
  useEffect(() => {
    if (initialDiagnostics && initialDiagnostics.length > 0) {
      setState((prev) => {
        // すでに診断実行中または結果がある場合は、上書きを避ける（APIから取得した結果を優先）
        // ただし、もし新しい initialDiagnostics が来た場合は更新する（例: レコードが切り替わった場合）
        // ここでは、現在の state.diagnostics と initialDiagnostics が異なる（長さで簡易判定）場合のみ更新
        if (prev.status === 'success' && prev.diagnostics.length === initialDiagnostics.length) {
          return prev;
        }
        return {
          ...prev,
          status: 'success',
          diagnostics: initialDiagnostics,
          counts: calcCounts(initialDiagnostics),
        };
      });
    }
  }, [initialDiagnostics]);

  /**
   * AI診断を実行する。
   * - recordId がある場合: /api/applications/[id]/ai-check（Firestoreからデータ取得）
   * - recordId がない場合: /api/applications/unsaved/ai-check（bodyにformDataを含める）
   */
  const runCheck = useCallback(
    async (formData: Record<string, unknown>) => {
      console.log('[useAiDiagnostics] runCheck 開始: recordId=', recordId, 'applicationType=', applicationType);
      setState((prev) => ({ ...prev, status: 'loading', errorMessage: undefined, isPanelOpen: true }));

      try {
        // IDトークン取得
        const idToken = await getIdToken();
        console.log('[useAiDiagnostics] idToken取得結果:', !!idToken);
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
          targetId === 'unsaved'
            ? { formData, applicationType }
            : { applicationType };

        console.log('[useAiDiagnostics] fetch実行:', url, 'body:', body);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(body),
        });

        console.log('[useAiDiagnostics] fetch完了: status=', res.status);

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

        setState((prev) => ({
          ...prev,
          status: 'success',
          diagnostics,
          counts: calcCounts(diagnostics),
        }));
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
    [recordId, applicationType]
  );

  /** 状態を完全にリセットする */
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  /** パネルを閉じる（診断結果は維持する） */
  const closePanel = useCallback(() => {
    setState((prev) => ({ ...prev, isPanelOpen: false }));
  }, []);

  /** パネルを開く（結果を再確認する用） */
  const openPanel = useCallback(() => {
    setState((prev) => ({ ...prev, isPanelOpen: true }));
  }, []);

  return {
    ...state,
    runCheck,
    reset,
    closePanel,
    openPanel,
  };
}
