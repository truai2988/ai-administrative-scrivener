'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  compressPhotoForImmigration,
  formatFileSize,
} from '@/utils/imageCompression';

interface PhotoUploadZoneProps {
  file?: File | null;
  onFileSelect?: (file: File | null) => void;
}

export const PhotoUploadZone: React.FC<PhotoUploadZoneProps> = ({
  file,
  onFileSelect,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionResult, setCompressionResult] = useState<{
    originalSize: number;
    compressedSize: number;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (rawFile: File) => {
    setErrorReason(null);
    setCompressionResult(null);

    if (!rawFile.type.startsWith('image/')) {
      setErrorReason('画像ファイルを選択してください。');
      return;
    }

    setIsCompressing(true);
    setCompressionProgress(0);

    try {
      const result = await compressPhotoForImmigration(rawFile, setCompressionProgress);

      setCompressionResult({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
      });

      // プレビュー生成
      const url = URL.createObjectURL(result.file);
      setPreviewUrl(url);

      if (onFileSelect) onFileSelect(result.file);
    } catch (error) {
      console.error('Photo compression error:', error);
      setErrorReason('画像の圧縮に失敗しました。別の画像をお試しください。');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemove = () => {
    setErrorReason(null);
    setCompressionResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (onFileSelect) onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isUnderLimit = compressionResult ? compressionResult.compressedSize <= 50 * 1024 : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
          顔写真（証明写真）
        </label>
        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
          <Camera className="w-2.5 h-2.5" />
          50KB以下に自動変換・圧縮
        </span>
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
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* メインエリア: 証明写真比率 (4:3 縦長) */}
      <div className="flex gap-5 items-start">
        {/* 写真プレビュー枠 (縦40mm × 横30mm = 4:3) */}
        <div
          className={`relative w-[120px] h-[160px] rounded-2xl border-2 border-dashed overflow-hidden shrink-0 transition-all duration-300 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : file && previewUrl
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const droppedFile = e.dataTransfer.files?.[0];
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
                className="absolute inset-0 flex flex-col items-center justify-center bg-white/90"
              >
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                <p className="text-xs font-bold text-amber-700">圧縮中...</p>
                <div className="w-16 bg-amber-100 rounded-full h-1 mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${compressionProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ) : previewUrl ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="顔写真プレビュー"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => inputRef.current?.click()}
              >
                <div className="p-2 bg-white rounded-xl shadow-sm mb-2">
                  <Camera className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-xs font-bold text-slate-500">タップして</p>
                <p className="text-xs font-bold text-slate-500">アップロード</p>
                <p className="text-xs text-slate-300 mt-1">40×30mm</p>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
            }}
          />
        </div>

        {/* 右側: 説明 + 圧縮結果 */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 leading-relaxed space-y-1">
            <p className="font-bold text-slate-700">入管規定:</p>
            <p>• 縦40mm × 横30mm（証明写真サイズ）</p>
            <p>• 画像ファイル（自動で50KB以下のJPEGに変換されます）</p>
            <p>• 背景は白または薄い色</p>
            <p className="text-amber-600 font-bold mt-2">
              スマホ写真でもOK — 自動で圧縮されます
            </p>
          </div>

          {/* 圧縮結果フィードバック */}
          <AnimatePresence>
            {compressionResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl p-3 border text-xs space-y-1.5 ${
                  isUnderLimit
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isUnderLimit ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className={`font-black ${isUnderLimit ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isUnderLimit ? '入管規定クリア ✓' : '規定超過 — 再撮影してください'}
                  </span>
                </div>
                <div className={`font-bold ${isUnderLimit ? 'text-emerald-600' : 'text-amber-600'}`}>
                  圧縮前: {formatFileSize(compressionResult.originalSize)} ➔ 圧縮後: {formatFileSize(compressionResult.compressedSize)}
                  <span className="ml-1.5 text-xs opacity-70">
                    ({Math.round((1 - compressionResult.compressedSize / compressionResult.originalSize) * 100)}% 削減)
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
