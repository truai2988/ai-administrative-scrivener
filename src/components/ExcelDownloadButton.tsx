'use client';

import React, { useState } from 'react';
import { generateApplicationExcel } from '@/app/actions/exportExcel';
import { Foreigner } from '@/types/database';
import { FileDown, Loader2, CheckCircle } from 'lucide-react';

interface ExcelDownloadButtonProps {
  foreigner: Foreigner;
}

export const ExcelDownloadButton: React.FC<ExcelDownloadButtonProps> = ({ foreigner }) => {
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
        console.log('Excel generation successful, file size:', result.data.length);
        setLastExcelData(result.data);
        
        try {
          // 最も互換性の高いファイル名（英数字のみ、短く）
          const simpleName = `APP_${foreigner.id.replace(/[^a-zA-Z0-9]/g, '')}.xlsx`;
          
          // MIMEタイプを汎用的なoctet-streamに変更してブラウザの処理を単純化
          const dataUrl = `data:application/octet-stream;base64,${result.data}`;
          
          const link = document.createElement('a');
          link.href = dataUrl;
          link.setAttribute('download', simpleName);
          
          document.body.appendChild(link);
          link.click();
          
          console.log('Download link triggered for:', simpleName);

          setIsDone(true);
          // 10秒間ダウンロード完了状態を維持し、ユーザーが手動リンクを触れる時間を確保
          setTimeout(() => setIsDone(false), 10000);

          // リンクの削除を遅延させて確実に発火させる
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          }, 2000);
        } catch (err) {
          console.error('Download setup failed:', err);
        }
      }
 else {
        alert('Excelの生成に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
          isDone 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            帳票を生成中...
          </>
        ) : isDone ? (
          <>
            <CheckCircle className="h-4 w-4" />
            ダウンロード済み
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" />
            入管提出用Excelを一括生成
          </>
        )}
      </button>
      
      {isDone && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
            自動でダウンロードが始まらない場合は、以下のリンクを<b>右クリックして「名前を付けてリンク先を保存」</b>を選択してください。
          </p>
          <a 
            href={`data:application/octet-stream;base64,${lastExcelData}`} 
            download={`APP_${foreigner.id.replace(/[^a-zA-Z0-9]/g, '')}.xlsx`}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 justify-center py-2 border border-indigo-200 rounded-lg bg-white shadow-sm"
          >
            <FileDown className="h-4 w-4" />
            ここを右クリックして「名前を付けて保存」
          </a>
        </div>
      )}
    </>
  );
};
