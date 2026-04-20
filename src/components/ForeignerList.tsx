'use client';

import React, { useState } from 'react';
import { Foreigner } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { differenceInDays } from 'date-fns';
import { Clock, CheckSquare, Square, MinusSquare, FilePen, Mail, CheckCircle, XCircle, Sparkles, ChevronDown } from 'lucide-react';
import { UserRole } from '@/types/database';
import { foreignerService } from '@/services/foreignerService';
import { canRequestReview, canApproveOrReturn } from '@/utils/permissions';
import { ExcelDownloadButton } from './ExcelDownloadButton';
import { ConsentPdfButton } from './ConsentPdfButton';

interface ForeignerListProps {
  data: Foreigner[];
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  readonly?: boolean;
  showBranch?: boolean;
  getBranchLabel?: (branchId: string) => string;
  userRole?: UserRole;
  onUpdate?: (updated: Foreigner) => void;
}

export const ForeignerList: React.FC<ForeignerListProps> = ({ data, selectedIds, onSelectionChange, readonly, showBranch, getBranchLabel, userRole, onUpdate }) => {
  const [filterBranch, setFilterBranch] = useState('');
  const [filterNationality, setFilterNationality] = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  // 支部選択肢: hq_direct（本部直轄）は常に先頭に固定 + data から追加
  const branchOptions = Array.from(new Set(['hq_direct', ...data.map(d => d.branchId).filter(Boolean) as string[]]));
  const nationalityOptions = Array.from(new Set(data.map(d => d.nationality).filter(Boolean)));
  const companyOptions = Array.from(new Set(data.map(d => d.company).filter(Boolean)));

  const filteredData = data.filter((item) => {
    if (filterBranch && item.branchId !== filterBranch) return false;
    if (filterNationality && item.nationality !== filterNationality) return false;
    if (filterCompany && item.company !== filterCompany) return false;
    return true;
  });

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
        <div className="flex flex-wrap gap-2">
          {/* 支部名 */}
          {showBranch && (
            <div className="relative">
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer min-w-[120px]"
              >
                <option value="">支部名: すべて</option>
                {branchOptions.map(b => (
                  <option key={b} value={b}>{getBranchLabel ? getBranchLabel(b!) : b}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          )}
          {/* 国籍 */}
          <div className="relative">
            <select
              value={filterNationality}
              onChange={(e) => setFilterNationality(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer min-w-[120px]"
            >
              <option value="">国籍: すべて</option>
              {nationalityOptions.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          {/* 企業名 */}
          <div className="relative">
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer min-w-[140px]"
            >
              <option value="">企業名: すべて</option>
              {companyOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
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
              {showBranch && (
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">管轄支部</th>
              )}
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">所属 / 在留資格</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">在留期限</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">進捗ステータス</th>
              {!readonly && (
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayedData.map((person) => {
              const daysLeft = getDaysRemaining(person.expiryDate);
              const isUrgent = daysLeft < 90;
              const isChecked = selectedIds?.has(person.id) ?? false;

              const allowApproveOrReturn = userRole ? canApproveOrReturn(userRole) : false;
              const allowRequestReview = userRole ? (canRequestReview(userRole) || (userRole === 'hq_admin' && person.branchId === 'hq_direct')) : false;

              const isStatusDraft = person.status === '準備中' || person.status === '編集中' || person.status === '差し戻し';
              const isStatusPendingReview = person.approvalStatus === 'pending_review' || person.status === 'チェック中';
              const isWorkflowDraftOrReturned = !person.approvalStatus || person.approvalStatus === 'draft' || person.approvalStatus === 'returned';

              const showRequestReviewBtn = allowRequestReview && isStatusDraft && isWorkflowDraftOrReturned;
              const showApproveReturnBtn = allowApproveOrReturn && isStatusPendingReview;

              const handleRequestReview = async (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!confirm('行政書士に内容の確認を依頼しますか？')) return;
                try {
                  await foreignerService.updateApprovalStatus(person.id, 'pending_review');
                  if (onUpdate) onUpdate({ ...person, approvalStatus: 'pending_review', status: 'チェック中' });
                } catch (err) {
                  console.error(err);
                  alert('エラーが発生しました');
                }
              };
              
              const handleApprove = async (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!confirm('このデータを承認し、「申請済」にしますか？')) return;
                try {
                  await foreignerService.updateApprovalStatus(person.id, 'approved');
                  if (onUpdate) onUpdate({ ...person, approvalStatus: 'approved', status: '申請済' });
                } catch (err) {
                  console.error(err);
                  alert('エラーが発生しました');
                }
              };
              
              const handleReturn = async (e: React.MouseEvent) => {
                e.stopPropagation();
                const reason = window.prompt('差し戻しの理由を入力してください');
                if (reason === null) return;
                try {
                  await foreignerService.updateApprovalStatus(person.id, 'returned', reason);
                  if (onUpdate) onUpdate({ ...person, approvalStatus: 'returned', returnReason: reason, status: '差し戻し' });
                } catch (err) {
                  console.error(err);
                  alert('エラーが発生しました');
                }
              };
              
              const handleEdit = (e: React.MouseEvent) => {
                e.stopPropagation();
                window.open(`/forms/renewal/${person.id}`, '_blank');
              };

              return (
                <tr 
                  key={person.id} 
                  className={`group transition-colors ${isChecked ? 'bg-teal-50/30' : ''}`}
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
                  {showBranch && (
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">
                        {getBranchLabel && person.branchId ? getBranchLabel(person.branchId) : person.branchId || '未所属'}
                      </span>
                    </td>
                  )}
                   <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{person.company || '未所属'}</span>
                      <span className="text-xs text-slate-400 line-clamp-1">{person.visaType || '−'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex flex-col ${isUrgent ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}`}>
                      <span className="text-sm">{person.expiryDate.replace(/-/g, '/')}</span>
                      <span className="text-xs opacity-70">
                        {daysLeft > 0 ? `${daysLeft}日以内` : '期限切れ'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={person.status} />
                  </td>
                  {!readonly && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {userRole === 'scrivener' && (
                          <>
                            <ExcelDownloadButton foreigner={person} variant="icon" />
                            <ConsentPdfButton foreigner={person} variant="icon" />
                          </>
                        )}

                        {person.aiReview ? (
                          <div
                            title={`AIリーガルチェック: リスクスコア ${person.aiReview.riskScore}点\n${person.aiReview.reason}`}
                            className={`flex items-center justify-center gap-1 h-8 px-2 rounded-lg border cursor-help transition-all ${
                              person.aiReview.riskScore < 30 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                              person.aiReview.riskScore < 70 ? 'bg-amber-50 border-amber-100 text-amber-600' :
                              'bg-rose-50 border-rose-100 text-rose-600'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="text-xs font-black">{person.aiReview.riskScore}</span>
                          </div>
                        ) : (
                          <div 
                            title="AIリーガルチェック: 未実施"
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-300"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        <button
                          onClick={handleEdit}
                          title="申請書を編集・新規作成"
                          className="flex items-center gap-1.5 px-3 py-2 bg-white text-indigo-600 border border-indigo-200 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                        >
                          <FilePen className="w-3.5 h-3.5" />
                          編集
                        </button>
                        
                        {showRequestReviewBtn && (
                          <button
                            onClick={handleRequestReview}
                            title="行政書士へ確認依頼"
                            className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white border border-violet-700 text-xs font-bold rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            確認依頼
                          </button>
                        )}
                        
                        {showApproveReturnBtn && (
                          <>
                            <button
                              onClick={handleReturn}
                              title="差し戻し"
                              className="flex items-center gap-1.5 px-3 py-2 bg-white text-rose-600 border border-rose-200 text-xs font-bold rounded-lg hover:bg-rose-50 transition-colors shadow-sm"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              差戻
                            </button>
                            <button
                              onClick={handleApprove}
                              title="承認"
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white border border-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              承認
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredData.length > 100 && (
        <div className="p-4 text-center bg-slate-50/30 text-xs font-medium text-slate-400">
          全 {filteredData.length} 件中 100 件を表示中。検索条件で絞り込んでください。
        </div>
      )}
    </div>
  );
};
