'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User, Building2, FileStack,
  AlertCircle, Save, Loader2, Download,
  Mail, CheckCircle, XCircle
} from 'lucide-react';
import { useAiDiagnostics } from '@/hooks/useAiDiagnostics';
import { TabAssignmentPanel } from '../TabAssignmentPanel';
import { AiAssistantSidePanel } from '@/components/forms/AiAssistantSidePanel';
import {
  changeOfStatusApplicationSchema,
  type ChangeOfStatusApplicationFormData,
} from '@/lib/schemas/changeOfStatusApplicationSchema';
import type { TabId } from '@/lib/schemas/renewalApplicationSchema'; // Reusing TabId
import { ForeignerInfoTab } from './foreigner/ForeignerInfoTab';
import { EmployerInfoTab } from './employer/EmployerInfoTab';
import { SimultaneousTab } from './simultaneous/SimultaneousTab';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { useChangeOfStatusFormSubmit } from '@/hooks/useChangeOfStatusFormSubmit';
import { useAuth } from '@/contexts/AuthContext';
import { SectionPermissionProvider } from '@/contexts/SectionPermissionContext';
import { resolveTemplate } from '@/lib/constants/assignmentTemplates';
import type { ApplicationKind, TabAssignmentTemplate } from '@/lib/constants/assignmentTemplates';
import type { TabAssignments } from '@/lib/schemas/renewalApplicationSchema';
import { mergeWithDefaults } from '@/lib/utils/formUtils';
import { useForeignerApproval } from '@/hooks/useForeignerApproval';
import { useDiagnosticJumpLearning } from '@/hooks/useDiagnosticJumpLearning';

import { downloadChangeOfStatusCsv1 } from '@/utils/changeOfStatusCsvGenerator1';
import { downloadChangeOfStatusCsvU } from '@/utils/changeOfStatusCsvGeneratorU';
import { downloadChangeOfStatusCsvSimultaneous } from '@/utils/changeOfStatusCsvGeneratorSim';
import { downloadChangeSpecificCsv } from '@/lib/csv/change/generateChangeSpecificCsv';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'foreigner',    label: '外国人本人情報',     icon: User },
  { id: 'employer',     label: '所属機関（企業）情報', icon: Building2 },
  { id: 'simultaneous', label: '同時申請',           icon: FileStack },
];

const DEFAULT_VALUES: Partial<ChangeOfStatusApplicationFormData> = {
  foreignerInfo: {
    nationality: '',
    birthDate: '',
    nameEn: '',
    nameKanji: '',
    gender: 'male',
    birthPlace: '',
    maritalStatus: 'unmarried',
    occupation: '',
    homeCountryAddress: '',
    japanZipCode: '',
    japanPrefecture: '',
    japanCity: '',
    japanAddressLines: '',
    japanAddress: '',
    phoneNumber: '',
    mobileNumber: '',
    email: '',
    passportNumber: '',
    passportExpiryDate: '',
    edNumberAlpha: '',
    edNumberNumeric: '',
    currentResidenceStatus: '特定技能１号 Specified Skilled Worker ( i )',
    currentStayPeriod: '',
    stayExpiryDate: '',
    hasResidenceCard: true,
    residenceCardNumber: '',
    desiredResidenceStatus: '特定技能１号 Specified Skilled Worker ( i )',
    desiredStayPeriod: '',
    desiredStayPeriodOther: '',
    changeReason: '',
    criminalRecord: false,
    criminalRecordDetail: '',
    specificSkillCategory: '1',
    skillCertifications: [],
    languageCertifications: [],
    otherSkillCert: '',
    otherLanguageCert: '',
    totalSpecificSkillStayYears: 0,
    totalSpecificSkillStayMonths: 0,
    depositCharged: false,
    depositOrganizationName: '',
    depositAmount: 0,
    feeCharged: false,
    foreignOrganizationName: '',
    feeAmount: 0,
    hasRelatives: false,
    relatives: [],
    residenceCardReceiptMethod: 'window',
    applicantResidencePlace: '',
    receivingOffice: '',
    notificationEmail: '',
    checkIntent: false,
    freeFormat: '',
  },
  employerInfo: {
    contractStartDate: '',
    contractEndDate: '',
    industryFields: [],
    jobCategories: [],
    mainJobType: '',
    otherJobTypes: [],
    weeklyWorkHours: 40,
    monthlyWorkHours: 173,
    equivalentWorkHours: true,
    monthlySalary: 180000,
    hourlyRate: 1039,
    japaneseMonthlySalary: 180000,
    equivalentSalary: true,
    paymentMethod: 'bank_transfer',
    hasDifferentTreatment: false,
    differentTreatmentDetail: '',
    companyNameJa: '',
    hasCorporateNumber: true,
    corporateNumber: '',
    employmentInsuranceNumber: '',
    companyZipCode: '',
    companyPref: '',
    companyCity: '',
    companyAddressLines: '',
    companyAddress: '',
    representativeName: '',
    companyPhone: '',
    capital: undefined,
    annualRevenue: undefined,
    employeeCount: 1,
    workplaceName: '',
    workplaceZipCode: '',
    workplacePref: '',
    workplaceCity: '',
    workplaceAddressLines: '',
    isSocialInsuranceApplicable: true,
    isLaborInsuranceApplicable: true,
    laborInsuranceNumber: '',
    hasJobHistory: false,
    jobHistory: [],
    complianceOaths: {
      hadLaborLawPenalty:        { applies: false, detail: '' },
      hadInvoluntaryDismissal:   { applies: false, detail: '' },
      hadMissingPersons:         { applies: false, detail: '' },
      hadCriminalPenalty:        { applies: false, detail: '' },
      hasMentalImpairment:       { applies: false, detail: '' },
      hasBankruptcy:             { applies: false, detail: '' },
      hadTechnicalInternRevocation:  { applies: false, detail: '' },
      wasOfficerOfRevokedEntity: { applies: false, detail: '' },
      hadIllegalAct:             { applies: false, detail: '' },
      hadGangsterRelation:       { applies: false, detail: '' },
      legalRepresentativeQualifies: { applies: false, detail: '' },
      isGangControlled:          { applies: false, detail: '' },
      keepsActivityRecords:      true,
      awaresOfGuaranteeContract: { applies: false, detail: '' },
      hasCompliancePenaltyContract: { applies: false, detail: '' },
      noSupportCostBurdenOnForeigner: true,
      allowsTemporaryReturn:          true,
      meetsEmploymentStandards:       true,
      coversReturnTravelCost:         true,
      monitorsHealthAndLife:          true,
      meetsSpecificIndustryEmploymentStandards: undefined,
      hasContractContinuationSystem:  true,
      paysWageByTransfer:             true,
      meetsAdditionalEmploymentStandards: undefined,
    },
    delegateSupportEntirely: false,
    supportPersonnel: {
      supervisorName: '',
      supervisorTitle: '',
      officerName: '',
      officerTitle: '',
    },
  },
  simultaneousApplication: {
    applyForReEntry: false,
    applyForActivityOutsideStatus: false,
    applyForAuthEmployment: false,
  },
};

interface ChangeOfStatusFormProps {
  onSubmit?: (data: ChangeOfStatusApplicationFormData) => void | Promise<void>;
  recordId?: string;
  foreignerId?: string;
  initialValues?: Partial<ChangeOfStatusApplicationFormData>;
  initialAiDiagnostics?: import('@/types/aiDiagnostics').DiagnosticItem[];
  hideHeader?: boolean;
  initialAssignments?: TabAssignments;
  templatesRecord?: Record<ApplicationKind, TabAssignmentTemplate>;
}

export function ChangeOfStatusFormInner({
  onSubmit,
  recordId,
  foreignerId,
  initialValues,
  initialAiDiagnostics,
  hideHeader,
}: ChangeOfStatusFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('foreigner');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const { toasts, dismiss, show: showToast } = useToast();
  // currentUser is handled by the wrapper now
  const { currentUser } = useAuth();

  const visibleTabs = TABS; // No roles restricted for now

  const effectiveTab = useMemo<TabId>(() => {
    if (visibleTabs.some(t => t.id === activeTab)) return activeTab;
    return visibleTabs[0].id;
  }, [visibleTabs, activeTab]);


  const mergedDefaultValues = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => mergeWithDefaults(initialValues, DEFAULT_VALUES as any),
    [initialValues]
  );

  const methods = useForm<ChangeOfStatusApplicationFormData>({
    resolver: zodResolver(changeOfStatusApplicationSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: mergedDefaultValues as any,
    mode: 'onTouched',
  });

  const { formState: { errors, isDirty }, reset } = methods;

  const nameEn = useWatch({ control: methods.control, name: 'foreignerInfo.nameEn' });
  const nameKanji = useWatch({ control: methods.control, name: 'foreignerInfo.nameKanji' });
  const applicantName = nameKanji || nameEn || '名称未入力';

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reset(mergedDefaultValues as any);
  }, [mergedDefaultValues, reset]);

  const defaultAssignments = useMemo(() => ({ foreigner: '', employer: '', simultaneous: '' }), []);

  const { isSaving, isBusy, handleSaveOnly, savedRecordId } =
    useChangeOfStatusFormSubmit({
      recordId,
      foreignerId,
      organizationId: currentUser?.organizationId ?? undefined,
      assignments: defaultAssignments,
      isDirty,
      control: methods.control,
      getValues: methods.getValues,
      onSubmit
    });

  const aiDiag = useAiDiagnostics({ 
    recordId: savedRecordId || recordId, 
    applicationType: 'change_of_status',
    initialDiagnostics: initialAiDiagnostics
  });

  const {
    hasApproveReturnPermission,
    canExecuteApproveReturn,
    hasRequestReviewPermission,
    canExecuteRequestReview,
    handleApprove,
    handleReturn,
    handleRequestReview
  } = useForeignerApproval(foreignerId);

  const hasForeignerErrors    = !!errors.foreignerInfo;
  const hasEmployerErrors     = !!errors.employerInfo;
  const hasSimultaneousErrors = !!errors.simultaneousApplication;

  // ── ジャンプ先学習機能 ──────────────────────────────────────────
  const jumpLearning = useDiagnosticJumpLearning({
    onToast: (msg) => showToast('success', msg),
  });

  const handleFieldClick = useCallback((fieldPath: string) => {
    // ── 学習辞書の優先参照 ──────────────────────────────────────
    const learnedPath = jumpLearning.resolveFieldPath(fieldPath);
    const effectivePath = learnedPath || fieldPath;

    // AIのパスからルートキーを抽出し、該当タブに切り替える
    const rootKey = effectivePath.split('.')[0];

    // ハルシネーション対策: ルートキーの正規化マップ（学習済みの場合はスキップ）
    const keyMap: Record<string, string> = {
      employmentInfo: 'employerInfo',
      companyInfo: 'employerInfo',
    };
    const normalizedRoot = learnedPath ? rootKey : (keyMap[rootKey] || rootKey);

    // 正規化されたフルパスを構築
    const normalizedPath = learnedPath
      ? learnedPath
      : (normalizedRoot !== rootKey ? fieldPath.replace(rootKey, normalizedRoot) : fieldPath);

    // ルートキー → タブID のマッピング
    const tabMap: Record<string, TabId> = {
      foreignerInfo: 'foreigner',
      employerInfo: 'employer',
      simultaneousApplication: 'simultaneous',
    };

    setActiveTab(tabMap[normalizedRoot] || 'foreigner');

    // ベストエフォートでフィールドにスクロール＆ハイライト
    setTimeout(() => {
      const el = document.querySelector(`[name="${normalizedPath}"]`) as HTMLElement
        || document.querySelector(`[name="${effectivePath}"]`) as HTMLElement
        || document.querySelector(`[name="${fieldPath}"]`) as HTMLElement;

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const orig = el.style.outline;
        el.style.transition = 'outline 0.3s ease';
        el.style.outline = '3px solid #f87171';
        setTimeout(() => { el.style.outline = orig; }, 2000);
      }
    }, 150);
  }, [setActiveTab, jumpLearning]);

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="form-split-layout">
        <div className="form-main-content">
          <FormProvider {...methods}>
            <form noValidate className="renewal-form">
          <div className="renewal-form-sticky-top">
            <div className="applicant-context-header flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="applicant-avatar shrink-0">
                  {applicantName.charAt(0)}
                </div>
                <div className="applicant-info min-w-0">
                  <div className="applicant-name truncate text-base font-bold text-slate-100 flex items-center gap-3">
                    <div>
                      {applicantName} <span className="applicant-suffix text-sm font-normal text-slate-400">様の申請データ</span>
                    </div>
                  </div>
                  <div className="applicant-type flex items-center flex-wrap gap-2 mt-0.5">
                    <span className="text-xs font-medium text-slate-400">在留資格変更許可申請</span>
                    <span className="text-slate-500 text-xs font-normal">別記第29号の14様式（特定技能）</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 w-full md:w-auto shrink-0">
                <div className="applicant-context-actions flex items-center gap-2 flex-wrap w-full md:w-auto pb-1 md:pb-0 shrink-0">
                  {!hideHeader && (
                    <>
                      <TabAssignmentPanel />

                      {hasRequestReviewPermission && (
                        <button
                          type="button"
                          onClick={handleRequestReview}
                          disabled={!canExecuteRequestReview}
                          title={canExecuteRequestReview ? "行政書士へ確認依頼" : "現在は確認依頼できません"}
                          className="flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg transition-colors min-w-[96px] shrink-0 bg-violet-600 text-white border border-violet-700 hover:bg-violet-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          確認依頼
                        </button>
                      )}

                      {hasApproveReturnPermission && (
                        <>
                          <button
                            type="button"
                            onClick={handleReturn}
                            disabled={!canExecuteApproveReturn}
                            title={canExecuteApproveReturn ? "差し戻し" : "現在は差し戻しできません"}
                            className="flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg transition-colors min-w-[80px] shrink-0 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            差戻
                          </button>
                          <button
                            type="button"
                            onClick={handleApprove}
                            disabled={!canExecuteApproveReturn}
                            title={canExecuteApproveReturn ? "承認" : "現在は承認できません"}
                            className="flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg transition-colors min-w-[80px] shrink-0 bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            承認
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="btn-outline btn-save h-8 px-3 text-xs font-bold shrink-0"
                        onClick={() => handleSaveOnly(methods.getValues())}
                        disabled={isBusy}
                        title="入力途中の内容を下書き保存します"
                      >
                        {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                        <span className="hidden sm:inline">{isSaving ? '保存中...' : '保存'}</span>
                      </button>

                      <div className="relative inline-block text-left shrink-0">
                        <button
                          type="button"
                          className="btn-outline h-8 px-3 text-xs font-bold flex items-center gap-1.5 shrink-0"
                          onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        >
                          <Download size={14} /> <span className="hidden sm:inline">CSV出力</span>
                        </button>
                        
                        {showDownloadMenu && (
                          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden flex flex-col">
                            <button
                              type="button"
                              className="w-full text-left px-4 py-3 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2"
                              onClick={() => {
                                const data = methods.getValues('foreignerInfo');
                                downloadChangeOfStatusCsv1(data);
                                setShowDownloadMenu(false);
                              }}
                            >
                              <User size={14} /> 基本情報 (在留資格変更)
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-3 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2"
                              onClick={() => {
                                const data = methods.getValues();
                                downloadChangeOfStatusCsvU(data);
                                setShowDownloadMenu(false);
                              }}
                            >
                              <Building2 size={14} /> 所属機関等 (区分U)
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-3 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2"
                              onClick={() => {
                                const data = methods.getValues();
                                downloadChangeSpecificCsv(data);
                                setShowDownloadMenu(false);
                              }}
                            >
                              <Building2 size={14} /> 申請情報 (区分V)
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-3 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              onClick={() => {
                                const data = methods.getValues('simultaneousApplication');
                                downloadChangeOfStatusCsvSimultaneous(data);
                                setShowDownloadMenu(false);
                              }}
                            >
                              <FileStack size={14} /> 同時申請用
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>


            <div className="tab-nav" role="tablist">
              {visibleTabs.map((tab) => {
                const Icon     = tab.icon;
                const isActive = effectiveTab === tab.id;
                const hasError =
                  tab.id === 'foreigner'  ? hasForeignerErrors
                  : tab.id === 'employer' ? hasEmployerErrors
                  : hasSimultaneousErrors;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={[
                      'tab-btn',
                      isActive ? 'tab-btn--active'   : '',
                      hasError ? 'tab-btn--error'    : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                    {hasError && (
                      <AlertCircle size={14} className="tab-error-icon" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div role="tabpanel" className="tab-panel">
            {effectiveTab === 'foreigner' && <ForeignerInfoTab />}
            {effectiveTab === 'employer' && <EmployerInfoTab />}
            {effectiveTab === 'simultaneous' && <SimultaneousTab />}
          </div>

        </form>
      </FormProvider>
      </div> {/* form-main-content */}

      {/* ─── AIアシスタント Side Panel ─── */}
      <AiAssistantSidePanel
        diagnosticProps={{
          status: aiDiag.status,
          diagnostics: aiDiag.diagnostics,
          errorMessage: aiDiag.errorMessage,
          onDiagnose: () => aiDiag.runCheck(methods.getValues()),
          onFieldClick: handleFieldClick,
          onStartLinking: jumpLearning.startLinking,
          isLinkingMode: jumpLearning.isLinkingMode,
          linkingField: jumpLearning.linkingField,
          learnedFields: jumpLearning.learnedFields
        }}
      />
      </div> {/* form-split-layout */}
    </>
  );
}

export function ChangeOfStatusForm({
  onSubmit,
  recordId,
  foreignerId,
  initialValues,
  initialAssignments,
  initialAiDiagnostics,
  hideHeader,
  templatesRecord,
}: ChangeOfStatusFormProps) {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role ?? 'branch_staff';

  const effectiveInitialAssignments =
    initialAssignments ?? (recordId ? {} : resolveTemplate('change', undefined, templatesRecord));

  return (
    <SectionPermissionProvider
      currentUserRole={userRole}
      initialAssignments={effectiveInitialAssignments}
      templatesRecord={templatesRecord}
    >
      <ChangeOfStatusFormInner
        onSubmit={onSubmit}
        recordId={recordId}
        foreignerId={foreignerId}
        initialValues={initialValues}
        initialAiDiagnostics={initialAiDiagnostics}
        hideHeader={hideHeader}
      />
    </SectionPermissionProvider>
  );
}
