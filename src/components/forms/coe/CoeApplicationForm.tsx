'use client';

import React, { useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, User, Building2, UserCircle2, Briefcase, FileText, Download, Check, Mail, CheckCircle, XCircle } from 'lucide-react';
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
    workingHoursPerWeek: '',
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
  recordId?: string;
  foreignerId?: string;
  organizationId?: string;
}

export function CoeApplicationForm({
  initialValues,
  recordId,
  foreignerId,
  organizationId,
}: CoeApplicationFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('identity');
  const { toasts, dismiss } = useToast();

  const methods = useForm<CoeApplicationFormData>({
    resolver: zodResolver(coeApplicationSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialValues } as CoeApplicationFormData,
    mode: 'onBlur',
  });

  const { formState: { errors }, control, getValues } = methods;

  const { currentUser } = useAuth();

  const {
    isSaving,
    isExporting,
    isAutoSaving,
    isBusy,
    savedRecordId,
    handleSaveOnly,
    handleSaveAndExport,
  } = useCoeFormSubmit({
    recordId,
    foreignerId,
    organizationId: organizationId || currentUser?.organizationId || undefined,
    control,
    getValues,
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

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()} className="renewal-form" noValidate>
          {/* Header and Tabs */}
          <div className="renewal-form-sticky-top">
            <div className="applicant-context-header flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 w-full md:w-auto">
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

                    <span className="text-xs font-medium text-slate-400">在留資格認定証明書交付申請</span>
                    <span className="text-slate-500 text-xs font-normal">別記第6号の3様式（特定技能）</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 w-full md:w-auto shrink-0">
                <div className="applicant-context-actions flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0 shrink-0">
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
                  {isSaving ? '保存中...' : '保存'}
                </button>

                <button
                  type="button"
                  className="btn-outline h-8 px-3 text-xs font-bold flex items-center gap-1.5 shrink-0"
                  onClick={() => handleSaveAndExport(getValues())}
                  disabled={isBusy}
                  title="保存してCSV形式で出力します"
                >
                  {isExporting ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
                  <span>{isExporting ? '出力中...' : 'CSV出力'}</span>
                </button>
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
    </FormProvider>
    </>
  );
}
