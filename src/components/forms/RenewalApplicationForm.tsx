'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User, Building2, FileStack,
  AlertCircle, Save, Loader2, Download
} from 'lucide-react';
import { AiAssistantSidePanel } from '@/components/forms/AiAssistantSidePanel';
import { useAiDiagnostics } from '@/hooks/useAiDiagnostics';
import {
  renewalApplicationSchema,
  type RenewalApplicationFormData,
  type TabId,
} from '@/lib/schemas/renewalApplicationSchema';

import { ForeignerInfoSection }           from './sections/ForeignerInfoSection';
import { EmployerInfoSection }            from './sections/EmployerInfoSection';
import { SimultaneousApplicationSection } from './sections/SimultaneousApplicationSection';
import { ToastContainer }                 from '@/components/ui/Toast';
import { useToast }                       from '@/components/ui/Toast';
import { ClickToFillProvider } from '@/contexts/ClickToFillContext';
import { AttachmentProvider } from '@/contexts/AttachmentContext';
import {
  SectionPermissionProvider,
  useSectionPermission,
} from '@/contexts/SectionPermissionContext';
import { mergeWithDefaults }  from '@/lib/utils/formUtils';
import { useRenewalFormSubmit } from '@/hooks/useRenewalFormSubmit';
import { useAuth } from '@/contexts/AuthContext';
import { calculateTotalSize } from '@/lib/utils/fileUtils';
import type { GlobalLimitContext } from '@/lib/utils/fileUtils';


import { useDiagnosticJumpLearning } from '@/hooks/useDiagnosticJumpLearning';

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

  /** 外部から渡す初期値（Firestoreデータから読み込み） */
  initialValues?: Partial<RenewalApplicationFormData>;
  /** DBからロードした初期のAI診断結果（過去の履歴） */
  initialAiDiagnostics?: import('@/types/aiDiagnostics').DiagnosticItem[];
  /** フォーム上部のタイトルヘッダーを非表示にするかどうか */
  hideHeader?: boolean;
}

// ─── 内部コンポーネント（SectionPermissionContext の中で動く） ────────────────
function RenewalApplicationFormInner({
  onSubmit,
  recordId,
  foreignerId,
  initialValues,
  initialAiDiagnostics,
  hideHeader,
}: Omit<RenewalApplicationFormProps, 'initialAssignments'>) {
  const [activeTab, setActiveTab] = useState<TabId>('foreigner');
  const { toasts, dismiss, show: showToast } = useToast();
  const { isEditable } = useSectionPermission();

  // AI診断フック（savedRecordIdが確定してから呼び出す）



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
  
  const initialAttachmentsMap = useMemo(() => {
    return {
      foreignerInfo: mergedDefaultValues.attachments?.foreignerInfo || [],
      employerInfo: mergedDefaultValues.attachments?.employerInfo || [],
      simultaneous: mergedDefaultValues.attachments?.simultaneous || []
    };
  }, [mergedDefaultValues]);

  const methods = useForm<RenewalApplicationFormData>({
    resolver: zodResolver(renewalApplicationSchema),
    defaultValues: mergedDefaultValues,
    mode: 'onTouched',
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
  const {
    isSaving,
    isBusy,
    savedRecordId,
    handleSaveOnly,
    handleSaveAndExport,
  } = useRenewalFormSubmit({
      recordId,
      foreignerId,
      organizationId: currentUser?.organizationId ?? undefined,
      control: methods.control,
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
      <FormProvider {...methods}>
      <AttachmentProvider
        applicationId={savedRecordId || recordId}
        initialAttachments={initialAttachmentsMap}
        readonly={!isEditable('foreigner')}
      >
      <ClickToFillProvider>
      <div className="form-split-layout">
        <div className="form-main-content">
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
                  </div>
                  <div className="applicant-type flex items-center flex-wrap gap-2 mt-0.5">

                    <span className="text-xs font-medium text-slate-400">在留期間更新許可申請</span>
                    <span className="text-slate-500 text-xs font-normal">別記第29号の15様式（特定技能）</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 w-full md:w-auto shrink-0">
                <div className="applicant-context-actions flex items-center gap-2 flex-wrap w-full md:w-auto pb-1 md:pb-0 shrink-0">
                  {/* === scrivener専用: 承認・保存・CSV === */}
                  {!hideHeader && (
                    <>
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

                      <button
                        type="button"
                        className="btn-outline h-8 px-3 text-xs font-bold flex items-center gap-1.5 shrink-0"
                        onClick={() => handleSaveAndExport(methods.getValues())}
                        disabled={isBusy}
                        title="保存してCSVデータを出力します"
                      >
                        <Download size={14} /> <span className="hidden sm:inline">CSV出力</span>
                      </button>
                    </>
                  )}
                </div>
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
        </div>

      <AiAssistantSidePanel
        extractionProps={{
          activeTab: effectiveTab
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
          learnedFields: jumpLearning.learnedFields,
          applicationId: savedRecordId || recordId,
        }}
      />
      </div>
      </ClickToFillProvider>
      </AttachmentProvider>
      </FormProvider>
    </>
  );
}

export function RenewalApplicationForm({
  onSubmit,
  recordId,
  foreignerId,
  initialValues,
  initialAiDiagnostics,
  hideHeader,
}: RenewalApplicationFormProps) {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role ?? 'union_staff';

  return (
    <SectionPermissionProvider
      currentUserRole={userRole}
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
