'use client';

import React, { useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, ChevronLeft, User, Building2, FileStack, AlertCircle, Download, Save, Loader2 } from 'lucide-react';
import {
  renewalApplicationSchema,
  type RenewalApplicationFormData,
} from '@/lib/schemas/renewalApplicationSchema';
import { ForeignerInfoSection } from './sections/ForeignerInfoSection';
import { EmployerInfoSection } from './sections/EmployerInfoSection';
import { SimultaneousApplicationSection } from './sections/SimultaneousApplicationSection';
import { downloadImmigrationCSV } from '@/lib/utils/csvMapper';
import { renewalApplicationService } from '@/services/renewalApplicationService';
import { useToast, ToastContainer } from '@/components/ui/Toast';

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
  /** 外部からの onSubmit コールバック（省略可） */
  onSubmit?: (data: RenewalApplicationFormData) => void | Promise<void>;
  /** 既存レコードのID（編集時） */
  recordId?: string;
}

export function RenewalApplicationForm({ onSubmit, recordId }: RenewalApplicationFormProps) {
  const [activeTab, setActiveTab]         = useState<TabId>('foreigner');
  const [isSaving, setIsSaving]           = useState(false);
  const [isExporting, setIsExporting]     = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | undefined>(recordId);
  const { toasts, show: showToast, dismiss } = useToast();

  const methods = useForm<RenewalApplicationFormData>({
    resolver: zodResolver(renewalApplicationSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const hasForeignerErrors   = !!errors.foreignerInfo;
  const hasEmployerErrors    = !!errors.employerInfo;
  const hasSimultaneousErrors = !!errors.simultaneousApplication;

  const isBusy = isSaving || isExporting;

  // ─── 共通: Firebase保存処理 ────────────────────────────────────────────────
  const saveToFirebase = useCallback(
    async (data: RenewalApplicationFormData): Promise<string> => {
      const id = await renewalApplicationService.save(data, savedRecordId);
      setSavedRecordId(id);
      if (onSubmit) await onSubmit(data);
      return id;
    },
    [savedRecordId, onSubmit]
  );

  // ─── ① 保存のみ ──────────────────────────────────────────────────────────
  const handleSaveOnly = useCallback(
    async (data: RenewalApplicationFormData) => {
      setIsSaving(true);
      try {
        await saveToFirebase(data);
        showToast('success', '保存しました（ステータス: 編集中）');
      } catch (err) {
        console.error('[保存エラー]', err);
        showToast('error', '保存に失敗しました。再度お試しください。');
      } finally {
        setIsSaving(false);
      }
    },
    [saveToFirebase, showToast]
  );

  // ─── ② 保存してCSV出力 ────────────────────────────────────────────────────
  const handleSaveAndExport = useCallback(
    async (data: RenewalApplicationFormData) => {
      setIsExporting(true);
      try {
        await saveToFirebase(data);
        await downloadImmigrationCSV(data);
        showToast('success', '保存してCSVを出力しました（3ファイル）');
      } catch (err) {
        console.error('[保存&CSV出力エラー]', err);
        showToast('error', '処理に失敗しました。コンソールを確認してください。');
      } finally {
        setIsExporting(false);
      }
    },
    [saveToFirebase, showToast]
  );

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <FormProvider {...methods}>
        <form noValidate className="renewal-form">
          {/* ─── ヘッダー ─────────────────────────────────────────────────── */}
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
                  disabled={isBusy}
                >
                  <ChevronLeft size={18} />
                  所属機関情報へ戻る
                </button>

                {/* ─── アクションバー ──────────────────────────────────── */}
                <div className="form-action-bar">
                  {/* ① 保存のみ */}
                  <button
                    type="button"
                    className="btn-outline btn-save"
                    onClick={handleSubmit(handleSaveOnly)}
                    disabled={isBusy}
                    id="btn-save-only"
                    title="入力内容をデータベースに保存します"
                  >
                    {isSaving
                      ? <Loader2 size={16} className="spin" />
                      : <Save size={16} />
                    }
                    {isSaving ? '保存中...' : '保存'}
                  </button>

                  {/* ② 保存してCSV出力 */}
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSubmit(handleSaveAndExport)}
                    disabled={isBusy}
                    id="btn-save-and-export"
                    title="保存後、入管申請用CSVを3ファイルダウンロードします"
                  >
                    {isExporting
                      ? <Loader2 size={16} className="spin" />
                      : <Download size={16} />
                    }
                    {isExporting ? 'CSV生成中...' : '保存してCSVを出力する'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </FormProvider>
    </>
  );
}

