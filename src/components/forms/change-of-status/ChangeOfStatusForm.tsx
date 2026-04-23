'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronRight, ChevronLeft,
  User, Building2, FileStack,
  AlertCircle, Save, Loader2, Download, Check
} from 'lucide-react';
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
import { mergeWithDefaults } from '@/lib/utils/formUtils';

import { downloadChangeOfStatusCsv1 } from '@/utils/changeOfStatusCsvGenerator1';
import { downloadChangeOfStatusCsvU } from '@/utils/changeOfStatusCsvGeneratorU';
import { downloadChangeOfStatusCsvSimultaneous } from '@/utils/changeOfStatusCsvGeneratorSim';

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
    currentResidenceStatus: '特定技能',
    currentStayPeriod: '',
    stayExpiryDate: '',
    hasResidenceCard: true,
    residenceCardNumber: '',
    desiredResidenceStatus: 'specified_skilled_worker',
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
  hideHeader?: boolean;
}

export function ChangeOfStatusForm({
  onSubmit,
  recordId,
  foreignerId,
  initialValues,
  hideHeader,
}: ChangeOfStatusFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('foreigner');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const { toasts, dismiss } = useToast();
  const { currentUser } = useAuth();

  const visibleTabs = TABS; // No roles restricted for now

  const effectiveTab = useMemo<TabId>(() => {
    if (visibleTabs.some(t => t.id === activeTab)) return activeTab;
    return visibleTabs[0].id;
  }, [visibleTabs, activeTab]);

  const activeIndex = visibleTabs.findIndex(t => t.id === effectiveTab);
  const prevTab = activeIndex > 0 ? visibleTabs[activeIndex - 1] : null;
  const nextTab = activeIndex < visibleTabs.length - 1 ? visibleTabs[activeIndex + 1] : null;

  const mergedDefaultValues = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => mergeWithDefaults(initialValues, DEFAULT_VALUES as any),
    [initialValues]
  );

  const methods = useForm<ChangeOfStatusApplicationFormData>({
    resolver: zodResolver(changeOfStatusApplicationSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: mergedDefaultValues as any,
    mode: 'onBlur',
  });

  const { formState: { errors }, reset } = methods;

  const nameEn = useWatch({ control: methods.control, name: 'foreignerInfo.nameEn' });
  const nameKanji = useWatch({ control: methods.control, name: 'foreignerInfo.nameKanji' });
  const applicantName = nameKanji || nameEn || '名称未入力';

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reset(mergedDefaultValues as any);
  }, [mergedDefaultValues, reset]);

  const defaultAssignments = useMemo(() => ({ foreigner: '', employer: '', simultaneous: '' }), []);

  const { isSaving, isAutoSaving, isBusy, handleSaveOnly, savedRecordId } =
    useChangeOfStatusFormSubmit({
      recordId,
      foreignerId,
      organizationId: currentUser?.organizationId ?? undefined,
      assignments: defaultAssignments,
      control: methods.control,
      getValues: methods.getValues,
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
          <div className="renewal-form-sticky-top">
            {!hideHeader && (
              <div className="form-header">
                <div className="form-header-main">
                  <div className="form-header-left">
                    <span className="form-header-badge">出入国在留管理庁 様式</span>
                    <h1 className="form-header-title">在留資格変更許可申請書</h1>
                    <p className="form-header-subtitle flex items-center mt-1 min-h-5">
                      別記第29号の14様式（特定技能）
                      {isAutoSaving ? (
                        <span className="form-saving-badge text-slate-500 text-xs flex items-center gap-1 ml-2">
                          <Loader2 size={12} className="spin" /> 自動保存中...
                        </span>
                      ) : savedRecordId ? (
                        <span className="form-saved-badge text-teal-600 text-xs flex items-center gap-1 ml-2">
                          <Check size={12} /> 保存済み
                        </span>
                      ) : null}
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
                      title="入力途中の内容を下書き保存します"
                    >
                      {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                      <span className="hidden sm:inline">{isSaving ? '保存中...' : '保存'}</span>
                    </button>

                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        className="btn-outline btn-nav-sm flex items-center gap-1"
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
                    {nextTab && (
                      <button type="button" className="btn-secondary btn-nav-sm" onClick={() => setActiveTab(nextTab.id)} disabled={isBusy}>
                        {nextTab.label}へ <ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="applicant-context-header">
              <div className="applicant-avatar">
                {applicantName.charAt(0)}
              </div>
              <div className="applicant-info">
                <div className="applicant-name">
                  {applicantName} <span className="applicant-suffix">様の申請データ</span>
                </div>
                <div className="applicant-type">在留資格変更許可申請（特定技能）</div>
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
    </>
  );
}
