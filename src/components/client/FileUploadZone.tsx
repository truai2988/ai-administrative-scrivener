'use client';

import React, { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  compressPhotoForImmigration,
  compressDocumentToPdf,
  formatFileSize,
} from '@/utils/imageCompression';

export type CompressionType = 'photo' | 'document' | 'none';

interface FileUploadZoneProps {
  label: string;
  accept?: string;
  file?: File | null;
  compressionType?: CompressionType;
  onFileSelect?: (file: File | null) => void;
  onValidationSuccess?: (extractedData: Record<string, string | null>) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  label,
  accept = "image/*",
  file,
  compressionType = 'none',
  onFileSelect,
  onValidationSuccess,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionResult, setCompressionResult] = useState<{
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);

  const compressFile = async (inputFile: File): Promise<File> => {
    if (compressionType === 'none') return inputFile;

    // 画像ファイルでない場合はスキップ
    if (!inputFile.type.startsWith('image/')) return inputFile;

    setIsCompressing(true);
    setCompressionProgress(0);
    setCompressionResult(null);

    try {
      let result;
      if (compressionType === 'photo') {
        result = await compressPhotoForImmigration(inputFile, setCompressionProgress);
      } else {
        result = await compressDocumentToPdf(inputFile, setCompressionProgress);
      }

      setCompressionResult({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
      });

      return result.file;
    } catch (error) {
      console.error('Compression error:', error);
      // 圧縮失敗時は元ファイルをそのまま使う
      return inputFile;
    } finally {
      setIsCompressing(false);
    }
  };

  /** 検証用に長辺800pxにリサイズする（転送量削減） */
  const resizeForValidation = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = url;
    });
  };

  const processFile = async (rawFile: File) => {
    setErrorReason(null);
    setCompressionResult(null);

    if (!rawFile.type.startsWith('image/')) {
      // PDF等の場合はそのまま許可
      if (onFileSelect) onFileSelect(rawFile);
      return;
    }

    // 圧縮とリサイズを並行して実行
    setIsChecking(true);
    const [compressedFile, base64ForValidation] = await Promise.all([
      compressFile(rawFile),
      resizeForValidation(rawFile),
    ]);

    try {
      const res = await fetch('/api/validate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64ForValidation, mimeType: 'image/jpeg' }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        setErrorReason('サーバーから予期せぬエラーが返されました（500エラー等）。サーバーのログを確認してください。');
        const input = document.getElementById(`file-input-${label}`) as HTMLInputElement;
        if (input) input.value = '';
        return;
      }

      if (!data.isValid) {
        if (data.systemError && !data.reason) {
          setErrorReason('AIのエラーが発生しました。APIキー等が未設定の可能性があります。');
        } else {
          setErrorReason(data.reason || '画像の検証に失敗しました。');
        }

        const input = document.getElementById(`file-input-${label}`) as HTMLInputElement;
        if (input) input.value = '';
      } else {
        // 圧縮後のファイルを設定
        if (onFileSelect) onFileSelect(compressedFile);
        if (onValidationSuccess && data.extractedData) {
          onValidationSuccess(data.extractedData);
        }
      }
    } catch (e) {
      console.error(e);
      setErrorReason('通信エラーが発生しました。再度お試しください。');
    } finally {
      setIsChecking(false);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      processFile(selectedFile);
    } else {
      if (onFileSelect) onFileSelect(null);
    }
  };

  const handleRemove = () => {
    setErrorReason(null);
    setCompressionResult(null);
    if (onFileSelect) onFileSelect(null);
  };

  const compressionLabel = compressionType === 'photo'
    ? '顔写真用 (JPEG 50KB以下に自動圧縮)'
    : compressionType === 'document'
      ? '書類用 (PDF形式に自動変換)'
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
        {compressionLabel && (
          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 flex items-center gap-1">
            <Minimize2 className="w-2.5 h-2.5" />
            {compressionLabel}
          </span>
        )}
      </div>
      
      {errorReason && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-3 rounded-xl shadow-sm flex items-center justify-between gap-2"
        >
          <p className="font-medium">{errorReason}</p>
          <button 
            type="button" 
            onClick={() => setErrorReason(null)}
            className="p-1 hover:bg-rose-100 rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-rose-500 hover:text-rose-700" />
          </button>
        </motion.div>
      )}

      <div 
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-300 ${
          isDragOver ? 'border-indigo-500 bg-indigo-50/50' : 
          file ? 'border-emerald-500 bg-emerald-50/30' : 
          errorReason ? 'border-rose-300 bg-rose-50/30' :
          'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const droppedFile = e.dataTransfer.files?.[0] || null;
          if (droppedFile) processFile(droppedFile);
        }}
      >
        <AnimatePresence mode="wait">
          {isCompressing ? (
            <motion.div 
              key="compressing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6"
            >
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-3" />
              <p className="text-sm font-bold text-teal-700">
                {compressionType === 'photo' ? 'JPEG圧縮中...' : 'PDF変換中...'}
              </p>
              <div className="w-48 bg-teal-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <motion.div
                  className="h-full bg-teal-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${compressionProgress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-teal-400 mt-2">{compressionProgress}% 完了</p>
            </motion.div>
          ) : isChecking ? (
            <motion.div 
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6"
            >
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm font-bold text-indigo-700">AIが画像の鮮明さをチェックしています...</p>
              <p className="text-[10px] text-indigo-400 mt-1">光の反射やピンボケがないか確認中</p>
            </motion.div>
          ) : !file ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-4 cursor-pointer"
              onClick={() => document.getElementById(`file-input-${label}`)?.click()}
            >
              <div className="p-3 bg-white rounded-xl shadow-sm mb-3">
                <Upload className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-slate-600">タップしてファイルを選択</p>
              <p className="text-[10px] text-slate-400 mt-1">またはドラッグ＆ドロップ</p>
              <input 
                id={`file-input-${label}`}
                type="file" 
                className="hidden" 
                accept={accept}
                onChange={handleFileChange}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="selected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 overflow-hidden">
                  {file.type.startsWith('image/') ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                </div>
                <button 
                  onClick={handleRemove}
                  className="p-2 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 圧縮結果の表示 */}
              {compressionResult && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100 text-[10px]"
                >
                  <Minimize2 className="w-3 h-3 text-teal-600" />
                  <span className="font-bold text-teal-700">自動圧縮済</span>
                  <span className="text-teal-500">
                    {formatFileSize(compressionResult.originalSize)} → {formatFileSize(compressionResult.compressedSize)}
                    <span className="ml-1 text-teal-400">
                      ({Math.round((1 - compressionResult.compressedSize / compressionResult.originalSize) * 100)}% 削減)
                    </span>
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
