import React, { useEffect, useState } from 'react';
import { Foreigner } from '@/types/database';
import { foreignerService } from '@/services/foreignerService';
import { StatusBadge } from './StatusBadge';
import { X, ShieldAlert, Info, Building2, Calendar, CreditCard, ClipboardList, Lock, Globe, Monitor, Edit3, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ExcelDownloadButton } from './ExcelDownloadButton';

function formatAgreeDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return isoString;
  }
}

interface ForeignerDetailProps {
  foreigner: Foreigner | null;
  onClose: () => void;
  onUpdate?: (updatedInfo: Foreigner) => void;
}

export const ForeignerDetail: React.FC<ForeignerDetailProps> = ({ foreigner, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Foreigner>>({});
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (foreigner) {
      document.body.style.overflow = 'hidden';
      setEditForm(foreigner);
      setIsEditing(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [foreigner]);

  const handleSave = async () => {
    if (!foreigner) return;
    setIsSaving(true);
    try {
      await foreignerService.updateForeignerDataAdmin(foreigner.id, editForm);
      if (onUpdate) {
        // 原本データが消失しないよう、元の foreigner から確実に引き継ぐ
        const updatedData = { 
          ...foreigner, 
          ...editForm, 
          originalSubmittedData: foreigner.originalSubmittedData, 
          isEditedByAdmin: true 
        } as Foreigner;
        onUpdate(updatedData);
      }
      setIsEditing(false);
    } catch {
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

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
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                {foreigner.name}
                {foreigner.originalSubmittedData && [
                  'name', 'nationality', 'birthDate', 'residenceCardNumber', 
                  'expiryDate', 'company', 'visaType'
                ].some((key) => {
                  const k = key as keyof Foreigner;
                  return foreigner.originalSubmittedData && foreigner.originalSubmittedData[k] !== foreigner[k];
                }) && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                    <Edit3 className="w-3 h-3" />
                    修正履歴あり
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-500">{foreigner.nationality} / {foreigner.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存する
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  編集する
                </button>
              )}
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                title="閉じる"
              >
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>
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
                </div>
              )}

              {/* Excel Download Section */}
              <div className="pt-4 text-center">
                <ExcelDownloadButton foreigner={foreigner} />
                <p className="mt-2 text-[10px] text-slate-400">
                  ※入管指定の最新Excel書式（更新用）にデータを流し込みます。
                </p>
              </div>
            </section>

            {/* Basic Info */}
            <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">基本情報</h3>
                {isEditing && <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">編集中</span>}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {isEditing ? (
                  <>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">氏名 (アルファベット)</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">国籍</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={editForm.nationality || ''} onChange={(e) => setEditForm({...editForm, nationality: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">在留カード番号</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none uppercase" value={editForm.residenceCardNumber || ''} onChange={(e) => setEditForm({...editForm, residenceCardNumber: e.target.value})} maxLength={12} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">生年月日</label>
                      <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={editForm.birthDate || ''} onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">在留期限</label>
                      <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={editForm.expiryDate || ''} onChange={(e) => setEditForm({...editForm, expiryDate: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">所属機関</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={editForm.company || ''} onChange={(e) => setEditForm({...editForm, company: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">在留資格種別</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={editForm.visaType || ''} onChange={(e) => setEditForm({...editForm, visaType: e.target.value})} />
                    </div>
                  </>
                ) : (
                  <>
                    <InfoItem icon={Globe} label="国籍" value={foreigner.nationality} />
                    <InfoItem icon={Calendar} label="生年月日" value={foreigner.birthDate} />
                    <InfoItem icon={CreditCard} label="在留カード番号" value={foreigner.residenceCardNumber} />
                    <InfoItem icon={Calendar} label="在留期限" value={foreigner.expiryDate} />
                    <InfoItem icon={Building2} label="所属機関" value={foreigner.company || '未登録'} />
                    <InfoItem icon={ClipboardList} label="在留資格種別" value={foreigner.visaType || '特定技能'} />
                  </>
                )}
              </div>
            </section>

            {/* Original Data View (Shows only if differences exist) */}
            {foreigner.originalSubmittedData && [
              'name', 'nationality', 'birthDate', 'residenceCardNumber', 
              'expiryDate', 'company', 'visaType'
            ].some((key) => {
              const k = key as keyof Foreigner;
              return foreigner.originalSubmittedData && foreigner.originalSubmittedData[k] !== foreigner[k];
            }) && (
              <section className="bg-amber-50/50 border border-amber-200 rounded-2xl overflow-hidden mt-6">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-800">
                      本人が同意した原本データ（修正前）
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {foreigner.originalSubmittedData.name !== foreigner.name && (
                      <div className="bg-white/60 p-3 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-600/70 mb-1">氏名 (Original Name)</p>
                        <p className="text-sm font-bold text-amber-900">{foreigner.originalSubmittedData.name}</p>
                      </div>
                    )}
                    {foreigner.originalSubmittedData.nationality !== foreigner.nationality && (
                      <div className="bg-white/60 p-3 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-600/70 mb-1">国籍 (Nationality)</p>
                        <p className="text-sm font-bold text-amber-900">{foreigner.originalSubmittedData.nationality}</p>
                      </div>
                    )}
                    {foreigner.originalSubmittedData.birthDate !== foreigner.birthDate && (
                      <div className="bg-white/60 p-3 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-600/70 mb-1">生年月日 (Birth Date)</p>
                        <p className="text-sm font-bold text-amber-900">{foreigner.originalSubmittedData.birthDate}</p>
                      </div>
                    )}
                    {foreigner.originalSubmittedData.residenceCardNumber !== foreigner.residenceCardNumber && (
                      <div className="bg-white/60 p-3 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-600/70 mb-1">在留カード番号 (Card No)</p>
                        <p className="text-sm font-bold text-amber-900">{foreigner.originalSubmittedData.residenceCardNumber}</p>
                      </div>
                    )}
                    {foreigner.originalSubmittedData.expiryDate !== foreigner.expiryDate && (
                      <div className="bg-white/60 p-3 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-600/70 mb-1">在留期限 (Expiry Date)</p>
                        <p className="text-sm font-bold text-amber-900">{foreigner.originalSubmittedData.expiryDate || '-'}</p>
                      </div>
                    )}
                    {foreigner.originalSubmittedData.company !== foreigner.company && (
                      <div className="bg-white/60 p-3 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-600/70 mb-1">所属機関 (Company)</p>
                        <p className="text-sm font-bold text-amber-900">{foreigner.originalSubmittedData.company || '未登録'}</p>
                      </div>
                    )}
                    {foreigner.originalSubmittedData.visaType !== foreigner.visaType && (
                      <div className="bg-white/60 p-3 rounded-xl border border-amber-100 col-span-2">
                        <p className="text-[10px] font-bold text-amber-600/70 mb-1">在留資格種別 (Visa Type)</p>
                        <p className="text-sm font-bold text-amber-900">{foreigner.originalSubmittedData.visaType || '特定技能'}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-amber-700/60 mt-4 leading-relaxed bg-amber-100/30 p-3 rounded-lg">
                    ※このデータは、本フォームを通じて外国人が申告・同意した時点の不可変なスナップショットです。
                  </p>
                </div>
              </section>
            )}

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

            {/* Legal Consent Log */}
            {foreigner.consentLog && (
              <section className="space-y-4 mt-8 pt-6 border-t border-slate-200 border-dashed">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  法的証拠ログ（電磁的同意記録）
                </h3>
                <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-5 shadow-inner">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InfoItem icon={Calendar} label="同意成立日時" value={formatAgreeDate(foreigner.consentLog.agreedAt)} />
                    <InfoItem icon={Globe} label="送信元IPアドレス" value={foreigner.consentLog.ipAddress} />
                    <div className="md:col-span-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                          <Monitor className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">認証端末情報（ユーザーエージェント）</p>
                          <p className="text-xs font-medium text-slate-600 mt-1 break-all leading-relaxed">
                            {foreigner.consentLog.userAgent}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
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
