'use client';

/**
 * 職員によるPC代理登録ページ — /foreigners/new
 *
 * ワークフロー:
 *  Step 1: 書類スキャン（DocumentUploadArea）で AI が在留カード・パスポートを読み取る
 *  Step 2: 読み取った情報を確認・補完し、画像もアップロードして「外国人台帳に登録」する
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // ダッシュボードへの遷移に使用
import { useAuth } from '@/contexts/AuthContext';
import {
  User, CreditCard, BookOpen, CheckCircle2,
  AlertCircle, Loader2, Upload, RotateCcw, ChevronRight, ChevronLeft, X, FileImage,
} from 'lucide-react';

import { storageService } from '@/services/storageService';
import { foreignerService } from '@/services/foreignerService';
import type { Foreigner } from '@/types/database';

// ─── 型定義 ──────────────────────────────────────────────────────────────────
type DocSlotId = 'card_front' | 'card_back' | 'passport';
type SlotStatus = 'idle' | 'analyzing' | 'done' | 'error';

interface DocSlotState {
  file: File | null;
  status: SlotStatus;
  errorMessage: string;
  fieldCount: number;
}
type SlotsState = Record<DocSlotId, DocSlotState>;

const INITIAL_SLOT: DocSlotState = { file: null, status: 'idle', errorMessage: '', fieldCount: 0 };
const INITIAL_SLOTS: SlotsState = { card_front: { ...INITIAL_SLOT }, card_back: { ...INITIAL_SLOT }, passport: { ...INITIAL_SLOT } };

const SLOT_DEFS: Array<{ id: DocSlotId; label: string; note: string; icon: React.ElementType }> = [
  { id: 'card_front', label: '在留カード（表）', note: '氏名・在留資格・在留期限', icon: CreditCard },
  { id: 'card_back',  label: '在留カード（裏）', note: '就労制限・資格外活動許可', icon: CreditCard },
  { id: 'passport',  label: 'パスポート（顔写真ページ）', note: '旅券番号・有効期限・国籍', icon: BookOpen },
];

// ─── 国籍リスト ───────────────────────────────────────────────────────────────
const NATIONALITIES = [
  '', 'Philippines', 'Vietnam', 'China', 'Indonesia', 'Nepal',
  'Myanmar', 'Cambodia', 'Thailand', 'India', 'Sri Lanka',
];
const NATIONALITY_LABELS: Record<string, string> = {
  '': '選択してください',
  Philippines: 'フィリピン', Vietnam: 'ベトナム', China: '中国',
  Indonesia: 'インドネシア', Nepal: 'ネパール', Myanmar: 'ミャンマー',
  Cambodia: 'カンボジア', Thailand: 'タイ', India: 'インド', 'Sri Lanka': 'スリランカ',
};



// ─── メインページ ─────────────────────────────────────────────────────────────
export default function ForeignersNewPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  /* ── Step 1: スキャン状態 ── */
  const [slots, setSlots] = useState<SlotsState>(INITIAL_SLOTS);
  const [dragOver, setDragOver] = useState<DocSlotId | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  /* ── Step 2: プロフィール確認フォーム ── */
  const [profile, setProfile] = useState<Partial<Foreigner>>({
    name: '', nationality: '', birthDate: '', residenceCardNumber: '', expiryDate: '', visaType: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);


  /* ── 添付処理 ── */
  const processFile = useCallback((slotId: DocSlotId, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', '画像ファイル（JPG / PNG）のみ対応しています。');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'ファイルサイズが大きすぎます（上限: 10MB）。');
      return;
    }

    setSlots(prev => ({ ...prev, [slotId]: { file, status: 'done', errorMessage: '', fieldCount: 0 } }));
  }, [showToast]);

  const handleDrop = useCallback((e: React.DragEvent, slotId: DocSlotId) => {
    e.preventDefault(); setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) processFile(slotId, file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, slotId: DocSlotId) => {
    const file = e.target.files?.[0];
    if (file) processFile(slotId, file);
    e.target.value = '';
  }, [processFile]);

  const resetSlot = useCallback((slotId: DocSlotId) => {
    setSlots(prev => ({ ...prev, [slotId]: { ...INITIAL_SLOT } }));
  }, []);

  /* ── Step 2: 保存 ── */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!profile.name?.trim()) newErrors.name = '氏名は必須です';
    if (!profile.nationality) newErrors.nationality = '国籍は必須です';
    if (!profile.birthDate) newErrors.birthDate = '生年月日は必須です';
    if (!profile.residenceCardNumber?.trim()) newErrors.residenceCardNumber = '在留カード番号は必須です';
    if (!profile.expiryDate) newErrors.expiryDate = '在留期限は必須です';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      /* 画像を Storage にアップロード */
      const newId = `staff-${Date.now()}`;
      const [rcFrontUrl, rcBackUrl, passportUrl] = await Promise.all([
        slots.card_front.file
          ? storageService.uploadFile(slots.card_front.file, `foreigners/${newId}/rc_front_${Date.now()}`)
          : Promise.resolve(undefined),
        slots.card_back.file
          ? storageService.uploadFile(slots.card_back.file, `foreigners/${newId}/rc_back_${Date.now()}`)
          : Promise.resolve(undefined),
        slots.passport.file
          ? storageService.uploadFile(slots.passport.file, `foreigners/${newId}/passport_${Date.now()}`)
          : Promise.resolve(undefined),
      ]);

      const payload: Partial<Foreigner> = {
        ...profile,
        // ログイン中のユーザーの organizationId を外国人の branchId に使用（セキュリティルール要件）
        branchId: currentUser?.organizationId || profile.branchId || 'hq_direct',
        status: '準備中',
        isEditedByAdmin: true,
        ...(rcFrontUrl  && { residenceCardFrontUrl: rcFrontUrl }),
        ...(rcBackUrl   && { residenceCardBackUrl: rcBackUrl }),
        ...(passportUrl && { passportImageUrl: passportUrl }),
      };

      /* foreignerServiceを直接呼び出してFirestoreに保存（クライアントSDKを正しく使用） */
      await foreignerService.submitForeignerEntry(newId, payload);
      setSavedId(newId);

    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '予期せぬエラーが発生しました。');
    } finally {
      setIsSaving(false);
    }
  };

  /* ── 登録完了画面 ── */
  if (savedId) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 text-center shadow-2xl border border-slate-700">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">外国人台帳に登録しました</h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            ダッシュボードの管理一覧に追加されました。<br/>
            「申請書を編集」から更新申請書の作成を開始できます。
          </p>
          <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all"
            >
              ダッシュボードに戻る
            </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-medium text-sm
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
          {toast.message}
        </div>
      )}

      {/* ─── 固定ヘッダー・ステップ */}
      <div className="max-w-5xl w-full mx-auto px-8 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-indigo-600/30 rounded-xl flex items-center justify-center">
            <User size={18} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">外国人の新規登録</h1>
            <p className="text-slate-400 text-xs">在留カード・パスポートをスキャンして、管理一覧に外国人情報を登録します。</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {[{ n: 1, label: '書類添付' }, { n: 2, label: '情報登録' }].map(({ n, label }) => (
            <React.Fragment key={n}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all
                ${step === n ? 'bg-indigo-600 text-white' : step > n ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                  ${step === n ? 'bg-white/20' : step > n ? 'bg-emerald-400 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                  {step > n ? '✓' : n}
                </span>
                {label}
              </div>
              {n < 2 && <div className="flex-1 h-px bg-slate-700" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ─── スクロール可能なコンテンツエリア */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto px-8 pb-6">

        {/* ═══ STEP 1: 書類添付 ═══════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 mb-6">
              {/* ヘッダー */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-indigo-600/30 rounded-xl flex items-center justify-center shrink-0">
                  <CreditCard size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">関連書類のアップロード</h2>
                  <p className="text-slate-400 text-sm">
                    事前に在留カードやパスポートの画像がある場合は、ここにアップロードできます。
                    <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-lg">JPG / PNG のみ対応</span>
                  </p>
                </div>
              </div>

              {/* スロットグリッド */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SLOT_DEFS.map(def => {
                  const slot = slots[def.id];
                  const Icon = def.icon;
                  const isDragOver = dragOver === def.id;
                  return (
                    <div key={def.id}>
                      <input
                        id={`file-input-${def.id}`}
                        type="file" accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={e => handleFileInput(e, def.id)}
                      />
                      <div
                        className={`border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all text-center
                          ${isDragOver ? 'border-indigo-500 bg-indigo-500/10' : ''}
                          ${slot.status === 'done' ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
                          ${slot.status === 'error' ? 'border-rose-500/50 bg-rose-500/5' : ''}
                          ${slot.status === 'idle' ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50' : ''}
                          ${slot.status === 'analyzing' ? 'border-indigo-500/50 bg-indigo-500/5' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(def.id); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={e => handleDrop(e, def.id)}
                        onClick={() => slot.status !== 'analyzing' && document.getElementById(`file-input-${def.id}`)?.click()}
                      >
                        {/* アイコン */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3
                          ${slot.status === 'done' ? 'bg-emerald-500/20' : slot.status === 'error' ? 'bg-rose-500/20' : 'bg-slate-700'}`}>
                          {slot.status === 'idle' && <Icon size={24} className="text-slate-400" />}
                          {slot.status === 'done' && <CheckCircle2 size={24} className="text-emerald-400" />}
                          {slot.status === 'error' && <AlertCircle size={24} className="text-rose-400" />}
                        </div>

                        <div className="text-sm font-bold text-white mb-1">{def.label}</div>
                        <div className="text-xs text-slate-400 mb-3">{def.note}</div>

                        {slot.status === 'idle' && (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Upload size={12} />
                              <span>ドロップ or クリック</span>
                            </div>
                            <span className="text-[10px] text-slate-600 bg-slate-700 px-2 py-0.5 rounded-md">JPG / PNG</span>
                          </div>
                        )}

                        {slot.status === 'done' && (
                          <div className="space-y-2">
                            {slot.file && (
                              <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                                <FileImage size={10}/> {slot.file.name.slice(0, 20)}
                              </div>
                            )}
                            <span className="text-xs text-emerald-400 font-medium">添付完了</span>
                          </div>
                        )}

                        {slot.status === 'error' && (
                          <span className="text-xs text-rose-400">{slot.errorMessage.slice(0, 40)}</span>
                        )}

                        {(slot.status === 'done' || slot.status === 'error') && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); resetSlot(def.id); }}
                            className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mx-auto"
                          >
                            <RotateCcw size={11}/> やり直す
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* スキップ注記 */}
              <div className="flex items-center gap-2 mt-5 text-xs text-slate-500">
                <X size={12}/> 書類がない場合は、次のステップで手動入力できます。
              </div>
            </div>

            {/* 次へボタン */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-900 transition-all active:scale-95"
              >
                情報の入力へ進む
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: 情報確認・登録 ═════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center shrink-0">
                  <User size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">外国人プロフィールの入力</h2>
                  <p className="text-slate-400 text-sm">
                    項目を入力してください。「登録する」で台帳に追加されます。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 氏名 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">
                    氏名（アルファベット）<span className="text-rose-400 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例: DELA CRUZ JUAN"
                    value={profile.name || ''}
                    onChange={e => setProfile(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all
                      ${errors.name ? 'border-rose-500' : 'border-slate-600'}`}
                  />
                  {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* 国籍 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">
                    国籍<span className="text-rose-400 ml-1">*</span>
                  </label>
                  <select
                    value={profile.nationality || ''}
                    onChange={e => setProfile(prev => ({ ...prev, nationality: e.target.value }))}
                    className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all
                      ${errors.nationality ? 'border-rose-500' : 'border-slate-600'}`}
                  >
                    {NATIONALITIES.map(n => (
                      <option key={n} value={n}>{NATIONALITY_LABELS[n] || n}</option>
                    ))}
                  </select>
                  {errors.nationality && <p className="text-rose-400 text-xs mt-1">{errors.nationality}</p>}
                </div>

                {/* 生年月日 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">
                    生年月日<span className="text-rose-400 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={profile.birthDate || ''}
                    onChange={e => setProfile(prev => ({ ...prev, birthDate: e.target.value }))}
                    className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all
                      ${errors.birthDate ? 'border-rose-500' : 'border-slate-600'}`}
                  />
                  {errors.birthDate && <p className="text-rose-400 text-xs mt-1">{errors.birthDate}</p>}
                </div>

                {/* 在留カード番号 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">
                    在留カード番号<span className="text-rose-400 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例: AB12345678CD"
                    maxLength={12}
                    value={profile.residenceCardNumber || ''}
                    onChange={e => setProfile(prev => ({ ...prev, residenceCardNumber: e.target.value.toUpperCase() }))}
                    className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase
                      ${errors.residenceCardNumber ? 'border-rose-500' : 'border-slate-600'}`}
                  />
                  {errors.residenceCardNumber && <p className="text-rose-400 text-xs mt-1">{errors.residenceCardNumber}</p>}
                </div>

                {/* 在留期限 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">
                    在留期限<span className="text-rose-400 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={profile.expiryDate || ''}
                    onChange={e => setProfile(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all
                      ${errors.expiryDate ? 'border-rose-500' : 'border-slate-600'}`}
                  />
                  {errors.expiryDate && <p className="text-rose-400 text-xs mt-1">{errors.expiryDate}</p>}
                </div>

                {/* 在留資格 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">在留資格（任意）</label>
                  <input
                    type="text"
                    placeholder="例: 特定技能１号"
                    value={profile.visaType || ''}
                    onChange={e => setProfile(prev => ({ ...prev, visaType: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* 性別 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">性別（任意）</label>
                  <select
                    value={profile.gender || ''}
                    onChange={e => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">選択してください</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>

                {/* 在留期間 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">在留期間（任意）</label>
                  <input
                    type="text"
                    placeholder="例: 5年"
                    value={profile.periodOfStay || ''}
                    onChange={e => setProfile(prev => ({ ...prev, periodOfStay: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* 就労制限 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">就労制限（任意）</label>
                  <input
                    type="text"
                    placeholder="例: 就労活動のみ可"
                    value={profile.workRestriction || ''}
                    onChange={e => setProfile(prev => ({ ...prev, workRestriction: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* 住所 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">住居地（任意）</label>
                  <input
                    type="text"
                    placeholder="例: 大阪府大阪市北区…"
                    value={profile.address || ''}
                    onChange={e => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* 許可年月日 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">許可年月日（任意）</label>
                  <input
                    type="date"
                    value={profile.dateOfPermission || ''}
                    onChange={e => setProfile(prev => ({ ...prev, dateOfPermission: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* 交付年月日 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">交付年月日（任意）</label>
                  <input
                    type="date"
                    value={profile.dateOfDelivery || ''}
                    onChange={e => setProfile(prev => ({ ...prev, dateOfDelivery: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* 旅券番号 */}
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">旅券番号（任意）</label>
                  <input
                    type="text"
                    placeholder="例: TK1234567"
                    value={profile.passportNumber || ''}
                    onChange={e => setProfile(prev => ({ ...prev, passportNumber: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                  />
                </div>
              </div>


              {/* アップロード済み画像のプレビュー */}
              {Object.values(slots).some(s => s.status === 'done') && (
                <div className="mt-6 pt-5 border-t border-slate-700">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">スキャン済み書類（登録時に保存されます）</p>
                  <div className="flex gap-3 flex-wrap">
                    {SLOT_DEFS.map(def => {
                      const slot = slots[def.id];
                      if (slot.status !== 'done' || !slot.file) return null;
                      return (
                        <div key={def.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-emerald-400">
                          <CheckCircle2 size={12} /> {def.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ナビゲーション */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-slate-200 font-medium transition-colors"
              >
                <ChevronLeft size={18} /> 書類添付に戻る
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900 transition-all active:scale-95"
              >
                {isSaving ? <><Loader2 size={18} className="animate-spin" /> 登録中...</> : <><CheckCircle2 size={18} /> 台帳に登録する</>}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
