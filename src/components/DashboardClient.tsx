'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useForeigners } from '@/hooks/useForeigners';
import { foreignerService } from '@/services/foreignerService';
import { Foreigner, USER_ROLE_LABELS, UserRole } from '@/types/database';
import { canCreateForeigner } from '@/utils/permissions';
import { SummaryCards } from '@/components/SummaryCards';
import { ForeignerList } from '@/components/ForeignerList';

import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Settings, UserCircle, Bell, LogOut, Database, Loader2, QrCode, Copy, Check, X, Sparkles, Shield, AlertTriangle, FilePen } from 'lucide-react';
import Link from 'next/link';

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
];

// ─── Role Badge Colors ───────────────────────────────────────────────────────
const ROLE_BADGE_STYLES: Record<string, string> = {
  branch_staff: 'bg-sky-50 text-sky-600 border-sky-100',
  hq_admin: 'bg-violet-50 text-violet-600 border-violet-100',
  scrivener: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  enterprise_staff: 'bg-amber-50 text-amber-600 border-amber-100',
};

export function DashboardClient({ initialData = [] }: { initialData?: Foreigner[] }) {
  const { currentUser, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { data, loading, setData } = useForeigners(currentUser, initialData);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // hq_admin専用: タブ選択状態 ('all' | 'hq_direct' | branchId)
  const [activeTab, setActiveTab] = useState<string>('all');
  // データ整合性チェックパネル（scrivener専用）
  const [showIntegrityPanel, setShowIntegrityPanel] = useState(false);
  // 組織ID → 表示名マップ（動的・APIから取得）
  const [organizationLabelMap, setOrganizationLabelMap] = useState<Record<string, string>>({});
  // 登録済み組織のリスト（タブ表示の根拠。typeも保持しheadquartersを除外するため）
  const [organizationsList, setOrganizationsList] = useState<Array<{ id: string; name: string; type: string }>>([]);

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

  const entryUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/foreigner/entry/${shareToken}${currentUser?.organizationId ? `?b=${currentUser.organizationId}` : ''}` 
    : '';

  useEffect(() => {
    setMounted(true);
  }, []);

  // 組織一覧を取得してタブリストと表示名マップを構築
  useEffect(() => {
    if (!currentUser) return;
    const roles = ['scrivener', 'hq_admin'];
    if (!roles.includes(currentUser.role)) return;

    (async () => {
      try {
        const { fetchOrganizations } = await import('@/lib/api/adminClient');
        const orgs = await fetchOrganizations();
        const map: Record<string, string> = {};
        const list: Array<{ id: string; name: string; type: string }> = [];
        for (const org of orgs) {
          map[org.id] = org.name;
          list.push({ id: org.id, name: org.name, type: org.type });
        }
        setOrganizationLabelMap(map);
        setOrganizationsList(list);
      } catch {
        // 取得失敗時はフォールバックとしてIDをそのまま表示
      }
    })();
  }, [currentUser]);


  // 未ログインチェック（Middlewareを通過しても念のためクライアント側でもチェック）
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  const showComingSoon = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);



  const userRole = currentUser?.role as UserRole;
  const roleLabel = userRole ? (USER_ROLE_LABELS[userRole] || userRole) : '';
  const roleBadgeStyle = userRole ? (ROLE_BADGE_STYLES[userRole] || 'bg-slate-50 text-slate-600 border-slate-100') : '';

  // hq_admin のみ有効なフィルター適用
  const isHqAdmin = userRole === 'hq_admin';
  const displayedData = useMemo(() => {
    if (!isHqAdmin) return data;
    if (activeTab !== 'all') return data.filter(f => f.branchId === activeTab);
    return data;
  }, [data, isHqAdmin, activeTab]);

  // サマリー計算
  const { total, expiringSoon, pending, completed } = useMemo(() => {
    const total = displayedData.length;
    const expiringSoon = displayedData.filter((p) => {
      const days = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days < 90 && days > 0;
    }).length;
    const pending = displayedData.filter((p) => p.status === 'チェック中' || p.status === '準備中' || p.status === '編集中' || p.status === '差し戻し').length;
    const completed = displayedData.filter(p => p.status === '申請済').length;
    
    return { total, expiringSoon, pending, completed };
  }, [displayedData]);

  // 支部タブリスト: 支部・企業のみ（本部系を除外）
  // 本部は外国人を管轄しないためタブに表示しない
  // ※ Firestoreの実データは "headquarters"、型定義は "hq" のため両方を除外
  const branchTabs = isHqAdmin
    ? organizationsList.filter(org => org.type !== 'headquarters' && org.type !== 'hq')
    : [];

  /** branchId → 表示名のマッピング（組織APIから動的取得） */
  const getBranchLabel = (branchId: string): string => {
    if (branchId === 'hq_direct') return '本部直轄';
    return organizationLabelMap[branchId] ?? branchId;
  };

  if (!mounted || authLoading) return null;
  if (!currentUser) return null;

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

          {/* アサイン設定（scrivener用） */}
          {userRole === 'scrivener' && (
            <SidebarItem
              icon={Settings}
              label="アサイン設定"
              href="/settings"
            />
          )}

          {/* プロフィール設定（全ユーザー共通） */}
          <SidebarItem
            icon={UserCircle}
            label="プロフィール設定"
            href="/settings/profile"
          />

          {/* 組織・ユーザー管理（scrivener / hq_admin） */}
          {(userRole === 'scrivener' || userRole === 'hq_admin') && (
            <SidebarItem
              icon={Shield}
              label="組織・ユーザー管理"
              href="/admin/organizations"
            />
          )}




          {/* scrivener専用: データ整合性チェック */}
          {userRole === 'scrivener' && (() => {
            const mismatchCount = data.filter(f =>
              (f.approvalStatus === 'returned' && f.status !== '準備中') ||
              (f.approvalStatus === 'approved' && f.status !== '申請済')
            ).length;
            return (
              <button
                onClick={() => setShowIntegrityPanel(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-rose-600 hover:bg-rose-50 group"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">データ整合性チェック</span>
                {mismatchCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
                    {mismatchCount}
                  </span>
                )}
              </button>
            );
          })()}
        </nav>

        {/* Support & Logout - Fixed at bottom */}
        <div className="p-8 pt-4 border-t border-slate-50 space-y-4 bg-white">
          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100/50">
            <p className="text-xs font-bold text-indigo-600 mb-1">サポート窓口</p>
            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">Coming Soon: 2026年実装予定</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SidebarItem icon={LogOut} label="ログアウト" onClick={handleLogout} />
            </div>
            {canCreateForeigner(userRole) && (
              <button 
                onClick={async () => {
                  if (confirm('デモデータを3件投入します。よろしいですか？')) {
                    setIsSeeding(true);
                    const res = await foreignerService.seedDemoData(currentUser.organizationId ?? undefined);
                    if (res.success) {
                      const fetched = await foreignerService.getForeignersByRole(currentUser.role, currentUser.organizationId ?? undefined);
                      setData(fetched);
                    } else {
                      alert('エラーが発生しました: ' + res.error);
                    }
                    setIsSeeding(false);
                  }
                }}
                title="デモデータ一括投入"
                className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
              >
                <Database className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 md:p-10 lg:p-14 max-w-[1600px] mx-auto w-full relative">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">管理概要</h1>
            <p className="text-slate-500 font-medium">現在、<span className="text-indigo-600 font-bold">{loading ? '-' : data.length}名</span>の外国人を管理しています。</p>
          </div>
          <div className="flex items-center gap-5">

            {canCreateForeigner(userRole) && (
              <button 
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                新規申請
              </button>
            )}



            {/* ユーザー情報（ロール表示） */}
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                {userRole === 'scrivener' ? (
                  <Shield className="h-6 w-6 text-emerald-500" />
                ) : (
                  <UserCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-tight">{currentUser.displayName} 様</p>
                {/* 名前と役職名が実質的に同じ場合は役職バッジを隠す（二重表記防止） */}
                {currentUser.displayName.replace(/\s+/g, '') !== roleLabel.replace(/\s+/g, '') && (
                  <p className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${roleBadgeStyle} inline-block mt-0.5`}>
                    {roleLabel}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        {loading || isSeeding ? (
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
              {/* hq_admin: タブバー */}
              {isHqAdmin && (
                <div className="flex mb-6 overflow-x-auto no-scrollbar">
                  <div className="inline-flex bg-slate-100 rounded-2xl p-1 gap-1 shrink-0">
                    {/* すべて（全件表示フィルター） */}
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                        activeTab === 'all'
                          ? 'bg-white text-violet-700 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      すべて
                      <span className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-full">
                        {data.length}
                      </span>
                    </button>

                    {/* 動的支部タブ（登録済み組織を根拠に表示・外国人数は無関係） */}
                    {branchTabs.map(org => (
                      <button
                        key={org.id}
                        onClick={() => setActiveTab(org.id)}
                        className={`px-5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                          activeTab === org.id
                            ? 'bg-white text-violet-700 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {org.name}
                        <span className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                          activeTab === org.id ? 'bg-violet-100 text-violet-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {data.filter(f => f.branchId === org.id).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ForeignerList 
                data={displayedData} 
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                readonly={isHqAdmin && activeTab === 'all'}
                showBranch={isHqAdmin && activeTab === 'all'}
                getBranchLabel={getBranchLabel}
                userRole={userRole}
                onUpdate={(updated) => setData(prev => prev.map(f => f.id === updated.id ? updated : f))}
              />
            </motion.div>
          </div>
        )}

        {/* データ整合性チェックパネル（scrivener専用） */}
        <AnimatePresence>
          {showIntegrityPanel && userRole === 'scrivener' && (() => {
            const mismatches = data.filter(f =>
              (f.approvalStatus === 'returned' && f.status !== '準備中') ||
              (f.approvalStatus === 'approved' && f.status !== '申請済')
            );
            return (
              <motion.div
                key="integrity-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
                onClick={() => setShowIntegrityPanel(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  onClick={e => e.stopPropagation()}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 rounded-xl">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-slate-900">データ整合性チェック</h2>
                        <p className="text-xs text-slate-400 mt-0.5">ステータスの不整合を検出します</p>
                      </div>
                    </div>
                    <button onClick={() => setShowIntegrityPanel(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                    {mismatches.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Shield className="h-7 w-7 text-emerald-500" />
                        </div>
                        <p className="font-bold text-slate-700">不整合なし</p>
                        <p className="text-sm text-slate-400 mt-1">すべてのデータは整合しています</p>
                      </div>
                    ) : (
                      mismatches.map(f => {
                        const isApprovedMismatch = f.approvalStatus === 'approved' && f.status !== '申請済';
                        const expectedStatus = isApprovedMismatch ? '申請済' : '準備中';
                        return (
                          <div key={f.id} className="flex items-center justify-between gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">{f.name}</p>
                              <p className="text-[11px] text-rose-600 font-bold mt-0.5">
                                {f.status} → {expectedStatus} に修復必要
                              </p>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  const { foreignerService } = await import('@/services/foreignerService');
                                  await foreignerService.updateForeignerDataAdmin(f.id, { status: expectedStatus });
                                  setData(prev => prev.map(d => d.id === f.id ? { ...d, status: expectedStatus } : d));
                                } catch {
                                  alert('修復に失敗しました');
                                }
                              }}
                              className="shrink-0 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 active:scale-95 transition-all"
                            >
                              修復
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-xs text-slate-400">
                      {mismatches.length > 0 ? `${mismatches.length}件の不整合を検出` : '問題なし'}
                    </p>
                    <button onClick={() => setShowIntegrityPanel(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                      閉じる
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

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

                    {/* ─── 職員代理入力 ─── */}
                    <div className="mt-4"></div>
                    <button
                      onClick={() => {
                        setShowShareModal(false);
                        window.open('/forms/renewal', '_blank');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-colors mt-2"
                    >
                      <FilePen className="h-4 w-4" />
                      職員が代わって申請書を作成する
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
  onClick,
  href
}: { 
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-300'}`} />
      <span className="text-sm">{label}</span>
      {badge && (
        <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${
          active ? 'bg-indigo-500 text-white' : 'bg-rose-50 text-rose-500'
        }`}>
          {badge}
        </span>
      )}
    </>
  );

  const className = `w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
    active 
      ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' 
      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-medium'
  }`;

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
