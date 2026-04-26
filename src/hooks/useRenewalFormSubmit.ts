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
import { useWatch, type Control, type UseFormGetValues } from 'react-hook-form';
import type { TabAssignments } from '@/lib/schemas/renewalApplicationSchema';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import { renewalApplicationService } from '@/services/renewalApplicationService';
import { downloadImmigrationCSV } from '@/lib/utils/csvMapper';
import { useToast } from '@/components/ui/Toast';
import isEqual from 'fast-deep-equal';

interface UseRenewalFormSubmitOptions {
  /** 既存レコードのID（編集時のみ）。未指定なら新規作成 */
  recordId?: string;
  /** 紐付ける外国人ドキュメントID */
  foreignerId?: string;
  /** 所属する組織のID */
  organizationId?: string;
  /** タブごとの担当者割り当て（SectionPermissionContextから渡す） */
  assignments?: TabAssignments;
  /** フォームがユーザーによって変更されたかどうかのフラグ */
  isDirty?: boolean;
  /** react-hook-form の control（特定のフィールドを監視するため） */
  control?: Control<RenewalApplicationFormData>;
  /** react-hook-form の getValues（オートセーブ時に現在の全体フォームデータを取得するため） */
  getValues?: UseFormGetValues<RenewalApplicationFormData>;
  /** 保存完了後の外部コールバック（省略可） */
  onSubmit?: (data: RenewalApplicationFormData) => void | Promise<void>;
}

interface UseRenewalFormSubmitReturn {
  isSaving: boolean;
  isExporting: boolean;
  isBusy: boolean;
  /** 先行保存中フラグ（マウント直後の draft 作成中） */
  isCreatingDraft: boolean;
  /** オートセーブ（Debounce処理）中フラグ */
  isAutoSaving: boolean;
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
  isDirty,
  control,
  getValues,
  onSubmit,
}: UseRenewalFormSubmitOptions = {}): UseRenewalFormSubmitReturn {
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

  // ─── 2. オートセーブ機能: 特定フィールドの変更監視とDebounce保存 ────────────
  // 担当者割り当て（assignments）フィールドを監視する
  const watchedAssignments = useWatch({
    control,
    name: 'assignments',
    disabled: !control,
  });

  const watchedAssignmentsStr = JSON.stringify(watchedAssignments);
  const assignmentsStr = JSON.stringify(assignments);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMountForWatch = useRef(true);
  const lastSavedData = useRef<RenewalApplicationFormData | null>(null);

  useEffect(() => {
    // 初回マウント時や必要な引数が揃っていない場合はスキップ
    if (isFirstMountForWatch.current) {
      isFirstMountForWatch.current = false;
      return;
    }

    if (!savedRecordId || !getValues) return;
    
    // フォームがユーザーによって実際に変更されていない場合は自動保存をスキップ
    if (!isDirty) return;

    // 前回のタイマーをクリア（Debounce）
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 5000ms 後に自動保存を実行
    debounceTimerRef.current = setTimeout(async () => {
      // タイマーが発火した時点でキューから外す（これ以降のページ離脱は警告不要）
      debounceTimerRef.current = null;
      setIsAutoSaving(true);
      try {
        // 現在の最新フォームデータを取得
        const currentData = getValues();
        // コンテキストから渡された assignments を優先してマージ
        const dataWithAssignments = { ...currentData, assignments: assignments || currentData.assignments };
        
        // 前回保存したデータと完全一致する場合は書き込みをスキップ（Write削減）
        if (isEqual(dataWithAssignments, lastSavedData.current)) {
          return;
        }

        await renewalApplicationService.save(dataWithAssignments, savedRecordId, foreignerId, organizationId);
        lastSavedData.current = dataWithAssignments;
        // UX上頻繁に出ると煩わしいため、成功通知は省略
      } catch (err) {
        console.error('[オートセーブエラー]', err);
        showToast('error', '自動保存に失敗しました');
      } finally {
        setIsAutoSaving(false);
      }
    }, 5000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAssignmentsStr, assignmentsStr, savedRecordId, foreignerId, organizationId, getValues, showToast, isDirty]);

  // ─── 2.5. ブラウザ離脱警告 & アンマウント時の強制保存 (Flush) ────────────
  const flushDataRef = useRef({ getValues, savedRecordId, foreignerId, organizationId, assignments });
  useEffect(() => {
    flushDataRef.current = { getValues, savedRecordId, foreignerId, organizationId, assignments };
  }, [getValues, savedRecordId, foreignerId, organizationId, assignments]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (debounceTimerRef.current) {
        e.preventDefault();
        e.returnValue = ''; // ほとんどのブラウザで標準の警告ダイアログが表示される
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // アンマウント時（ページ遷移など）に未保存キューがあれば即座に保存実行
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        
        const { getValues, savedRecordId, foreignerId, organizationId, assignments } = flushDataRef.current;
        if (getValues && savedRecordId && lastSavedData.current) {
          const currentData = getValues();
          const dataWithAssignments = { ...currentData, assignments: assignments || currentData.assignments };
          if (!isEqual(dataWithAssignments, lastSavedData.current)) {
            // アンマウント時なのでawaitせずバックグラウンドで実行
            renewalApplicationService.save(dataWithAssignments, savedRecordId, foreignerId, organizationId).catch((err) => {
              console.error('[アンマウント時オートセーブエラー]', err);
            });
          }
        }
      }
    };
  }, []);

  // ─── 共通: Firebase保存 ───────────────────────────────────────────────────
  const saveToFirebase = useCallback(
    async (data: RenewalApplicationFormData): Promise<string> => {
      const dataWithAssignments = { ...data, assignments: assignments || data.assignments };
      const id = await renewalApplicationService.save(dataWithAssignments, savedRecordId, foreignerId, organizationId);
      setSavedRecordId(id);
      lastSavedData.current = dataWithAssignments;
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
    isAutoSaving,
    handleSaveOnly,
    handleSaveAndExport,
    savedRecordId,
  };
}
