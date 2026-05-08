import { useState, useEffect, useRef } from 'react';
import { useWatch, type Control, type UseFormGetValues, type UseFormReset } from 'react-hook-form';
import { dynamicApplicationService } from '@/services/dynamicApplicationService';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import isEqual from 'fast-deep-equal';

const AUTOSAVE_DELAY_MS = 2000;

export function useUniversalAutoSave(
  formType: string,
  control: Control<any>,
  getValues: UseFormGetValues<any>,
  reset: UseFormReset<any>
) {
  const { currentUser } = useAuth();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const { show: showToast } = useToast();

  const watchedData = useWatch({ control });
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<any>(null);
  const isFirstRender = useRef(true);
  const [isDraftLoading, setIsDraftLoading] = useState(true);

  // マウント時に下書きの読み込み or 新規作成
  useEffect(() => {
    if (!currentUser?.id) {
        setIsDraftLoading(false);
        return;
    }
    
    let cancelled = false;
    const initDraft = async () => {
      try {
        const draft = await dynamicApplicationService.findLatestDraft(formType, currentUser.id);
        if (cancelled) return;
        
        if (draft && draft.data) {
          // 下書きがあればフォームに復元
          reset(draft.data, { keepDefaultValues: false });
          lastSavedData.current = draft.data;
          setSavedRecordId(draft.id);
          showToast('success', '前回の作成途中のデータを復元しました');
        } else {
          // なければ新規作成
          const newId = await dynamicApplicationService.createDraft(formType, currentUser.id);
          if (!cancelled) setSavedRecordId(newId);
        }
      } catch (err) {
        console.error("Draft初期化失敗:", err);
      } finally {
        if (!cancelled) setIsDraftLoading(false);
      }
    };
    initDraft();
    return () => { cancelled = true; };
  }, [formType, currentUser?.id, reset, showToast]);

  // 値変更監視＆オートセーブ
  useEffect(() => {
    // 初期ロード中または初回レンダリング時はスキップ
    if (isFirstRender.current || isDraftLoading) {
      if (!isDraftLoading) {
        isFirstRender.current = false;
      }
      return;
    }
    if (!savedRecordId || !currentUser?.id) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      autoSaveTimerRef.current = null;
      const currentData = getValues();
      
      // 未定義や空オブジェクトを考慮
      if (!currentData || Object.keys(currentData).length === 0) return;
      if (isEqual(currentData, lastSavedData.current)) return;

      setIsAutoSaving(true);
      try {
        await dynamicApplicationService.save(savedRecordId, formType, currentUser.id, currentData);
        lastSavedData.current = currentData;
        setLastSavedAt(new Date());
      } catch (e) {
        console.error("AutoSave Error:", e);
        showToast('error', '自動保存に失敗しました');
      } finally {
        setIsAutoSaving(false);
      }
    }, AUTOSAVE_DELAY_MS);
  }, [watchedData, savedRecordId, formType, currentUser?.id, getValues, showToast, isDraftLoading]);

  return { isAutoSaving, lastSavedAt, savedRecordId, isDraftLoading };
}
