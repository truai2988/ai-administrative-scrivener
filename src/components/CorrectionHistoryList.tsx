'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { CorrectionHistory, UserRole } from '@/types/database';
import { canViewHistory } from '@/utils/permissions';
import { History, Clock, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CorrectionHistoryListProps {
  foreignerId: string;
  userRole: UserRole;
}

export const CorrectionHistoryList: React.FC<CorrectionHistoryListProps> = ({ foreignerId, userRole }) => {
  const [histories, setHistories] = useState<CorrectionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!canViewHistory(userRole)) {
      setLoading(false);
      return;
    }

    const fetchHistories = async () => {
      try {
        const q = query(
          collection(db, 'foreigners', foreignerId, 'correction_histories'),
          orderBy('correctedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CorrectionHistory));
        setHistories(data);
      } catch (error) {
        console.error('Error fetching correction histories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistories();
  }, [foreignerId, userRole]);

  if (!canViewHistory(userRole)) return null;
  if (loading) return null; // or loading skeleton
  if (histories.length === 0) return null; // Hide if no history

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  const DIFF_LABEL: Record<string, string> = {
    name: '氏名',
    nationality: '国籍',
    birthDate: '生年月日',
    residenceCardNumber: '在留カード番号',
    expiryDate: '在留期限',
    email: 'メールアドレス',
    company: '所属機関',
    visaType: '在留資格種別',
    jobTitle: '職務内容',
    experience: '過去の経験・専門性',
    salary: '基本給 (月額)',
    allowances: '諸手当 (月額)',
    socialInsurance: '社会保険加入',
    housingProvided: '住宅の提供',
  };

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
        <History className="w-4 h-4 text-amber-500" />
        データ修正履歴
      </h3>
      <div className="space-y-4">
        {histories.map((history) => (
          <div key={history.id} className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === history.id ? null : history.id!)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{formatDate(history.correctedAt)}</p>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" /> {history.correctedBy}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                  {Object.keys(history.diff || {}).length}項目の変更
                </span>
                {expandedId === history.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>
            <AnimatePresence>
              {expandedId === history.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200"
                >
                  <div className="p-5 space-y-4 bg-white">
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                      <p className="text-xs font-bold text-amber-600/70 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> 修正理由
                      </p>
                      <p className="text-sm font-medium text-amber-900 leading-relaxed whitespace-pre-wrap">
                        {history.reason}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(history.diff || {}).map(([key, changes]) => (
                        <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 mb-1">{DIFF_LABEL[key] || key}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-slate-500 line-through truncate max-w-[100px]" title={String(changes.old || '未登録')}>
                              {String(changes.old || '未登録')}
                            </p>
                            <span className="text-xs text-slate-300">→</span>
                            <p className="text-sm font-bold text-slate-700 truncate max-w-[120px]" title={String(changes.new || '未登録')}>
                              {String(changes.new || '未登録')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
};
