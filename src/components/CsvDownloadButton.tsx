'use client';

import React, { useState } from 'react';
import { generateBatchCsv } from '@/app/actions/exportCsv';
import { Foreigner } from '@/types/database';
import { FileSpreadsheet, Loader2, CheckCircle } from 'lucide-react';

interface CsvDownloadButtonProps {
  foreigners: Foreigner[];
  disabled?: boolean;
}

export const CsvDownloadButton: React.FC<CsvDownloadButtonProps> = ({
  foreigners,
  disabled = false,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleDownload = async () => {
    if (foreigners.length === 0) return;
    setIsGenerating(true);
    setIsDone(false);

    try {
      const result = await generateBatchCsv(foreigners);

      if (result.success && result.data) {
        const dataUrl = `data:text/csv;base64,${result.data}`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.setAttribute('download', result.filename || 'batch_export.csv');
        document.body.appendChild(link);
        link.click();

        setIsDone(true);
        setTimeout(() => setIsDone(false), 8000);
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 2000);
      } else {
        alert('CSVの生成に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = disabled || foreigners.length === 0 || isGenerating;

  return (
    <button
      onClick={handleDownload}
      disabled={isDisabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
        isDone
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          : isDisabled
            ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
            : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-100'
      }`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          CSV生成中...
        </>
      ) : isDone ? (
        <>
          <CheckCircle className="h-4 w-4" />
          CSV出力完了
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4" />
          CSV一括出力 {foreigners.length > 0 && `(${foreigners.length}名)`}
        </>
      )}
    </button>
  );
};
