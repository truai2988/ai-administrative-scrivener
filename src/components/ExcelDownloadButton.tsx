'use client';

import React, { useState } from 'react';
import { generateApplicationExcel } from '@/app/actions/exportExcel';
import { Foreigner } from '@/types/database';
import { FileDown, Loader2, CheckCircle } from 'lucide-react';

interface ExcelDownloadButtonProps {
  foreigner: Foreigner;
  variant?: 'default' | 'outline' | 'compact';
}

export const ExcelDownloadButton: React.FC<ExcelDownloadButtonProps> = ({ 
  foreigner, 
  variant = 'default' 
}) => {
  const [lastExcelData, setLastExcelData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    setIsDone(false);
    setLastExcelData(null);

    try {
      const result = await generateApplicationExcel(foreigner);

      if (result.success && result.data) {
        setLastExcelData(result.data);
        
        try {
          const simpleName = `APP_${foreigner.id.replace(/[^a-zA-Z0-9]/g, '')}.xlsx`;
          const dataUrl = `data:application/octet-stream;base64,${result.data}`;
          
          const link = document.createElement('a');
          link.href = dataUrl;
          link.setAttribute('download', simpleName);
          document.body.appendChild(link);
          link.click();
          
          setIsDone(true);
          setTimeout(() => setIsDone(false), 10000);
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          }, 2000);
        } catch (err) {
          console.error('Download setup failed:', err);
        }
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
    }`
  };

  return (
    <>
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
            {variant === 'compact' ? '中...' : '帳票を生成中...'}
          </>
        ) : isDone ? (
          <>
            <CheckCircle className="h-4 w-4" />
            {variant === 'compact' ? '完了' : 'ダウンロード済み'}
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" />
            {variant === 'compact' ? 'Excel出力' : '入管提出用Excelを一括生成'}
          </>
        )}
      </button>
      
      {isDone && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300 text-center">
          <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
            自動で始まらない場合はこちら
          </p>
          <a 
            href={`data:application/octet-stream;base64,${lastExcelData}`} 
            download={`APP_${foreigner.id.replace(/[^a-zA-Z0-9]/g, '')}.xlsx`}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 justify-center py-2 border border-indigo-200 rounded-lg bg-white shadow-sm"
          >
            <FileDown className="h-3.5 w-3.5" />
            手動ダウンロード
          </a>
        </div>
      )}
    </>
  );
};
