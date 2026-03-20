import React, { useEffect } from 'react';
import { Foreigner } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { X, ShieldAlert, Info, Building2, Calendar, CreditCard, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ExcelDownloadButton } from './ExcelDownloadButton';

interface ForeignerDetailProps {
  foreigner: Foreigner | null;
  onClose: () => void;
}

export const ForeignerDetail: React.FC<ForeignerDetailProps> = ({ foreigner, onClose }) => {
  useEffect(() => {
    if (foreigner) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [foreigner]);

  if (!foreigner) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto no-scrollbar"
        >
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{foreigner.name}</h2>
              <p className="text-sm text-slate-500">{foreigner.nationality} / {foreigner.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-slate-400" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Status Section */}
            <section className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">現在のステータス</p>
                <StatusBadge status={foreigner.status} />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">在留期限</p>
                <p className="text-lg font-bold text-rose-600">{foreigner.expiryDate}</p>
              </div>
            </section>

            {/* AI Review Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-500" />
                AI リーガルチェック結果
              </h3>
              {foreigner.aiReview ? (
                <div className={`rounded-2xl p-6 border ${
                  foreigner.aiReview.riskScore > 50 ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-600">不許可リスクスコア</span>
                    <span className={`text-2xl font-black ${
                      foreigner.aiReview.riskScore > 50 ? 'text-rose-600' : 'text-indigo-600'
                    }`}>
                      {foreigner.aiReview.riskScore}%
                    </span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-2 mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        foreigner.aiReview.riskScore > 50 ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${foreigner.aiReview.riskScore}%` }}
                    />
                  </div>
                  <div className="flex gap-3 bg-white/60 p-4 rounded-xl border border-white/40">
                    <Info className="h-5 w-5 text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {foreigner.aiReview.reason}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-10 text-center">
                  <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">AIによるチェックはまだ行われていません。</p>
                  <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
                    今すぐチェックを実行
                  </button>
                </div>
              )}

              {/* Excel Download Section */}
              <div className="pt-4">
                <ExcelDownloadButton foreigner={foreigner} />
                <p className="mt-2 text-[10px] text-center text-slate-400">
                  ※入管指定の最新Excel書式（更新用）にデータを流し込みます。
                </p>
              </div>
            </section>

            {/* Basic Info */}
            <section className="grid grid-cols-2 gap-6">
              <InfoItem icon={CreditCard} label="在留カード番号" value={foreigner.residenceCardNumber} />
              <InfoItem icon={Calendar} label="生年月日" value={foreigner.birthDate} />
              <InfoItem icon={Building2} label="所属機関" value={(foreigner as unknown as { company?: string }).company || '未登録'} />
              <InfoItem icon={ClipboardList} label="在留資格種別" value={(foreigner as unknown as { visaType?: string }).visaType || '特定技能'} />
            </section>

            {/* Job Content / Experience */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">職務内容・経歴</h3>
              <div className="space-y-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-indigo-500 mb-2">現在の職務予定</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {foreigner.aiReview?.jobTitle || '飲食料品製造業における加工ラインの管理・充填・梱包業務。一部、作業員の指揮命令を含む。'}
                  </p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 mb-2">過去の経験・専門性</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {foreigner.aiReview?.pastExperience || '未登録'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-50 rounded-lg">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
