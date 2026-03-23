import React, { useEffect, useState } from 'react';
import { Foreigner } from '@/types/database';
import { foreignerService } from '@/services/foreignerService';
import { StatusBadge } from './StatusBadge';
import { X, ShieldAlert, Info, Calendar, ClipboardList, Lock, Globe, Monitor, Edit3, Save, Loader2, UserCircle, CheckCircle2, ExternalLink, Building2 } from 'lucide-react';
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
  foreigner: Foreigner;
  onClose: () => void;
  onUpdate: (updated: Foreigner) => void;
}

export const ForeignerDetail: React.FC<ForeignerDetailProps> = ({ 
  foreigner, 
  onClose, 
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Foreigner>>({
    name: foreigner.name || '',
    nationality: foreigner.nationality || '',
    residenceCardNumber: foreigner.residenceCardNumber || '',
    birthDate: foreigner.birthDate || '',
    expiryDate: foreigner.expiryDate || '',
    visaType: foreigner.visaType || '',
    company: foreigner.company || '',
    jobTitle: foreigner.jobTitle || '',
    experience: foreigner.experience || '',
    salary: foreigner.salary || '',
    allowances: foreigner.allowances || '',
    socialInsurance: foreigner.socialInsurance || false,
    housingProvided: foreigner.housingProvided || false
  });

  useEffect(() => {
    if (foreigner) {
      document.body.style.overflow = 'hidden';
      setEditForm({
        name: foreigner.name || '',
        nationality: foreigner.nationality || '',
        residenceCardNumber: foreigner.residenceCardNumber || '',
        birthDate: foreigner.birthDate || '',
        expiryDate: foreigner.expiryDate || '',
        visaType: foreigner.visaType || '',
        company: foreigner.company || '',
        jobTitle: foreigner.jobTitle || foreigner.aiReview?.jobTitle || '',
        experience: foreigner.experience || foreigner.aiReview?.pastExperience || '',
        salary: foreigner.salary || '',
        allowances: foreigner.allowances || '',
        socialInsurance: foreigner.socialInsurance || false,
        housingProvided: foreigner.housingProvided || false
      });
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
        const updatedData = { 
          ...foreigner, 
          ...editForm, 
          originalSubmittedData: foreigner.originalSubmittedData, 
          isEditedByAdmin: true 
        } as Foreigner;
        onUpdate(updatedData);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Firestore save failed:', error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (!foreigner) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto no-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen pb-20"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 shadow-sm">
            <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                  title="一覧に戻る"
                >
                  <X className="h-6 w-6" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    {foreigner.name}
                    {foreigner.originalSubmittedData && [
                      'name', 'nationality', 'birthDate', 'residenceCardNumber', 'expiryDate'
                    ].some((key) => {
                      const k = key as keyof Foreigner;
                      return foreigner.originalSubmittedData && foreigner.originalSubmittedData[k] !== foreigner[k];
                    }) && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200">
                        <Edit3 className="w-3 h-3" />
                        本人情報修正あり
                      </span>
                    )}
                  </h2>
                  <p className="text-sm font-bold text-slate-400 tracking-wide uppercase">
                    {foreigner.nationality} • ID: {foreigner.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing && (
                  <ExcelDownloadButton foreigner={foreigner} variant="compact" />
                )}
                
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    修正内容を保存
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 text-sm active:scale-95"
                  >
                    <Edit3 className="w-4 h-4" />
                    登録内容を修正
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto p-8 space-y-10">
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
            </section>

            {/* Main Content Area */}
            <div className="space-y-10">
              {isEditing ? (
                <section className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-indigo-500" />
                      登録内容の編集
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
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
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">職務内容 (予定)</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700 min-h-[100px] focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                        value={editForm.jobTitle || ''}
                        onChange={(e) => setEditForm({...editForm, jobTitle: e.target.value})}
                        placeholder="職務の名称や主たる業務内容を入力してください"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">過去の経験・専門性</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700 min-h-[100px] focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none" 
                        value={editForm.experience || ''}
                        onChange={(e) => setEditForm({...editForm, experience: e.target.value})}
                        placeholder="これまでの職歴や取得資格など"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">基本給 (月額)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">¥</span>
                        <input type="number" className="w-full pl-7 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={editForm.salary || ''} onChange={(e) => setEditForm({...editForm, salary: e.target.value})} />
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">諸手当 (月額)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">¥</span>
                        <input type="number" className="w-full pl-7 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={editForm.allowances || ''} onChange={(e) => setEditForm({...editForm, allowances: e.target.value})} />
                      </div>
                    </div>
                    <div className="col-span-2 flex gap-6 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={editForm.socialInsurance} onChange={(e) => setEditForm({...editForm, socialInsurance: e.target.checked})} />
                        <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">社会保険加入</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={editForm.housingProvided} onChange={(e) => setEditForm({...editForm, housingProvided: e.target.checked})} />
                        <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">住宅の提供あり</span>
                      </label>
                    </div>
                  </div>
                </section>
              ) : (
                <div className="space-y-12">
                  <section className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-8">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
                       <UserCircle className="w-4 h-4" />
                       本人申告の情報
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">氏名</p>
                        <p className="text-base font-black text-slate-900">{foreigner.name}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">国籍</p>
                        <p className="text-base font-black text-slate-900">{foreigner.nationality}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">生年月日</p>
                        <p className="text-base font-black text-slate-900">{foreigner.birthDate}</p>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs font-bold text-slate-400">在留期限</span>
                        <span className="text-sm font-black text-rose-600">{foreigner.expiryDate}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs font-bold text-slate-400">カード番号</span>
                        <span className="text-sm font-black text-indigo-600 font-mono tracking-wider">{foreigner.residenceCardNumber}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                         <span className="text-xs font-bold text-slate-400">提出書類</span>
                         <div className="flex gap-2">
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">パスポート</span>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">在留カード</span>
                         </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                         <CheckCircle2 className="w-3.5 h-3.5" />
                         提出書類のデジタルコピー
                      </h5>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="aspect-3/2 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-white hover:border-indigo-300 transition-all">
                          <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-500">在留カード(表)</span>
                          <ExternalLink className="w-3 h-3 text-slate-200 group-hover:text-indigo-400" />
                        </div>
                        <div className="aspect-3/2 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400">在留カード(裏)</span>
                          <ExternalLink className="w-3 h-3 text-slate-200" />
                        </div>
                        <div className="aspect-3/2 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400">パスポート</span>
                          <ExternalLink className="w-3 h-3 text-slate-200" />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Original Data View */}
                  {foreigner.originalSubmittedData && [
                    'name', 'nationality', 'birthDate', 'residenceCardNumber', 'expiryDate'
                  ].some((key) => {
                    const k = key as keyof Foreigner;
                    return foreigner.originalSubmittedData && foreigner.originalSubmittedData[k] !== foreigner[k];
                  }) && (
                    <section className="bg-amber-50/50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-4 text-amber-600">
                          <Lock className="w-4 h-4" />
                          <h3 className="text-sm font-bold">
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
                        </div>
                        <p className="text-xs text-amber-700/60 mt-4 leading-relaxed bg-amber-100/30 p-3 rounded-lg border border-amber-100/50">
                          ※このデータは、本フォームを通じて外国人が申告・同意した時点の不可変なスナップショットです。
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Legal Consent Log */}
                  {foreigner.consentLog && (
                    <section className="space-y-4 pt-6 border-t border-slate-200 border-dashed">
                      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-slate-500" />
                        法的証拠ログ（電磁的同意記録）
                      </h3>
                      <div className="bg-slate-100/80 border border-slate-200 rounded-3xl p-6 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InfoItem icon={Calendar} label="同意成立日時" value={formatAgreeDate(foreigner.consentLog.agreedAt)} />
                          <InfoItem icon={Globe} label="送信元IPアドレス" value={foreigner.consentLog.ipAddress} />
                          <div className="md:col-span-2">
                            <div className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-white">
                              <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <Monitor className="h-4 w-4 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">認証端末情報</p>
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

                  {/* Support Agency / Company Data */}
                  <section className="space-y-6 pt-10 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        受入・契約情報 <span className="text-[10px] font-bold text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded">監理団体/支援機関入力</span>
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="group p-5 bg-indigo-50/40 border border-indigo-100 rounded-3xl hover:bg-indigo-50 transition-colors">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> 所属機関
                        </p>
                        <p className="text-base font-black text-slate-800">{foreigner.company || '未登録'}</p>
                      </div>
                      <div className="group p-5 bg-indigo-50/40 border border-indigo-100 rounded-3xl hover:bg-indigo-50 transition-colors">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <ClipboardList className="w-3 h-3" /> 現在の在留資格
                        </p>
                        <p className="text-base font-black text-slate-800">{foreigner.visaType || '特定技能1号'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          給与・諸手当
                        </p>
                        <div className="flex gap-8">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 mb-0.5">基本給</p>
                            <p className="text-lg font-black text-slate-900">
                              {foreigner.salary ? `¥${Number(foreigner.salary).toLocaleString()}` : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 mb-0.5">諸手当</p>
                            <p className="text-lg font-black text-slate-900">
                              {foreigner.allowances ? `¥${Number(foreigner.allowances).toLocaleString()}` : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">待遇・福利厚生</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                            foreigner.socialInsurance 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                              : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}>
                            社会保険：{foreigner.socialInsurance ? '加入' : '未加入'}
                          </span>
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                            foreigner.housingProvided 
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                              : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}>
                            住宅：{foreigner.housingProvided ? '提供あり' : 'なし'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">職務内容 (予定)</p>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {foreigner.jobTitle || foreigner.aiReview?.jobTitle || '未登録'}
                        </p>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-2 h-2 rounded-full bg-slate-300 shadow-sm" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">過去の経験・専門性</p>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {foreigner.experience || foreigner.aiReview?.pastExperience || '未登録'}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm shrink-0">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
