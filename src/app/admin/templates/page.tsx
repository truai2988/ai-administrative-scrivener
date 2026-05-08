'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Loader2,
  ArrowLeft,
  Trash2,
  FileSpreadsheet,
  Download,
  X,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';

import type { DocumentTemplate } from '@/types/database';
import { fetchDocumentTemplates, deleteDocumentTemplate } from '@/lib/api/templateAdminClient';
import { UploadTemplateModal } from './_components/UploadTemplateModal';

// ─── ローカル トースト ────────────────────────────────────────────────────────
interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

function useLocalToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, show, dismiss };
}

// ─── メインコンポーネント ──────────────────────────────────────────────────────
export default function AdminTemplatesPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, show: showToast, dismiss } = useLocalToast();

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // フォーム状態
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 削除状態
  const [confirmDelete, setConfirmDelete] = useState<DocumentTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 管理者権限チェック
  const canManage = currentUser?.role === 'scrivener' || currentUser?.role === 'hq_admin';

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // 閲覧権限がない場合はリダイレクト
    if (!canManage) {
      router.push('/');
    }
  }, [currentUser, authLoading, router, canManage]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDocumentTemplates();
      setTemplates(data);
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message || 'テンプレート一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!authLoading && canManage) {
      loadTemplates();
    }
  }, [authLoading, canManage, loadTemplates]);

  // ─── 削除ハンドラ ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await deleteDocumentTemplate(confirmDelete.id, confirmDelete.storagePath);
      showToast('success', 'テンプレートを削除しました');
      setConfirmDelete(null);
      loadTemplates();
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message || 'テンプレートの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── ロードガード表示 ──────────────────────────────────────────────────────
  if (authLoading || (currentUser && !canManage && !authLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* ─── トースト表示 ─── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
                t.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}
            >
              <div className="text-sm font-bold">{t.message}</div>
              <button onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── ヘッダー ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FileText size={22} className="text-indigo-600" />
                テンプレートマスター管理
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                出力用原本（Excel / Word）の登録・管理
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Upload size={16} />
              新規テンプレート登録
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* ─── テンプレート一覧 ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <FileSpreadsheet size={17} className="text-slate-500" />
              登録済みテンプレート
              <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                {templates.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <FileText size={36} className="text-slate-200" />
              <p className="text-sm font-medium">まだテンプレートが登録されていません</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      template.fileType === 'excel' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800">{template.formName}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          template.fileType === 'excel' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                          {template.fileType.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5">
                          <p className="text-xs text-slate-500 font-mono">
                            {template.formId}
                          </p>
                          <button
                            onClick={() => handleCopy(template.formId)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="IDをコピー"
                          >
                            {copiedId === template.formId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(template.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={template.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      <Download size={14} />
                      ダウンロード
                    </a>
                    <button
                      onClick={() => setConfirmDelete(template)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ─── アップロードモーダル ──────────────────────────────────────────────── */}
      <UploadTemplateModal
        show={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          loadTemplates();
        }}
        showToast={showToast}
      />

      {/* ─── 削除確認ダイアログ ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 bg-rose-50/50">
                <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
                  <Trash2 size={17} />
                  テンプレートの削除
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-700">
                  <span className="font-bold">「{confirmDelete.formName}」</span>を完全に削除しますか？
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    ⚠️ この操作は元に戻せません。Storage 上の実体ファイルも削除されます。
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    削除する
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
