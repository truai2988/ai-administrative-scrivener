import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFormContext, useFieldArray, Controller, useWatch, Path } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { RenewalApplicationFormData, AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';
import type { GlobalLimitContext } from '@/lib/utils/fileUtils';
import { renewalFormOptions, getSpecifiedSkilledSubOptions } from '@/lib/constants/renewalFormOptions';
import { FormField } from '../ui/FormField';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormRadioGroup } from '../ui/FormRadio';
import { FormTextarea } from '../ui/FormTextarea';
import { CompanyMasterSelector } from '../ui/CompanyMasterSelector';
import { useCompanyMasters } from '@/hooks/useCompanyMasters';
import { useAuth } from '@/contexts/AuthContext';

type ComplianceOathItem = {
  key: string;
  label: string;
  hasDetail?: boolean;
};

const COMPLIANCE_OATHS: ComplianceOathItem[] = [
  { key: 'hadLaborLawPenalty', label: '(11) 労働・社会保険・租税法令違反で罰則を受けた', hasDetail: true },
  { key: 'hadInvoluntaryDismissal', label: '(12) 1年以内に特定技能外国人を非自発的に離職させた', hasDetail: true },
  { key: 'hadMissingPersons', label: '(13) 1年以内に特定技能外国人の行方不明者を発生させた', hasDetail: true },
  { key: 'hadCriminalPenalty', label: '(14) 禁錮以上の刑又は出入国管理法違反等の特定の刑に処せられた', hasDetail: true },
  { key: 'hasMentalImpairment', label: '(15) 精神の障害等により業務を適正に行うに当たって必要な認知等が適切にできない', hasDetail: true },
  { key: 'hasBankruptcy', label: '(16) 破産手続開始の決定を受けて復権を得ない', hasDetail: true },
  { key: 'hadTechnicalInternRevocation', label: '(17) 過去5年以内に技能実習計画の認定を取り消された等', hasDetail: true },
  { key: 'wasOfficerOfRevokedEntity', label: '(18) 技能実習計画の認定を取り消された法人の役員等であった', hasDetail: true },
  { key: 'hadIllegalAct', label: '(19) 過去5年以内に出入国又は労働法令に関し不正・著しく不当な行為をした', hasDetail: true },
  { key: 'hadGangsterRelation', label: '(20) 暴力団等に該当する', hasDetail: true },
  { key: 'legalRepresentativeQualifies', label: '(21) 法定代理人が(14)〜(20)に該当する', hasDetail: true },
  { key: 'isGangControlled', label: '(22) 役員等が暴力団等の統制下にある', hasDetail: true },
  { key: 'keepsActivityRecords', label: '(23) 活動状況書類を作成し雇用終了後1年以上保存する' },
  { key: 'awaresOfGuaranteeContract', label: '(24) 保証金の徴収等をされていることを認識して契約を結んだ', hasDetail: true },
  { key: 'hasCompliancePenaltyContract', label: '(25) 違約金を定める契約を結んだ', hasDetail: true },
  { key: 'noSupportCostBurdenOnForeigner', label: '(26) 1号支援費用を外国人に負担させない' },
  { key: 'allowsTemporaryReturn', label: '(7) 一時帰国を希望する場合は必要な有給休暇を取得させる' },
  { key: 'meetsEmploymentStandards', label: '(8) 雇用関係基準に適合している' },
  { key: 'coversReturnTravelCost', label: '(9) 帰国旅費負担に合意する' },
  { key: 'monitorsHealthAndLife', label: '(10) 健康・生活状況を把握する' },
  { key: 'meetsSpecificIndustryEmploymentStandards', label: '(11) 特定産業分野固有の雇用基準に適合している' },
  { key: 'hasContractContinuationSystem', label: '(30) 雇用契約継続体制が確保されている' },
  { key: 'paysWageByTransfer', label: '(31) 報酬を振込等により確実に支払う' },
  { key: 'meetsAdditionalEmploymentStandards', label: '(32) 雇用契約適正履行追加基準に適合している' },
];

type SupportPlanItem = {
  key: string;
  label: string;
};

const SUPPORT_PLAN_ITEMS: SupportPlanItem[] = [
  { key: 'airportPickup', label: '(1) 出入国時の送迎' },
  { key: 'housingSupport', label: '(2) 適切な住居の確保に係る支援' },
  { key: 'financialContractSupport', label: '(3) 預貯金口座開設・生活に必要な契約の支援' },
  { key: 'lifeInfoProvision', label: '(4) 生活オリエンテーションの実施（外国語等）' },
  { key: 'adminProcedureEscort', label: '(5) 行政機関の手続への同行等' },
  { key: 'japaneseLanguageLearning', label: '(6) 日本語学習機会の提供' },
  { key: 'complaintSupport', label: '(7) 相談又は苦情への対応（外国語等）' },
  { key: 'interculturalExchange', label: '(8) 日本人との交流促進に係る支援' },
  { key: 'jobChangeSupport', label: '(9) 非自発的離職時の転職支援' },
  { key: 'regularInterviewAndReport', label: '(10) 定期面談の実施・行政関係機関通報' },
  { key: 'writtenPlanProvision', label: '(11) 支援計画の書面交付（外国語等）' },
  { key: 'specificIndustryItems', label: '(12) 特定産業分野固有事項の対応' },
  { key: 'implementationCapability', label: '(13) 支援実施体制の適切性担保' },
  { key: 'meetsRegulationStandards', label: '(14) 支援計画が基準に適合している' },
];

/** チェックボックス行コンポーネント（欠格事由など） */
function CheckboxRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="checkbox-row">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="checkbox-input"
      />
      <span className="checkbox-label">{label}</span>
    </label>
  );
}

interface EmployerInfoSectionProps {
  isEditable?: boolean;
  applicationId?: string;
  initialAttachments?: AttachmentMeta[];
  globalLimitContext?: GlobalLimitContext;
  /** RBAC フィルタリング用の organizationId（企業マスタ取得に使用） */
  organizationId?: string | null;
}

export function EmployerInfoSection({
  isEditable = true,
  initialAttachments,
  organizationId,
}: EmployerInfoSectionProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RenewalApplicationFormData>();

  // 企業マスタの取得（organizationId がある場合のみ）
  const { companies, loading: companiesLoading } = useCompanyMasters(organizationId);

  const emp = errors.employerInfo;
  
  // エラーオブジェクトの安全な参照（any回避）
  const saErr = emp?.supportAgency as Record<string, { message?: string }> | undefined;
  const dispatchErr = emp?.dispatchDestination as Record<string, { message?: string }> | undefined;
  const placeErr = emp?.placementAgency as Record<string, { message?: string }> | undefined;
  const interErr = emp?.intermediaryAgency as Record<string, { message?: string }> | undefined;
  
  const { fields: jobFields, append: appendJob, remove: removeJob } = useFieldArray({
    control,
    name: 'employerInfo.jobHistory',
  });

  // Watch values
  const isLaborInsuranceApplicable = watch('employerInfo.isLaborInsuranceApplicable');
  const delegateSupportEntirely = watch('employerInfo.delegateSupportEntirely');
  const hasCorporateNumber = watch('employerInfo.hasCorporateNumber');
  const hasDifferentTreatment = watch('employerInfo.hasDifferentTreatment');
  const hasJobHistory = watch('employerInfo.hasJobHistory');

  // ─ カスケード連動: 特定産業分野→業務区分 ─
  const selectedIndustryField = watch('employerInfo.industryFields.0');
  const jobCategoryOptions = useMemo(() => getSpecifiedSkilledSubOptions(selectedIndustryField), [selectedIndustryField]);

  // 特定産業分野が変更されたら業務区分をリセット
  const prevIndustryRef = useRef(selectedIndustryField);
  useEffect(() => {
    if (prevIndustryRef.current !== selectedIndustryField && prevIndustryRef.current !== undefined) {
      setValue('employerInfo.jobCategories', []);
    }
    prevIndustryRef.current = selectedIndustryField;
  }, [selectedIndustryField, setValue]);

  // アコーディオン制御ステート
  const [showDispatch, setShowDispatch] = useState(false);
  const [showPlacement, setShowPlacement] = useState(false);
  const [showIntermediary, setShowIntermediary] = useState(false);

  // 書類ファーストワークフローの制御
  const [isManualInputEnabled, setIsManualInputEnabled] = useState(false);
  const attachments = useWatch({ control, name: 'attachments.employerInfo' }) || initialAttachments || [];
  const hasAttachments = attachments.length > 0;
  
  // 行政書士・本部は手動入力を常に許可する
  const { currentUser } = useAuth();
  const hasFullAccess = currentUser?.role === 'scrivener';
  
  // 編集モードかつ（書類が添付されている OR 手動入力がオン OR フルアクセス権限）の場合のみフィールドを有効化
  const isFieldsEnabled = isEditable && (hasAttachments || isManualInputEnabled || hasFullAccess);

  return (
    <div className={`section-container${!isEditable ? ' section-container--readonly' : ''}`}>
      {!isEditable && (
        <div className="section-readonly-banner">
          🔒 このセクションは閲覧のみです。自分の担当のタブのみ編集できます。
        </div>
      )}
      
      {/* ─── 添付書類 (最上部配置) ────────────────────────────────────────── */}
      {isEditable && !hasAttachments && !hasFullAccess && (
        <div className="subsection subsection--attachments">
          <div className="manual-entry-override" style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#fbbf24', fontSize: '0.85rem' }}>
              <input 
                type="checkbox" 
                className="checkbox-input"
                checked={isManualInputEnabled} 
                onChange={(e) => setIsManualInputEnabled(e.target.checked)} 
              />
              <span>※書類を後日提出し、手動で入力を開始する</span>
            </label>
          </div>
        </div>
      )}

      <fieldset disabled={!isFieldsEnabled} style={{ border: 'none', padding: 0, margin: 0, opacity: isFieldsEnabled ? 1 : 0.5, transition: 'opacity 0.2s', pointerEvents: isFieldsEnabled ? 'auto' : 'none' }}>

      {/* ─── ① 雇用契約 ──────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">雇用契約</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="雇用契約期間（開始日）"
            required
            error={emp?.contractStartDate?.message}
          >
            <FormInput
              type="date"
              {...register('employerInfo.contractStartDate')}
              error={!!emp?.contractStartDate}
            />
          </FormField>

          <FormField
            label="雇用契約期間（終了日）"
            required
            error={emp?.contractEndDate?.message}
          >
            <FormInput
              type="date"
              {...register('employerInfo.contractEndDate')}
              error={!!emp?.contractEndDate}
            />
          </FormField>
        </div>
      </div>

      {/* ─── ② 業務内容 ──────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">従事する業務</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="特定産業分野"
            required
            error={emp?.industryFields?.message}
          >
            <Controller
              name="employerInfo.industryFields.0"
              control={control}
              render={({ field }) => (
                <FormSelect
                  name={field.name}
                  options={renewalFormOptions.specifiedSkilledField}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                  }}
                  error={!!emp?.industryFields}
                  placeholder="分野を選択"
                />
              )}
            />
          </FormField>

          <FormField
            label="主たる職種"
            required
            hint="例: 溶接、鋳造、機械加工 など"
            error={emp?.mainJobType?.message}
          >
            <FormInput
              {...register('employerInfo.mainJobType')}
              placeholder="例: 溶接"
              error={!!emp?.mainJobType}
            />
          </FormField>

          <FormField
            label="従事する業務の区分"
            required
            error={emp?.jobCategories?.message}
          >
            <Controller
              name="employerInfo.jobCategories.0"
              control={control}
              render={({ field }) => (
                <FormSelect
                  options={jobCategoryOptions}
                  {...field}
                  error={!!emp?.jobCategories}
                  disabled={!selectedIndustryField || jobCategoryOptions.length === 0}
                  placeholder={selectedIndustryField ? '業務区分を選択' : '先に特定産業分野を選択してください'}
                />
              )}
            />
          </FormField>

          <FormField
            label="他の職種"
            hint="複数ある場合はカンマ(,)区切り"
            error={emp?.otherJobTypes?.message}
          >
            <Controller
              name="employerInfo.otherJobTypes"
              control={control}
              render={({ field }) => (
                <FormInput
                  name={field.name}
                  value={field.value?.join(',') || ''}
                  onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="例: 洗浄, 梱包"
                  error={!!emp?.otherJobTypes}
                />
              )}
            />
          </FormField>
        </div>
      </div>

      {/* ─── ③ 労働時間 ──────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">所定労働時間</h3>
        <div className="form-grid form-grid--3">
          <FormField
            label="週所定労働時間（時間）"
            required
            error={emp?.weeklyWorkHours?.message}
          >
            <FormInput
              type="number"
              {...register('employerInfo.weeklyWorkHours', { valueAsNumber: true })}
              placeholder="例: 40"
              min={1}
              max={60}
              error={!!emp?.weeklyWorkHours}
            />
          </FormField>

          <FormField
            label="月所定労働時間（時間）"
            required
            error={emp?.monthlyWorkHours?.message}
          >
            <FormInput
              type="number"
              {...register('employerInfo.monthlyWorkHours', { valueAsNumber: true })}
              placeholder="例: 173"
              min={1}
              max={280}
              error={!!emp?.monthlyWorkHours}
            />
          </FormField>

          <FormField
            label="日本人と同等の所定労働時間か"
            required
            error={emp?.equivalentWorkHours?.message}
          >
            <Controller
              name="employerInfo.equivalentWorkHours"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="employerInfo.equivalentWorkHours"
                  options={[
                    { value: 'true', label: '同等' },
                    { value: 'false', label: '同等ではない' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!emp?.equivalentWorkHours}
                />
              )}
            />
          </FormField>
        </div>
      </div>

      {/* ─── ④ 報酬 ──────────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">報酬</h3>
        <div className="form-grid form-grid--3">
          <FormField
            label="月額報酬（円）"
            required
            hint="最低10万円以上"
            error={emp?.monthlySalary?.message}
          >
            <FormInput
              type="number"
              {...register('employerInfo.monthlySalary', { valueAsNumber: true })}
              placeholder="例: 180000"
              error={!!emp?.monthlySalary}
            />
          </FormField>

          <FormField
            label="同等業務の日本人の月額報酬（円）"
            required
            error={emp?.japaneseMonthlySalary?.message}
          >
            <FormInput
              type="number"
              {...register('employerInfo.japaneseMonthlySalary', { valueAsNumber: true })}
              placeholder="例: 180000"
              error={!!emp?.japaneseMonthlySalary}
            />
          </FormField>

          <FormField
            label="時間換算額（円）"
            required
            error={emp?.hourlyRate?.message}
          >
            <FormInput
              type="number"
              {...register('employerInfo.hourlyRate', { valueAsNumber: true })}
              placeholder="例: 1039"
              error={!!emp?.hourlyRate}
            />
          </FormField>

          <FormField
            label="同種業務の日本人と同等以上の報酬か"
            required
            error={emp?.equivalentSalary?.message}
          >
            <Controller
              name="employerInfo.equivalentSalary"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="employerInfo.equivalentSalary"
                  options={[
                    { value: 'true', label: '同等以上' },
                    { value: 'false', label: '同等未満' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!emp?.equivalentSalary}
                />
              )}
            />
          </FormField>

          <FormField label="報酬の支払方法" required error={emp?.paymentMethod?.message}>
            <Controller
              name="employerInfo.paymentMethod"
              control={control}
              render={({ field }) => (
                <FormSelect
                  options={renewalFormOptions.paymentMethod}
                  {...field}
                  error={!!emp?.paymentMethod}
                />
              )}
            />
          </FormField>

          <FormField
            label="異なった待遇の有無"
            required
            error={emp?.hasDifferentTreatment?.message}
          >
            <Controller
              name="employerInfo.hasDifferentTreatment"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="employerInfo.hasDifferentTreatment"
                  options={[
                    { value: 'false', label: '無' },
                    { value: 'true', label: '有' },
                  ]}
                  value={String(field.value ?? 'false')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!emp?.hasDifferentTreatment}
                />
              )}
            />
          </FormField>
          
          {hasDifferentTreatment && (
            <FormField label="異なった待遇の内容" required error={emp?.differentTreatmentDetail?.message}>
              <FormInput
                {...register('employerInfo.differentTreatmentDetail')}
                placeholder="内容を記入してください"
                error={!!emp?.differentTreatmentDetail}
              />
            </FormField>
          )}
        </div>
      </div>

      {/* ─── ⑤ 法人基本情報 ──────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">法人基本情報</h3>

        {/* 企業マスタから自動入力 */}
        {isEditable && (
          <CompanyMasterSelector
            companies={companies}
            loading={companiesLoading}
          />
        )}
        <div className="form-grid form-grid--2">
          <FormField label="法人（会社）名" required error={emp?.companyNameJa?.message}>
            <FormInput
              {...register('employerInfo.companyNameJa')}
              placeholder="例: 株式会社〇〇製作所"
              error={!!emp?.companyNameJa}
            />
          </FormField>

          <FormField
            label="法人番号の有無"
            required
            error={emp?.hasCorporateNumber?.message}
          >
            <Controller
              name="employerInfo.hasCorporateNumber"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="employerInfo.hasCorporateNumber"
                  options={[
                    { value: 'true', label: '有' },
                    { value: 'false', label: '無' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!emp?.hasCorporateNumber}
                />
              )}
            />
          </FormField>

          {hasCorporateNumber && (
            <FormField
              label="法人番号"
              required
              hint="13桁の数字"
              error={emp?.corporateNumber?.message}
            >
              <FormInput
                {...register('employerInfo.corporateNumber')}
                placeholder="1234567890123"
                maxLength={13}
                error={!!emp?.corporateNumber}
              />
            </FormField>
          )}
          <FormField label="法人所在地（郵便番号）" required error={emp?.companyZipCode?.message}>
            <FormInput
              {...register('employerInfo.companyZipCode')}
              placeholder="例: 1000001"
              error={!!emp?.companyZipCode}
            />
          </FormField>

          <FormField label="法人所在地（都道府県）" required error={emp?.companyPref?.message}>
            <Controller
              name="employerInfo.companyPref"
              control={control}
              render={({ field }) => (
                <FormSelect
                  name={field.name}
                  options={renewalFormOptions.prefectures}
                  value={field.value ?? ''}
                  onChange={(val) => {
                    field.onChange(val);
                    setValue('employerInfo.companyCity', '');
                  }}
                  error={!!emp?.companyPref}
                />
              )}
            />
          </FormField>

          <FormField label="法人所在地（市区町村）" required error={emp?.companyCity?.message}>
            <Controller
              name="employerInfo.companyCity"
              control={control}
              render={({ field }) => {
                const selectedPrefecture = watch('employerInfo.companyPref');
                const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                return (
                  <FormSelect
                    options={cityOptions}
                    {...field}
                    error={!!emp?.companyCity}
                    disabled={!selectedPrefecture || cityOptions.length === 0}
                  />
                );
              }}
            />
          </FormField>

          <FormField label="法人所在地（番地等）" required error={emp?.companyAddressLines?.message}>
            <FormInput
              {...register('employerInfo.companyAddressLines')}
              placeholder="例: 千代田1-1-1"
              error={!!emp?.companyAddressLines}
            />
          </FormField>

          <FormField label="全体住所（任意）" hint="結合された住所等" error={emp?.companyAddress?.message}>
            <FormInput
              {...register('employerInfo.companyAddress')}
              placeholder="例: 東京都千代田区千代田1-1-1"
              error={!!emp?.companyAddress}
            />
          </FormField>

          <FormField label="代表者氏名" required error={emp?.representativeName?.message}>
            <FormInput
              {...register('employerInfo.representativeName')}
              placeholder="例: 山田 太郎"
              error={!!emp?.representativeName}
            />
          </FormField>

          <FormField
            label="法人電話番号"
            required
            hint="ハイフンなし 例: 0312345678"
            error={emp?.companyPhone?.message}
          >
            <FormInput
              {...register('employerInfo.companyPhone')}
              type="tel"
              placeholder="0312345678"
              error={!!emp?.companyPhone}
            />
          </FormField>

          <FormField label="従業員数（人）" required error={emp?.employeeCount?.message}>
            <FormInput
              type="number"
              {...register('employerInfo.employeeCount', { valueAsNumber: true })}
              placeholder="例: 50"
              min={1}
              error={!!emp?.employeeCount}
            />
          </FormField>

          <FormField
            label="資本金（万円）"
            hint="任意"
            error={emp?.capital?.message}
          >
            <FormInput
              type="number"
              {...register('employerInfo.capital', { valueAsNumber: true })}
              placeholder="例: 1000"
              min={0}
              error={!!emp?.capital}
            />
          </FormField>

          <FormField
            label="売上高（万円）"
            hint="任意"
            error={emp?.annualRevenue?.message}
          >
            <FormInput
              type="number"
              {...register('employerInfo.annualRevenue', { valueAsNumber: true })}
              placeholder="例: 50000"
              min={0}
              error={!!emp?.annualRevenue}
            />
          </FormField>
        </div>
      </div>

      {/* ─── ⑥ 勤務事業所・保険 ────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">勤務事業所・労働社会保険</h3>
        <div className="form-grid form-grid--2">
          
          <FormField label="事業所名" required error={emp?.workplaceName?.message}>
            <FormInput
              {...register('employerInfo.workplaceName')}
              placeholder="例: 本社工場"
              error={!!emp?.workplaceName}
            />
          </FormField>
          
          <FormField label="事業所 郵便番号" required error={emp?.workplaceZipCode?.message}>
            <FormInput
              {...register('employerInfo.workplaceZipCode')}
              placeholder="例: 1000001"
              error={!!emp?.workplaceZipCode}
            />
          </FormField>

          <FormField label="事業所 都道府県" required error={emp?.workplacePref?.message}>
            <Controller
              name="employerInfo.workplacePref"
              control={control}
              render={({ field }) => (
                <FormSelect
                  name={field.name}
                  options={renewalFormOptions.prefectures}
                  value={field.value ?? ''}
                  onChange={(val) => {
                    field.onChange(val);
                    setValue('employerInfo.workplaceCity', '');
                  }}
                  error={!!emp?.workplacePref}
                />
              )}
            />
          </FormField>

          <FormField label="事業所 市区町村" required error={emp?.workplaceCity?.message}>
            <Controller
              name="employerInfo.workplaceCity"
              control={control}
              render={({ field }) => {
                const selectedPrefecture = watch('employerInfo.workplacePref');
                const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                return (
                  <FormSelect
                    options={cityOptions}
                    {...field}
                    error={!!emp?.workplaceCity}
                    disabled={!selectedPrefecture || cityOptions.length === 0}
                  />
                );
              }}
            />
          </FormField>
          
          <FormField label="事業所 番地等" required error={emp?.workplaceAddressLines?.message}>
            <FormInput
              {...register('employerInfo.workplaceAddressLines')}
              placeholder="例: 芝公園1-1-1"
              error={!!emp?.workplaceAddressLines}
            />
          </FormField>

          <FormField
            label="社会保険（健康保険・厚生年金）適用の有無"
            required
            error={emp?.isSocialInsuranceApplicable?.message}
          >
            <Controller
              name="employerInfo.isSocialInsuranceApplicable"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="employerInfo.isSocialInsuranceApplicable"
                  options={[
                    { value: 'true', label: '適用あり' },
                    { value: 'false', label: '適用なし' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!emp?.isSocialInsuranceApplicable}
                />
              )}
            />
          </FormField>

          <FormField
            label="労働保険（雇用・労災）適用の有無"
            required
            error={emp?.isLaborInsuranceApplicable?.message}
          >
            <Controller
              name="employerInfo.isLaborInsuranceApplicable"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="employerInfo.isLaborInsuranceApplicable"
                  options={[
                    { value: 'true', label: '適用あり' },
                    { value: 'false', label: '適用なし' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!emp?.isLaborInsuranceApplicable}
                />
              )}
            />
          </FormField>

          {isLaborInsuranceApplicable && (
            <FormField
              label="労働保険番号"
              required
              error={emp?.laborInsuranceNumber?.message}
            >
              <FormInput
                {...register('employerInfo.laborInsuranceNumber')}
                placeholder="1234567890123"
                error={!!emp?.laborInsuranceNumber}
              />
            </FormField>
          )}

          <FormField
            label="雇用保険適用事業所番号（任意）"
            error={emp?.employmentInsuranceNumber?.message}
          >
            <FormInput
              {...register('employerInfo.employmentInsuranceNumber')}
              placeholder="12345678901"
              maxLength={11}
              error={!!emp?.employmentInsuranceNumber}
            />
          </FormField>
        </div>
      </div>

      {/* ─── ⑦ 欠格事由等の確認（誓約事項） ────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">欠格事由等の確認（誓約事項）</h3>
        <p className="subsection-desc">
          以下の項目に「該当する（はい）」がある場合は、特定技能外国人の受入れができない可能性があります。<br/>
          該当するものにはチェックを入れ、詳細経緯を記入してください。
        </p>
        <div className="disqualify-block" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {COMPLIANCE_OATHS.map(item => {
            const appliesPath = item.hasDetail
              ? `employerInfo.complianceOaths.${item.key}.applies`
              : `employerInfo.complianceOaths.${item.key}`;
            const detailPath = item.hasDetail
              ? `employerInfo.complianceOaths.${item.key}.detail`
              : null;
            
            return (
              <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
                <Controller
                  name={appliesPath as Path<RenewalApplicationFormData>}
                  control={control}
                  render={({ field }) => (
                    <CheckboxRow
                      id={`compliance-${item.key}`}
                      label={item.label}
                      checked={field.value as boolean}
                      onChange={field.onChange}
                    />
                  )}
                />
                {item.hasDetail && watch(appliesPath as Path<RenewalApplicationFormData>) && (
                  <div style={{ paddingLeft: '1.75rem', marginTop: '0.25rem' }}>
                    <FormTextarea
                      {...register(detailPath as Path<RenewalApplicationFormData>)}
                      placeholder="詳細な理由・経緯を記入してください"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <h4 className="text-sm font-bold text-slate-700 mt-6 mb-4">派遣・労災等の特記事項</h4>
        <div className="disqualify-block" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
            <Controller
              name="employerInfo.dispatchQualification.applies"
              control={control}
              render={({ field }) => (
                <CheckboxRow
                  id="dispatchQual-applies"
                  label="(27) 派遣機関要件のいずれかに該当"
                  checked={field.value as boolean}
                  onChange={field.onChange}
                />
              )}
            />
            {watch('employerInfo.dispatchQualification.applies') && (
              <div style={{ paddingLeft: '1.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Controller
                  name="employerInfo.dispatchQualification.doesSpecificIndustryBusiness"
                  control={control}
                  render={({ field }) => <CheckboxRow id="dq-1" label="特定産業分野業務を実施している" checked={!!field.value} onChange={field.onChange} />}
                />
                {watch('employerInfo.dispatchQualification.doesSpecificIndustryBusiness') && (
                   <FormInput {...register('employerInfo.dispatchQualification.doesSpecificIndustryBusinessDetail')} placeholder="詳細" />
                )}
                
                <Controller
                  name="employerInfo.dispatchQualification.publicBodyCapitalMajority"
                  control={control}
                  render={({ field }) => <CheckboxRow id="dq-2" label="地方公共団体等が資本金過半数出資" checked={!!field.value} onChange={field.onChange} />}
                />
                
                <Controller
                  name="employerInfo.dispatchQualification.publicBodyManagementInvolvement"
                  control={control}
                  render={({ field }) => <CheckboxRow id="dq-3" label="地方公共団体等が業務執行に実質関与" checked={!!field.value} onChange={field.onChange} />}
                />

                <Controller
                  name="employerInfo.dispatchQualification.isAgricultureSpecialZoneEntity"
                  control={control}
                  render={({ field }) => <CheckboxRow id="dq-4" label="農業特区機関" checked={!!field.value} onChange={field.onChange} />}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
            <Controller
              name="employerInfo.dispatchDestinationDisqualification.applies"
              control={control}
              render={({ field }) => <CheckboxRow id="dispatchDestDisq" label="(28) 派遣先が欠格事由に該当する" checked={!!field.value} onChange={field.onChange} />}
            />
            {watch('employerInfo.dispatchDestinationDisqualification.applies') && (
              <div style={{ paddingLeft: '1.75rem', marginTop: '0.25rem' }}>
                <FormTextarea {...register('employerInfo.dispatchDestinationDisqualification.detail')} placeholder="詳細な理由・経緯" rows={2} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
            <Controller
              name="employerInfo.hasWorkersCompMeasures.applies"
              control={control}
              render={({ field }) => <CheckboxRow id="workersComp" label="(29) 労災保険加入等の措置を講じている" checked={!!field.value} onChange={field.onChange} />}
            />
            {watch('employerInfo.hasWorkersCompMeasures.applies') && (
               <div style={{ paddingLeft: '1.75rem', marginTop: '0.25rem' }}>
                 <FormTextarea {...register('employerInfo.hasWorkersCompMeasures.detail')} placeholder="詳細な措置内容" rows={2} />
               </div>
            )}
          </div>
          
        </div>
      </div>

      {/* ─── ⑧ 1号特定技能外国人支援計画 ─────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">1号特定技能外国人支援計画</h3>
        <p className="subsection-desc">
          作成した支援計画に含まれる支援の実施項目にチェックを入れてください。
        </p>
        <div className="disqualify-block" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem' }}>
          {SUPPORT_PLAN_ITEMS.map(item => (
             <Controller
               key={item.key}
               name={`employerInfo.supportPlan.${item.key}` as Path<RenewalApplicationFormData>}
               control={control}
               render={({ field }) => (
                 <CheckboxRow
                   id={`supportPlan-${item.key}`}
                   label={item.label}
                   checked={field.value as boolean}
                   onChange={field.onChange}
                 />
               )}
             />
          ))}
        </div>
      </div>

      {/* ─── ⑧ 支援体制 ──────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">1号特定技能外国人支援計画の実施体制</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="登録支援機関への全部委託の有無"
            required
            error={emp?.delegateSupportEntirely?.message}
          >
            <Controller
              name="employerInfo.delegateSupportEntirely"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="employerInfo.delegateSupportEntirely"
                  options={[
                    { value: 'false', label: '自社で実施（一部委託含む）' },
                    { value: 'true', label: '登録支援機関に全部委託' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!emp?.delegateSupportEntirely}
                />
              )}
            />
          </FormField>

          {/* 全部委託の場合のみ: 登録支援機関の詳細 */}
          {delegateSupportEntirely && (
            <div style={{ gridColumn: '1 / -1', padding: '1.25rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>登録支援機関の詳細情報</h4>
              <div className="form-grid form-grid--2">
                <FormField label="登録支援機関の名称" required error={saErr?.name?.message}>
                  <FormInput {...register('employerInfo.supportAgency.name')} placeholder="例: 株式会社〇〇支援機関" error={!!saErr?.name} />
                </FormField>
                <FormField label="登録番号" hint="例: 20登-000000" error={saErr?.registrationNumber?.message}>
                  <FormInput {...register('employerInfo.supportAgency.registrationNumber')} placeholder="例: 20登-000000" error={!!saErr?.registrationNumber} />
                </FormField>
                <FormField label="登録年月日" error={saErr?.registrationDate?.message}>
                  <FormInput type="date" {...register('employerInfo.supportAgency.registrationDate')} error={!!saErr?.registrationDate} />
                </FormField>
                <FormField label="代表者の氏名" error={saErr?.representativeName?.message}>
                  <FormInput {...register('employerInfo.supportAgency.representativeName')} placeholder="例: 田中 一郎" error={!!saErr?.representativeName} />
                </FormField>
                <FormField label="郵便番号" hint="ハイフンなし" error={saErr?.zipCode?.message}>
                  <FormInput {...register('employerInfo.supportAgency.zipCode')} placeholder="1000001" maxLength={7} error={!!saErr?.zipCode} />
                </FormField>
                <FormField label="都道府県" error={saErr?.prefecture?.message}>
                  <Controller
                    name="employerInfo.supportAgency.prefecture"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        options={renewalFormOptions.prefectures}
                        value={field.value ?? ''}
                        onChange={(val) => {
                          field.onChange(val);
                          setValue('employerInfo.supportAgency.city', '');
                        }}
                        error={!!saErr?.prefecture}
                      />
                    )}
                  />
                </FormField>
                <FormField label="市区町村" error={saErr?.city?.message}>
                  <Controller
                    name="employerInfo.supportAgency.city"
                    control={control}
                    render={({ field }) => {
                      const selectedPrefecture = watch('employerInfo.supportAgency.prefecture');
                      const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                      return (
                        <FormSelect
                          options={cityOptions}
                          {...field}
                          error={!!saErr?.city}
                          disabled={!selectedPrefecture || cityOptions.length === 0}
                        />
                      );
                    }}
                  />
                </FormField>
                <FormField label="町名・番地等" error={saErr?.addressLines?.message}>
                  <FormInput {...register('employerInfo.supportAgency.addressLines')} placeholder="例: 芝公園1-1-1" error={!!saErr?.addressLines} />
                </FormField>
                <FormField label="電話番号" hint="ハイフンなし" error={saErr?.phone?.message}>
                  <FormInput {...register('employerInfo.supportAgency.phone')} placeholder="0312345678" error={!!saErr?.phone} />
                </FormField>
                
                {/* 支援責任者・事業所 */}
                <FormField label="支援を行う事業所の名称" error={saErr?.supportOfficeName?.message}>
                  <FormInput {...register('employerInfo.supportAgency.supportOfficeName')} placeholder="例: 関東支社" error={!!saErr?.supportOfficeName} />
                </FormField>
                <FormField label="事業所 郵便番号" error={saErr?.officeZipCode?.message}>
                  <FormInput {...register('employerInfo.supportAgency.officeZipCode')} placeholder="1000001" maxLength={7} error={!!saErr?.officeZipCode} />
                </FormField>
                <FormField label="事業所 都道府県" error={saErr?.officePrefecture?.message}>
                  <Controller
                    name="employerInfo.supportAgency.officePrefecture"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        options={renewalFormOptions.prefectures}
                        value={field.value ?? ''}
                        onChange={(val) => {
                          field.onChange(val);
                          setValue('employerInfo.supportAgency.officeCity', '');
                        }}
                        error={!!saErr?.officePrefecture}
                      />
                    )}
                  />
                </FormField>
                <FormField label="事業所 市区町村" error={saErr?.officeCity?.message}>
                  <Controller
                    name="employerInfo.supportAgency.officeCity"
                    control={control}
                    render={({ field }) => {
                      const selectedPrefecture = watch('employerInfo.supportAgency.officePrefecture');
                      const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                      return (
                        <FormSelect
                          options={cityOptions}
                          {...field}
                          error={!!saErr?.officeCity}
                          disabled={!selectedPrefecture || cityOptions.length === 0}
                        />
                      );
                    }}
                  />
                </FormField>
                <FormField label="支援責任者名" error={saErr?.supportSupervisorName?.message}>
                  <FormInput {...register('employerInfo.supportAgency.supportSupervisorName')} placeholder="例: 鈴木 次郎" error={!!saErr?.supportSupervisorName} />
                </FormField>
                <FormField label="支援担当者名" error={saErr?.supportOfficerName?.message}>
                  <FormInput {...register('employerInfo.supportAgency.supportOfficerName')} placeholder="例: 佐藤 花子" error={!!saErr?.supportOfficerName} />
                </FormField>
                <FormField label="対応可能言語" error={saErr?.supportLanguages?.message}>
                  <FormInput {...register('employerInfo.supportAgency.supportLanguages')} placeholder="例: 日本語、英語" error={!!saErr?.supportLanguages} />
                </FormField>
                <FormField label="支援委託手数料(月額/人)" error={saErr?.supportFeeMonthly?.message}>
                  <FormInput type="number" {...register('employerInfo.supportAgency.supportFeeMonthly', { valueAsNumber: true })} placeholder="15000" error={!!saErr?.supportFeeMonthly} />
                </FormField>
              </div>
            </div>
          )}

          <FormField
            label="支援責任者 氏名"
            required
            error={emp?.supportPersonnel?.supervisorName?.message}
          >
            <FormInput
              {...register('employerInfo.supportPersonnel.supervisorName')}
              placeholder="例: 鈴木 一郎"
              error={!!emp?.supportPersonnel?.supervisorName}
            />
          </FormField>

          <FormField
            label="支援責任者 役職"
            required
            error={emp?.supportPersonnel?.supervisorTitle?.message}
          >
            <FormInput
              {...register('employerInfo.supportPersonnel.supervisorTitle')}
              placeholder="例: 代表取締役"
              error={!!emp?.supportPersonnel?.supervisorTitle}
            />
          </FormField>

          <FormField
            label="支援担当者 氏名"
            required
            error={emp?.supportPersonnel?.officerName?.message}
          >
            <FormInput
              {...register('employerInfo.supportPersonnel.officerName')}
              placeholder="例: 田中 花子"
              error={!!emp?.supportPersonnel?.officerName}
            />
          </FormField>

          <FormField
            label="支援担当者 役職"
            required
            error={emp?.supportPersonnel?.officerTitle?.message}
          >
            <FormInput
              {...register('employerInfo.supportPersonnel.officerTitle')}
              placeholder="例: 人事部長"
              error={!!emp?.supportPersonnel?.officerTitle}
            />
          </FormField>
        </div>
      </div>

      {/* ─── 支援業務の実施要件・体制（委託しない場合等） ───────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">支援業務の実施要件等</h3>
        <p className="subsection-desc">自社で支援を実施する場合（一部委託の場合を含む）等の確認事項です。</p>
        <div className="disqualify-block" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
            <Controller
              name="employerInfo.qualifiedForSupportWork"
              control={control}
              render={({ field }) => (
                <CheckboxRow
                  id="qualifiedSupport"
                  label="(35) 支援業務実施要件（適合するものにチェック）"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {watch('employerInfo.qualifiedForSupportWork') && (
              <div style={{ paddingLeft: '1.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Controller
                  name="employerInfo.supportWorkQualification1"
                  control={control}
                  render={({ field }) => <CheckboxRow id="q-1" label="過去2年間の中長期在留者の適正な受入れ実績がある" checked={!!field.value} onChange={field.onChange} />}
                />
                <Controller
                  name="employerInfo.supportWorkQualification2"
                  control={control}
                  render={({ field }) => <CheckboxRow id="q-2" label="過去2年間に報酬を得て生活相談等に従事した経験がある" checked={!!field.value} onChange={field.onChange} />}
                />
                <Controller
                  name="employerInfo.supportWorkQualification3"
                  control={control}
                  render={({ field }) => <CheckboxRow id="q-3" label="その他支援を適正に実施できる事情がある" checked={!!field.value} onChange={field.onChange} />}
                />
                {watch('employerInfo.supportWorkQualification3') && (
                  <FormInput {...register('employerInfo.supportWorkQualification3Detail')} placeholder="詳細な事情を記入" />
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
             <Controller
               name="employerInfo.hasForeignLanguageSupportCapability"
               control={control}
               render={({ field }) => <CheckboxRow id="langCap" label="(36) 外国人が十分理解できる言語での支援体制がある" checked={!!field.value} onChange={field.onChange} />}
             />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
             <Controller
               name="employerInfo.keepsSupportRecords"
               control={control}
               render={({ field }) => <CheckboxRow id="keepRec" label="(37) 支援状況書類を作成し、1年以上保存する" checked={!!field.value} onChange={field.onChange} />}
             />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
             <Controller
               name="employerInfo.supportersNeutral"
               control={control}
               render={({ field }) => <CheckboxRow id="neut" label="(38) 支援責任者・担当者が中立な立場で支援を実施できる" checked={!!field.value} onChange={field.onChange} />}
             />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
             <Controller
               name="employerInfo.hadSupportNeglect.applies"
               control={control}
               render={({ field }) => <CheckboxRow id="neglect" label="(39) 【該当注意】過去5年間に支援計画に基づく支援を怠り、指導を受けた" checked={!!field.value} onChange={field.onChange} />}
             />
             {watch('employerInfo.hadSupportNeglect.applies') && (
                <div style={{ paddingLeft: '1.75rem', marginTop: '0.25rem' }}>
                  <FormTextarea {...register('employerInfo.hadSupportNeglect.detail')} placeholder="詳細な理由・経緯" rows={2} />
                </div>
             )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
             <Controller
               name="employerInfo.hasRegularMeetingCapability"
               control={control}
               render={({ field }) => <CheckboxRow id="meet" label="(40) 定期面談を適正に実施する体制がある" checked={!!field.value} onChange={field.onChange} />}
             />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.015)', borderRadius: '0.375rem' }}>
             <Controller
               name="employerInfo.meetsSpecificIndustrySupportStandards"
               control={control}
               render={({ field }) => <CheckboxRow id="indSupStd" label="(41) 特定産業分野固有の支援基準に適合している" checked={!!field.value} onChange={field.onChange} />}
             />
          </div>

        </div>
      </div>

      {/* ─── ⑨ 職歴 ──────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">職歴</h3>

        <FormField
          label="職歴の有無"
          required
          error={emp?.hasJobHistory?.message}
        >
          <Controller
            name="employerInfo.hasJobHistory"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="employerInfo.hasJobHistory"
                options={[
                  { value: 'false', label: '無' },
                  { value: 'true', label: '有' },
                ]}
                value={String(field.value ?? 'false')}
                onChange={(v) => field.onChange(v === 'true')}
                error={!!emp?.hasJobHistory}
              />
            )}
          />
        </FormField>

        {hasJobHistory && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="subsection-header-row mb-4">
              <h4 className="text-sm font-bold text-slate-700">登録済み職歴</h4>
              <button
                type="button"
                className="btn-add"
                onClick={() =>
                  appendJob({
                    startDate: '',
                    endDate: '',
                    companyName: '',
                  })
                }
              >
                <Plus size={16} />
                追加
              </button>
            </div>

            {jobFields.length === 0 && (
              <p className="empty-list-hint">
                職歴がある場合は「追加」ボタンから入力してください
              </p>
            )}

            {jobFields.map((field, index) => {
              const job = emp?.jobHistory?.[index];
              return (
                <div key={field.id} className="relative-row">
                  <div className="relative-row-header">
                    <span className="relative-row-number">職歴 #{index + 1}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeJob(index)}
                    >
                      <Trash2 size={14} />
                      削除
                    </button>
                  </div>
                  <div className="form-grid form-grid--3">
                    <FormField label="入社年月" required hint="YYYY-MM" error={job?.startDate?.message}>
                      <FormInput
                        {...register(`employerInfo.jobHistory.${index}.startDate`)}
                        placeholder="例: 2020-04"
                        error={!!job?.startDate}
                      />
                    </FormField>
                    <FormField label="退社年月" hint="YYYY-MM（任意）" error={job?.endDate?.message}>
                      <FormInput
                        {...register(`employerInfo.jobHistory.${index}.endDate`)}
                        placeholder="例: 2023-03"
                        error={!!job?.endDate}
                      />
                    </FormField>
                    <FormField label="勤務先名称" required error={job?.companyName?.message}>
                      <FormInput
                        {...register(`employerInfo.jobHistory.${index}.companyName`)}
                        placeholder="例: 株式会社〇〇"
                        error={!!job?.companyName}
                      />
                    </FormField>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 関連機関（派遣先・職業紹介等） ─────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">関連機関</h3>
        <p className="subsection-desc" style={{ marginBottom: '0.75rem' }}>
          派遣形態の場合や、職業紹介・取次機関を利用した場合のみ広げて入力してください。
        </p>

        {/* 派遣先 */}
        <button
          type="button"
          onClick={() => setShowDispatch(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.875rem', background: showDispatch ? '#f1f5f9' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: showDispatch ? '0.75rem' : '0.5rem', textAlign: 'left' }}
        >
          {showDispatch ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          派遣先（雇用形態が派遣の場合）
        </button>
        {showDispatch && (
          <div style={{ padding: '1rem', marginBottom: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
            <div className="form-grid form-grid--2">
              <FormField label="派遣先 氏名・名称" error={dispatchErr?.name?.message}><FormInput {...register('employerInfo.dispatchDestination.name')} error={!!dispatchErr?.name} /></FormField>
              <FormField label="法人番号" error={dispatchErr?.corporateNumber?.message}><FormInput {...register('employerInfo.dispatchDestination.corporateNumber')} maxLength={13} error={!!dispatchErr?.corporateNumber} /></FormField>
              <FormField label="雇用保険適用事業所番号" error={dispatchErr?.employmentInsuranceNumber?.message}><FormInput {...register('employerInfo.dispatchDestination.employmentInsuranceNumber')} maxLength={11} error={!!dispatchErr?.employmentInsuranceNumber} /></FormField>
              <FormField label="代表者の氏名" error={dispatchErr?.representativeName?.message}><FormInput {...register('employerInfo.dispatchDestination.representativeName')} error={!!dispatchErr?.representativeName} /></FormField>
              <FormField label="郵便番号" hint="ハイフンなし" error={dispatchErr?.zipCode?.message}><FormInput {...register('employerInfo.dispatchDestination.zipCode')} maxLength={7} error={!!dispatchErr?.zipCode} /></FormField>
              <FormField label="都道府県" error={dispatchErr?.prefecture?.message}>
                <Controller
                  name="employerInfo.dispatchDestination.prefecture"
                  control={control}
                  render={({ field }) => (
                    <FormSelect options={renewalFormOptions.prefectures} value={field.value ?? ''} onChange={(val) => { field.onChange(val); setValue('employerInfo.dispatchDestination.city', ''); }} error={!!dispatchErr?.prefecture} />
                  )}
                />
              </FormField>
              <FormField label="市区町村" error={dispatchErr?.city?.message}>
                <Controller
                  name="employerInfo.dispatchDestination.city"
                  control={control}
                  render={({ field }) => {
                    const selectedPrefecture = watch('employerInfo.dispatchDestination.prefecture');
                    const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                    return <FormSelect options={cityOptions} {...field} error={!!dispatchErr?.city} disabled={!selectedPrefecture || cityOptions.length === 0} />;
                  }}
                />
              </FormField>
              <FormField label="町名・番地等" error={dispatchErr?.addressLines?.message}><FormInput {...register('employerInfo.dispatchDestination.addressLines')} error={!!dispatchErr?.addressLines} /></FormField>
              <FormField label="電話番号" hint="ハイフンなし" error={dispatchErr?.phone?.message}><FormInput {...register('employerInfo.dispatchDestination.phone')} error={!!dispatchErr?.phone} /></FormField>
              <FormField label="派遣期間(始期)" error={dispatchErr?.periodStart?.message}><FormInput type="date" {...register('employerInfo.dispatchDestination.periodStart')} error={!!dispatchErr?.periodStart} /></FormField>
              <FormField label="派遣期間(終期)" error={dispatchErr?.periodEnd?.message}><FormInput type="date" {...register('employerInfo.dispatchDestination.periodEnd')} error={!!dispatchErr?.periodEnd} /></FormField>
            </div>
          </div>
        )}

        {/* 職業紹介事業者 */}
        <button
          type="button"
          onClick={() => setShowPlacement(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.875rem', background: showPlacement ? '#f1f5f9' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: showPlacement ? '0.75rem' : '0.5rem', textAlign: 'left' }}
        >
          {showPlacement ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          職業紹介事業者
        </button>
        {showPlacement && (
          <div style={{ padding: '1rem', marginBottom: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
            <div className="form-grid form-grid--2">
              <FormField label="職業紹介事業者 氏名・名称" error={placeErr?.name?.message}><FormInput {...register('employerInfo.placementAgency.name')} error={!!placeErr?.name} /></FormField>
              <FormField label="法人番号" error={placeErr?.corporateNumber?.message}><FormInput {...register('employerInfo.placementAgency.corporateNumber')} maxLength={13} error={!!placeErr?.corporateNumber} /></FormField>
              <FormField label="雇用保険適用事業所番号" error={placeErr?.employmentInsuranceNumber?.message}><FormInput {...register('employerInfo.placementAgency.employmentInsuranceNumber')} maxLength={11} error={!!placeErr?.employmentInsuranceNumber} /></FormField>
              <FormField label="許可・届出番号" error={placeErr?.licenseNumber?.message}><FormInput {...register('employerInfo.placementAgency.licenseNumber')} error={!!placeErr?.licenseNumber} /></FormField>
              <FormField label="受理年月日" error={placeErr?.acceptanceDate?.message}><FormInput type="date" {...register('employerInfo.placementAgency.acceptanceDate')} error={!!placeErr?.acceptanceDate} /></FormField>
              <FormField label="郵便番号" hint="ハイフンなし" error={placeErr?.zipCode?.message}><FormInput {...register('employerInfo.placementAgency.zipCode')} maxLength={7} error={!!placeErr?.zipCode} /></FormField>
              <FormField label="都道府県" error={placeErr?.prefecture?.message}>
                <Controller
                  name="employerInfo.placementAgency.prefecture"
                  control={control}
                  render={({ field }) => (
                    <FormSelect options={renewalFormOptions.prefectures} value={field.value ?? ''} onChange={(val) => { field.onChange(val); setValue('employerInfo.placementAgency.city', ''); }} error={!!placeErr?.prefecture} />
                  )}
                />
              </FormField>
              <FormField label="市区町村" error={placeErr?.city?.message}>
                <Controller
                  name="employerInfo.placementAgency.city"
                  control={control}
                  render={({ field }) => {
                    const selectedPrefecture = watch('employerInfo.placementAgency.prefecture');
                    const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                    return <FormSelect options={cityOptions} {...field} error={!!placeErr?.city} disabled={!selectedPrefecture || cityOptions.length === 0} />;
                  }}
                />
              </FormField>
              <FormField label="町名・番地等" error={placeErr?.addressLines?.message}><FormInput {...register('employerInfo.placementAgency.addressLines')} error={!!placeErr?.addressLines} /></FormField>
              <FormField label="電話番号" hint="ハイフンなし" error={placeErr?.phone?.message}><FormInput {...register('employerInfo.placementAgency.phone')} error={!!placeErr?.phone} /></FormField>
            </div>
          </div>
        )}

        {/* 取次機関 */}
        <button
          type="button"
          onClick={() => setShowIntermediary(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.875rem', background: showIntermediary ? '#f1f5f9' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: showIntermediary ? '0.75rem' : 0, textAlign: 'left' }}
        >
          {showIntermediary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          海外の取次機関
        </button>
        {showIntermediary && (
          <div style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
            <div className="form-grid form-grid--2">
              <FormField label="取次機関 氏名・名称" error={interErr?.name?.message}><FormInput {...register('employerInfo.intermediaryAgency.name')} error={!!interErr?.name} /></FormField>
              <FormField label="国・地域" error={interErr?.country?.message}><FormInput {...register('employerInfo.intermediaryAgency.country')} error={!!interErr?.country} /></FormField>
              <FormField label="郵便番号" hint="ハイフンなし" error={interErr?.zipCode?.message}><FormInput {...register('employerInfo.intermediaryAgency.zipCode')} maxLength={7} error={!!interErr?.zipCode} /></FormField>
              <FormField label="都道府県・州など" error={interErr?.prefecture?.message}><FormInput {...register('employerInfo.intermediaryAgency.prefecture')} error={!!interErr?.prefecture} /></FormField>
              <FormField label="市区町村" error={interErr?.city?.message}><FormInput {...register('employerInfo.intermediaryAgency.city')} error={!!interErr?.city} /></FormField>
              <FormField label="町名・番地等" error={interErr?.addressLines?.message}><FormInput {...register('employerInfo.intermediaryAgency.addressLines')} error={!!interErr?.addressLines} /></FormField>
              <FormField label="電話番号" hint="ハイフンなし" error={interErr?.phone?.message}><FormInput {...register('employerInfo.intermediaryAgency.phone')} error={!!interErr?.phone} /></FormField>
            </div>
          </div>
        )}
      </div>

      </fieldset>
    </div>
  );
}
