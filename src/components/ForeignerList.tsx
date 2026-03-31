'use client';

import React, { useState } from 'react';
import { Foreigner } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { differenceInDays } from 'date-fns';
import { Search, ChevronRight, Clock, ShieldCheck, CheckSquare, Square, MinusSquare, Gavel, FilePen } from 'lucide-react';
import Link from 'next/link';

interface ForeignerListProps {
  data: Foreigner[];
  onSelect: (foreigner: Foreigner, editMode?: boolean) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export const ForeignerList: React.FC<ForeignerListProps> = ({ data, onSelect, selectedIds, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(
    (item) =>
      item.name.includes(searchTerm) ||
      item.nationality.includes(searchTerm) ||
      (item.company && item.company.includes(searchTerm))
  );

  const displayedData = filteredData.slice(0, 100);

  const getDaysRemaining = (date: string) => {
    return differenceInDays(new Date(date), new Date());
  };

  // チェックボックス選択ロジック
  const isSelectable = !!onSelectionChange;
  const allSelected = isSelectable && displayedData.length > 0 && displayedData.every(f => selectedIds?.has(f.id));
  const someSelected = isSelectable && displayedData.some(f => selectedIds?.has(f.id));

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(displayedData.map(f => f.id)));
    }
  };

  const toggleOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-500" />
          管理対象者リスト
          {isSelectable && selectedIds && selectedIds.size > 0 && (
            <span className="ml-2 text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
              {selectedIds.size}名選択中
            </span>
          )}
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
              {isSelectable && (
                <th className="px-4 py-4 w-10">
                  <button
                    onClick={toggleAll}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                    title={allSelected ? '全選択解除' : '全選択'}
                  >
                    {allSelected ? (
                      <CheckSquare className="h-5 w-5 text-teal-600" />
                    ) : someSelected ? (
                      <MinusSquare className="h-5 w-5 text-teal-400" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
              )}
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">氏名 / 国籍</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">所属 / 在留資格</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">在留期限</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">進捗ステータス</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">法的同意</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">AIレビュー</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayedData.map((person) => {
              const daysLeft = getDaysRemaining(person.expiryDate);
              const isUrgent = daysLeft < 90;
              const isChecked = selectedIds?.has(person.id) ?? false;

              return (
                <tr 
                  key={person.id} 
                  className={`hover:bg-indigo-50/30 transition-colors group cursor-pointer ${isChecked ? 'bg-teal-50/30' : ''}`}
                  onClick={() => onSelect(person)}
                >
                  {isSelectable && (
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => toggleOne(e, person.id)}
                        className="text-slate-400 hover:text-teal-600 transition-colors"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-teal-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {person.name}
                      </span>
                      <span className="text-xs text-slate-400">{person.nationality}</span>
                    </div>
                  </td>
                   <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{person.company || '未所属'}</span>
                      <span className="text-xs text-slate-400 line-clamp-1">{person.visaType || '特定技能'}</span>
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
                  <td className="px-6 py-4 text-center">
                    {person.consentLog ? (
                      <div className="flex flex-col items-center gap-1" title="法的同意済み (PDF出力可能)">
                        <Gavel className="h-4 w-4 text-emerald-500" />
                        <span className="text-[8px] font-bold text-emerald-600 uppercase">DONE</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 opacity-20" title="同意未完了">
                        <Gavel className="h-4 w-4 text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">PENDING</span>
                      </div>
                    )}
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
                    <div className="flex items-center justify-end gap-2">
                      {/* 申請書を編集ボタン */}
                      <Link
                        href={`/forms/renewal/${person.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all
                          bg-indigo-50 text-indigo-600 border border-indigo-100
                          hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
                        title="在留期間更新許可申請書を編集"
                      >
                        <FilePen className="h-3.5 w-3.5" />
                        申請書を編集
                      </Link>
                      {/* 詳細モーダルへ */}
                      <div className="flex items-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
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
