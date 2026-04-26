'use client';

/**
 * useCoeFormSubmit.ts
 * COE（在留資格認定証明書）申請フォームの保存・エクスポートロジックをカプセル化するカスタムフック
 *
 * 責務:
 *   1. Firebase への保存処理（新規作成 / 更新自動判定）
 *   2. CSV のダウンロード処理
 *   3. ローディング状態（isSaving, isExporting, isCreatingDraft, isAutoSaving）の管理
 *   4. 成功 / エラー Toast の表示
 *   5. マウント時の先行保存（Draft作成）
 *   6. 特定フィールド（担当者割り当て等）変更時の自動保存（Debounce付き）
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWatch, type Control, type UseFormGetValues } from 'react-hook-form';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';
import { coeApplicationService } from '@/services/coeApplicationService';
import { downloadCoeCSV } from '@/lib/utils/coeCsvMapper';
import { useToast } from '@/components/ui/Toast';
import isEqual from 'fast-deep-equal';

interface UseCoeFormSubmitOptions {
  /** 既存レコードのID（編集時のみ）。未指定なら新規作成 */
  recordId?: string;
  /** 紐付ける外国人ドキュメントID */
  foreignerId?: string;
  /** 所属する組織のID */
  organizationId?: string;
  /** フォームがユーザーによって変更されたかどうかのフラグ */
  isDirty?: boolean;
  /** react-hook-form の control（特定のフィールドを監視するため） */
  control?: Control<CoeApplicationFormData>;
  /** react-hook-form の getValues（オートセーブ時に現在の全体フォームデータを取得するため） */
  getValues?: UseFormGetValues<CoeApplicationFormData>;
  /** 保存完了後の外部コールバック（省略可） */
  onSuccess?: (id: string) => void | Promise<void>;
}

interface UseCoeFormSubmitReturn {
  isSaving: boolean;
  isExporting: boolean;
  isBusy: boolean;
  /** 先行保存中フラグ（マウント直後の draft 作成中） */
  isCreatingDraft: boolean;
  /** オートセーブ（Debounce処理）中フラグ */
  isAutoSaving: boolean;
  /** 保存のみ実行するハンドラ（handleSubmit に渡す） */
  handleSaveOnly: (data: CoeApplicationFormData) => Promise<void>;
  /** 保存 + CSV出力を実行するハンドラ（handleSubmit に渡す） */
  handleSaveAndExport: (data: CoeApplicationFormData) => Promise<void>;
  /** 現在保存されているレコードのID（初回保存後に更新される） */
  savedRecordId: string | undefined;
}

export function useCoeFormSubmit({
  recordId,
  foreignerId,
  organizationId,
  isDirty,
  control,
  getValues,
  onSuccess,
}: UseCoeFormSubmitOptions = {}): UseCoeFormSubmitReturn {
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

    coeApplicationService.createDraft(foreignerId)
      .then((id) => {
        if (!cancelled) setSavedRecordId(id);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[COE先行保存エラー]', err);
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
    disabled: !control, // フェーズ3統合前など、controlが未指定の場合は監視を無効化
  });

  const watchedAssignmentsStr = JSON.stringify(watchedAssignments);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMountForWatch = useRef(true);
  const lastSavedData = useRef<CoeApplicationFormData | null>(null);

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
      setIsAutoSaving(true);
      try {
        // 現在の最新フォームデータを取得
        const currentData = getValues();
        
        // 前回保存したデータと完全一致する場合は書き込みをスキップ（Write削減）
        if (isEqual(currentData, lastSavedData.current)) {
          return;
        }

        await coeApplicationService.save(currentData, savedRecordId, foreignerId, organizationId);
        lastSavedData.current = currentData;
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
  }, [watchedAssignmentsStr, savedRecordId, foreignerId, organizationId, getValues, showToast, isDirty]);

  // ─── 共通: Firebase保存 ───────────────────────────────────────────────────
  const saveToFirebase = useCallback(
    async (data: CoeApplicationFormData): Promise<string> => {
      const id = await coeApplicationService.save(data, savedRecordId, foreignerId, organizationId);
      setSavedRecordId(id);
      lastSavedData.current = data;
      if (onSuccess) await onSuccess(id);
      return id;
    },
    [savedRecordId, foreignerId, organizationId, onSuccess]
  );

  // ─── 3. 手動保存のみ ──────────────────────────────────────────────────────
  const handleSaveOnly = useCallback(
    async (data: CoeApplicationFormData) => {
      setIsSaving(true);
      try {
        await saveToFirebase(data);
        showToast('success', '保存しました（ステータス: 編集中）');
      } catch (error) {
        console.error('[保存エラー]', error);
        showToast('error', '保存に失敗しました。再度お試しください。');
      } finally {
        setIsSaving(false);
      }
    },
    [saveToFirebase, showToast]
  );

  // ─── 4. 保存 + CSV出力の完全連携 ──────────────────────────────────────────
  const handleSaveAndExport = useCallback(
    async (data: CoeApplicationFormData) => {
      setIsExporting(true);
      try {
        await saveToFirebase(data);
        showToast('success', 'データを保存しました。CSVのダウンロードを開始します。');
        
        // 保存成功直後にCSV自動ダウンロードを呼び出し
        await downloadCoeCSV(data, true);
        
      } catch (error) {
        console.error('[COE保存・出力エラー]', error);
        showToast('error', '保存またはCSV出力に失敗しました。');
      } finally {
        setIsExporting(false);
      }
    },
    [saveToFirebase, showToast]
  );

  return {
    isSaving,
    isExporting,
    isCreatingDraft,
    isAutoSaving,
    // 保存系かエクスポート系が走っている場合は画面操作をブロックするためのbusyフラグ
    isBusy: isSaving || isExporting || isCreatingDraft,
    savedRecordId,
    handleSaveOnly,
    handleSaveAndExport,
  };
}
