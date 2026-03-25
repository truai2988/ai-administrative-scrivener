'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { foreignerService } from '@/services/foreignerService';
import { Foreigner } from '@/types/database';
import { SummaryCards } from '@/components/SummaryCards';
import { ForeignerList } from '@/components/ForeignerList';
import { ForeignerDetail } from '@/components/ForeignerDetail';
import { CsvDownloadButton } from '@/components/CsvDownloadButton';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Settings, UserCircle, Bell, LogOut, Menu, Database, Loader2, QrCode, Copy, Check, ExternalLink, X, FileText, PenTool, Sparkles } from 'lucide-react';

// ─── Toast Message Component ─────────────────────────────────────────────────
function ToastNotification({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30 border border-slate-700/50 backdrop-blur-lg"
    >
      <div className="h-8 w-8 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
        <Sparkles className="h-4 w-4 text-indigo-400" />
      </div>
      <div>
        <p className="text-sm font-bold">{message}</p>
        <p className="text-[11px] text-slate-400 font-medium">Coming Soon: 2026年実装予定</p>
      </div>
      <button onClick={onClose} className="ml-2 p-1 text-slate-500 hover:text-white transition-colors rounded-lg">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── Coming Soon Sidebar Items ───────────────────────────────────────────────
const COMING_SOON_ITEMS: { icon: React.ElementType; label: string; toastMessage: string; badge?: number }[] = [
  { icon: UserCircle, label: '外国人管理・台帳', toastMessage: '高度な外国人台帳管理' },
  { icon: Bell, label: '通知・期限アラート', toastMessage: '自動期限監視アラート', badge: 12 },
  { icon: FileText, label: '附属書類PDFの自動生成', toastMessage: '附属書類PDFの自動生成' },
  { icon: PenTool, label: '完全電子署名', toastMessage: '完全電子署名' },
  { icon: Settings, label: 'システム設定', toastMessage: 'エンタープライズ設定パネル' },
];

export function DashboardClient({ initialData = [] }: { initialData?: Foreigner[] }) {
  const [data, setData] = useState<Foreigner[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [selectedForeigner, setSelectedForeigner] = useState<Foreigner | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Welcome banner
  const [showWelcome, setShowWelcome] = useState(true);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 共有モーダル用のステート
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareToken, setShareToken] = useState('dummy-token-123');

  // モーダルを開くたびに新しいテスト用トークンを生成
  useEffect(() => {
    if (showShareModal) {
      setShareToken(`test-${Math.random().toString(36).slice(2, 6)}-${Date.now().toString().slice(-4)}`);
    }
  }, [showShareModal]);

  const entryUrl = typeof window !== 'undefined' ? `${window.location.origin}/foreigner/entry/${shareToken}` : '';

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const fetched = await foreignerService.getAllForeigners();
        setData(fetched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const showComingSoon = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  // Calculate summaries (use 0/empty if loading)
  const total = data.length;
  const expiringSoon = data.filter((p) => {
    const days = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days < 90 && days > 0;
  }).length;
  const pending = data.filter((p) => p.status === 'チェック中' || p.status === '準備中').length;
  const completed = data.filter(p => p.status === '申請済').length;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white border-r border-slate-100 shadow-sm z-20">
        {/* Logo - Fixed */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-linear-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600 tracking-tight">
                Noctiluca
              </span>
              <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">AI Labor Management</p>
            </div>
          </div>
          {/* Demo Version Badge */}
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/60 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 tracking-wide">DEMO VERSION</span>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-8 py-4 space-y-2 no-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="総合ダッシュボード" active />
          {COMING_SOON_ITEMS.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              onClick={() => showComingSoon(item.toastMessage)}
            />
          ))}
        </nav>

        {/* Support & Logout - Fixed at bottom */}
        <div className="p-8 pt-4 border-t border-slate-50 space-y-4 bg-white">
          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100/50">
            <p className="text-xs font-bold text-indigo-600 mb-1">サポート窓口</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">ご不明点はいつでもAIアシスタントへお尋ねください。</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SidebarItem icon={LogOut} label="ログアウト" />
            </div>
            <button 
              onClick={async () => {
                if (confirm('デモデータを3件投入します。よろしいですか？')) {
                  // データ投入中はローディングにする
                  setLoading(true);
                  const res = await foreignerService.seedDemoData();
                  if (res.success) {
                    // 最新データを再取得する
                    const fetched = await foreignerService.getAllForeigners();
                    setData(fetched);
                  } else {
                    alert('エラーが発生しました: ' + res.error);
                  }
                  setLoading(false);
                }
              }}
              title="デモデータ一括投入"
              className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
            >
              <Database className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 md:p-10 lg:p-14 max-w-[1600px] mx-auto w-full relative">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">管理概要</h1>
            <p className="text-slate-500 font-medium">現在、<span className="text-indigo-600 font-bold">{loading ? '-' : total}名</span>の外国人を管理しています。</p>
          </div>
          <div className="flex items-center gap-5">
            {!loading && (
              <div className="hidden sm:block">
                <CsvDownloadButton foreigners={data.filter(f => selectedIds.has(f.id))} />
              </div>
            )}

            <button 
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              新規登録URL発行
            </button>

            <button className="p-3 bg-white border border-slate-100 rounded-2xl hover:shadow-lg hover:shadow-indigo-50 transition-all relative group">
              <Bell className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            </button>
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                <UserCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-tight">管理者 様</p>
                <p className="text-[10px] font-bold text-emerald-500">プロフェッショナル認証</p>
              </div>
            </div>
            <button className="lg:hidden p-3 bg-white border border-slate-100 rounded-2xl">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Welcome Banner */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-10"
            >
              <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-8 md:p-10 shadow-xl shadow-indigo-200/40">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
                <div className="absolute top-8 right-12 w-2 h-2 bg-white/30 rounded-full" />
                <div className="absolute top-16 right-32 w-1.5 h-1.5 bg-white/20 rounded-full" />
                
                <button
                  onClick={() => setShowWelcome(false)}
                  className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="px-3 py-1 bg-white/15 backdrop-blur-sm text-white text-[10px] font-bold rounded-full border border-white/20 tracking-wider uppercase">
                      Noctiluca Demo
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-snug mb-3 tracking-tight">
                    外国人管理から、<br className="hidden md:block" />紙とハンコを完全撤廃。
                  </h2>
                  <p className="text-sm md:text-base text-indigo-100 font-medium leading-relaxed max-w-xl">
                    法改正リスクをゼロにする、AI労務管理システムへようこそ
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <p className="text-slate-500 font-bold text-sm">データを読み込み中...</p>
          </div>
        ) : (
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <SummaryCards
                total={total}
                expiringSoon={expiringSoon}
                pending={pending}
                completed={completed}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <ForeignerList 
                data={data} 
                onSelect={(f) => setSelectedForeigner(f)}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </motion.div>
          </div>
        )}

        {/* Full Screen Detail Modal/Panel */}
        {selectedForeigner && (
          <ForeignerDetail 
            foreigner={selectedForeigner} 
            onClose={() => {
              setSelectedForeigner(null);
            }} 
            onUpdate={(updatedInfo) => {
              setData((prev) => prev.map((f) => f.id === updatedInfo.id ? updatedInfo : f));
              setSelectedForeigner(updatedInfo);
            }}
          />
        )}

        {/* 共有モーダル */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">URLを共有する</h3>
                      <p className="text-xs text-slate-500">外国人に申請用URLを送信します</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowShareModal(false)}
                    className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 flex flex-col items-center">
                  {/* QR Code (using public API for simplicity) */}
                  <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(entryUrl)}`} 
                      alt="QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <p className="text-sm font-bold text-slate-700 mb-2">目の前にいる場合はQRコードをスキャン</p>
                  <p className="text-xs text-slate-500 text-center mb-8">
                    スマートフォンのカメラで読み取ると、<br/>すぐに申請画面が開きます。
                  </p>

                  <div className="w-full space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">またはURLを送信</p>
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 overflow-hidden">
                        <p className="text-sm text-slate-600 font-medium truncate">{entryUrl}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(entryUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors flex shrink-0 items-center justify-center w-11 h-11"
                      >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>

                    <button
                      onClick={() => window.open(entryUrl, '_blank')}
                      className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      テスト用画面をブラウザで開く
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <ToastNotification
              message={toastMessage}
              onClose={() => setToastMessage(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ 
  icon: Icon, 
  label, 
  active = false, 
  badge,
  onClick
}: { 
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
        active 
          ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-medium'
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-300'}`} />
      <span className="text-sm">{label}</span>
      {badge && (
        <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${
          active ? 'bg-indigo-500 text-white' : 'bg-rose-50 text-rose-500'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
