'use client';

import React, { useState, useCallback } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, User, Building2, UserCircle2, Briefcase, FileText, Download, Mail, CheckCircle, XCircle, CloudOff, Cloud } from 'lucide-react';
import { useAiDiagnostics } from '@/hooks/useAiDiagnostics';
import { ClickToFillProvider } from '@/contexts/ClickToFillContext';
import { AttachmentProvider } from '@/contexts/AttachmentContext';
import { COLLECTIONS } from '@/constants/firestore';
import { AiAssistantSidePanel } from '@/components/forms/AiAssistantSidePanel';
import { useDiagnosticJumpLearning } from '@/hooks/useDiagnosticJumpLearning';


import {
  coeApplicationSchema,
  type CoeApplicationFormData,
} from '@/lib/schemas/coeApplicationSchema';
import { useCoeFormSubmit } from '@/hooks/useCoeFormSubmit';
import { useForeignerApproval } from '@/hooks/useForeignerApproval';
import { useToast, ToastContainer } from '@/components/ui/Toast';

import { IdentityInfoSubForm } from './sections/IdentityInfoSubForm';
import { ApplicantSpecificInfoSubForm } from './sections/ApplicantSpecificInfoSubForm';
import { EmployerInfoSubForm } from './sections/EmployerInfoSubForm';
import { RepresentativeSubForm } from './sections/RepresentativeSubForm';
import { ApplicationMetadataFields } from './sections/ApplicationMetadataFields';
import { useAuth } from '@/contexts/AuthContext';
import { SectionPermissionProvider } from '@/contexts/SectionPermissionContext';
import type { ApplicationKind, TabAssignmentTemplate } from '@/lib/constants/assignmentTemplates';

type TabId = 'identity' | 'applicant' | 'employer' | 'representative' | 'metadata';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'identity', label: '身分事項', icon: User },
  { id: 'applicant', label: '申請人情報', icon: Briefcase },
  { id: 'employer', label: '所属機関等', icon: Building2 },
  { id: 'representative', label: '代理人・取次者', icon: UserCircle2 },
  { id: 'metadata', label: '申請メタデータ', icon: FileText },
];

const DEFAULT_VALUES: Partial<CoeApplicationFormData> = {
  identityInfo: {
    nationality: '',
    birthDate: '',
    nameEn: '',
    nameKanji: '',
    gender: '1',
    birthPlace: '',
    maritalStatus: '2',
    occupation: '',
    homeCountryAddress: '',
    japanZipCode: '',
    japanPrefecture: '',
    japanCity: '',
    japanAddressLines: '',
    phoneNumber: '',
    mobileNumber: '',
    email: '',
    passportNumber: '',
    passportExpiryDate: '',
    entryPurpose: '',
    entryPurposeOther: '',
    entryPort: '',
    entryDate: '',
    stayPeriod: '',
    accompanyingPersons: '2',
    visaApplicationPlace: '',
    pastEntryCount: '',
    latestEntryDate: '',
    latestDepartureDate: '',
    pastApplicationRecord: '2',
    pastApplicationCount: '',
    pastApplicationApprovalCount: '',
    criminalRecord: '2',
    criminalRecordDetail: '',
    departureOrderHistory: '2',
    departureOrderCount: '',
    latestDepartureOrderDate: '',
    familyInJapan: '2',
    relatives: [],
  },
  applicantSpecificInfo: {
    academicBackground: '3',
    schoolName: '',
    graduationDate: '',
    majorCategory: '1',
    majorDetails: '',
    hasJobHistory: '2',
    jobHistory: [],
    hasJapaneseCertification: '2',
    japaneseCertificationName: '',
    japaneseCertificationGrade: '',
  },
  employerInfo: {
    companyNameJa: '',
    branchName: '',
    hasCorporateNumber: '1',
    corporateNumber: '',
    employmentInsuranceNumber: '',
    mainIndustry: '',
    companyZipCode: '',
    companyPref: '',
    companyCity: '',
    companyAddressLines: '',
    companyPhone: '',
    capital: '',
    annualRevenue: '',
    employeeCount: '',
    foreignEmployeeCount: '',
    monthlySalary: '',
    cohabitingFamilies: [],
  },
  legalRepresentative: {
    name: '',
    relationship: '',
    zipCode: '',
    prefecture: '',
    city: '',
    addressLines: '',
    phone: '',
    mobilePhone: '',
  },
  agencyRep: {
    name: '',
    zipCode: '',
    prefecture: '',
    city: '',
    addressLines: '',
    organization: '',
    phone: '',
  },
  residenceCardReceiptMethod: '1',
  checkIntent: '2',
  freeFormat: '',
};

interface CoeApplicationFormProps {
  initialValues?: Partial<CoeApplicationFormData>;
  initialAiDiagnostics?: import('@/types/aiDiagnostics').DiagnosticItem[];
  recordId?: string;
  foreignerId?: string;
  organizationId?: string;
  templatesRecord?: Record<ApplicationKind, TabAssignmentTemplate>;
}

export function CoeApplicationFormInner({
  initialValues,
  initialAiDiagnostics,
  recordId,
  foreignerId,
  organizationId,
}: CoeApplicationFormProps) {
  const { toasts, dismiss, show: showToast } = useToast();

  const mergedDefaultValues = React.useMemo(() => {
    return { ...DEFAULT_VALUES, ...initialValues } as CoeApplicationFormData;
  }, [initialValues]);
  
  const initialAttachmentsMap = React.useMemo(() => {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      foreignerInfo: (mergedDefaultValues as any).attachments?.foreignerInfo || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      employerInfo: (mergedDefaultValues as any).attachments?.employerInfo || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      simultaneous: (mergedDefaultValues as any).attachments?.simultaneous || []
    };
  }, [mergedDefaultValues]);

  const methods = useForm<CoeApplicationFormData>({
    resolver: zodResolver(coeApplicationSchema),
    defaultValues: mergedDefaultValues,
    mode: 'onTouched',
  });

  const { formState: { errors, isDirty }, control, getValues } = methods;

  // currentUser is handled by the wrapper now
  const { currentUser } = useAuth();

  const {
    isSaving,
    isExporting,
    isBusy,
    isAutoSaving,
    lastSavedAt,
    savedRecordId,
    handleSaveOnly,
    handleSaveAndExport,
  } = useCoeFormSubmit({
    recordId,
    foreignerId,
    organizationId: organizationId || currentUser?.organizationId || undefined,
    isDirty,
    control,
    getValues,
  });

  const [activeTab, setActiveTab] = useState<TabId>('identity');
  const aiDiag = useAiDiagnostics({ 
    recordId: savedRecordId || recordId, 
    applicationType: 'coe',
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


  const nameEn = useWatch({ control: methods.control, name: 'identityInfo.nameEn' });
  const nameKanji = useWatch({ control: methods.control, name: 'identityInfo.nameKanji' });
  const applicantName = nameKanji || nameEn || '名称未入力';

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

    // ハルシネーション対策: ルートキーの正規化マップ
    const keyMap: Record<string, string> = {
      foreignerInfo: 'identityInfo',
      employmentInfo: 'employerInfo',
      companyInfo: 'employerInfo',
    };
    const normalizedRoot = learnedPath ? rootKey : (keyMap[rootKey] || rootKey);

    // ハルシネーション対策: COE固有のフルパス正規化マップ（学習済みの場合はスキップ）
    const fullPathMap: Record<string, string> = {
      'employerInfo.jobCategories': 'employerInfo.specifiedSkilledSubCategory',
      'employerInfo.jobCategories.0': 'employerInfo.specifiedSkilledSubCategory',
      'employerInfo.industryFields': 'employerInfo.specifiedSkilledField',
      'employerInfo.specifiedSkilledCategory': 'employerInfo.specifiedSkilledSubCategory',
    };

    // 学習済みパスの場合はそのまま使用、未学習の場合は正規化を適用
    const resolvedPath = learnedPath
      ? learnedPath
      : (fullPathMap[fieldPath]
        ?? (normalizedRoot !== rootKey ? fieldPath.replace(rootKey, normalizedRoot) : fieldPath));

    // ルートキー → タブID のマッピング
    const tabMap: Record<string, TabId> = {
      identityInfo: 'identity',
      applicantSpecificInfo: 'applicant',
      employerInfo: 'employer',
      legalRepresentative: 'representative',
      agencyRep: 'representative',
      residenceCardReceiptMethod: 'metadata',
      checkIntent: 'metadata',
      freeFormat: 'metadata',
    };

    setActiveTab(tabMap[resolvedPath.split('.')[0]] || tabMap[normalizedRoot] || 'identity');

    // ベストエフォートでフィールドにスクロール＆ハイライト
    setTimeout(() => {
      const el = document.querySelector(`[name="${resolvedPath}"]`) as HTMLElement
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
      <FormProvider {...methods}>
      <AttachmentProvider
        applicationId={savedRecordId || recordId}
        collectionName={COLLECTIONS.COE_APPLICATIONS}
        initialAttachments={initialAttachmentsMap}
        readonly={!currentUser}
      >
      <ClickToFillProvider>
      <div className="form-split-layout">
        <div className="form-main-content">
        <form onSubmit={(e) => e.preventDefault()} className="renewal-form" noValidate>
          {/* Header and Tabs */}
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

                    <span className="text-xs font-medium text-slate-400">在留資格認定証明書交付申請</span>
                    <span className="text-slate-500 text-xs font-normal">別記第6号の3様式（特定技能）</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 w-full md:w-auto shrink-0">
                <div className="applicant-context-actions flex items-center gap-2 flex-wrap w-full md:w-auto pb-1 md:pb-0 shrink-0">

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
                    onClick={() => handleSaveOnly(getValues())}
                    disabled={isBusy}
                    id="btn-save-only"
                    title="入力途中の内容を下書き保存します"
                  >
                    {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                    <span className="hidden sm:inline">{isSaving ? '保存中...' : '保存'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-outline h-8 px-3 text-xs font-bold flex items-center gap-1.5 shrink-0"
                    onClick={() => handleSaveAndExport(getValues())}
                    disabled={isBusy}
                    title="保存してCSV形式で出力します"
                  >
                    {isExporting ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
                    <span className="hidden sm:inline">{isExporting ? '出力中...' : 'CSV出力'}</span>
                  </button>
              </div>

                {/* ─── 保存状態インジケーター ─────────────────────────────── */}
                <div className="flex items-center gap-1.5 text-xs w-full md:w-auto justify-end pr-1">
                  {isAutoSaving ? (
                    <>
                      <Loader2 size={12} className="spin text-sky-400" />
                      <span className="text-sky-400">自動保存中...</span>
                    </>
                  ) : isSaving ? (
                    <>
                      <Loader2 size={12} className="spin text-amber-400" />
                      <span className="text-amber-400">保存しています...</span>
                    </>
                  ) : lastSavedAt ? (
                    <>
                      <Cloud size={12} className="text-emerald-400" />
                      <span className="text-slate-400">
                        {lastSavedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        {' '}に保存完了
                      </span>
                    </>
                  ) : (
                    <>
                      <CloudOff size={12} className="text-slate-500" />
                      <span className="text-slate-500">未保存</span>
                    </>
                  )}
                </div>
              </div>
            </div>


          <div className="tab-nav" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              // Check for errors in the current tab section
              let hasError = false;
              if (tab.id === 'identity' && errors.identityInfo) hasError = true;
              if (tab.id === 'applicant' && errors.applicantSpecificInfo) hasError = true;
              if (tab.id === 'employer' && errors.employerInfo) hasError = true;
              if (tab.id === 'representative' && (errors.legalRepresentative || errors.agencyRep)) hasError = true;
              if (tab.id === 'metadata' && (errors.residenceCardReceiptMethod || errors.checkIntent || errors.freeFormat)) hasError = true;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`tab-btn ${isActive ? 'tab-btn--active' : ''} ${hasError ? 'tab-btn--error' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Panels */}
        <div role="tabpanel" className="tab-panel">
          {activeTab === 'identity' && <IdentityInfoSubForm />}
          {activeTab === 'applicant' && <ApplicantSpecificInfoSubForm />}
          {activeTab === 'employer' && <EmployerInfoSubForm />}
          {activeTab === 'representative' && <RepresentativeSubForm />}
          {activeTab === 'metadata' && <ApplicationMetadataFields />}
        </div>
      </form>
    </div>
    <AiAssistantSidePanel
      extractionProps={{
        activeTab: activeTab
      }}
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
    </div>
    </ClickToFillProvider>
    </AttachmentProvider>
    </FormProvider>
    </>
  );
}

export function CoeApplicationForm({
  initialValues,
  initialAiDiagnostics,
  recordId,
  foreignerId,
  organizationId,
  templatesRecord,
}: CoeApplicationFormProps) {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role ?? 'branch_staff';

  return (
    <SectionPermissionProvider
      currentUserRole={userRole}
      templatesRecord={templatesRecord}
    >
      <CoeApplicationFormInner
        initialValues={initialValues}
        initialAiDiagnostics={initialAiDiagnostics}
        recordId={recordId}
        foreignerId={foreignerId}
        organizationId={organizationId}
      />
    </SectionPermissionProvider>
  );
}
