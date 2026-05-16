'use client';

import React, { useState, useMemo } from 'react';
import { Foreigner } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { differenceInDays } from 'date-fns';
import { Clock, CheckSquare, Square, MinusSquare, FilePen, Sparkles, XCircle, Check, AlertCircle, RefreshCw, AlertTriangle, Upload } from 'lucide-react';
import { UserRole } from '@/types/database';
import { ExcelDownloadButton } from './ExcelDownloadButton';
import { ConsentPdfButton } from './ConsentPdfButton';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import type { ForeignerAiDiagnosticSummary, AiDiagnosticSummary } from '@/services/aiDiagnosticStatusService';

interface ForeignerListProps {
  data: Foreigner[];
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  readonly?: boolean;
  showOrganization?: boolean;
  getOrganizationLabel?: (orgId: string) => string;
  userRole?: UserRole;
  aiDiagnosticMap?: Record<string, ForeignerAiDiagnosticSummary>;
  onUpdate?: (updated: Foreigner) => void;
  onDeleteSelected?: () => void;
}

export const ForeignerList: React.FC<ForeignerListProps> = ({ data, selectedIds, onSelectionChange, readonly, showOrganization, getOrganizationLabel, userRole, aiDiagnosticMap, onDeleteSelected }) => {
  const [filterUnion, setFilterUnion] = useState('');
  const [filterNationality, setFilterNationality] = useState('');
  const [filterEnterprise, setFilterEnterprise] = useState('');
  const [filterVisaType, setFilterVisaType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { toasts, dismiss } = useToast();

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
                if ((filterKey === 'union' || filterKey === 'enterprise') && opt === 'unassigned') label = '未所属';
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

  const { unionOptions, nationalityOptions, enterpriseOptions, visaTypeOptions, statusOptions } = useMemo(() => {
    const rawUnions = new Set(data.map(d => d.unionId).filter(Boolean) as string[]);
    const rawEnterprises = new Set(data.map(d => d.enterpriseId).filter(Boolean) as string[]);
    
    if (data.some(d => !d.unionId)) rawUnions.add('unassigned');
    if (data.some(d => !d.enterpriseId)) rawEnterprises.add('unassigned');

    return {
      unionOptions: Array.from(rawUnions),
      nationalityOptions: Array.from(new Set(data.map(d => d.nationality).filter(Boolean) as string[])),
      enterpriseOptions: Array.from(rawEnterprises),
      visaTypeOptions: Array.from(new Set(data.map(d => d.visaType).filter(Boolean) as string[])),
      statusOptions: Array.from(new Set(data.map(d => d.status).filter(Boolean) as string[]))
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filterUnion) {
        if (filterUnion === 'unassigned') {
          if (item.unionId) return false;
        } else {
          if (item.unionId !== filterUnion) return false;
        }
      }
      if (filterNationality && item.nationality !== filterNationality) return false;
      if (filterEnterprise) {
        if (filterEnterprise === 'unassigned') {
          if (item.enterpriseId) return false;
        } else {
          if (item.enterpriseId !== filterEnterprise) return false;
        }
      }
      if (filterVisaType && item.visaType !== filterVisaType) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      return true;
    });
  }, [data, filterUnion, filterNationality, filterEnterprise, filterVisaType, filterStatus]);

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

  const colName = readonly ? (showOrganization ? 'w-[14%]' : 'w-[16%]') : (showOrganization ? 'w-[12%]' : 'w-[14%]');
  const colNat = readonly ? (showOrganization ? 'w-[10%]' : 'w-[11%]') : (showOrganization ? 'w-[8%]' : 'w-[9%]');
  const colOrg = readonly ? 'w-[11%]' : 'w-[9%]';
  const colComp = readonly ? (showOrganization ? 'w-[17%]' : 'w-[20%]') : (showOrganization ? 'w-[14%]' : 'w-[17%]');
  const colVisa = readonly ? (showOrganization ? 'w-[14%]' : 'w-[15%]') : (showOrganization ? 'w-[11%]' : 'w-[12%]');
  const colExp = readonly ? (showOrganization ? 'w-[12%]' : 'w-[13%]') : (showOrganization ? 'w-[9%]' : 'w-[10%]');
  const colStat = readonly ? (showOrganization ? 'w-[12%]' : 'w-[13%]') : (showOrganization ? 'w-[9%]' : 'w-[10%]');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <Clock className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-bold text-slate-800">管理対象者リスト</h2>
        {isSelectable && selectedIds && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 ml-2">
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
              {selectedIds.size}名選択中
            </span>
            {onDeleteSelected && (
              <button
                onClick={onDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                削除
              </button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full min-w-[1200px] text-left border-collapse table-fixed">
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
              {showOrganization && (
                <th className={`px-2 py-3 ${colOrg} text-center`}>
                  {renderFilterHeader('union', '組合', filterUnion, setFilterUnion, unionOptions, getOrganizationLabel)}
                </th>
              )}
              <th className={`px-2 py-3 ${colComp} text-center`}>
                {renderFilterHeader('enterprise', '所属企業', filterEnterprise, setFilterEnterprise, enterpriseOptions, getOrganizationLabel)}
              </th>
              <th className={`px-2 py-3 ${colVisa} text-center`}>
                {renderFilterHeader('visa', '在留資格', filterVisaType, setFilterVisaType, visaTypeOptions)}
              </th>
              <th className={`px-3 py-3 ${colExp} text-center text-xs font-bold text-slate-400`}>在留期限</th>
              <th className={`px-2 py-3 ${colStat} text-center`}>
                {renderFilterHeader('status', '進捗ステータス', filterStatus, setFilterStatus, statusOptions)}
              </th>
              {!readonly && (
                <th className={`px-2 py-3 w-[24%] text-center text-xs font-bold text-slate-400 uppercase tracking-wider`}>操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayedData.map((person) => {
              const daysLeft = person.expiryDate ? getDaysRemaining(person.expiryDate) : Infinity;
              const isUrgent = daysLeft < 90;
              const isChecked = selectedIds?.has(person.id) ?? false;
              const diag = aiDiagnosticMap?.[person.id];
              
              const hasAnyDiagIssue = diag && Object.values(diag).some(
                (d) => d && (d.stale || d.critical > 0 || d.warning > 0)
              );

              const renderDiagIcon = (d?: AiDiagnosticSummary) => {
                if (!d) return <span title="未診断"><Sparkles className="w-3.5 h-3.5 text-slate-300" /></span>;
                if (d.stale) return <span title="要再診断"><RefreshCw className="w-3.5 h-3.5 text-indigo-500" /></span>;
                if (d.critical > 0) return <span title="重大な問題あり"><AlertCircle className="w-3.5 h-3.5 text-rose-600" /></span>;
                if (d.warning > 0) return <span title="要注意あり"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>;
                return <span title="問題なし"><Check className="w-3.5 h-3.5 text-emerald-500" /></span>;
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
                    <span className="block truncate text-xs font-bold text-slate-900" title={person.name}>{person.name}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="block truncate text-xs text-slate-600" title={person.nationality}>{person.nationality}</span>
                  </td>
                  {showOrganization && (
                    <td className="px-2 py-3 text-center">
                      <span className="block truncate text-xs font-medium text-slate-700" title={getOrganizationLabel ? getOrganizationLabel(person.unionId || 'unassigned') : (!person.unionId ? '未所属' : person.unionId)}>
                        {getOrganizationLabel ? getOrganizationLabel(person.unionId || 'unassigned') : (!person.unionId ? '未所属' : person.unionId)}
                      </span>
                    </td>
                  )}
                  <td className="px-2 py-3 text-center">
                    <span className="block truncate text-xs font-medium text-slate-700" title={getOrganizationLabel ? getOrganizationLabel(person.enterpriseId || 'unassigned') : (!person.enterpriseId ? '未所属' : person.enterpriseId)}>
                      {getOrganizationLabel ? getOrganizationLabel(person.enterpriseId || 'unassigned') : (!person.enterpriseId ? '未所属' : person.enterpriseId)}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="block truncate text-xs text-slate-600" title={person.visaType || '−'}>{person.visaType || '−'}</span>
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
                    <td className="px-2 py-3 align-middle">
                      <div className="flex flex-nowrap whitespace-nowrap items-center justify-center gap-1.5 min-w-0">
                        {/* ── scrivener: フル操作（Excel/同意書/申請書類） ── */}
                        {userRole === 'scrivener' && (
                          <>
                            <ExcelDownloadButton foreigner={person} variant="icon" />
                            <ConsentPdfButton foreigner={person} variant="icon" />

                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(openDropdown === `edit-${person.id}` ? null : `edit-${person.id}`);
                                }}
                                title="申請書を作成・編集"
                                className="relative flex items-center justify-center gap-1.5 h-8 px-3 bg-white text-indigo-600 border border-indigo-200 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm min-w-[96px]"
                              >
                                <FilePen className="w-3.5 h-3.5" />
                                申請書類
                                {hasAnyDiagIssue && (
                                  <span className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white shadow-sm" />
                                )}
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
                                        window.open(`/forms/coe/${person.id}`, '_blank');
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-sky-600 hover:bg-sky-50 border-b border-slate-100 transition-colors"
                                    >
                                      {renderDiagIcon(diag?.coe)}
                                      <span>在留資格認定証明書交付申請</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdown(null);
                                        window.open(`/forms/renewal/${person.id}`, '_blank');
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border-b border-slate-100 transition-colors"
                                    >
                                      {renderDiagIcon(diag?.renewal)}
                                      <span>在留期間更新許可申請</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdown(null);
                                        window.open(`/forms/change-of-status/${person.id}`, '_blank');
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-teal-600 hover:bg-teal-50 transition-colors"
                                    >
                                      {renderDiagIcon(diag?.changeOfStatus)}
                                      <span>在留資格変更許可申請</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}

                        {/* ── branch_staff / enterprise_staff: 書類アップロードのみ ── */}
                        {(userRole === 'union_staff' || userRole === 'enterprise_staff') && (
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(openDropdown === `upload-${person.id}` ? null : `upload-${person.id}`);
                              }}
                              title="書類をアップロード"
                              className="flex items-center justify-center gap-1.5 h-8 px-3 bg-white text-violet-600 border border-violet-200 text-xs font-bold rounded-lg hover:bg-violet-50 transition-colors shadow-sm min-w-[120px]"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              書類アップロード ▾
                            </button>

                            {openDropdown === `upload-${person.id}` && (
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
                                      window.open(`/forms/coe/${person.id}`, '_blank');
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-sky-600 hover:bg-sky-50 border-b border-slate-100 transition-colors"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span>在留資格認定証明書交付申請</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      window.open(`/forms/renewal/${person.id}`, '_blank');
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border-b border-slate-100 transition-colors"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span>在留期間更新許可申請</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdown(null);
                                      window.open(`/forms/change-of-status/${person.id}`, '_blank');
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-teal-600 hover:bg-teal-50 transition-colors"
                                  >
                                    <Upload className="w-3 h-3" />
                                    <span>在留資格変更許可申請</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
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
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
};
