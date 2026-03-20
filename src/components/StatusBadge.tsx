import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ForeignerStatus } from '@/types/database';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatusBadgeProps {
  status: ForeignerStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (status: ForeignerStatus) => {
    switch (status) {
      case '完了':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case '申請済':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case '追加資料待機':
        return 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';
      case '準備中':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'チェック中':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200 font-bold';
      case '期限切れ警告':
        return 'bg-rose-100 text-rose-700 border-rose-200 font-bold';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <span
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-300',
        getStatusStyles(status)
      )}
    >
      {status}
    </span>
  );
};
