'use client';

/**
 * useRenewalFormSubmit.ts
 * 更新申請フォームの保存・エクスポートロジックをカプセル化するカスタムフック
 *
 * 責務:
 *   1. Firebase への保存処理（新規作成 / 更新自動判定）
 *   2. CSV のダウンロード処理
 *   3. ローディング状態（isSaving, isExporting）の管理
 *   4. 成功 / エラー Toast の表示
 *
 * このフックを使うコンポーネントはボタンのレンダリングのみに集中できる。
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { TabAssignments } from '@/lib/schemas/renewalApplicationSchema';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import { renewalApplicationService } from '@/services/renewalApplicationService';
import { downloadImmigrationCSV } from '@/lib/utils/csvMapper';
import { useToast } from '@/components/ui/Toast';

interface UseRenewalFormSubmitOptions {
  /** 既存レコードのID（編集時のみ）。未指定なら新規作成 */
  recordId?: string;
  /** 紐付ける外国人ドキュメントID */
  foreignerId?: string;
  /** 所属する組織のID */
  organizationId?: string;
  /** タブごとの担当者割り当て（SectionPermissionContextから渡す） */
  assignments: TabAssignments;
  /** 保存完了後の外部コールバック（省略可） */
  onSubmit?: (data: RenewalApplicationFormData) => void | Promise<void>;
}

interface UseRenewalFormSubmitReturn {
  isSaving: boolean;
  isExporting: boolean;
  isBusy: boolean;
  /** 先行保存中フラグ（マウント直後の draft 作成中） */
  isCreatingDraft: boolean;
  /** 保存のみ実行するハンドラ（handleSubmit に渡す） */
  handleSaveOnly: (data: RenewalApplicationFormData) => Promise<void>;
  /** 保存 + CSV出力を実行するハンドラ（handleSubmit に渡す） */
  handleSaveAndExport: (data: RenewalApplicationFormData) => Promise<void>;
  /** 現在保存されているレコードのID（初回保存後に更新される） */
  savedRecordId: string | undefined;
}

export function useRenewalFormSubmit({
  recordId,
  foreignerId,
  organizationId,
  assignments,
  onSubmit,
}: UseRenewalFormSubmitOptions): UseRenewalFormSubmitReturn {
  const [isSaving,        setIsSaving]        = useState(false);
  const [isExporting,     setIsExporting]     = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [savedRecordId,   setSavedRecordId]   = useState<string | undefined>(recordId);
  const { show: showToast } = useToast();

  // ─── 先行保存: マウント直後に applicationId を確定させる ─────────────────
  useEffect(() => {
    // すでに recordId がある場合（編集時）はスキップ
    if (recordId) return;

    let cancelled = false;
    setIsCreatingDraft(true);

    renewalApplicationService.createDraft(foreignerId)
      .then((id) => {
        if (!cancelled) setSavedRecordId(id);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[先行保存エラー]', err);
          // 失敗しても操作は続行可能（警告のみ）
        }
      })
      .finally(() => {
        if (!cancelled) setIsCreatingDraft(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時1回のみ

  // ─── 担当者割り当てのオートセーブ ───────────────────────────────────────────
  const lastAssignmentsRef = useRef<TabAssignments>(assignments);

  useEffect(() => {
    if (!savedRecordId) return;

    // JSON.stringifyで簡易等価チェック（値が本当に変わったか判定）
    const isChanged = JSON.stringify(lastAssignmentsRef.current) !== JSON.stringify(assignments);
    if (!isChanged) return;

    lastAssignmentsRef.current = assignments;

    const autoSaveAssignments = async () => {
      try {
        const { db } = await import('@/lib/firebase/client');
        const { doc, updateDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'renewal_applications', savedRecordId);
        await updateDoc(docRef, { 'formData.assignments': assignments });
        // UX上頻繁に出ると煩わしいため、成功通知は省略
      } catch (err) {
        console.error('[assignments自動保存エラー]', err);
        showToast('error', '担当者割り当ての自動保存に失敗しました');
      }
    };

    autoSaveAssignments();
  }, [assignments, savedRecordId, showToast]);

  // ─── 共通: Firebase保存 ───────────────────────────────────────────────────
  const saveToFirebase = useCallback(
    async (data: RenewalApplicationFormData): Promise<string> => {
      const dataWithAssignments = { ...data, assignments };
      const id = await renewalApplicationService.save(dataWithAssignments, savedRecordId, foreignerId, organizationId);
      setSavedRecordId(id);
      if (onSubmit) await onSubmit(dataWithAssignments);
      return id;
    },
    [savedRecordId, foreignerId, organizationId, assignments, onSubmit]
  );

  // ─── ① 保存のみ ──────────────────────────────────────────────────────────
  const handleSaveOnly = useCallback(
    async (data: RenewalApplicationFormData) => {
      setIsSaving(true);
      try {
        await saveToFirebase(data);
        showToast('success', '保存しました（ステータス: 編集中）');
      } catch (err) {
        console.error('[保存エラー]', err);
        showToast('error', '保存に失敗しました。再度お試しください。');
      } finally {
        setIsSaving(false);
      }
    },
    [saveToFirebase, showToast]
  );

  // ─── ② 保存 + CSV出力 ────────────────────────────────────────────────────
  const handleSaveAndExport = useCallback(
    async (data: RenewalApplicationFormData) => {
      setIsExporting(true);
      try {
        await saveToFirebase(data);
        await downloadImmigrationCSV(data);
        showToast('success', '保存してCSVを出力しました（3ファイル）');
      } catch (err) {
        console.error('[保存&CSV出力エラー]', err);
        showToast('error', '処理に失敗しました。コンソールを確認してください。');
      } finally {
        setIsExporting(false);
      }
    },
    [saveToFirebase, showToast]
  );

  return {
    isSaving,
    isExporting,
    isBusy: isSaving || isExporting,
    isCreatingDraft,
    handleSaveOnly,
    handleSaveAndExport,
    savedRecordId,
  };
}
