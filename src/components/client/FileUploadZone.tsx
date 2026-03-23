'use client';

import React, { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadZoneProps {
  label: string;
  accept?: string;
  file?: File | null;
  onFileSelect?: (file: File | null) => void;
  onValidationSuccess?: (extractedData: Record<string, string | null>) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ label, accept = "image/*", file, onFileSelect, onValidationSuccess }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setErrorReason(null);
    if (!file.type.startsWith('image/')) {
      // PDF等の場合はそのまま許可
      if (onFileSelect) onFileSelect(file);
      return;
    }

    setIsChecking(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      const res = await fetch('/api/validate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });

      const data = await res.json();
      if (!data.isValid) {
        if (data.systemError) {
          // AI自体のエラーの場合は、進行を止めないことも考慮できますが、今回はエラーとして表示
          setErrorReason('AIのエラーが発生しました。APIキー等が未設定の可能性があります。');
        } else {
          setErrorReason(data.reason);
        }
        
        // input fieldをリセットする
        const input = document.getElementById(`file-input-${label}`) as HTMLInputElement;
        if (input) input.value = '';
      } else {
        if (onFileSelect) onFileSelect(file);
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
    const file = e.target.files?.[0] || null;
    if (file) {
      processFile(file);
    } else {
      if (onFileSelect) onFileSelect(null);
    }
  };

  const handleRemove = () => {
    setErrorReason(null);
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      
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
          const file = e.dataTransfer.files?.[0] || null;
          if (file) processFile(file);
        }}
      >
        <AnimatePresence mode="wait">
          {isChecking ? (
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
              className="flex items-center gap-4 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 overflow-hidden">
                {file.type.startsWith('image/') ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={handleRemove}
                className="p-2 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
