'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PhotoUploadZone } from '../client/PhotoUploadZone';
import { FileUploadZone } from '../client/FileUploadZone';
import { storageService } from '@/services/storageService';
import { submitApplicantRegistrationAction } from '@/app/actions/applicantAuthActions';

interface WizardProps {
  token: string;
}

export const ApplicantRegistrationWizard: React.FC<WizardProps> = ({ token }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // -- State --
  // Step 1
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Step 2 (OCR/Manual Input)
  const [profile, setProfile] = useState({
    name: '',
    nationality: '',
    passportNumber: '',
    birthDate: '',
    gender: '',
    placeOfBirth: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    issuingAuthority: '',
  });

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
          } else if (breadcrumb.includes('生年月日') || breadcrumb.includes('Date of birth')) {
            extractedProfile.birthDate = item.value;
          } else if (breadcrumb.includes('性別') || breadcrumb.includes('Sex') || breadcrumb.includes('Gender')) {
            extractedProfile.gender = item.value;
          } else if (breadcrumb.includes('出生地') || breadcrumb.includes('Place of birth')) {
            extractedProfile.placeOfBirth = item.value;
          } else if (breadcrumb.includes('発行年月日') || breadcrumb.includes('Date of issue')) {
            extractedProfile.passportIssueDate = item.value;
          } else if (breadcrumb.includes('有効期間満了日') || breadcrumb.includes('Date of expiry')) {
            extractedProfile.passportExpiryDate = item.value;
          } else if (breadcrumb.includes('発行機関') || breadcrumb.includes('Authority')) {
            extractedProfile.issuingAuthority = item.value;
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile.name || !profile.nationality || !profile.passportNumber) {
      setError('すべての項目を入力してください。');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 一時的なID（アップロードパス用）
      const tempId = crypto.randomUUID();
      
      // 画像のアップロード
      const [passportUrl, photoUrl] = await Promise.all([
        storageService.uploadFile(passportFile!, `foreigners/${tempId}/passport_${Date.now()}`),
        storageService.uploadFile(photoFile!, `foreigners/${tempId}/photo_${Date.now()}`),
      ]);

      // サーバーアクションを呼び出して foreigners ドキュメントを作成
      const res = await submitApplicantRegistrationAction(token, {
        name: profile.name,
        nationality: profile.nationality,
        passportNumber: profile.passportNumber,
        birthDate: profile.birthDate,
        gender: profile.gender,
        placeOfBirth: profile.placeOfBirth,
        passportIssueDate: profile.passportIssueDate,
        passportExpiryDate: profile.passportExpiryDate,
        issuingAuthority: profile.issuingAuthority,
        passportImageUrl: passportUrl,
        photoUrl: photoUrl,
      });

      if (!res.success) {
        throw new Error(res.error || 'サーバーでの登録処理に失敗しました。');
      }

      setIsSuccess(true);
      
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : '登録に失敗しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto min-h-dvh bg-slate-50 flex items-center justify-center p-5">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-100 flex flex-col items-center text-center space-y-4 max-w-sm w-full"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900">とうろく完了</h2>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            じょうほうの とうろくが おわりました。<br/>
            (Registration completed successfully)
          </p>
          <button
            onClick={() => window.close()}
            className="mt-4 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold active:scale-95 transition-transform"
          >
            とじる (Close)
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-dvh bg-white flex flex-col relative pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black text-slate-900 tracking-tight">情報を登録する</h1>
          <span className="text-xs font-bold text-slate-400">Step {step} / 2</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="bg-indigo-500 h-full rounded-full"
            initial={{ width: '50%' }}
            animate={{ width: `${(step / 2) * 100}%` }}
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

              <div className="space-y-5 h-[50vh] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
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
                
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">せいべつ (Sex)</label>
                    <input
                      type="text"
                      value={profile.gender}
                      onChange={(e) => setProfile({...profile, gender: e.target.value})}
                      placeholder="M / F"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">たんじょうび (DOB)</label>
                    <input
                      type="text"
                      value={profile.birthDate}
                      onChange={(e) => setProfile({...profile, birthDate: e.target.value})}
                      placeholder="1990-01-01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">しゅっせいち (Birth Place)</label>
                    <input
                      type="text"
                      value={profile.placeOfBirth}
                      onChange={(e) => setProfile({...profile, placeOfBirth: e.target.value})}
                      placeholder="Hanoi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">はっこうび (Issue Date)</label>
                    <input
                      type="text"
                      value={profile.passportIssueDate}
                      onChange={(e) => setProfile({...profile, passportIssueDate: e.target.value})}
                      placeholder="2020-01-01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">ゆうこうきげん (Expiry Date)</label>
                    <input
                      type="text"
                      value={profile.passportExpiryDate}
                      onChange={(e) => setProfile({...profile, passportExpiryDate: e.target.value})}
                      placeholder="2030-01-01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">はっこうきかん (Authority)</label>
                  <input
                    type="text"
                    value={profile.issuingAuthority}
                    onChange={(e) => setProfile({...profile, issuingAuthority: e.target.value})}
                    placeholder="Ministry of Foreign Affairs"
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
                  onClick={() => handleSubmit()}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> ほぞんちゅう...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> 保存する (Save)</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
