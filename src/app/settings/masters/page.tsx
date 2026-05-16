'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Landmark, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { CompanyMasterContent } from './_components/CompanyMasterContent';
import { UnionMasterContent } from './_components/UnionMasterContent';

type TabType = 'companies' | 'unions';

export default function MastersSettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // default to companies
  const [activeTab, setActiveTab] = useState<TabType>('companies');

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // Only scrivener and union_staff can access this page
    if (currentUser.role === 'enterprise_staff') {
      router.push('/');
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }



  const tabs = [
    { id: 'companies', label: '企業マスタ', icon: Building2 },
    { id: 'unions', label: '組合マスタ', icon: Landmark },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* ─── ヘッダー ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                マスタ管理
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                書類印字用のマスタデータの管理
              </p>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="flex items-center gap-2 border-b border-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors relative ${
                    isActive
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeMasterTab"
                      className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-indigo-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'companies' && <CompanyMasterContent />}
            {activeTab === 'unions' && <UnionMasterContent />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
