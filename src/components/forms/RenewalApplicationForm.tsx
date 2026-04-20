'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronRight, ChevronLeft,
  User, Building2, FileStack,
  AlertCircle, Save, Loader2, Sparkles,
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
  hideHeader,
}: Omit<RenewalApplicationFormProps, 'initialAssignments' | 'templatesRecord'>) {
  const [activeTab, setActiveTab] = useState<TabId>('foreigner');
  const { toasts, dismiss } = useToast();
  const { isEditable, assignments } = useSectionPermission();

  // AI診断フック
  const aiDiag = useAiDiagnostics({ recordId });

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

  // ヘッダーボタンで共用するタブ行移情報
  const activeIndex = useMemo(
    () => visibleTabs.findIndex(t => t.id === effectiveTab),
    [visibleTabs, effectiveTab]
  );
  const prevTab = activeIndex > 0 ? visibleTabs[activeIndex - 1] : null;
  const nextTab = activeIndex < visibleTabs.length - 1 ? visibleTabs[activeIndex + 1] : null;

  // DEFAULT_VALUES と initialValues を mergeWithDefaults でディープマージ
  const mergedDefaultValues = useMemo(
    () => mergeWithDefaults(initialValues, DEFAULT_VALUES),
    [initialValues]
  );

  const methods = useForm<RenewalApplicationFormData>({
    resolver: zodResolver(renewalApplicationSchema),
    defaultValues: mergedDefaultValues,
    mode: 'onBlur',
  });

  const { formState: { errors }, reset } = methods;

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
  const { isSaving, isBusy, handleSaveOnly, savedRecordId } =
    useRenewalFormSubmit({
      recordId,
      foreignerId,
      organizationId: currentUser?.organizationId ?? undefined,
      assignments,
      onSubmit
    });

  const hasForeignerErrors    = !!errors.foreignerInfo;
  const hasEmployerErrors     = !!errors.employerInfo;
  const hasSimultaneousErrors = !!errors.simultaneousApplication;

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <FormProvider {...methods}>
        <form noValidate className="renewal-form">

          {/* ─── 上部固定エリア（ヘッダー・対象者情報・タブを束ねる） ──────────────── */}
          <div className="renewal-form-sticky-top">
            {/* ─── ヘッダー（ボタン統合） ──────────────────────── */}
            {!hideHeader && (
              <div className="form-header">
                <div className="form-header-main">
                  <div className="form-header-left">
                    <span className="form-header-badge">出入国在留管理庁 様式</span>
                    <h1 className="form-header-title">在留期間更新許可申請書</h1>
                    <p className="form-header-subtitle">
                      別記第29号の15様式（特定技能）
                      {savedRecordId && (
                        <span className="form-saved-badge">✓ 保存済み</span>
                      )}
                    </p>
                  </div>
                  <div className="form-header-actions">
                    {prevTab && (
                      <button type="button" className="btn-outline btn-nav-sm" onClick={() => setActiveTab(prevTab.id)} disabled={isBusy}>
                        <ChevronLeft size={15} /> {prevTab.label}へ
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-outline btn-save btn-nav-sm"
                      onClick={() => handleSaveOnly(methods.getValues())}
                      disabled={isBusy}
                      id="btn-save-only"
                      title="入力途中の内容を下書き保存します"
                    >
                      {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                    {nextTab && (
                      <button type="button" className="btn-secondary btn-nav-sm" onClick={() => setActiveTab(nextTab.id)} disabled={isBusy}>
                        {nextTab.label}へ <ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── 対象者コンテキストヘッダー ────────────────────────────── */}
            <div className="applicant-context-header">
              <div className="applicant-avatar">
                {applicantName.charAt(0)}
              </div>
              <div className="applicant-info">
                <div className="applicant-name">
                  {applicantName} <span className="applicant-suffix">様の申請データ</span>
                </div>
                <div className="applicant-type">在留期間更新許可申請（特定技能）</div>
              </div>

              <div className="applicant-context-actions">
                {/* ─── 担当者割り当てパネル ─── */}
                <TabAssignmentPanel />
                
                {/* ─── AI診断ボタン ─── */}
                <button
                  type="button"
                  id="btn-ai-check"
                  className={`ai-check-btn ${aiDiag.status === 'loading' ? 'ai-check-btn--loading' : ''}`}
                  onClick={() => aiDiag.runCheck(methods.getValues())}
                  disabled={aiDiag.status === 'loading'}
                  title="入力内容・整合性・法的リスクをAIが診断します"
                >
                  {aiDiag.status === 'loading' ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  <span className="hidden sm:inline">
                    {aiDiag.status === 'loading' ? 'AI診断中...' : 'AIで書類・入力内容を診断する'}
                  </span>
                  <span className="sm:hidden">
                    {aiDiag.status === 'loading' ? '解析中...' : 'AI診断'}
                  </span>
                  {aiDiag.status === 'success' && aiDiag.counts.critical > 0 && (
                    <span className="ai-check-btn-badge ai-check-btn-badge--critical">
                      {aiDiag.counts.critical}
                    </span>
                  )}
                  {aiDiag.status === 'success' && aiDiag.counts.critical === 0 && aiDiag.counts.warning > 0 && (
                    <span className="ai-check-btn-badge ai-check-btn-badge--warning">
                      {aiDiag.counts.warning}
                    </span>
                  )}
                </button>
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

      {/* ─── AI診断結果 Drawer ─── */}
      <AiDiagnosticPanel
        status={aiDiag.status}
        diagnostics={aiDiag.diagnostics}
        counts={aiDiag.counts}
        errorMessage={aiDiag.errorMessage}
        onClose={aiDiag.reset}
      />

    </>
  );
}

export function RenewalApplicationForm({
  onSubmit,
  recordId,
  foreignerId,
  initialAssignments,
  initialValues,
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
        hideHeader={hideHeader}
      />
    </SectionPermissionProvider>
  );
}
