'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Loader2, ArrowLeft, ShieldAlert, UserCircle } from 'lucide-react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function SettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, dismiss, show: showToast } = useToast();

  React.useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // 行政書士（Scrivener）チェック
    if (currentUser.role !== 'scrivener') {
      showToast('error', '権限がありません');
      setTimeout(() => router.push('/'), 1500);
      return;
    }
  }, [currentUser, authLoading, router, showToast]);

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* ─── ヘッダー ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Settings size={22} className="text-indigo-600" />
                設定
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">各種設定とシステムメンテナンス</p>
            </div>
        </div>
      </header>

      {/* ─── メインコンテンツ ─────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        


        {/* ─── システムメンテナンス ─── */}
        <div className="mt-6 bg-white rounded-2xl shadow-xs border border-rose-200 overflow-hidden">
          <div className="p-6 border-b border-rose-100 bg-rose-50/30">
            <h2 className="text-lg font-bold flex items-center gap-2 text-rose-600">
              <ShieldAlert size={18} />
              システムメンテナンス
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              データベースの不整合や表示のズレが発生した場合の強制リセットツールです。
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700">ダッシュボード数値の再集計</h3>
                <p className="text-xs text-slate-500 mt-1">
                  一覧画面上部のタブ（進行中の申請、完了など）の数字が実際のリスト件数と合わない場合、このボタンを押して全データを数え直してください。
                </p>
              </div>
              <RecalculateButton showToast={showToast} />
            </div>

          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function RecalculateButton({ showToast }: { showToast: (type: 'success'|'error', msg: string) => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/admin/recalculate-stats', { method: 'POST' });
          if (!res.ok) throw new Error('API Error');
          showToast('success', '再集計が完了しました。画面を更新すると反映されます。');
        } catch (err) {
          console.error(err);
          showToast('error', '再集計に失敗しました');
        } finally {
          setLoading(false);
        }
      }}
      className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
      再集計を実行
    </button>
  );
}
