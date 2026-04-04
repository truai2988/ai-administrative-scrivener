'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronRight, ChevronLeft,
  User, Building2, FileStack,
  AlertCircle, Download, Save, Loader2,
} from 'lucide-react';
import {
  renewalApplicationSchema,
  type RenewalApplicationFormData,
  type TabId,
  type TabAssignments,
} from '@/lib/schemas/renewalApplicationSchema';
import type { ApplicationKind, TabAssignmentTemplate } from '@/lib/constants/assignmentTemplates';
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
    desiredStayPeriod: '1year',
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
      hadLaborLawPenalty: false,
      hadIllegalDismissal: false,
      hadMissingPersons: false,
    },
    delegateSupportEntirely: false,
    supportAgencyName: '',
    supportAgencyRegistrationNumber: '',
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
  const { toasts, dismiss, show: showToast } = useToast();
  const { isEditable, assignments } = useSectionPermission();

  const visibleTabs = useMemo(() => TABS.filter(tab => isEditable(tab.id)), [isEditable]);

  /**
   * 現在選択中のタブが表示可能タブリストから外れた場合、最初のタブにフォールバック。
   * useEffect + setState の組み合わせは cascading renders を招くため
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
    mode: 'onBlur',
  });

  const { handleSubmit, formState: { errors }, reset } = methods;

  // useWatch: React Compiler に安全な方法でフォーム値をサブスクライブ
  const nameEn = useWatch({ control: methods.control, name: 'foreignerInfo.nameEn' });
  const nameKanji = useWatch({ control: methods.control, name: 'foreignerInfo.nameKanji' });
  const applicantName = nameKanji || nameEn || '名称未入力';

  // 動的な値の同期: initialValues が変更された際（またはマウント直後）に確実に値をセットする
  useEffect(() => {
    reset(mergedDefaultValues);
  }, [mergedDefaultValues, reset]);

  // 保存・エクスポートロジックはカスタムフックに委譲
  const { isSaving, isExporting, isBusy, handleSaveOnly, handleSaveAndExport, savedRecordId } =
    useRenewalFormSubmit({ recordId, foreignerId, assignments, onSubmit });

  const hasForeignerErrors    = !!errors.foreignerInfo;
  const hasEmployerErrors     = !!errors.employerInfo;
  const hasSimultaneousErrors = !!errors.simultaneousApplication;

  const onValidationFailed = () => {
    showToast('error', '入力内容にエラーがあります。赤く表示されたタブ・項目を確認してください。');
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <FormProvider {...methods}>
        <form noValidate className="renewal-form">

          {/* ─── ヘッダー ─────────────────────────────────────────────── */}
          {!hideHeader && (
            <div className="form-header">
              <div className="form-header-badge">出入国在留管理庁 様式</div>
              <h1 className="form-header-title">在留期間更新許可申請書</h1>
              <p className="form-header-subtitle">
                別記第29号の15様式（特定技能）
                {savedRecordId && (
                  <span className="form-saved-badge">✓ 保存済み</span>
                )}
              </p>
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

          {/* ─── 担当者割り当てパネル ──────────────────────────────────── */}
          <TabAssignmentPanel />

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

          {/* ─── ナビゲーション & アクションバー ──────────────────────── */}
          <div className="form-nav">
            {(() => {
              const activeIndex = visibleTabs.findIndex(t => t.id === effectiveTab);
              const prevTab = activeIndex > 0 ? visibleTabs[activeIndex - 1] : null;
              const nextTab = activeIndex < visibleTabs.length - 1 ? visibleTabs[activeIndex + 1] : null;

              return (
                <div className={prevTab ? 'form-nav-both' : 'form-nav-right'}>
                  {prevTab && (
                    <button type="button" className="btn-outline" onClick={() => setActiveTab(prevTab.id)} disabled={isBusy}>
                      <ChevronLeft size={18} /> {prevTab.label}へ戻る
                    </button>
                  )}

                  {nextTab ? (
                    <button type="button" className="btn-secondary" onClick={() => setActiveTab(nextTab.id)} disabled={isBusy}>
                      {nextTab.label}へ <ChevronRight size={18} />
                    </button>
                  ) : (
                    <div className="form-action-bar">
                      {/* ① 保存 */}
                      <button
                        type="button"
                        className="btn-outline btn-save"
                        onClick={() => handleSaveOnly(methods.getValues())}
                        disabled={isBusy}
                        id="btn-save-only"
                        title="入力途中の内容を下書き保存します"
                      >
                        {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        {isSaving ? '保存中...' : '保存'}
                      </button>

                      {/* ② 保存してCSV出力 */}
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSubmit(handleSaveAndExport, onValidationFailed)}
                        disabled={isBusy}
                        id="btn-save-and-export"
                        title="保存後、入管申請用CSVを3ファイルダウンロードします"
                      >
                        {isExporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                        {isExporting ? 'CSV生成中...' : '保存してCSVを出力する'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

        </form>
      </FormProvider>
    </>
  );
}

// ─── 公開エクスポート: Provider でラップ ─────────────────────────────────────────────
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
  // currentUser が null の場合はフォーム自体が認証ガードで場外される想定だが、
  // 安全のため null でも動くようデフォルト値を設定する
  const userId = currentUser?.id ?? '';
  const userRole = currentUser?.role ?? 'branch_staff';

  return (
    <SectionPermissionProvider
      currentUserId={userId}
      currentUserRole={userRole}
      initialAssignments={initialAssignments}
      templatesRecord={templatesRecord}
      onAssignmentsChange={(a) => {
        console.debug('[assignments変更]', a);
      }}
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
