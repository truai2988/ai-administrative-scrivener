'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadDocumentTemplate } from '@/lib/api/templateAdminClient';

interface UploadTemplateModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function UploadTemplateModal({
  show,
  onClose,
  onSuccess,
  showToast,
}: UploadTemplateModalProps) {
  const { currentUser } = useAuth();
  
  const [formName, setFormName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormName('');
    setFile(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (isUploading) return;
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
      ];
      if (!validTypes.includes(droppedFile.type) && !droppedFile.name.match(/\.(xlsx|docx)$/)) {
        showToast('error', 'Excel(.xlsx) または Word(.docx) ファイルのみアップロード可能です');
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!file) {
      showToast('error', 'ファイルを選択してください');
      return;
    }
    if (!formName) {
      showToast('error', '必須項目を入力してください');
      return;
    }

    const isExcel = file.name.endsWith('.xlsx');
    const isWord = file.name.endsWith('.docx');
    
    if (!isExcel && !isWord) {
      showToast('error', 'Excel(.xlsx) または Word(.docx) のみをアップロードしてください');
      return;
    }

    const fileType = isExcel ? 'excel' : 'word';

    // 完全自動で一意のID（例: tpl_a1b2c3d4）を生成
    const generatedFormId = `tpl_${Math.random().toString(36).substring(2, 10)}`;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadDocumentTemplate(
        file,
        generatedFormId,
        formName,
        fileType,
        currentUser.id,
        (progress) => setUploadProgress(progress)
      );
      
      // アップロード完了時に自動でクリップボードにコピー
      try {
        await navigator.clipboard.writeText(generatedFormId);
        showToast('success', `アップロード完了（ID: ${generatedFormId} をコピーしました）`);
      } catch (_) {
        showToast('success', 'テンプレートのアップロードが完了しました');
      }
      
      resetForm();
      onSuccess();
    } catch (error: unknown) {
      const err = error as Error;
      showToast('error', err.message || 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
        >
          {/* ヘッダー */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText size={20} className="text-indigo-500" />
                新規テンプレートのアップロード
              </h3>
            </div>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="p-6 overflow-y-auto">
            <form id="templateUploadForm" onSubmit={handleSubmit} className="space-y-6">
              
              {/* formName 入力 */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  テンプレート名称（書類名） <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例: 事業計画書"
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              {/* ドラッグ＆ドロップ エリア */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  原本ファイル (.xlsx / .docx) <span className="text-rose-500">*</span>
                </label>
                
                {file ? (
                  <div className="border border-indigo-200 bg-indigo-50 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm">
                        <FileText size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{file.name}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors
                      ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}
                      ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100">
                      <Upload size={24} className="text-indigo-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700">
                        ここにファイルをドロップ
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        または、クリックしてファイルを選択
                      </p>
                    </div>
                    <p className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full mt-2">
                      .xlsx または .docx
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .docx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                />
              </div>

              {/* プログレスバー */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>アップロード中...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* フッター */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              form="templateUploadForm"
              disabled={!file || !formName || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  アップロード中...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  登録する
                </>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
