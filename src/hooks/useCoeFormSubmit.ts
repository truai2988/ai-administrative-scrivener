'use client';

import { useState, useCallback } from 'react';
import type { CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';
import { downloadCoeCSV } from '@/lib/utils/coeCsvMapper';
import { useToast } from '@/components/ui/Toast';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UseCoeFormSubmitOptions {
  recordId?: string;
  onSuccess?: (id: string) => void;
}

export function useCoeFormSubmit({ recordId, onSuccess }: UseCoeFormSubmitOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const { show: showToast } = useToast();
  const [savedRecordId, setSavedRecordId] = useState<string | undefined>(recordId);

  const saveToFirestore = useCallback(async (data: CoeApplicationFormData) => {
    const targetId = savedRecordId || recordId;
    
    // Firestoreに保存する用のデータ整形 (Date等が混ざらないようシリアライズ可能な形にする)
    const payload = {
      formData: data,
      updatedAt: serverTimestamp(),
    };

    if (targetId) {
      // 上書き保存 (Draft更新)
      const docRef = doc(db, 'coe_applications', targetId);
      await setDoc(docRef, payload, { merge: true });
      return targetId;
    } else {
      // 新規作成
      const colRef = collection(db, 'coe_applications');
      const newDoc = await addDoc(colRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
      setSavedRecordId(newDoc.id);
      return newDoc.id;
    }
  }, [savedRecordId, recordId]);

  const handleSaveAndExport = useCallback(
    async (data: CoeApplicationFormData) => {
      setIsExporting(true);
      try {
        const id = await saveToFirestore(data);
        showToast('success', 'データを保存しました。CSVのダウンロードを開始します。');
        
        // 成功直後にCSV自動ダウンロード
        await downloadCoeCSV(data, true);
        
        if (onSuccess) {
          onSuccess(id);
        }
      } catch (error) {
        console.error('[COE保存・出力エラー]', error);
        showToast('error', '保存またはCSV出力に失敗しました。');
      } finally {
        setIsExporting(false);
      }
    },
    [saveToFirestore, showToast, onSuccess]
  );

  return {
    isSaving: isExporting, // UIのプロパティ名互換性のため残す
    isExporting,
    savedRecordId,
    handleSaveAndExport,
  };
}
