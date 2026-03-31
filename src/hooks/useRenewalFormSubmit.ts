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

import { useState, useCallback } from 'react';
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
  /** タブごとの担当者割り当て（SectionPermissionContextから渡す） */
  assignments: TabAssignments;
  /** 保存完了後の外部コールバック（省略可） */
  onSubmit?: (data: RenewalApplicationFormData) => void | Promise<void>;
}

interface UseRenewalFormSubmitReturn {
  isSaving: boolean;
  isExporting: boolean;
  isBusy: boolean;
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
  assignments,
  onSubmit,
}: UseRenewalFormSubmitOptions): UseRenewalFormSubmitReturn {
  const [isSaving,       setIsSaving]       = useState(false);
  const [isExporting,    setIsExporting]    = useState(false);
  const [savedRecordId,  setSavedRecordId]  = useState<string | undefined>(recordId);
  const { show: showToast } = useToast();

  // ─── 共通: Firebase保存 ───────────────────────────────────────────────────
  const saveToFirebase = useCallback(
    async (data: RenewalApplicationFormData): Promise<string> => {
      const dataWithAssignments = { ...data, assignments };
      const id = await renewalApplicationService.save(dataWithAssignments, savedRecordId, foreignerId);
      setSavedRecordId(id);
      if (onSubmit) await onSubmit(dataWithAssignments);
      return id;
    },
    [savedRecordId, foreignerId, assignments, onSubmit]
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
    handleSaveOnly,
    handleSaveAndExport,
    savedRecordId,
  };
}
