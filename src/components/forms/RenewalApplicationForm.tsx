/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User, Building2, FileStack,
  AlertCircle, Save, Loader2, Download, Check,
  Mail, CheckCircle, XCircle
} from 'lucide-react';
import { AiDiagnosticPanel } from './AiDiagnosticPanel';
import { useAiDiagnostics } from '@/hooks/useAiDiagnostics';
import {
  renewalApplicationSchema,
  type RenewalApplicationFormData,
  type TabId,
  type TabAssignments,
} from '@/lib/schemas/renewalApplicationSchema';
import { resolveTemplate, type ApplicationKind, type TabAssignmentTemplate } from '@/lib/constants/assignmentTemplates';
import { ForeignerInfoSection }           from './sections/ForeignerInfoSection';
import { EmployerInfoSection }            from './sections/EmployerInfoSection';
import { SimultaneousApplicationSection } from './sections/SimultaneousApplicationSection';
import { ToastContainer }                 from '@/components/ui/Toast';
import { useToast }                       from '@/components/ui/Toast';
import {
  SectionPermissionProvider,
  useSectionPermission,
} from '@/contexts/SectionPermissionContext';
import { TabAssignmentPanel } from './TabAssignmentPanel';
import { mergeWithDefaults }  from '@/lib/utils/formUtils';
import { useRenewalFormSubmit } from '@/hooks/useRenewalFormSubmit';
import { useAuth } from '@/contexts/AuthContext';
import { calculateTotalSize } from '@/lib/utils/fileUtils';
import type { GlobalLimitContext } from '@/lib/utils/fileUtils';

import { useForeignerApproval } from '@/hooks/useForeignerApproval';

// ─── タブ定義 ─────────────────────────────────────────────────────────────────
const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'foreigner',    label: '外国人本人情報',     icon: User },
  { id: 'employer',     label: '所属機関（企業）情報', icon: Building2 },
  { id: 'simultaneous', label: '同時申請',           icon: FileStack },
];

// ─── デフォルト値 ─────────────────────────────────────────────────────────────
const DEFAULT_VALUES: RenewalApplicationFormData = {
  foreignerInfo: {
    nationality: '',
    birthDate: '',
    nameEn: '',
    nameKanji: '',
    gender: 'male',
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
    currentResidenceStatus: '特定技能',
    currentStayPeriod: '',
    stayExpiryDate: '',
    hasResidenceCard: true,
    residenceCardNumber: '',
    desiredStayPeriod: '',
    desiredStayPeriodOther: '',
    renewalReason: '',
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

// ─── Props ────────────────────────────────────────────────────────────────────
interface RenewalApplicationFormProps {
  /** 外部からの onSubmit コールバック（省略可） */
  onSubmit?: (data: RenewalApplicationFormData) => void | Promise<void>;
  /** 既存レコードのID（編集時） */
  recordId?: string;
  /** Firestoreの外国人ドキュメントID（一覧画面から遷移時に渡す） */
  foreignerId?: string;
  /** 初期担当者割り当て（既存レコードから読み込んだ値） */
  initialAssignments?: TabAssignments;
  /** 外部から渡す初期値（Firestoreデータから読み込み） */
  initialValues?: Partial<RenewalApplicationFormData>;
  /** DBからロードした初期のAI診断結果（過去の履歴） */
  initialAiDiagnostics?: import('@/types/aiDiagnostics').DiagnosticItem[];
  /** フォーム上部のタイトルヘッダーを非表示にするかどうか */
  hideHeader?: boolean;
  /** DBから取得した最新のテンプレート設定 */
  templatesRecord?: Record<ApplicationKind, TabAssignmentTemplate>;
}

// ─── 内部コンポーネント（SectionPermissionContext の中で動く） ────────────────
function RenewalApplicationFormInner({
  onSubmit,
  recordId,
  foreignerId,
  initialValues,
  initialAiDiagnostics,
  hideHeader,
}: Omit<RenewalApplicationFormProps, 'initialAssignments' | 'templatesRecord'>) {
  const [activeTab, setActiveTab] = useState<TabId>('foreigner');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const { toasts, dismiss } = useToast();
  const { isEditable, assignments } = useSectionPermission();

  // AI診断フック（savedRecordIdが確定してから呼び出す）

  const {
    hasApproveReturnPermission,
    canExecuteApproveReturn,
    hasRequestReviewPermission,
    canExecuteRequestReview,
    handleApprove,
    handleReturn,
    handleRequestReview
  } = useForeignerApproval(foreignerId);

  const visibleTabs = useMemo(() => TABS.filter(tab => isEditable(tab.id)), [isEditable]);

  /**
   * 現在選択中のタブが表示可能タブリストから外れた場合、最初のタブにフォールバック。
   * useMemo で直接解決する（effectiveTab を実際のレンダリングに使用）。
   */
  const effectiveTab = useMemo<TabId>(() => {
    if (visibleTabs.length === 0) return 'foreigner';
    if (visibleTabs.some(t => t.id === activeTab)) return activeTab;
    return visibleTabs[0].id;
  }, [visibleTabs, activeTab]);

  // DEFAULT_VALUES と initialValues を mergeWithDefaults でディープマージ
  const mergedDefaultValues = useMemo(
    () => mergeWithDefaults(initialValues, DEFAULT_VALUES),
    [initialValues]
  );

  const methods = useForm<RenewalApplicationFormData>({
    resolver: zodResolver(renewalApplicationSchema),
    defaultValues: mergedDefaultValues,
    mode: 'onTouched',
  });

  const { formState: { errors, isDirty }, reset } = methods;

  // useWatch: React Compiler に安全な方法でフォーム値をサブスクライブ
  const nameEn = useWatch({ control: methods.control, name: 'foreignerInfo.nameEn' });
  const nameKanji = useWatch({ control: methods.control, name: 'foreignerInfo.nameKanji' });
  const applicantName = nameKanji || nameEn || '名称未入力';

  // 動的な値の同期: initialValues が変更された際（またはマウント直後）に確実に値をセットする
  useEffect(() => {
    reset(mergedDefaultValues);
  }, [mergedDefaultValues, reset]);

  // 保存・エクスポートロジックはカスタムフックに委譲
  const { currentUser } = useAuth();
  const {
    isSaving,
    isAutoSaving,
    isBusy,
    savedRecordId,
    handleSaveOnly,
  } = useRenewalFormSubmit({
      recordId,
      foreignerId,
      organizationId: currentUser?.organizationId ?? undefined,
      assignments,
      isDirty,
      control: methods.control,
      getValues: methods.getValues,
      onSubmit
    });

  const aiDiag = useAiDiagnostics({ 
    recordId: savedRecordId || recordId,
    applicationType: 'renewal',
    initialDiagnostics: initialAiDiagnostics
  });

  const hasForeignerErrors    = !!errors.foreignerInfo;
  const hasEmployerErrors     = !!errors.employerInfo;
  const hasSimultaneousErrors = !!errors.simultaneousApplication;

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="form-split-layout">
        <div className="form-main-content">
          <FormProvider {...methods}>
            <form noValidate className="renewal-form">

          {/* ─── 上部固定エリア（ヘッダー・対象者情報・タブを束ねる） ──────────────── */}
          <div className="renewal-form-sticky-top">
            {/* ─── ヘッダー（ボタン統合） ──────────────────────── */}
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
                    <div className="flex items-center">
                      {isAutoSaving ? (
                        <span className="form-saving-badge text-slate-500 text-xs flex items-center gap-1">
                          <Loader2 size={12} className="spin" /> 自動保存中...
                        </span>
                      ) : savedRecordId ? (
                        <span className="form-saved-badge text-teal-600 text-xs flex items-center gap-1">
                          <Check size={12} /> 保存済み
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="applicant-type flex items-center flex-wrap gap-2 mt-0.5">

                    <span className="text-xs font-medium text-slate-400">在留期間更新許可申請</span>
                    <span className="text-slate-500 text-xs font-normal">別記第29号の15様式（特定技能）</span>
                  </div>
                </div>
              </div>

              <div className="applicant-context-actions flex items-center gap-2 flex-wrap shrink-0">
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
                          onClick={async () => {
                            const csvGenModule = await import('@/lib/csv/index');
                            const { generateApplicationCsvs } = csvGenModule;
                            const data = methods.getValues() as any;
                            const { basicBlob } = await generateApplicationCsvs(data);
                            const url = window.URL.createObjectURL(basicBlob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = '申請情報入力(在留期間更新許可申請)_1.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                            setShowDownloadMenu(false);
                          }}
                        >
                          <User size={14} /> 基本情報 (在留期間更新)
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2"
                          onClick={async () => {
                            const csvGenModule = await import('@/lib/csv/index');
                            const { generateApplicationCsvs } = csvGenModule;
                            const data = methods.getValues() as any;
                            const { specificBlob } = await generateApplicationCsvs(data);
                            const url = window.URL.createObjectURL(specificBlob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = '申請情報入力(区分V)_1.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                            setShowDownloadMenu(false);
                          }}
                        >
                          <Building2 size={14} /> 所属機関等 (区分V)
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          onClick={async () => {
                            const csvGenModule = await import('@/lib/csv/index');
                            const { generateApplicationCsvs } = csvGenModule;
                            const data = methods.getValues() as any;
                            const { simultaneousBlob } = await generateApplicationCsvs(data);
                            const url = window.URL.createObjectURL(simultaneousBlob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = '申請情報入力(同時申請)_1.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
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


            {/* ─── タブナビゲーション ────────────────────────────────────── */}
            <div className="tab-nav" role="tablist">
              {visibleTabs.map((tab) => {
                const Icon     = tab.icon;
                const isActive = effectiveTab === tab.id;
                const canEdit  = isEditable(tab.id);
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
                    id={`tab-${tab.id}`}
                    className={[
                      'tab-btn',
                      isActive ? 'tab-btn--active'   : '',
                      hasError ? 'tab-btn--error'    : '',
                      !canEdit ? 'tab-btn--readonly' : '',
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


          {/* ─── セクション ───────────────────────────────────────────── */}
          {(() => {
            const foreignerFiles    = methods.getValues('attachments.foreignerInfo') ?? [];
            const employerFiles     = methods.getValues('attachments.employerInfo')  ?? [];
            const simultaneousFiles = methods.getValues('attachments.simultaneous')  ?? [];
            const allFiles = [...foreignerFiles, ...employerFiles, ...simultaneousFiles];
            const globalCtx: GlobalLimitContext = {
              totalFileCount: allFiles.length,
              totalSizeBytes: calculateTotalSize(allFiles),
            };
            return (
              <div
                role="tabpanel"
                aria-labelledby={`tab-${effectiveTab}`}
                className="tab-panel"
              >
                {effectiveTab === 'foreigner' && (
                  <ForeignerInfoSection
                    isEditable={isEditable('foreigner')}
                    applicationId={savedRecordId}
                    initialAttachments={foreignerFiles}
                    globalLimitContext={globalCtx}
                  />
                )}
                {effectiveTab === 'employer' && (
                  <EmployerInfoSection
                    isEditable={isEditable('employer')}
                    applicationId={savedRecordId}
                    initialAttachments={employerFiles}
                    globalLimitContext={globalCtx}
                    organizationId={currentUser?.organizationId}
                  />
                )}
                {effectiveTab === 'simultaneous' && (
                  <SimultaneousApplicationSection
                    isEditable={isEditable('simultaneous')}
                    applicationId={savedRecordId}
                    initialAttachments={simultaneousFiles}
                    globalLimitContext={globalCtx}
                  />
                )}
              </div>
            );
          })()}

        </form>
      </FormProvider>
      </div>

      {/* ─── AI診断結果 Drawer ─── */}
      <div className="form-side-panel">
        <AiDiagnosticPanel
          status={aiDiag.status}
          diagnostics={aiDiag.diagnostics}
          errorMessage={aiDiag.errorMessage}
          onDiagnose={() => aiDiag.runCheck(methods.getValues())}
        />
      </div>
      </div>
    </>
  );
}

export function RenewalApplicationForm({
  onSubmit,
  recordId,
  foreignerId,
  initialAssignments,
  initialValues,
  initialAiDiagnostics,
  hideHeader,
  templatesRecord,
}: RenewalApplicationFormProps) {
  const { currentUser } = useAuth();

  // 認証情報を SectionPermissionProvider に渡す
  const userRole = currentUser?.role ?? 'branch_staff';

  // 新規作成時（recordIdがなく、initialAssignmentsが明示されていない場合）はテンプレートの初期値を適用する
  const effectiveInitialAssignments =
    initialAssignments ?? (recordId ? {} : resolveTemplate('renewal', undefined, templatesRecord));

  return (
    <SectionPermissionProvider
      currentUserRole={userRole}
      initialAssignments={effectiveInitialAssignments}
      templatesRecord={templatesRecord}
    >
      <RenewalApplicationFormInner
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
