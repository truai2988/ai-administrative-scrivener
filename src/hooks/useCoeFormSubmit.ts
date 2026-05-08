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
 *   6. フォーム全体の変更監視 → Debounce（2000ms）自動保存
 *   7. 担当者割り当て（assignments）の自動保存（5000ms）
 *   8. ブラウザ離脱時の未保存キューフラッシュ
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWatch, type Control, type UseFormGetValues } from 'react-hook-form';
import { type CoeApplicationFormData, type TabAssignments } from '@/lib/schemas/coeApplicationSchema';
import { coeApplicationService } from '@/services/coeApplicationService';
import { downloadCoeCSV } from '@/lib/utils/coeCsvMapper';
import { useToast } from '@/components/ui/Toast';
import isEqual from 'fast-deep-equal';

// ─── オートセーブの Debounce 間隔（ms） ─────────────────────────────────────
const FORM_AUTOSAVE_DELAY_MS = 2000;
const ASSIGNMENTS_AUTOSAVE_DELAY_MS = 5000;

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
  /** 最終保存日時（UIインジケーター用） */
  lastSavedAt: Date | null;
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
  control,
  getValues,
  onSuccess,
}: UseCoeFormSubmitOptions = {}): UseCoeFormSubmitReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
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

  // ─── 2. フォーム全体のオートセーブ（Debounce 2000ms） ────────────────────
  //   useWatch でフォームの全フィールドを監視し、入力が 2000ms 止まったら
  //   バックグラウンドで save を実行する。

  const watchedFormData = useWatch({
    control,
    disabled: !control,
  });

  const formAutoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstFormRender = useRef(true);
  const lastSavedFormData = useRef<CoeApplicationFormData | null>(null);
  // 手動保存中はオートセーブをスキップするフラグ
  const isManualSavingRef = useRef(false);

  useEffect(() => {
    // 初回マウント時は変更ではないのでスキップ
    if (isFirstFormRender.current) {
      isFirstFormRender.current = false;
      return;
    }

    // 必要な引数がまだ揃っていない場合はスキップ
    if (!savedRecordId || !getValues || !watchedFormData) return;

    // 前回のタイマーをクリア（Debounce）
    if (formAutoSaveTimerRef.current) {
      clearTimeout(formAutoSaveTimerRef.current);
    }

    formAutoSaveTimerRef.current = setTimeout(async () => {
      formAutoSaveTimerRef.current = null;

      // 手動保存中なら衝突を避けるためスキップ
      if (isManualSavingRef.current) return;

      const currentData = getValues();

      // 前回保存データと完全一致する場合は Firestore Write を節約
      if (isEqual(currentData, lastSavedFormData.current)) {
        return;
      }

      setIsAutoSaving(true);
      try {
        const id = await coeApplicationService.save(
          currentData,
          savedRecordId,
          foreignerId,
          organizationId,
        );
        setSavedRecordId(id);
        lastSavedFormData.current = currentData;
        setLastSavedAt(new Date());
        console.log('[COEオートセーブ] ✅ 自動保存完了');
      } catch (err) {
        console.error('[COEオートセーブエラー]', err);
        // オートセーブの失敗は静かに処理（次回リトライに任せる）
      } finally {
        setIsAutoSaving(false);
      }
    }, FORM_AUTOSAVE_DELAY_MS);

    return () => {
      if (formAutoSaveTimerRef.current) {
        clearTimeout(formAutoSaveTimerRef.current);
      }
    };
  // watchedFormData の変更を検知するために JSON.stringify を使わず、
  // watchedFormData 自体を依存配列に入れる（useWatch は新しい参照を返す）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFormData, savedRecordId, foreignerId, organizationId, getValues]);

  // ─── 3. 担当者（assignments）の自動保存（5000ms） ───────────────────────
  const watchedAssignments = useWatch({
    control,
    name: 'assignments',
    disabled: !control,
  });

  const watchedAssignmentsStr = JSON.stringify(watchedAssignments);

  const assignmentsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMountForAssignments = useRef(true);
  const lastSavedAssignments = useRef<TabAssignments | null>(null);

  useEffect(() => {
    if (isFirstMountForAssignments.current) {
      isFirstMountForAssignments.current = false;
      return;
    }

    if (!savedRecordId || !watchedAssignments) return;

    if (assignmentsTimerRef.current) {
      clearTimeout(assignmentsTimerRef.current);
    }

    assignmentsTimerRef.current = setTimeout(async () => {
      assignmentsTimerRef.current = null;
      setIsAutoSaving(true);
      try {
        if (isEqual(watchedAssignments, lastSavedAssignments.current)) {
          return;
        }

        await coeApplicationService.updateAssignments(savedRecordId, watchedAssignments as TabAssignments);
        lastSavedAssignments.current = watchedAssignments as TabAssignments;
        setLastSavedAt(new Date());
      } catch (err) {
        console.error('[オートセーブエラー]', err);
        showToast('error', '担当者の自動保存に失敗しました');
      } finally {
        setIsAutoSaving(false);
      }
    }, ASSIGNMENTS_AUTOSAVE_DELAY_MS);

    return () => {
      if (assignmentsTimerRef.current) {
        clearTimeout(assignmentsTimerRef.current);
      }
    };
  }, [watchedAssignmentsStr, watchedAssignments, savedRecordId, showToast]);

  // ─── 4. ブラウザ離脱警告 & アンマウント時の強制保存 (Flush) ────────────────
  const flushDataRef = useRef({ savedRecordId, getValues });
  useEffect(() => {
    flushDataRef.current = { savedRecordId, getValues };
  }, [savedRecordId, getValues]);

  useEffect(() => {
    const hasPendingChanges = () =>
      formAutoSaveTimerRef.current !== null || assignmentsTimerRef.current !== null;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // アンマウント時に未保存キューがあれば即座に保存実行
      if (formAutoSaveTimerRef.current) {
        clearTimeout(formAutoSaveTimerRef.current);
        formAutoSaveTimerRef.current = null;

        const { savedRecordId: id, getValues: gv } = flushDataRef.current;
        if (id && gv) {
          const data = gv();
          if (!isEqual(data, lastSavedFormData.current)) {
            coeApplicationService.save(data, id, foreignerId, organizationId).catch((err) => {
              console.error('[アンマウント時オートセーブエラー]', err);
            });
          }
        }
      }

      if (assignmentsTimerRef.current) {
        clearTimeout(assignmentsTimerRef.current);
        assignmentsTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 共通: Firebase保存 ───────────────────────────────────────────────────
  const saveToFirebase = useCallback(
    async (data: CoeApplicationFormData): Promise<string> => {
      const id = await coeApplicationService.save(data, savedRecordId, foreignerId, organizationId);
      setSavedRecordId(id);
      lastSavedFormData.current = data;
      setLastSavedAt(new Date());
      if (onSuccess) await onSuccess(id);
      return id;
    },
    [savedRecordId, foreignerId, organizationId, onSuccess]
  );

  // ─── 5. 手動保存のみ ──────────────────────────────────────────────────────
  const handleSaveOnly = useCallback(
    async (data: CoeApplicationFormData) => {
      // オートセーブとの衝突を防止
      isManualSavingRef.current = true;
      if (formAutoSaveTimerRef.current) {
        clearTimeout(formAutoSaveTimerRef.current);
        formAutoSaveTimerRef.current = null;
      }

      setIsSaving(true);
      try {
        await saveToFirebase(data);
        showToast('success', '保存しました（ステータス: 編集中）');
      } catch (error) {
        console.error('[保存エラー]', error);
        showToast('error', '保存に失敗しました。再度お試しください。');
      } finally {
        setIsSaving(false);
        isManualSavingRef.current = false;
      }
    },
    [saveToFirebase, showToast]
  );

  // ─── 6. 保存 + CSV出力の完全連携 ──────────────────────────────────────────
  const handleSaveAndExport = useCallback(
    async (data: CoeApplicationFormData) => {
      isManualSavingRef.current = true;
      if (formAutoSaveTimerRef.current) {
        clearTimeout(formAutoSaveTimerRef.current);
        formAutoSaveTimerRef.current = null;
      }

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
        isManualSavingRef.current = false;
      }
    },
    [saveToFirebase, showToast]
  );

  return {
    isSaving,
    isExporting,
    isCreatingDraft,
    isAutoSaving,
    lastSavedAt,
    isBusy: isSaving || isExporting || isCreatingDraft,
    savedRecordId,
    handleSaveOnly,
    handleSaveAndExport,
  };
}
