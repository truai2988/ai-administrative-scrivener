'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { auth } from '@/lib/firebase/auth';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { USER_ROLE_LABELS } from '@/types/database';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Building2,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  KeyRound
} from 'lucide-react';

// ─── トーストコンポーネント (ページローカル) ──────────────────────────────
function ToastNotification({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border bg-white ${
        type === 'success' ? 'border-emerald-100 shadow-emerald-50' : 'border-rose-100 shadow-rose-50'
      }`}
    >
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
          type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-rose-500" />
        )}
      </div>
      <div className="pr-4">
        <p className={`text-sm font-bold ${type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
          {type === 'success' ? '成功' : 'エラー'}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-wrap">{message}</p>
      </div>
      <button onClick={onClose} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
        <X size={15} />
      </button>
    </motion.div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────────────────
export default function ProfileSettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // プロフィール表示用
  const [orgName, setOrgName] = useState<string>('');
  const [loadingOrg, setLoadingOrg] = useState(true);

  // パスワード変更フォーム用
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // トースト状態
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 認証ガード
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // 組織名の取得
  useEffect(() => {
    async function fetchOrgName() {
      if (!currentUser) return;
      if (!currentUser.organizationId) {
        setOrgName('未所属（システム管理者）');
        setLoadingOrg(false);
        return;
      }
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', currentUser.organizationId));
        if (orgDoc.exists()) {
          setOrgName(orgDoc.data()?.name || '不明な組織');
        } else {
          setOrgName('組織情報が見つかりません');
        }
      } catch (error) {
        console.error('Error fetching org:', error);
        setOrgName('取得エラー');
      } finally {
        setLoadingOrg(false);
      }
    }
    if (currentUser) fetchOrgName();
  }, [currentUser]);

  // パスワード変更処理
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !currentUser?.email) return;

    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: '新しいパスワードと確認用パスワードが一致しません。' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'パスワードは6文字以上で設定してください。' });
      return;
    }

    setIsUpdating(true);
    try {
      // 1. 再認証フロー（requires-recent-login の回避）
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. パスワード更新
      await updatePassword(auth.currentUser, newPassword);

      // 成功
      setToast({ type: 'success', message: 'パスワードが正常に変更されました。\n次回から新しいパスワードでログインしてください。' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (authError: unknown) {
      console.error('Password update error:', authError);
      const err = authError as { code?: string };
      let errMsg = 'パスワードの変更に失敗しました。';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errMsg = '現在のパスワードが間違っています。';
      } else if (err.code === 'auth/weak-password') {
        errMsg = '新しいパスワードが脆弱すぎます。';
      }
      setToast({ type: 'error', message: errMsg });
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* ─── ヘッダー ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <User size={16} className="text-indigo-600" />
            </div>
            <h1 className="font-bold text-lg text-slate-800">プロフィール・アカウント設定</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 mt-10 space-y-8">
        
        {/* ─── プロフィール情報 (Read-only) ─────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <h2 className="font-bold text-slate-800">基本情報（担当者プロフィール）</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 名前 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <User size={14} />
                  <span className="text-xs font-bold">氏名（表示名）</span>
                </div>
                <p className="font-bold text-slate-900">{currentUser.displayName}</p>
              </div>

              {/* メールアドレス */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Mail size={14} />
                  <span className="text-xs font-bold">メールアドレス (ログインID)</span>
                </div>
                <p className="font-bold text-slate-900">{currentUser.email}</p>
              </div>

              {/* 権限 (ロール) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <ShieldCheck size={14} />
                  <span className="text-xs font-bold">システム権限</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg shadow-xs">
                    {USER_ROLE_LABELS[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </div>

              {/* 所属組織 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Building2 size={14} />
                  <span className="text-xs font-bold">所属している組織</span>
                </div>
                {loadingOrg ? (
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                ) : (
                  <p className="font-bold text-slate-900">{orgName}</p>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* ─── パスワードの変更 ────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <h2 className="font-bold text-slate-800">パスワードの変更</h2>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="p-6">
            <p className="text-sm text-slate-500 mb-6">
              セキュリティのため、パスワードを変更するには現在のパスワードを入力して再認証を行う必要があります。
            </p>

            <div className="max-w-md space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">現在のパスワード</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="現在のパスワード"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">新しいパスワード</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="新しいパスワード（6文字以上）"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">新しいパスワード（確認用）</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="もう一度入力"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  パスワードを変更する
                </button>
              </div>
            </div>
          </form>
        </section>

      </main>

      {/* トースト表示 */}
      <AnimatePresence>
        {toast && (
          <ToastNotification
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
