'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, Upload, FileText,
  Sparkles, ToggleLeft, ToggleRight, AlertCircle, FileUp,
} from 'lucide-react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { getIdToken } from '@/lib/firebase/auth';
import type { AiDiagnosticRule } from '@/types/database';

// ─── API ヘルパー ────────────────────────────────────────────────────────────

async function apiRequest(url: string, options: RequestInit = {}) {
  const token = await getIdToken();
  if (!token) throw new Error('ログインセッションが切れています');
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ─── メインコンポーネント ────────────────────────────────────────────────────

export default function AiRulesSettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, dismiss, show: showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<AiDiagnosticRule[]>([]);

  // 新規テキストルール
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  // PDF アップロード
  const [showPdfForm, setShowPdfForm] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 編集中ルール
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // トグル処理中
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ─── 認証チェック ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) { router.push('/login'); return; }
    if (currentUser.role !== 'scrivener' && currentUser.role !== 'hq_admin') {
      showToast('error', '権限がありません');
      setTimeout(() => router.push('/'), 1500);
    }
  }, [currentUser, authLoading, router, showToast]);

  // ─── データ取得 ───────────────────────────────────────────────────────────

  const fetchRules = useCallback(async () => {
    try {
      const data = await apiRequest('/api/ai-rules');
      setRules(data.rules ?? []);
    } catch (err) {
      console.error('[ai-rules] Fetch error:', err);
      showToast('error', 'ルールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!authLoading && currentUser) fetchRules();
  }, [authLoading, currentUser, fetchRules]);

  // ─── テキストルール追加 ──────────────────────────────────────────────────

  const handleAddTextRule = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      showToast('error', 'ルール名と内容は必須です');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/api/ai-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      showToast('success', 'ルールを追加しました');
      setNewTitle(''); setNewContent(''); setShowAddForm(false);
      await fetchRules();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // ─── PDFアップロード ─────────────────────────────────────────────────────

  const handleUploadPdf = async () => {
    if (!pdfTitle.trim() || !pdfFile) {
      showToast('error', 'ルール名とPDFファイルは必須です');
      return;
    }
    setUploading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('ログインセッションが切れています');
      const fd = new FormData();
      fd.append('title', pdfTitle);
      fd.append('file', pdfFile);
      const res = await fetch('/api/ai-rules/upload-pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      showToast('success', data.message || 'PDFをアップロードしました');
      setPdfTitle(''); setPdfFile(null); setShowPdfForm(false);
      await fetchRules();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  // ─── 有効/無効トグル ─────────────────────────────────────────────────────

  const handleToggle = async (rule: AiDiagnosticRule) => {
    setTogglingId(rule.id);
    try {
      await apiRequest(`/api/ai-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      setRules((prev) => prev.map((r) =>
        r.id === rule.id ? { ...r, enabled: !r.enabled } : r
      ));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setTogglingId(null);
    }
  };

  // ─── ルール編集 ──────────────────────────────────────────────────────────

  const startEdit = (rule: AiDiagnosticRule) => {
    setEditingId(rule.id);
    setEditTitle(rule.title);
    setEditContent(rule.type === 'text' ? (rule.content ?? '') : '');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    setEditSaving(true);
    try {
      const body: Record<string, string> = { title: editTitle };
      const rule = rules.find((r) => r.id === editingId);
      if (rule?.type === 'text') body.content = editContent;
      await apiRequest(`/api/ai-rules/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showToast('success', 'ルールを更新しました');
      setEditingId(null);
      await fetchRules();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setEditSaving(false);
    }
  };

  // ─── ルール削除 ──────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('このルールを削除してもよろしいですか？')) return;
    try {
      await apiRequest(`/api/ai-rules/${id}`, { method: 'DELETE' });
      showToast('success', 'ルールを削除しました');
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // ─── ローディング ────────────────────────────────────────────────────────

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // ─── レンダリング ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/settings" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Sparkles size={22} className="text-indigo-600" />
                AI診断ルール管理
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">独自の診断基準の追加・PDFガイドラインのアップロード</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* ── 説明カード ── */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <div className="flex gap-3 items-start">
            <AlertCircle size={18} className="text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-sm text-indigo-800 leading-relaxed">
              <p className="font-bold mb-1">AI診断にカスタムルールを追加できます</p>
              <p>ここで追加したルールは、すべての申請書でAI診断を実行する際に自動的に適用されます。テキストで直接記述するか、入管ガイドラインPDFをアップロードしてください。</p>
            </div>
          </div>
        </div>

        {/* ── アクションボタン ── */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setShowAddForm(true); setShowPdfForm(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> テキストルールを追加
          </button>
          <button
            onClick={() => { setShowPdfForm(true); setShowAddForm(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 border border-indigo-200 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors"
          >
            <Upload size={16} /> PDFをアップロード
          </button>
        </div>

        {/* ── テキストルール追加フォーム ── */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" />
              新規テキストルール
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ルール名</label>
                <input
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例：最低賃金の基準引き上げ（2025年10月施行）"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ルール内容（自然言語で記述）</label>
                <textarea
                  value={newContent} onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  placeholder={"例：月給が180,000円を下回る場合は warning を出すこと。\nメッセージ：「2025年10月の最低賃金改定により、月給180,000円以上が推奨されます。」"}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y font-mono"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">キャンセル</button>
                <button onClick={handleAddTextRule} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PDFアップロードフォーム ── */}
        {showPdfForm && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <FileUp size={16} className="text-indigo-500" />
              PDFガイドラインのアップロード
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ルール名</label>
                <input
                  value={pdfTitle} onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="例：入管ガイドライン 2025年版"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">PDFファイル（最大20MB）</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors">
                    <Upload size={14} /> ファイルを選択
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
                  </label>
                  {pdfFile && <span className="text-sm text-slate-600 truncate max-w-[250px]">{pdfFile.name}</span>}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowPdfForm(false)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">キャンセル</button>
                <button onClick={handleUploadPdf} disabled={uploading} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? 'テキスト抽出中...' : 'アップロード'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ルール一覧 ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500" />
              登録済みルール
              <span className="text-sm font-normal text-slate-500">（{rules.length}件）</span>
            </h2>
          </div>

          {rules.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">まだカスタムルールが登録されていません</p>
              <p className="text-xs mt-1">上のボタンからルールを追加してください</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <div key={rule.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  {editingId === rule.id ? (
                    /* 編集モード */
                    <div className="space-y-3">
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                      {rule.type === 'text' && (
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={5} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y font-mono" />
                      )}
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-500">キャンセル</button>
                        <button onClick={handleSaveEdit} disabled={editSaving} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">
                          {editSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} 保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 表示モード */
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {rule.type === 'pdf' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-xs font-bold"><FileUp size={10} /> PDF</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold"><FileText size={10} /> テキスト</span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${rule.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {rule.enabled ? '有効' : '無効'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">{rule.title}</h3>
                        {rule.type === 'text' && rule.content && (
                          <p className="text-xs text-slate-500 line-clamp-2 whitespace-pre-wrap">{rule.content}</p>
                        )}
                        {rule.type === 'pdf' && rule.pdfFileName && (
                          <p className="text-xs text-slate-500">
                            📄 {rule.pdfFileName}
                            {rule.pdfExtractedText && ` — ${rule.pdfExtractedText.length.toLocaleString()}文字抽出済`}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(rule.createdAt).toLocaleDateString('ja-JP')} 作成
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* トグル */}
                        <button
                          onClick={() => handleToggle(rule)}
                          disabled={togglingId === rule.id}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                          title={rule.enabled ? '無効にする' : '有効にする'}
                        >
                          {togglingId === rule.id ? <Loader2 size={18} className="animate-spin" /> : rule.enabled ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                        </button>
                        {/* 編集 */}
                        <button onClick={() => startEdit(rule)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 text-xs font-medium">編集</button>
                        {/* 削除 */}
                        <button onClick={() => handleDelete(rule.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
