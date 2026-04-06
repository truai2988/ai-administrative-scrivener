'use client';

/**
 * useRenewalFormData.ts
 * 更新申請フォームの初期データ取得ロジックをカプセル化するカスタムフック
 *
 * 責務:
 *   1. 認証ガード（未ログインならログインページへリダイレクト）
 *   2. renewal_applications コレクションから既存申請データを取得
 *   3. データなし時のフォールバック: foreigners コレクションから基本情報を引き継ぎ
 *   4. ローディング / エラー / 準備完了 の状態管理
 *
 * このフックを使うコンポーネントはUIの描き分けのみに集中できる。
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { renewalApplicationService, type RenewalApplicationRecord } from '@/services/renewalApplicationService';
import { foreignerService } from '@/services/foreignerService';
import { mapForeignerProfileToFormData } from '@/lib/mappers/foreignerToFormData';
import { getAssignmentTemplates } from '@/lib/constants/assignmentTemplates';
import type { ApplicationKind, TabAssignmentTemplate } from '@/lib/constants/assignmentTemplates';

export type FormLoadPhase =
  | { phase: 'loading' }
  | { phase: 'ready'; record: RenewalApplicationRecord | null; templatesRecord: Record<ApplicationKind, TabAssignmentTemplate> }
  | { phase: 'error'; message: string };

export function useRenewalFormData(foreignerId: string): FormLoadPhase {
  const [state, setState] = useState<FormLoadPhase>({ phase: 'loading' });
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 認証ロード中は待機
    if (authLoading) return;

    // 未ログイン → ログインページへリダイレクト
    if (!currentUser) {
      router.push('/login');
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        // 並列取得: 申請書データとシステム設定のテンプレート
        const [record, templatesRecord] = await Promise.all([
          renewalApplicationService.getByForeignerId(foreignerId),
          getAssignmentTemplates()
        ]);

        if (record) {
          // ─── デバッグログ ─────────────────────────────────────────
          console.group('[useRenewalFormData] レコード読み込み確認');
          console.log('record.id:', record.id);
          console.log('record.attachments (ルート):', JSON.stringify(record.attachments, null, 2));
          console.log('record.formData?.attachments (formData内):', JSON.stringify(record.formData?.attachments, null, 2));
          console.groupEnd();
          // ──────────────────────────────────────────────────────────

          // useFileUpload は attachments をドキュメントルートに保存しているため、
          // フォーム初期値 (formData) に root の attachments をマージする
          if (record.attachments && record.formData) {
            record.formData.attachments = record.attachments;
          }
          
          // 既存の申請書データが見つかった場合はそのまま使用
          if (!cancelled) setState({ phase: 'ready', record, templatesRecord });
          return;
        }

        // Step 2: 申請書が未作成の場合 → foreigners から基本情報を引き継ぎ（フォールバック）
        let fallbackRecord: RenewalApplicationRecord | null = null;
        try {
          const profile = await foreignerService.getForeignerById(foreignerId);
          if (profile) {
            const formData = mapForeignerProfileToFormData(profile);
            // 疑似的な record（id は未付与、保存時に新規作成される）
            fallbackRecord = { formData } as RenewalApplicationRecord;
          }
        } catch (profileErr) {
          // フォールバック失敗は警告のみ（空フォームで続行）
          console.warn('[useRenewalFormData] プロフィールフォールバック取得失敗:', profileErr);
        }

        if (!cancelled) setState({ phase: 'ready', record: fallbackRecord, templatesRecord });
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
