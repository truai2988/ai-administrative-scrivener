'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ChevronRight, ChevronLeft, User, Building2, FileStack, AlertCircle } from 'lucide-react';
import {
  renewalApplicationSchema,
  type RenewalApplicationFormData,
} from '@/lib/schemas/renewalApplicationSchema';
import { ForeignerInfoSection } from './sections/ForeignerInfoSection';
import { EmployerInfoSection } from './sections/EmployerInfoSection';
import { SimultaneousApplicationSection } from './sections/SimultaneousApplicationSection';

const TABS = [
  { id: 'foreigner', label: '外国人本人情報', icon: User },
  { id: 'employer', label: '所属機関（企業）情報', icon: Building2 },
  { id: 'simultaneous', label: '同時申請', icon: FileStack },
] as const;

type TabId = (typeof TABS)[number]['id'];

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

interface RenewalApplicationFormProps {
  /** フォーム送信時のコールバック */
  onSubmit?: (data: RenewalApplicationFormData) => void | Promise<void>;
}

export function RenewalApplicationForm({ onSubmit }: RenewalApplicationFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('foreigner');
  const [submitted, setSubmitted] = useState(false);

  const methods = useForm<RenewalApplicationFormData>({
    resolver: zodResolver(renewalApplicationSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const hasForeignerErrors = !!errors.foreignerInfo;
  const hasEmployerErrors = !!errors.employerInfo;
  const hasSimultaneousErrors = !!errors.simultaneousApplication;

  const handleFormSubmit = async (data: RenewalApplicationFormData) => {
    if (onSubmit) {
      await onSubmit(data);
    } else {
      console.log('[RenewalApplicationForm] Submitted data:', data);
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="form-success">
        <CheckCircle2 size={56} className="form-success-icon" />
        <h2 className="form-success-title">入力内容を確認しました</h2>
        <p className="form-success-desc">
          申請書のデータが正常に登録されました。
          <br />
          行政書士による確認後、申請手続きが進められます。
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setSubmitted(false)}
        >
          新しい申請を入力する
        </button>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="renewal-form">
        {/* ─── ヘッダー ─────────────────────────────────────────────────── */}
        <div className="form-header">
          <div className="form-header-badge">出入国在留管理庁 様式</div>
          <h1 className="form-header-title">在留期間更新許可申請書</h1>
          <p className="form-header-subtitle">
            別記第29号の15様式（特定技能）
          </p>
        </div>

        {/* ─── タブナビゲーション ────────────────────────────────────────── */}
        <div className="tab-nav" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasError =
              tab.id === 'foreigner'
                ? hasForeignerErrors
                : tab.id === 'employer'
                ? hasEmployerErrors
                : hasSimultaneousErrors;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                id={`tab-${tab.id}`}
                className={`tab-btn ${isActive ? 'tab-btn--active' : ''} ${hasError ? 'tab-btn--error' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {hasError && <AlertCircle size={14} className="tab-error-icon" />}
              </button>
            );
          })}
        </div>

        {/* ─── セクション ───────────────────────────────────────────────── */}
        <div
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="tab-panel"
        >
          {activeTab === 'foreigner' && <ForeignerInfoSection />}
          {activeTab === 'employer' && <EmployerInfoSection />}
          {activeTab === 'simultaneous' && <SimultaneousApplicationSection />}
        </div>

        {/* ─── ナビゲーションボタン ─────────────────────────────────────── */}
        <div className="form-nav">
          {activeTab === 'foreigner' ? (
            <div className="form-nav-right">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveTab('employer')}
              >
                所属機関情報へ
                <ChevronRight size={18} />
              </button>
            </div>
          ) : activeTab === 'employer' ? (
            <div className="form-nav-both">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setActiveTab('foreigner')}
              >
                <ChevronLeft size={18} />
                外国人本人情報へ戻る
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveTab('simultaneous')}
              >
                同時申請へ
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="form-nav-both">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setActiveTab('employer')}
              >
                <ChevronLeft size={18} />
                所属機関情報へ戻る
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                id="submit-renewal-form"
              >
                {isSubmitting ? '送信中...' : '申請内容を確定する'}
                {!isSubmitting && <CheckCircle2 size={18} />}
              </button>
            </div>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
