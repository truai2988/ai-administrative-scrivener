'use client';

import React, { useState, useEffect } from 'react';
import { foreignerService } from '@/services/foreignerService';
import { Foreigner } from '@/types/database';
import { SummaryCards } from '@/components/SummaryCards';
import { ForeignerList } from '@/components/ForeignerList';
import { ForeignerDetail } from '@/components/ForeignerDetail';
import { motion } from 'framer-motion';
import { LayoutDashboard, Settings, UserCircle, Bell, LogOut, Menu, Search, Filter } from 'lucide-react';

export default function DashboardPage() {
  const [dashboardState, setDashboardState] = useState<{
    data: Foreigner[];
    loading: boolean;
    mounted: boolean;
  }>({
    data: [],
    loading: true,
    mounted: false
  });
  
  const [selectedForeigner, setSelectedForeigner] = useState<Foreigner | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const foreigners = await foreignerService.getAllForeigners();
        setDashboardState({
          data: foreigners,
          loading: false,
          mounted: true
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setDashboardState({
          data: [],
          loading: false,
          mounted: true
        });
      }
    };
    
    fetchData();
  }, []);

  const { data, loading, mounted } = dashboardState;

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold">システムを起動中...</p>
        </div>
      </div>
    );
  }

  // Calculate summaries
  const total = data.length;
  const expiringSoon = data.filter((p) => {
    const days = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days < 90 && days > 0;
  }).length;
  const pending = data.filter((p) => p.status === 'チェック中' || p.status === '準備中').length;
  const completed = data.filter(p => p.status === '申請済').length;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 p-8 shadow-sm z-20">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="h-10 w-10 bg-linear-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600 tracking-tight">
              AI 行政書士
            </span>
            <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Management Suite</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="総合ダッシュボード" active />
          <SidebarItem icon={UserCircle} label="外国人管理・台帳" />
          <SidebarItem icon={Bell} label="通知・期限アラート" badge={12} />
          <SidebarItem icon={Filter} label="申請カテゴリ" />
          <SidebarItem icon={Settings} label="システム設定" />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-50 space-y-4">
          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100/50">
            <p className="text-xs font-bold text-indigo-600 mb-1">サポート窓口</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">ご不明点はいつでもAIアシスタントへお尋ねください。</p>
          </div>
          <SidebarItem icon={LogOut} label="ログアウト" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 md:p-10 lg:p-14 max-w-[1600px] mx-auto w-full relative">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">管理概要</h1>
            <p className="text-slate-500 font-medium">現在、<span className="text-indigo-600 font-bold">{total}名</span>の外国人を管理しています。</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="グローバル検索..." 
                className="bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm w-64 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
            
            <button 
              onClick={async () => {
                if (confirm('デモデータを3件投入します。よろしいですか？')) {
                  const { seedDatabaseAction } = await import('@/app/actions/seedActions');
                  const res = await seedDatabaseAction();
                  if (res.success) {
                    alert('デモデータを投入しました。画面を更新します。');
                    window.location.reload();
                  } else {
                    alert('エラーが発生しました: ' + res.error);
                  }
                }
              }}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-xl border border-slate-200 hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>🔧 デモデータ一括投入</span>
            </button>

            <button 
              onClick={() => window.open('/foreigner/entry/dummy-token-123', '_blank')}
              className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <UserCircle className="h-4 w-4" />
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
                <p className="text-xs font-black text-slate-900 leading-tight">行政書士 太郎 様</p>
                <p className="text-[10px] font-bold text-emerald-500">プロフェッショナル認証</p>
              </div>
            </div>
            <button className="lg:hidden p-3 bg-white border border-slate-100 rounded-2xl">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
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
            />
          </motion.div>
        </div>

        {/* Full Screen Detail Modal/Panel */}
        {selectedForeigner && (
          <ForeignerDetail 
            foreigner={selectedForeigner} 
            onClose={() => setSelectedForeigner(null)} 
          />
        )}
      </main>
    </div>
  );
}

function SidebarItem({ 
  icon: Icon, 
  label, 
  active = false, 
  badge 
}: { 
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
  badge?: number;
}) {
  return (
    <button
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
