'use client';

/**
 * useChangeOfStatusFormData.ts
 * 在留資格変更許可申請フォームの初期データ取得ロジックをカプセル化するカスタムフック
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { changeOfStatusApplicationService, type ChangeOfStatusApplicationRecord } from '@/services/changeOfStatusApplicationService';
import { foreignerService } from '@/services/foreignerService';
import { mapForeignerProfileToChangeOfStatusFormData } from '@/lib/mappers/foreignerToFormData';

export type ChangeOfStatusFormLoadPhase =
  | { phase: 'loading' }
  | { phase: 'ready'; record: ChangeOfStatusApplicationRecord | null }
  | { phase: 'error'; message: string };

export function useChangeOfStatusFormData(foreignerId: string): ChangeOfStatusFormLoadPhase {
  const [state, setState] = useState<ChangeOfStatusFormLoadPhase>({ phase: 'loading' });
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.push('/login');
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        const record = await changeOfStatusApplicationService.getByForeignerId(foreignerId);

        if (record) {
          if (record.attachments && record.formData) {
            (record.formData as Record<string, unknown>).attachments = record.attachments;
          }
          if (!cancelled) setState({ phase: 'ready', record });
          return;
        }

        let fallbackRecord: ChangeOfStatusApplicationRecord | null = null;
        try {
          const profile = await foreignerService.getForeignerById(foreignerId);
          if (profile) {
            const formData = mapForeignerProfileToChangeOfStatusFormData(profile);
            fallbackRecord = { formData } as ChangeOfStatusApplicationRecord;
          }
        } catch (profileErr) {
          console.warn('[useChangeOfStatusFormData] プロフィールフォールバック取得失敗:', profileErr);
        }

        if (!cancelled) setState({ phase: 'ready', record: fallbackRecord });
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
          setState({ phase: 'error', message });
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [foreignerId, currentUser, authLoading, router]);

  return state;
}
