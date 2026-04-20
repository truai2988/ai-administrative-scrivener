'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Send, Loader2, CheckCircle2, History, MessageSquarePlus, Clock, Inbox } from 'lucide-react';
import { supportSchema, SupportFormData } from '@/lib/schemas/supportSchema';
import { submitSupportInquiry } from '@/app/actions/supportActions';
import { useMyInquiries } from '@/hooks/useMyInquiries';

interface SupportInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportInquiryModal({ isOpen, onClose }: SupportInquiryModalProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { inquiries, loading: historyLoading } = useMyInquiries();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: SupportFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const res = await submitSupportInquiry(data);
    
    if (res.success) {
      setIsSuccess(true);
      setIsSubmitting(false);
    } else {
      setSubmitError(res.error || '予期せぬエラーが発生しました。');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setIsSuccess(false);
      setSubmitError(null);
      setActiveTab('new');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md md:max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex bg-indigo-50 items-center justify-between px-6 py-4 border-b border-indigo-100 shrink-0">
          <h2 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
            サポート窓口へ問い合わせ
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100/50 p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {!isSuccess && (
          <div className="flex mx-6 mt-4 mb-0 bg-slate-100 rounded-xl p-1 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-2.5 text-sm font-bold flex items-center gap-2 justify-center rounded-lg transition-all ${
                activeTab === 'new'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4" />
              新規作成
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2.5 text-sm font-bold flex items-center gap-2 justify-center rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              送信履歴
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col overflow-y-auto">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 bg-indigo-50/50 rounded-xl my-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <p className="text-base font-bold text-slate-800 mb-2">送信が完了しました</p>
              <p className="text-sm text-slate-600 text-center font-medium max-w-xs leading-relaxed mb-6">
                お問い合わせいただきありがとうございます。担当者からのご返信を今しばらくお待ちください。
              </p>
              <div className="flex gap-3 w-full max-w-xs flex-col">
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    reset();
                    setActiveTab('history');
                  }}
                  className="w-full py-3 px-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-xl transition-all active:scale-95 text-sm"
                >
                  送信履歴を確認する
                </button>
                <button
                  onClick={handleClose}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm"
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : activeTab === 'new' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-5">
              <div className="flex flex-col space-y-1">
                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
                  システムに関するご要望、エラーの報告、その他ご不明な点についてお気軽にお問い合わせください。
                </p>
              </div>

              {submitError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-bold whitespace-pre-wrap flex flex-col">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <label htmlFor="subject" className="text-xs font-bold text-slate-700">
                  件名 <span className="text-rose-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  placeholder="例: パスワードを忘れてしまった"
                  className={`w-full text-sm font-medium border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-all outline-none ${
                    errors.subject
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                  {...register('subject')}
                  disabled={isSubmitting}
                />
                {errors.subject && (
                  <p className="text-xs font-bold text-rose-500">{errors.subject.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-2 flex-1">
                <label htmlFor="body" className="text-xs font-bold text-slate-700">
                  問い合わせ内容 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="body"
                  placeholder="できるだけ詳細にお書きください..."
                  rows={6}
                  className={`w-full text-sm font-medium border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-all outline-none resize-none ${
                    errors.body
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                  {...register('body')}
                  disabled={isSubmitting}
                />
                {errors.body && (
                  <p className="text-xs font-bold text-rose-500">{errors.body.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none active:scale-[0.98] mt-2 group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>送信中...</span>
                  </>
                ) : (
                  <>
                    <span>送信する</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col space-y-4">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                  <p className="text-xs font-bold text-slate-500">履歴を読み込み中...</p>
                </div>
              ) : inquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-slate-100 text-center px-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                    <Inbox className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 mb-1">まだお問い合わせ履歴はありません</p>
                  <p className="text-xs text-slate-500 mb-5">
                    システムに関するご不明点などがございましたら、<br />
                    新規作成タブからお気軽にご連絡ください。
                  </p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    新規作成へ戻る
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  {inquiries.map((inq) => {
                    const isResolved = inq.status === 'resolved';
                    const isInProgress = inq.status === 'in_progress';
                    
                    // Firestore Timestamp => Date => String
                    let dateStr = '';
                    if (inq.createdAt) {
                      if (typeof inq.createdAt === 'string') {
                        dateStr = new Date(inq.createdAt).toLocaleString('ja-JP');
                      } else if ('toDate' in inq.createdAt) {
                        dateStr = inq.createdAt.toDate().toLocaleString('ja-JP');
                      } else {
                        dateStr = new Date(inq.createdAt as unknown as Date).toLocaleString('ja-JP');
                      }
                    }

                    return (
                      <div key={inq.id} className="flex flex-col bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all hover:bg-white hover:shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-bold text-slate-800 line-clamp-1 flex-1 pr-3">
                            {inq.subject}
                          </h3>
                          <div className="shrink-0">
                            {isResolved ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                完了
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border border-amber-200">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                対応中
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border border-slate-300">
                                <Clock className="w-3 h-3" />
                                未対応
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mb-3 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                          {inq.body}
                        </p>
                        <div className="text-xs font-bold text-slate-400 mt-auto">
                          {dateStr}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
