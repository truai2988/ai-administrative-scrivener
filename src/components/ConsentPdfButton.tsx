'use client';

import React, { useState } from 'react';
import { generateConsentPdfClient } from '@/utils/generateConsentPdf';
import { Foreigner } from '@/types/database';
import { ScrollText, Loader2, CheckCircle } from 'lucide-react';

interface ConsentPdfButtonProps {
  foreigner: Foreigner;
  variant?: 'default' | 'compact';
}

export const ConsentPdfButton: React.FC<ConsentPdfButtonProps> = ({
  foreigner,
  variant = 'default',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const hasConsent = !!foreigner.consentLog;

  const handleDownload = async () => {
    if (!hasConsent) return;
    setIsGenerating(true);
    setIsDone(false);

    try {
      const result = await generateConsentPdfClient(foreigner);

      if (result.success && result.blob) {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.filename || 'consent.pdf');
        document.body.appendChild(link);
        link.click();

        setIsDone(true);
        setTimeout(() => setIsDone(false), 10000);
        setTimeout(() => {
          URL.revokeObjectURL(url);
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 2000);
      } else {
        alert('PDFの生成に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasConsent) {
    return variant === 'compact' ? null : (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
      >
        <ScrollText className="h-4 w-4" />
        依頼書PDF（同意記録なし）
      </button>
    );
  }

  const buttonClasses = {
    default: `w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
      isDone
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        : 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-100'
    }`,
    compact: `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
      isDone
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        : 'bg-white text-violet-700 hover:bg-violet-50 border border-violet-200 shadow-sm'
    }`,
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDownload();
      }}
      disabled={isGenerating}
      className={`${buttonClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {variant === 'compact' ? '生成中...' : '依頼書PDFを生成中...'}
        </>
      ) : isDone ? (
        <>
          <CheckCircle className="h-4 w-4" />
          {variant === 'compact' ? '完了' : 'ダウンロード済み'}
        </>
      ) : (
        <>
          <ScrollText className="h-4 w-4" />
          {variant === 'compact' ? '依頼書PDF' : '申請取次依頼書・承諾書PDFを生成'}
        </>
      )}
    </button>
  );
};
