'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { ForeignerSchema } from '@/utils/validation';
import { StepProgress } from '../client/StepProgress';
import { FileUploadZone } from '../client/FileUploadZone';
import { PhotoUploadZone } from '../client/PhotoUploadZone';
import { ChevronRight, ChevronLeft, Send, CheckCircle2, User, CreditCard, FileText, Landmark } from 'lucide-react';

import { submitForeignerEntryAction } from '@/app/actions/foreignerActions';
import { storageService } from '@/services/storageService';
import { Foreigner } from '@/types/database';


interface ForeignerEntryFormProps {
  token: string;
  branchId?: string;
  isCorrectionMode?: boolean;
  initialData?: Partial<Foreigner>;
  onCorrectionSuccess?: (updatedData: Partial<Foreigner>) => void;
  onCorrectionCancel?: () => void;
  currentUser?: { id: string; name: string };
}

export const ForeignerEntryForm: React.FC<ForeignerEntryFormProps> = ({ 
  token, 
  branchId,
  isCorrectionMode = false,
  initialData,
  onCorrectionSuccess,
  onCorrectionCancel,
  currentUser,
}) => {
  const STEPS = isCorrectionMode 
    ? ['書類添付', '基本情報', '在留情報', '修正の確認']
    : ['書類添付', '基本情報', '在留情報', '委任同意'];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    nationality: initialData?.nationality || '',
    birthday: initialData?.birthDate || '',
    residenceCardNumber: initialData?.residenceCardNumber || '',
    expiryDate: initialData?.expiryDate || '',
    visaType: initialData?.visaType || '',
    jobType: initialData?.jobTitle || '',
    experienceYears: initialData?.experience || '',
    files: {} as Record<string, File | null>,
    isAgreed: false,
    correctionReason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 合計ファイルサイズの計算
  const calculateTotalSize = (files: Record<string, File | null>) => {
    return Object.values(files).reduce((acc, file) => acc + (file?.size || 0), 0);
  };

  const currentTotalSize = calculateTotalSize(formData.files);
  const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB
  const isOverTotalLimit = currentTotalSize > MAX_TOTAL_SIZE;

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.name) newErrors.name = '氏名を入力してください';
      if (!formData.nationality) newErrors.nationality = '国籍を選択してください';
    } else if (currentStep === 2) {
      const result = ForeignerSchema.safeParse({
        ...formData,
        residenceCardNumber: formData.residenceCardNumber,
        expiryDate: formData.expiryDate || '2099-12-31',
      });
      if (!result.success) {
        result.error.issues.forEach((err: z.ZodIssue) => {
          if (err.path.toString().includes('residenceCardNumber')) newErrors.residenceCardNumber = err.message;
        });
      }
    } else if (currentStep === 0) {
      if (isOverTotalLimit) {
        newErrors.files = `合計サイズが制限(25MB)を超えています。現在は${(currentTotalSize / (1024 * 1024)).toFixed(2)}MBです。`;
      }
    } else if (currentStep === 3) {
      if (!isCorrectionMode && !formData.isAgreed) newErrors.isAgreed = '同意が必要です';
      if (isCorrectionMode && !formData.correctionReason.trim()) newErrors.correctionReason = '修正理由は必須です';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep()) {
      setIsSubmitting(true);
      
      try {
        // Upload files if they exist
        const photoUrl = formData.files['photo'] 
          ? await storageService.uploadFile(formData.files['photo'], `foreigners/${token}/photo_${Date.now()}`) : undefined;
        const rcFrontUrl = formData.files['rc-front'] 
          ? await storageService.uploadFile(formData.files['rc-front'], `foreigners/${token}/rc_front_${Date.now()}`) : undefined;
        const rcBackUrl = formData.files['rc-back'] 
          ? await storageService.uploadFile(formData.files['rc-back'], `foreigners/${token}/rc_back_${Date.now()}`) : undefined;
        const passportUrl = formData.files['passport'] 
          ? await storageService.uploadFile(formData.files['passport'], `foreigners/${token}/passport_${Date.now()}`) : undefined;

        const updatedPayload: Partial<Foreigner> = {
          name: formData.name,
          nationality: formData.nationality,
          birthDate: formData.birthday,
          residenceCardNumber: formData.residenceCardNumber,
          expiryDate: formData.expiryDate,
          visaType: formData.visaType,
          branchId: branchId,
        };
        if (photoUrl) updatedPayload.photoUrl = photoUrl;
        if (rcFrontUrl) updatedPayload.residenceCardFrontUrl = rcFrontUrl;
        if (rcBackUrl) updatedPayload.residenceCardBackUrl = rcBackUrl;
        if (passportUrl) updatedPayload.passportImageUrl = passportUrl;

        if (isCorrectionMode) {
          const { foreignerService } = await import('@/services/foreignerService');
          await foreignerService.correctForeignerData(
            token,
            updatedPayload,
            formData.correctionReason,
            currentUser?.id || 'unknown'
          );
          alert('データの修正が完了し、履歴が保存されました。');
          if (onCorrectionSuccess) onCorrectionSuccess(updatedPayload);
        } else {
          const result = await submitForeignerEntryAction(token, updatedPayload);

          if (result.success) {
            setIsSubmitted(true);
          } else {
            alert(result.error);
          }
        }
      } catch (error) {
        console.error('Submit error:', error);
        alert('送信中にエラーが発生しました。時間を置いて再度お試しください。');
      } finally {
        setIsSubmitting(false);
      }
    }
  };


  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl text-center border border-slate-100"
      >
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">送信が完了しました</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          ご入力いただいた情報は、行政書士および支援機関にて確認いたします。<br />
          今後の手続きのご案内があるまでお待ちください。<br />
          <strong className="text-indigo-600 mt-2 block">こちらの画面は閉じて終了していただいて構いません。</strong>
        </p>
        <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-500 italic">
          ※法的委任への同意が記録されました。
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pb-20 pt-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          ビザ申請データ入力
        </h1>
        <p className="text-xs text-slate-500">
          スマホで簡単に申請書類の準備ができます。
        </p>
      </div>

      <StepProgress currentStep={currentStep + 1} totalSteps={STEPS.length} steps={STEPS} />

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Documents */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="bg-amber-50/50 p-4 rounded-2xl mb-4 flex items-start gap-3">
                  <FileText className="w-5 h-5 text-amber-600 mt-1" />
                  <p className="text-sm text-amber-900 leading-relaxed font-medium">
                    スマートフォンのカメラで撮影してアップロードしてください。AIが文字情報を自動入力します。
                  </p>
                </div>

                <div className={`p-4 rounded-2xl mb-6 border ${isOverTotalLimit ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">合計ファイルサイズ</span>
                    <span className={`text-xs font-bold ${isOverTotalLimit ? 'text-rose-600' : 'text-slate-600'}`}>
                      {(currentTotalSize / (1024 * 1024)).toFixed(2)} / 25.00 MB
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className={`h-full ${isOverTotalLimit ? 'bg-rose-500' : 'bg-indigo-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((currentTotalSize / MAX_TOTAL_SIZE) * 100, 100)}%` }}
                    />
                  </div>
                  {isOverTotalLimit && (
                    <p className="text-[10px] text-rose-600 font-bold mt-2">
                      【警告】合計サイズが25MBを超えています。一部のファイルを削除、または画質を下げて再度アップロードしてください。
                    </p>
                  )}
                </div>

                {errors.files && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl mb-4 font-bold">
                    {errors.files}
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <PhotoUploadZone
                      file={formData.files['photo']}
                      onFileSelect={(f) => setFormData(prev => ({ ...prev, files: { ...prev.files, 'photo': f } }))}
                    />
                  </div>
                  <div className="border-t border-slate-100 pt-6">
                    <FileUploadZone 
                      label="在留カード（表面）" 
                      file={formData.files['rc-front']}
                      compressionType="document"
                      onFileSelect={(f) => setFormData(prev => ({ ...prev, files: { ...prev.files, 'rc-front': f } }))} 
                    />
                  </div>
                  <div>
                    <FileUploadZone 
                      label="在留カード（裏面）" 
                      file={formData.files['rc-back']}
                      compressionType="document"
                      onFileSelect={(f) => setFormData(prev => ({ ...prev, files: { ...prev.files, 'rc-back': f } }))} 
                    />
                  </div>
                  <div>
                    <FileUploadZone 
                      label="パスポート（顔写真ページ）" 
                      file={formData.files['passport']}
                      compressionType="document"
                      onFileSelect={(f) => setFormData(prev => ({ ...prev, files: { ...prev.files, 'passport': f } }))} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="bg-indigo-50/50 p-4 rounded-2xl mb-6 flex items-start gap-3">
                  <User className="w-5 h-5 text-indigo-600 mt-1" />
                  <p className="text-sm text-indigo-900 leading-relaxed font-medium">
                    AIが読み取った内容を確認し、間違いがあれば修正してください。
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">氏名 (アルファベット)</label>
                  <input
                    type="text"
                    placeholder="例: DELA CRUZ JUAN"
                    className={`w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-lg ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">国籍</label>
                  <select
                    className={`w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-lg appearance-none ${errors.nationality ? 'ring-2 ring-red-500' : ''}`}
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  >
                    <option value="">選択してください</option>
                    <option value="Philippines">フィリピン</option>
                    <option value="Vietnam">ベトナム</option>
                    <option value="China">中国</option>
                    <option value="Indonesia">インドネシア</option>
                    <option value="Nepal">ネパール</option>
                    <option value="Myanmar">ミャンマー</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Residence Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="bg-blue-50/50 p-4 rounded-2xl mb-6 flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600 mt-1" />
                  <p className="text-sm text-blue-900 leading-relaxed font-medium">
                    AIが読み取った在留カード番号と有効期限に間違いがないか確認してください。
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">在留カード番号</label>
                  <input
                    type="text"
                    placeholder="例: AB12345678CD"
                    maxLength={12}
                    className={`w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-lg uppercase ${errors.residenceCardNumber ? 'ring-2 ring-red-500' : ''}`}
                    value={formData.residenceCardNumber}
                    onChange={(e) => setFormData({ ...formData, residenceCardNumber: e.target.value })}
                  />
                  {errors.residenceCardNumber && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.residenceCardNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">在留期限</label>
                  <input
                    type="date"
                    className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">在留資格</label>
                  <input
                    type="text"
                    placeholder="例: 技術・人文知識・国際業務"
                    className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                    value={formData.visaType}
                    onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Consent or Correction Confirm */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {isCorrectionMode ? (
                  <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-6 h-6 text-amber-600" />
                      <h3 className="text-lg font-bold text-amber-900">修正理由の入力</h3>
                    </div>
                    <div className="text-sm text-amber-800 leading-relaxed mb-4">
                      <p>修正内容を保存するためには、理由の入力が必須です。この理由は関係支部に履歴として共有されます。</p>
                    </div>
                    <textarea
                      placeholder="例: 在留カード番号の読み取りミスを修正"
                      className={`w-full p-4 bg-white border rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all text-sm resize-none h-32 ${errors.correctionReason ? 'border-red-500 ring-2 ring-red-500' : 'border-amber-200'}`}
                      value={formData.correctionReason}
                      onChange={(e) => setFormData({ ...formData, correctionReason: e.target.value })}
                    />
                    {errors.correctionReason && <p className="text-red-500 text-xs mt-2 font-medium">{errors.correctionReason}</p>}
                  </div>
                ) : (
                  <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                    <div className="flex items-center gap-3 mb-4">
                      <Landmark className="w-6 h-6 text-emerald-600" />
                      <h3 className="text-lg font-bold text-emerald-900">法的委任への同意</h3>
                    </div>
                    <div className="text-sm text-emerald-800 leading-relaxed space-y-3 prose prose-sm">
                      <p>私は、本申請に関する手続きを、提携する行政書士に委任することに同意します。</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>入力された情報の正確性を保証します。</li>
                        <li>申請に必要な個人情報の提供に同意します。</li>
                        <li>委任内容に変更がある場合は速やかに通知します。</li>
                      </ul>
                    </div>
                    <label className="mt-8 flex items-center gap-4 p-4 bg-white rounded-2xl cursor-pointer shadow-sm border border-emerald-100 transition-all active:scale-95">
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={formData.isAgreed}
                        onChange={(e) => setFormData({ ...formData, isAgreed: e.target.checked })}
                      />
                      <span className="text-sm font-bold text-slate-700">上記の内容を理解し、同意します</span>
                    </label>
                    {errors.isAgreed && <p className="text-red-500 text-xs mt-2 font-medium">{errors.isAgreed}</p>}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 p-4 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all active:bg-slate-200"
            >
              <ChevronLeft className="w-5 h-5" />
              戻る
            </button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-2 p-4 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 active:bg-indigo-700"
            >
              次へ
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!isCorrectionMode && !formData.isAgreed) || isSubmitting}
              className={`flex-2 p-4 flex items-center justify-center gap-2 font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${
                (isCorrectionMode || formData.isAgreed) && !isSubmitting
                  ? (isCorrectionMode ? 'bg-amber-500 text-white shadow-amber-200 active:bg-amber-600' : 'bg-emerald-600 text-white shadow-emerald-200 active:bg-emerald-700')
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Send className={isSubmitting ? "w-5 h-5 animate-pulse" : "w-5 h-5"} />
              {isSubmitting ? '処理中...' : (isCorrectionMode ? '修正を確定する' : '申請を委任して送信')}
            </button>
          )}
        </div>

        {isCorrectionMode && onCorrectionCancel && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onCorrectionCancel}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 underline"
            >
              修正をキャンセル
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
