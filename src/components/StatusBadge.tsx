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
      case '作成中':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case '作成完了':
        return 'bg-amber-50 text-amber-600 border-amber-200 font-bold';
      case '申請済':
        return 'bg-blue-100 text-blue-700 border-blue-200 font-bold';
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
