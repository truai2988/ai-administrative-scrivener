'use client';

import React, { useState, useMemo } from 'react';
import { Foreigner } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { differenceInDays } from 'date-fns';
import { Clock, CheckSquare, Square, MinusSquare, FilePen, Mail, CheckCircle, XCircle, Sparkles } from 'lucide-react';
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
  const [filterVisaType, setFilterVisaType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const renderFilterHeader = (
    filterKey: string,
    title: string,
    value: string,
    setValue: (v: string) => void,
    options: string[],
    getLabel?: (v: string) => string
  ) => {
    const isOpen = openDropdown === filterKey;
    return (
      <div className="relative inline-flex items-center justify-center w-full">
        <button
          onClick={(e) => { e.stopPropagation(); setOpenDropdown(isOpen ? null : filterKey); }}
          className={`flex items-center justify-center text-xs font-bold w-full hover:opacity-80 transition-opacity ${value ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          {title} <span className="ml-1 opacity-70 text-[10px]">▼</span>
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); }} 
            />
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[140px] max-w-[240px] bg-white border border-slate-200 rounded-md shadow-xl z-50 max-h-[300px] overflow-y-auto text-left py-1">
              <div 
                className={`px-3 py-2.5 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors ${value === '' ? 'bg-indigo-50/50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                onClick={(e) => { e.stopPropagation(); setValue(''); setOpenDropdown(null); }}
              >
                すべて
              </div>
              {options.map(opt => {
                let label = getLabel ? getLabel(opt) : opt;
                if (filterKey === 'branch' && opt === 'hq_direct') label = '本部直轄';
                return (
                  <div 
                    key={opt}
                    className={`px-3 py-2.5 text-xs hover:bg-slate-50 cursor-pointer pointer-events-auto break-all transition-colors ${value === opt ? 'bg-indigo-50/50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                    onClick={(e) => { e.stopPropagation(); setValue(opt); setOpenDropdown(null); }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const { branchOptions, nationalityOptions, companyOptions, visaTypeOptions, statusOptions } = useMemo(() => {
    return {
      branchOptions: Array.from(new Set(['hq_direct', ...data.map(d => d.branchId).filter(Boolean) as string[]])),
      nationalityOptions: Array.from(new Set(data.map(d => d.nationality).filter(Boolean) as string[])),
      companyOptions: Array.from(new Set(data.map(d => d.company).filter(Boolean) as string[])),
      visaTypeOptions: Array.from(new Set(data.map(d => d.visaType).filter(Boolean) as string[])),
      statusOptions: Array.from(new Set(data.map(d => d.status).filter(Boolean) as string[]))
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filterBranch && item.branchId !== filterBranch) return false;
      if (filterNationality && item.nationality !== filterNationality) return false;
      if (filterCompany && item.company !== filterCompany) return false;
      if (filterVisaType && item.visaType !== filterVisaType) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      return true;
    });
  }, [data, filterBranch, filterNationality, filterCompany, filterVisaType, filterStatus]);

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

  const colName = readonly ? (showBranch ? 'w-[15%]' : 'w-[20%]') : (showBranch ? 'w-[13%]' : 'w-[16%]');
  const colNat = readonly ? (showBranch ? 'w-[10%]' : 'w-[12%]') : (showBranch ? 'w-[7%]' : 'w-[8%]');
  const colBranch = readonly ? 'w-[14%]' : 'w-[10%]';
  const colComp = readonly ? (showBranch ? 'w-[16%]' : 'w-[20%]') : (showBranch ? 'w-[12%]' : 'w-[14%]');
  const colVisa = readonly ? (showBranch ? 'w-[14%]' : 'w-[16%]') : (showBranch ? 'w-[10%]' : 'w-[12%]');
  const colExp = readonly ? (showBranch ? 'w-[13%]' : 'w-[15%]') : (showBranch ? 'w-[9%]' : 'w-[10%]');
  const colStat = readonly ? (showBranch ? 'w-[14%]' : 'w-[17%]') : (showBranch ? 'w-[11%]' : 'w-[12%]');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <Clock className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-bold text-slate-800">管理対象者リスト</h2>
        {isSelectable && selectedIds && selectedIds.size > 0 && (
          <span className="ml-2 text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
            {selectedIds.size}名選択中
          </span>
        )}
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full min-w-[1100px] text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50">
              {isSelectable && (
                <th className="px-1 py-3 w-[4%] text-center align-middle">
                  <button
                    onClick={toggleAll}
                    className="inline-flex items-center justify-center align-middle text-slate-400 hover:text-indigo-600 transition-colors mt-0.5"
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
              <th className={`px-3 py-3 ${colName} text-center text-xs font-bold text-slate-400`}>氏名</th>
              <th className={`px-2 py-3 ${colNat} text-center`}>
                {renderFilterHeader('nationality', '国籍', filterNationality, setFilterNationality, nationalityOptions)}
              </th>
              {showBranch && (
                <th className={`px-2 py-3 ${colBranch} text-center`}>
                  {renderFilterHeader('branch', '管轄支部', filterBranch, setFilterBranch, branchOptions, getBranchLabel)}
                </th>
              )}
              <th className={`px-2 py-3 ${colComp} text-center`}>
                {renderFilterHeader('company', '所属企業', filterCompany, setFilterCompany, companyOptions)}
              </th>
              <th className={`px-2 py-3 ${colVisa} text-center`}>
                {renderFilterHeader('visa', '在留資格', filterVisaType, setFilterVisaType, visaTypeOptions)}
              </th>
              <th className={`px-3 py-3 ${colExp} text-center text-xs font-bold text-slate-400`}>在留期限</th>
              <th className={`px-2 py-3 ${colStat} text-center`}>
                {renderFilterHeader('status', '進捗ステータス', filterStatus, setFilterStatus, statusOptions)}
              </th>
              {!readonly && (
                <th className={`px-2 py-3 ${showBranch ? 'w-[21%]' : 'w-[25%]'} text-center text-xs font-bold text-slate-400 uppercase tracking-wider`}>操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayedData.map((person) => {
              const daysLeft = person.expiryDate ? getDaysRemaining(person.expiryDate) : Infinity;
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
              


              return (
                <tr 
                  key={person.id} 
                  className={`group transition-colors ${isChecked ? 'bg-teal-50/30' : ''}`}
                >
                  {isSelectable && (
                    <td className="px-1 py-3 text-center align-middle">
                      <button
                        onClick={(e) => toggleOne(e, person.id)}
                        className="inline-flex items-center justify-center align-middle text-slate-400 hover:text-teal-600 transition-colors mt-0.5"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-teal-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="px-3 py-3 text-left">
                    <span className="text-xs font-bold text-slate-900">{person.name}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-xs text-slate-600">{person.nationality}</span>
                  </td>
                  {showBranch && (
                    <td className="px-2 py-3 text-center">
                      <span className="text-xs font-medium text-slate-700">
                        {getBranchLabel && person.branchId ? getBranchLabel(person.branchId) : person.branchId || '未所属'}
                      </span>
                    </td>
                  )}
                  <td className="px-2 py-3 text-center">
                    <span className="text-xs font-medium text-slate-700">{person.company || '未所属'}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-xs text-slate-600">{person.visaType || '−'}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={`text-xs ${isUrgent ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}`}>
                      {person.expiryDate ? person.expiryDate.replace(/-/g, '/') : '−'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <StatusBadge status={person.status} />
                  </td>
                  {!readonly && (
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
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

                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === `edit-${person.id}` ? null : `edit-${person.id}`);
                            }}
                            title="申請書を作成・編集"
                            className="flex items-center gap-1.5 px-3 py-2 bg-white text-indigo-600 border border-indigo-200 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                          >
                            <FilePen className="w-3.5 h-3.5" />
                            書類作成
                          </button>

                          {openDropdown === `edit-${person.id}` && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(null);
                                }}
                              />
                              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-max bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    window.open(`/forms/renewal/${person.id}`, '_blank');
                                  }}
                                  className="block w-full text-left px-4 py-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border-b border-slate-100 transition-colors"
                                >
                                  期間更新許可申請
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    window.open(`/forms/change-of-status/new?foreignerId=${person.id}`, '_blank');
                                  }}
                                  className="block w-full text-left px-4 py-3 text-xs font-bold text-teal-600 hover:bg-teal-50 border-b border-slate-100 transition-colors"
                                >
                                  在留資格変更許可申請
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    window.open('/forms/coe/new', '_blank');
                                  }}
                                  className="block w-full text-left px-4 py-3 text-xs font-bold text-sky-600 hover:bg-sky-50 transition-colors"
                                >
                                  在留資格認定証明書交付申請
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        
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
