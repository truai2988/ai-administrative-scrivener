'use client';

import React, { useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ChevronRight, ChevronLeft, User, Building2, UserCircle2, Briefcase, FileText } from 'lucide-react';
import {
  coeApplicationSchema,
  type CoeApplicationFormData,
} from '@/lib/schemas/coeApplicationSchema';

import { IdentityInfoSubForm } from './sections/IdentityInfoSubForm';
import { ApplicantSpecificInfoSubForm } from './sections/ApplicantSpecificInfoSubForm';
import { EmployerInfoSubForm } from './sections/EmployerInfoSubForm';
import { RepresentativeSubForm } from './sections/RepresentativeSubForm';
import { ApplicationMetadataFields } from './sections/ApplicationMetadataFields';

type TabId = 'identity' | 'applicant' | 'employer' | 'representative' | 'metadata';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'identity', label: '身分事項', icon: User },
  { id: 'applicant', label: '申請人情報 (区分V)', icon: Briefcase },
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
  onSubmit?: (data: CoeApplicationFormData) => void;
  isSaving?: boolean;
}

export function CoeApplicationForm({
  initialValues,
  onSubmit,
  isSaving = false,
}: CoeApplicationFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('identity');

  const methods = useForm<CoeApplicationFormData>({
    resolver: zodResolver(coeApplicationSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialValues } as CoeApplicationFormData,
    mode: 'onBlur',
  });

  const { handleSubmit, formState: { errors } } = methods;

  const activeIndex = TABS.findIndex(t => t.id === activeTab);
  const prevTab = activeIndex > 0 ? TABS[activeIndex - 1] : null;
  const nextTab = activeIndex < TABS.length - 1 ? TABS[activeIndex + 1] : null;

  const nameEn = useWatch({ control: methods.control, name: 'identityInfo.nameEn' });
  const nameKanji = useWatch({ control: methods.control, name: 'identityInfo.nameKanji' });
  const applicantName = nameKanji || nameEn || '名称未入力';

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit((data) => onSubmit?.(data))} className="renewal-form" noValidate>
        {/* Header and Tabs */}
        <div className="renewal-form-sticky-top">
          <div className="form-header">
            <div className="form-header-main">
              <div className="form-header-left">
                <span className="form-header-badge">出入国在留管理庁 様式</span>
                <h1 className="form-header-title">在留資格認定証明書交付申請書</h1>
              </div>
              <div className="form-header-actions">
                {prevTab && (
                  <button type="button" className="btn-outline btn-nav-sm" onClick={() => setActiveTab(prevTab.id)}>
                    <ChevronLeft size={15} /> {prevTab.label}へ
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-outline btn-save btn-nav-sm"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                  保存＆CSVダウンロード
                </button>
                {nextTab && (
                  <button type="button" className="btn-secondary btn-nav-sm" onClick={() => setActiveTab(nextTab.id)}>
                    {nextTab.label}へ <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="applicant-context-header">
            <div className="applicant-avatar">
              {applicantName.charAt(0)}
            </div>
            <div className="applicant-info">
              <div className="applicant-name">
                {applicantName} <span className="applicant-suffix">様の申請データ</span>
              </div>
              <div className="applicant-type">在留資格認定証明書交付申請</div>
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
  );
}
