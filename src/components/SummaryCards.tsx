import React from 'react';
import { AlertTriangle, FileText, CheckCircle } from 'lucide-react';

interface SummaryCardsProps {
  expiringSoon: number;
  pending: number;
  completed: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  expiringSoon,
  pending,
  completed,
}) => {
  const cards = [
    {
      title: '3ヶ月以内に期限切れ',
      value: expiringSoon,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      title: '進行中の申請案件',
      value: pending,
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: '今月の完了数',
      value: completed,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white px-6 py-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 flex items-center space-x-5 group"
        >
          <div className={`${card.bg} p-3.5 rounded-2xl group-hover:scale-110 transition-transform`}>
            <card.icon className={`h-7 w-7 ${card.color}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">{card.title}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
