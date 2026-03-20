'use client';

import React, { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadZoneProps {
  label: string;
  accept?: string;
  onFileSelect?: (file: File | null) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ label, accept = "image/*", onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-300 ${
          isDragOver ? 'border-indigo-500 bg-indigo-50/50' : selectedFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0] || null;
          setSelectedFile(file);
          if (onFileSelect) onFileSelect(file);
        }}
      >
        <AnimatePresence mode="wait">
          {!selectedFile ? (
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
                {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
