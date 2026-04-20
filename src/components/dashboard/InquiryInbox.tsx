'use client';

import React, { useMemo } from 'react';
import { useInquiries } from '@/hooks/useInquiries';
import { updateInquiryStatus } from '@/app/actions/supportActions';
import { Bell, X, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { UserRole } from '@/types/database';
import { format } from 'date-fns';

interface InquiryInboxProps {
  userRole: UserRole | string;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS = {
  open: '未対応',
  in_progress: '対応中',
  resolved: '完了'
};

const STATUS_COLORS = {
  open: 'bg-rose-100 text-rose-700 border-rose-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

export function useInquiryUnreadCount(userRole: UserRole | string) {
  const { inquiries } = useInquiries(userRole);
  return useMemo(() => inquiries.filter(i => i.status === 'open').length, [inquiries]);
}

export default function InquiryInbox({ userRole, isOpen, onClose }: InquiryInboxProps) {
  const { inquiries, loading } = useInquiries(userRole);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

  const handleStatusChange = async (inquiryId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    setIsUpdating(inquiryId);
    try {
      const res = await updateInquiryStatus(inquiryId, newStatus);
      if (!res.success) {
        alert(res.error || 'ステータスの更新に失敗しました。');
      }
    } catch (e) {
      console.error(e);
      alert('通信エラーが発生しました。');
    } finally {
      setIsUpdating(null);
    }
  };

  const getCreatedAt = (createdAt: unknown) => {
    if (!createdAt) return '';
    try {
      const ts = createdAt as { toDate?: () => Date };
      const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(createdAt as string | number | Date);
      return format(date, 'yyyy/MM/dd HH:mm');
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-slate-50 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">通知ボックス</h2>
              <p className="text-xs text-slate-500">ユーザーからのお問い合わせ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-xs font-medium">読み込み中...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-50" />
              <p className="text-xs font-medium">現在お問い合わせはありません</p>
            </div>
          ) : (
            inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">
                    {inquiry.subject}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${STATUS_COLORS[inquiry.status]}`}>
                    {STATUS_LABELS[inquiry.status]}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {inquiry.body}
                </p>

                <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-400">送信元:</span>
                    <span>{inquiry.tenantId !== 'unknown' ? '🏢 ' + inquiry.tenantId : '🏢 組織情報なし'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-medium text-slate-400">受信日時:</span>
                    <span>{getCreatedAt(inquiry.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 mt-2">
                    {isUpdating === inquiry.id ? (
                      <div className="text-xs text-slate-400 flex items-center gap-1 py-2">
                        <RefreshCw className="w-3 h-3 animate-spin" /> 更新中...
                      </div>
                    ) : (
                      <>
                        {inquiry.status === 'open' && (
                          <button
                            onClick={() => handleStatusChange(inquiry.id, 'in_progress')}
                            className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-lg border border-amber-200 transition-colors flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" /> 対応中にする
                          </button>
                        )}
                        {(inquiry.status === 'open' || inquiry.status === 'in_progress') && (
                          <button
                            onClick={() => handleStatusChange(inquiry.id, 'resolved')}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> 完了にする
                          </button>
                        )}
                        {inquiry.status === 'resolved' && (
                          <button
                            onClick={() => handleStatusChange(inquiry.id, 'open')}
                            className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3" /> 未対応に戻す
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
