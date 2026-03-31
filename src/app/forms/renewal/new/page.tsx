'use client';

import React, { useState, useCallback } from 'react';
import '../renewal-form.css';
import { RenewalApplicationForm } from '@/components/forms/RenewalApplicationForm';
import { DocumentUploadArea }      from '@/components/forms/DocumentUploadArea';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { mergeWithDefaults }        from '@/lib/utils/formUtils';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';

// デフォルト値（フォームと同定義のもの）
const EMPTY_FORM_VALUES: Partial<RenewalApplicationFormData> = {};

export default function RenewalFormNewPage() {
  const { toasts, dismiss, show: showToast } = useToast();

  // AIが抽出したデータを状態として保持
  const [aiInitialValues, setAiInitialValues] = useState<Partial<RenewalApplicationFormData>>(EMPTY_FORM_VALUES);

  /**
   * DocumentUploadArea からAI抽出データを受け取るコールバック。
   * 複数書類をアップロードした場合は、マージして蓄積する。
   */
  const handleExtracted = useCallback(
    (data: Partial<RenewalApplicationFormData>, fieldCount: number) => {
      setAiInitialValues((prev) => mergeWithDefaults(data, prev));
      showToast('success', `✨ 書類から ${fieldCount} 項目を読み取りました。フォームに自動入力済みです。`);
    },
    [showToast]
  );

  /** DocumentUploadArea からエラーを受け取るコールバック */
  const handleUploadError = useCallback(
    (message: string) => {
      showToast('error', message);
    },
    [showToast]
  );

  return (
    <main className="renewal-page">
      {/* Toast はページ最上位で管理（FormとUploadArea共有） */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div className="renewal-form">
        {/* ─── Step 1: 書類アップロード（OCRアシスト） */}
        <DocumentUploadArea
          onExtracted={handleExtracted}
          onError={handleUploadError}
        />

        {/* ─── Step 2: 申請フォーム本体（AIデータが初期値に入った状態で表示） */}
        <RenewalApplicationForm
          initialValues={aiInitialValues}
        />
      </div>
    </main>
  );
}
