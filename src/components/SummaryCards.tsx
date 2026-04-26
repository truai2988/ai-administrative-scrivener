import React from 'react';
import { AlertTriangle, FileText, CheckCircle, List } from 'lucide-react';

export type SummaryTab = 'all' | 'expiring' | 'pending' | 'completed';

interface SummaryCardsProps {
  expiringSoon: number;
  pending: number;
  completed: number;
  activeTab: SummaryTab;
  onTabChange: (tab: SummaryTab) => void;
}

const tabs: {
  id: SummaryTab;
  label: string;
  icon: React.ElementType;
  badgeKey?: keyof Pick<SummaryCardsProps, 'expiringSoon' | 'pending' | 'completed'>;
  activeColor: string;
  badgeColor: string;
}[] = [
  {
    id: 'all',
    label: '全件',
    icon: List,
    activeColor: 'bg-slate-800 text-white',
    badgeColor: '',
  },
  {
    id: 'expiring',
    label: '期限切れ間近',
    icon: AlertTriangle,
    badgeKey: 'expiringSoon',
    activeColor: 'bg-rose-600 text-white',
    badgeColor: 'bg-rose-100 text-rose-600',
  },
  {
    id: 'pending',
    label: '進行中の申請',
    icon: FileText,
    badgeKey: 'pending',
    activeColor: 'bg-amber-500 text-white',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'completed',
    label: '完了した申請',
    icon: CheckCircle,
    badgeKey: 'completed',
    activeColor: 'bg-emerald-600 text-white',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
];

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  expiringSoon,
  pending,
  completed,
  activeTab,
  onTabChange,
}) => {
  const counts = { expiringSoon, pending, completed };

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        // ⑤ バッジ値は必ず 0 以上にクランプ（Firestoreカウンター異常値の防御）
        const badgeValue = tab.badgeKey ? Math.max(0, counts[tab.badgeKey]) : undefined;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm
              whitespace-nowrap transition-all duration-200 shrink-0
              ${isActive
                ? `${tab.activeColor} shadow-md`
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700 shadow-sm'
              }
            `}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
            {badgeValue !== undefined && (
              <span
                className={`
                  text-xs font-black px-2 py-0.5 rounded-full min-w-5 text-center
                  ${isActive ? 'bg-white/25 text-white' : tab.badgeColor}
                `}
              >
                {badgeValue}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
