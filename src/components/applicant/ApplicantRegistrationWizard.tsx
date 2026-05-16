'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, UserPlus, Lock, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PhotoUploadZone } from '../client/PhotoUploadZone';
import { FileUploadZone } from '../client/FileUploadZone';
import { storageService } from '@/services/storageService';
import { signUp } from '@/lib/firebase/auth';
import { registerApplicantAccountAction } from '@/app/actions/applicantAuthActions';
import { useRouter } from 'next/navigation';

interface WizardProps {
  token: string;
}

export const ApplicantRegistrationWizard: React.FC<WizardProps> = ({ token }) => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // -- State --
  // Step 1
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Step 2 (OCR/Manual Input)
  const [profile, setProfile] = useState({
    name: '',
    nationality: '',
    passportNumber: '',
  });

  // Step 3 (Auth)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNextToStep2 = async () => {
    if (!passportFile || !photoFile) {
      setError('パスポートと顔写真の両方をアップロードしてください。');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', passportFile);

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'パスポートの読み取りに失敗しました。');
      }

      const data = await res.json();
      
      if (data.success && data.items) {
        const extractedProfile = { ...profile };
        
        data.items.forEach((item: { value: string; breadcrumb?: string[] }) => {
          const breadcrumb = item.breadcrumb?.join(' > ') || '';
          if (breadcrumb.includes('氏名（英字）') || breadcrumb.includes('Name')) {
            extractedProfile.name = item.value;
          } else if (breadcrumb.includes('国籍') || breadcrumb.includes('Nationality')) {
            extractedProfile.nationality = item.value;
          } else if (breadcrumb.includes('旅券番号') || breadcrumb.includes('Passport')) {
            extractedProfile.passportNumber = item.value;
          }
        });
        
        setProfile(extractedProfile);
      }
      
      setStep(2);
    } catch (err: unknown) {
      console.error('OCR Error:', err);
      // OCRが失敗しても手動で入力できるようにStep 2へ進める（エラーは表示）
      const errorMessage = err instanceof Error ? err.message : '読み取りに失敗しました。手動で入力してください。';
      setError(errorMessage);
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextToStep3 = () => {
    if (!profile.name || !profile.nationality || !profile.passportNumber) {
      setError('すべての項目を入力してください。');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Firebase Auth アカウント作成 (クライアントサイド)
      //    成功すると自動的にログイン状態になる
      const userCredential = await signUp(email, password);
      const user = userCredential.user;

      // 2. 画像のアップロード
      // uidをプレフィックスにして安全に保存
      const uid = user.uid;
      const [passportUrl, photoUrl] = await Promise.all([
        storageService.uploadFile(passportFile!, `foreigners/${uid}/passport_${Date.now()}`),
        storageService.uploadFile(photoFile!, `foreigners/${uid}/photo_${Date.now()}`),
      ]);

      // 3. サーバーアクションを呼び出して users と foreigners ドキュメントを作成
      const res = await registerApplicantAccountAction(uid, email, token, {
        name: profile.name,
        nationality: profile.nationality,
        passportNumber: profile.passportNumber,
        passportImageUrl: passportUrl,
        photoUrl: photoUrl,
      });

      if (!res.success) {
        throw new Error(res.error || 'サーバーでの登録処理に失敗しました。');
      }

      // 登録完了後、申請人用のダッシュボードへ遷移
      // （※現在 applicant 専用ダッシュボードがない場合は /foreigner/dashboard などへ）
      router.push('/login'); // ひとまずログイン画面か完了画面へ
      
    } catch (err: unknown) {
      console.error(err);
      const authError = err as { code?: string; message?: string };
      if (authError.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に登録されています。');
      } else {
        setError(authError.message || '登録に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-dvh bg-white flex flex-col relative pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black text-slate-900 tracking-tight">アカウントをつくる</h1>
          <span className="text-xs font-bold text-slate-400">Step {step} / 3</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="bg-indigo-500 h-full rounded-full"
            initial={{ width: '33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-rose-700 leading-relaxed">{error}</p>
          </motion.div>
        </div>
      )}

      {/* Steps Content */}
      <div className="flex-1 px-5 pt-6 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">1. しゃしんをとる</h2>
                <p className="text-xs text-slate-500 font-medium">Take photos of your passport and face</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">パスポート (Passport)</label>
                  <FileUploadZone
                    onFileSelect={(f) => setPassportFile(f)}
                    label="パスポートの顔写真ページ"
                  />
                  {passportFile && <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {passportFile.name}</p>}
                </div>

                <div>
                  <PhotoUploadZone
                    file={photoFile}
                    onFileSelect={(f) => setPhotoFile(f)}
                  />
                </div>
              </div>

              <button
                onClick={handleNextToStep2}
                disabled={isProcessing}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70 disabled:scale-100"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> よみとりちゅう...</>
                ) : (
                  <>つぎへ (Next) <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
               <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">2. じぶんのじょうほう</h2>
                <p className="text-xs text-slate-500 font-medium">Confirm your personal info</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">なまえ (Name)</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    placeholder="TARO YAMADA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">くに (Nationality)</label>
                  <input
                    type="text"
                    value={profile.nationality}
                    onChange={(e) => setProfile({...profile, nationality: e.target.value})}
                    placeholder="Vietnam"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">パスポートばんごう (Passport No.)</label>
                  <input
                    type="text"
                    value={profile.passportNumber}
                    onChange={(e) => setProfile({...profile, passportNumber: e.target.value})}
                    placeholder="AB1234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="p-4 bg-slate-100 text-slate-500 rounded-2xl font-bold active:scale-95 transition-transform"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextToStep3}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  つぎへ (Next) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">3. ログインじょうほう</h2>
                <p className="text-xs text-slate-500 font-medium">Create login credentials</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">メールアドレス (Email)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">パスワード (Password)</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1 mt-1 font-medium">6もじ以上 (At least 6 characters)</p>
                </div>

                {/* 将来的にGoogleログインを追加するスペース */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-center text-[10px] text-slate-400 mb-3 font-bold">OR</p>
                  <button type="button" disabled className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 text-xs opacity-50 cursor-not-allowed">
                    Google アカウントで登録 (Coming Soon)
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="p-4 bg-slate-100 text-slate-500 rounded-2xl font-bold active:scale-95 transition-transform"
                    disabled={isProcessing}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> さくせいちゅう...</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> 登録する (Register)</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
