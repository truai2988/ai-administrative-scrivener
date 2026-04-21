'use client';

/**
 * useChangeOfStatusFormSubmit.ts
 * 在留資格変更許可申請フォームの保存・エクスポートロジックをカプセル化するカスタムフック
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { TabAssignments } from '@/lib/schemas/changeOfStatusApplicationSchema';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { changeOfStatusApplicationService } from '@/services/changeOfStatusApplicationService';
import { downloadImmigrationCSV } from '@/lib/utils/csvMapper';
import { useToast } from '@/components/ui/Toast';

interface UseChangeOfStatusFormSubmitOptions {
  recordId?: string;
  foreignerId?: string;
  organizationId?: string;
  assignments: TabAssignments;
  onSubmit?: (data: ChangeOfStatusApplicationFormData) => void | Promise<void>;
}

interface UseChangeOfStatusFormSubmitReturn {
  isSaving: boolean;
  isExporting: boolean;
  isBusy: boolean;
  isCreatingDraft: boolean;
  handleSaveOnly: (data: ChangeOfStatusApplicationFormData) => Promise<void>;
  handleSaveAndExport: (data: ChangeOfStatusApplicationFormData) => Promise<void>;
  savedRecordId: string | undefined;
}

export function useChangeOfStatusFormSubmit({
  recordId,
  foreignerId,
  organizationId,
  assignments,
  onSubmit,
}: UseChangeOfStatusFormSubmitOptions): UseChangeOfStatusFormSubmitReturn {
  const [isSaving,        setIsSaving]        = useState(false);
  const [isExporting,     setIsExporting]     = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [savedRecordId,   setSavedRecordId]   = useState<string | undefined>(recordId);
  const { show: showToast } = useToast();

  useEffect(() => {
    if (recordId) return;

    let cancelled = false;
    setIsCreatingDraft(true);

    changeOfStatusApplicationService.createDraft(foreignerId)
      .then((id) => {
        if (!cancelled) setSavedRecordId(id);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[先行保存エラー]', err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsCreatingDraft(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastAssignmentsRef = useRef<TabAssignments>(assignments);

  useEffect(() => {
    if (!savedRecordId) return;

    const isChanged = JSON.stringify(lastAssignmentsRef.current) !== JSON.stringify(assignments);
    if (!isChanged) return;

    lastAssignmentsRef.current = assignments;

    const autoSaveAssignments = async () => {
      try {
        const { db } = await import('@/lib/firebase/client');
        const { doc, updateDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'change_of_status_applications', savedRecordId);
        await updateDoc(docRef, { 'formData.assignments': assignments });
      } catch (err) {
        console.error('[assignments自動保存エラー]', err);
        showToast('error', '担当者割り当ての自動保存に失敗しました');
      }
    };

    autoSaveAssignments();
  }, [assignments, savedRecordId, showToast]);

  const saveToFirebase = useCallback(
    async (data: ChangeOfStatusApplicationFormData): Promise<string> => {
      const dataWithAssignments = { ...data, assignments };
      const id = await changeOfStatusApplicationService.save(dataWithAssignments, savedRecordId, foreignerId, organizationId);
      setSavedRecordId(id);
      if (onSubmit) await onSubmit(dataWithAssignments);
      return id;
    },
    [savedRecordId, foreignerId, organizationId, assignments, onSubmit]
  );

  const handleSaveOnly = useCallback(
    async (data: ChangeOfStatusApplicationFormData) => {
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

  const handleSaveAndExport = useCallback(
    async (data: ChangeOfStatusApplicationFormData) => {
      setIsExporting(true);
      try {
        await saveToFirebase(data);
        await downloadImmigrationCSV(data as any); // csvMapper depends on unified schema or specifics, this is fine
        showToast('success', '保存してCSVを出力しました');
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
