'use client';

import React, { useState } from 'react';
import { Foreigner } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { format, differenceInDays } from 'date-fns';
import { Search, ChevronRight, Clock, ShieldCheck } from 'lucide-react';

interface ForeignerListProps {
  data: Foreigner[];
  onSelect: (foreigner: Foreigner) => void;
}

export const ForeignerList: React.FC<ForeignerListProps> = ({ data, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(
    (item) =>
      item.name.includes(searchTerm) ||
      item.nationality.includes(searchTerm) ||
      ((item as any).company && (item as any).company.includes(searchTerm))
  );

  const getDaysRemaining = (date: string) => {
    return differenceInDays(new Date(date), new Date());
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-500" />
          管理対象者リスト
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="名前、国籍、企業名で検索..."
            className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm w-full md:w-80 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">氏名 / 国籍</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">所属 / 在留資格</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">在留期限</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">進捗ステータス</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">AIレビュー</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.slice(0, 100).map((person) => {
              const daysLeft = getDaysRemaining(person.expiryDate);
              const isUrgent = daysLeft < 90;

              return (
                <tr 
                  key={person.id} 
                  className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                  onClick={() => onSelect(person)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{person.name}</span>
                      <span className="text-xs text-slate-400">{person.nationality}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{(person as any).company || '未所属'}</span>
                      <span className="text-xs text-slate-400 line-clamp-1">{(person as any).visaType || '特定技能'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex flex-col ${isUrgent ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}`}>
                      <span className="text-sm">{person.expiryDate.replace(/-/g, '/')}</span>
                      <span className="text-[10px] opacity-70">
                        {daysLeft > 0 ? `${daysLeft}日以内` : '期限切れ'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={person.status} />
                  </td>
                  <td className="px-6 py-4">
                    {person.aiReview ? (
                      <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg w-fit">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold">完了 ({person.aiReview.riskScore}%)</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300">未入庫</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all group-hover:text-indigo-600">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredData.length > 100 && (
        <div className="p-4 text-center bg-slate-50/30 text-[10px] font-medium text-slate-400">
          全 {filteredData.length} 件中 100 件を表示中。検索条件で絞り込んでください。
        </div>
      )}
    </div>
  );
};
