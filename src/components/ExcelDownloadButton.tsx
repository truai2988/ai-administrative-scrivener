'use client';

import React, { useState } from 'react';
import { generateApplicationExcel } from '@/app/actions/exportExcel';
import { Foreigner } from '@/types/database';
import { FileDown, Loader2, CheckCircle } from 'lucide-react';

interface ExcelDownloadButtonProps {
  foreigner: Foreigner;
  variant?: 'default' | 'outline' | 'compact' | 'icon';
}

export const ExcelDownloadButton: React.FC<ExcelDownloadButtonProps> = ({ 
  foreigner, 
  variant = 'default' 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    setIsDone(false);

    try {
      const result = await generateApplicationExcel(foreigner);

      if (result.success && result.data) {
        // Convert base64 to Blob for reliable, cache-proof download
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const fileName = `APP_${foreigner.id.replace(/[^a-zA-Z0-9]/g, '')}.xlsx`;
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup: revoke the object URL and remove the link element
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 500);

        setIsDone(true);
        setTimeout(() => setIsDone(false), 5000);
      } else {
        alert('Excelの生成に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  const buttonClasses = {
    default: `w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
      isDone 
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
    }`,
    compact: `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
      isDone 
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
    }`,
    outline: `w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all border-2 ${
      isDone
        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
        : 'border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'
    }`,
    icon: `flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
      isDone
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        : 'bg-white text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 shadow-sm'
    }`
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDownload();
      }}
      disabled={isGenerating}
      title={variant === 'icon' ? "Excel出力" : undefined}
      className={`${buttonClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
    >
      {isGenerating ? (
        <>
          <Loader2 className={`${variant === 'icon' ? 'h-4 w-4' : 'h-4 w-4'} animate-spin`} />
          {variant !== 'icon' && (variant === 'compact' ? '中...' : '帳票を生成中...')}
        </>
      ) : isDone ? (
        <>
          <CheckCircle className={`${variant === 'icon' ? 'h-4 w-4' : 'h-4 w-4'}`} />
          {variant !== 'icon' && (variant === 'compact' ? '完了' : 'ダウンロード済み')}
        </>
      ) : (
        <>
          <FileDown className={`${variant === 'icon' ? 'h-4 w-4' : 'h-4 w-4'}`} />
          {variant !== 'icon' && (variant === 'compact' ? 'Excel出力' : '入管提出用Excelを一括生成')}
        </>
      )}
    </button>
  );
};
