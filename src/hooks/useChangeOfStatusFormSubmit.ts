'use client';

/**
 * useChangeOfStatusFormSubmit.ts
 * 在留資格変更許可申請フォームの保存・エクスポートロジックをカプセル化するカスタムフック
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
import { useWatch, type Control, type UseFormGetValues } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { changeOfStatusApplicationService } from '@/services/changeOfStatusApplicationService';
import { downloadImmigrationCSV } from '@/lib/utils/csvMapper';
import { useToast } from '@/components/ui/Toast';
import isEqual from 'fast-deep-equal';

interface UseChangeOfStatusFormSubmitOptions {
  /** 既存レコードのID（編集時のみ）。未指定なら新規作成 */
  recordId?: string;
  /** 紐付ける外国人ドキュメントID */
  foreignerId?: string;
  /** 所属する組織のID */
  organizationId?: string;

  isDirty?: boolean;
  /** react-hook-form の control（特定のフィールドを監視するため） */
  control?: Control<ChangeOfStatusApplicationFormData>;
  /** react-hook-form の getValues（オートセーブ時に現在の全体フォームデータを取得するため） */
  getValues?: UseFormGetValues<ChangeOfStatusApplicationFormData>;
  /** 保存完了後の外部コールバック（省略可） */
  onSubmit?: (data: ChangeOfStatusApplicationFormData) => void | Promise<void>;
}

interface UseChangeOfStatusFormSubmitReturn {
  isSaving: boolean;
  isExporting: boolean;
  isBusy: boolean;
  /** 先行保存中フラグ（マウント直後の draft 作成中） */
  isCreatingDraft: boolean;
  /** オートセーブ（Debounce処理）中フラグ */
  isAutoSaving: boolean;
  /** 保存のみ実行するハンドラ（handleSubmit に渡す） */
  handleSaveOnly: (data: ChangeOfStatusApplicationFormData) => Promise<void>;
  /** 保存 + CSV出力を実行するハンドラ（handleSubmit に渡す） */
  handleSaveAndExport: (data: ChangeOfStatusApplicationFormData) => Promise<void>;
  /** 現在保存されているレコードのID（初回保存後に更新される） */
  savedRecordId: string | undefined;
}

export function useChangeOfStatusFormSubmit({
  recordId,
  foreignerId,
  organizationId,

  control,
  onSubmit,
}: UseChangeOfStatusFormSubmitOptions = {}): UseChangeOfStatusFormSubmitReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | undefined>(recordId);
  const { show: showToast } = useToast();

  // ─── 1. 先行保存: マウント直後に applicationId を確定させる ─────────────────
  useEffect(() => {
    // すでに recordId がある場合（編集時）はスキップ
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
          // 失敗しても操作は続行可能（警告のみ）
        }
      })
      .finally(() => {
        if (!cancelled) setIsCreatingDraft(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時1回のみ



  // ─── 共通: Firebase保存 ───────────────────────────────────────────────────
  const saveToFirebase = useCallback(
    async (data: ChangeOfStatusApplicationFormData): Promise<string> => {
      const id = await changeOfStatusApplicationService.save(data, savedRecordId, foreignerId, organizationId);
      setSavedRecordId(id);
      if (onSubmit) await onSubmit(data);
      return id;
    },
    [savedRecordId, foreignerId, organizationId, onSubmit]
  );

  // ─── ① 保存のみ ──────────────────────────────────────────────────────────
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

  // ─── ② 保存 + CSV出力 ────────────────────────────────────────────────────
  const handleSaveAndExport = useCallback(
    async (data: ChangeOfStatusApplicationFormData) => {
      setIsExporting(true);
      try {
        await saveToFirebase(data);
        await downloadImmigrationCSV(data as unknown as import('@/lib/schemas/renewalApplicationSchema').RenewalApplicationFormData);
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
    isAutoSaving,
    handleSaveOnly,
    handleSaveAndExport,
    savedRecordId,
  };
}
