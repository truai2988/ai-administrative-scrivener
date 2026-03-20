'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ForeignerSchema } from '@/utils/validation';
import { StepProgress } from './StepProgress';
import { FileUploadZone } from './FileUploadZone';
import { ChevronRight, ChevronLeft, Send, CheckCircle2, User, CreditCard, Briefcase, FileText } from 'lucide-react';

const STEPS = ['基本情報', '在留情報', '職務・経歴', '書類添付'];

export const ClientEntryForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    nationality: '',
    birthDate: '',
    residenceCardNumber: '',
    expiryDate: '',
    jobTitle: '',
    pastExperience: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.name) newErrors.name = '氏名を入力してください';
      if (!formData.nationality) newErrors.nationality = '国籍を入力してください';
      if (!formData.birthDate) newErrors.birthDate = '生年月日を入力してください';
    } else if (step === 2) {
      const result = ForeignerSchema.safeParse({
        name: formData.name || 'dummy',
        birthDate: formData.birthDate || '2000-01-01',
        nationality: formData.nationality || 'dummy',
        residenceCardNumber: formData.residenceCardNumber,
        expiryDate: formData.expiryDate || '2099-12-31',
      });
      if (!result.success) {
        result.error.issues.forEach((err: z.ZodIssue) => {
          if (err.path.includes('residenceCardNumber')) newErrors.residenceCardNumber = err.message;
          if (err.path.includes('expiryDate')) newErrors.expiryDate = err.message;
        });
      }
      if (!formData.residenceCardNumber) newErrors.residenceCardNumber = '在留カード番号を入力してください';
      if (!formData.expiryDate) newErrors.expiryDate = '在留期限を入力してください';
    } else if (step === 3) {
      if (!formData.jobTitle) newErrors.jobTitle = '職務内容を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      console.log('Sending data to Administrative Scrivener Dashboard...', formData);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto mt-20 p-8 text-center bg-white rounded-3xl shadow-xl border border-emerald-100"
      >
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">送信完了</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          申請情報の送信が完了しました。<br />
          行政書士による審査結果をお待ちください。
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
        >
          トップに戻る
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm relative pb-32">
      {/* Header */}
      <div className="bg-indigo-600 p-8 pt-12 rounded-b-[40px] text-white overflow-hidden relative">
        <motion.div 
          className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <h1 className="text-2xl font-black mb-2">更新申請・情報入力</h1>
        <p className="text-indigo-100 text-sm opacity-80">必要事項を入力し、審査を依頼してください</p>
      </div>

      <StepProgress currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />

      <div className="px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 rounded-2xl">
                  <User className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800">基本情報を入力</h3>
                </div>
                <InputField 
                  label="氏名 (英語)" 
                  placeholder="DELA CRUZ JUAN"
                  value={formData.name}
                  error={errors.name}
                  onChange={(val) => setFormData({...formData, name: val})}
                />
                <InputField 
                  label="国籍" 
                  placeholder="フィリピン"
                  value={formData.nationality}
                  error={errors.nationality}
                  onChange={(val) => setFormData({...formData, nationality: val})}
                />
                <InputField 
                  label="生年月日" 
                  type="date"
                  value={formData.birthDate}
                  error={errors.birthDate}
                  onChange={(val) => setFormData({...formData, birthDate: val})}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 rounded-2xl">
                  <CreditCard className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800">在留資格カード情報</h3>
                </div>
                <InputField 
                  label="在留カード番号" 
                  placeholder="AB12345678CD"
                  value={formData.residenceCardNumber}
                  error={errors.residenceCardNumber}
                  onChange={(val) => setFormData({...formData, residenceCardNumber: val.toUpperCase()})}
                />
                <InputField 
                  label="在留期限" 
                  type="date"
                  value={formData.expiryDate}
                  error={errors.expiryDate}
                  onChange={(val) => setFormData({...formData, expiryDate: val})}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 rounded-2xl">
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800">職務予定・経歴</h3>
                </div>
                <TextAreaField 
                  label="現在の職務内容予定" 
                  placeholder="例：建設業（土木作業長）"
                  value={formData.jobTitle}
                  error={errors.jobTitle}
                  onChange={(val) => setFormData({...formData, jobTitle: val})}
                />
                <TextAreaField 
                  label="過去の経歴・専門性" 
                  placeholder="例：母国での会計業務、特定技能1号など"
                  value={formData.pastExperience}
                  onChange={(val) => setFormData({...formData, pastExperience: val})}
                />
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 rounded-2xl">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800">必要書類の添付</h3>
                </div>
                <FileUploadZone label="在留カード（表面）" />
                <FileUploadZone label="在留カード（裏面）" />
                <FileUploadZone label="パスポート（顔写真のページ）" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 flex gap-4 max-w-md mx-auto z-20">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-4 border-2 border-slate-200 text-slate-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                戻る
              </button>
            )}
            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                次へ
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                className="flex-2 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-[0.98]"
              >
                審査を依頼する
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField: React.FC<{ label: string; placeholder?: string; type?: string; value: string; error?: string; onChange: (val: string) => void }> = ({ label, placeholder, type = 'text', value, error, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none transition-all duration-300 ${
        error ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'
      } text-slate-700 font-medium`}
    />
    {error && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-500 font-bold ml-1">{error}</motion.p>}
  </div>
);

const TextAreaField: React.FC<{ label: string; placeholder?: string; value: string; error?: string; onChange: (val: string) => void }> = ({ label, placeholder, value, error, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <textarea 
      placeholder={placeholder}
      value={value}
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none transition-all duration-300 ${
        error ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50'
      } text-slate-700 font-medium resize-none`}
    />
    {error && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-500 font-bold ml-1">{error}</motion.p>}
  </div>
);
