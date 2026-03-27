'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { foreignerService } from '@/services/foreignerService';
import { Foreigner } from '@/types/database';
import { ForeignerDetail } from '@/components/ForeignerDetail';
import { StatusBadge } from '@/components/StatusBadge';
import { motion } from 'framer-motion';
import { ClipboardList, Loader2, ChevronLeft, Clock, User, Globe } from 'lucide-react';

export default function PendingReviewPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Foreigner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Foreigner | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || currentUser.role !== 'scrivener') {
      router.push('/');
      return;
    }
    const load = async () => {
      try {
        const results = await foreignerService.getPendingReviewForeigners();
        setData(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, authLoading, router]);

  const handleUpdate = (updated: Foreigner) => {
    // リストからは確認待ち以外を除去するが、詳細画面は承認済みでも開いたままにする
    setData(prev => prev.map(f => f.id === updated.id ? updated : f).filter(f => f.approvalStatus === 'pending_review'));
    setSelected(updated); // 常に最新情報で詳細画面を更新（閉じない）
  };

  if (selected) {
    return (
      <ForeignerDetail
        foreigner={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
        userRole={currentUser?.role ?? 'scrivener'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/')}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-indigo-500" />
              未確認一覧
            </h1>
            <p className="text-sm text-slate-500 mt-1">確認依頼が届いたデータ一覧です。内容を確認し、承認または差し戻しを行ってください。</p>
          </div>
          {!loading && (
            <span className="ml-auto px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">
              {data.length}件 確認待ち
            </span>
          )}
        </header>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="font-medium">読み込み中...</span>
          </div>
        ) : data.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 text-slate-400"
          >
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">確認待ちのデータはありません</p>
            <p className="text-sm mt-1">支部事務員が確認依頼を送ると、ここに表示されます。</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {data.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(f)}
                className="bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer hover:shadow-lg hover:shadow-indigo-50 hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <User className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg">{f.name}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                        <Globe className="h-3.5 w-3.5" />
                        {f.nationality}
                        {f.company && <span>• {f.company}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={f.status} />
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-2 justify-end">
                      <Clock className="h-3 w-3" />
                      更新: {new Date(f.updatedAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
