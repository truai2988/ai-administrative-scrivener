'use client';

import React from 'react';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { Building2, Plus, Trash2 } from 'lucide-react';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import { INDUSTRY_FIELD_OPTIONS, PAYMENT_METHOD_OPTIONS } from '@/types/renewalApplication';
import { FormField } from '../ui/FormField';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormRadioGroup } from '../ui/FormRadio';

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

export function EmployerInfoSection() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<RenewalApplicationFormData>();

  const emp = errors.employerInfo;
  
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

  return (
    <div className="section-container">
      <div className="section-header">
        <Building2 size={20} className="section-icon" />
        <h2 className="section-title">所属機関（企業）情報</h2>
        <p className="section-desc">所属機関等作成用（1〜8）に対応する項目です</p>
      </div>

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
                  options={INDUSTRY_FIELD_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  value={field.value}
                  onChange={(val) => {
                    // Update the array with the single selected value as item 0
                    field.onChange(val);
                  }}
                  error={!!emp?.industryFields}
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
                  options={PAYMENT_METHOD_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
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
            <FormInput
              {...register('employerInfo.companyPref')}
              placeholder="例: 東京都"
              error={!!emp?.companyPref}
            />
          </FormField>

          <FormField label="法人所在地（市区町村）" required error={emp?.companyCity?.message}>
            <FormInput
              {...register('employerInfo.companyCity')}
              placeholder="例: 千代田区"
              error={!!emp?.companyCity}
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
            <FormInput
              {...register('employerInfo.workplacePref')}
              placeholder="例: 東京都"
              error={!!emp?.workplacePref}
            />
          </FormField>

          <FormField label="事業所 市区町村" required error={emp?.workplaceCity?.message}>
            <FormInput
              {...register('employerInfo.workplaceCity')}
              placeholder="例: 港区"
              error={!!emp?.workplaceCity}
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

      {/* ─── ⑦ 欠格事由 ──────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">欠格事由等の確認（誓約事項）</h3>
        <p className="subsection-desc">
          以下の項目に該当する場合は、特定技能外国人の受入れができない可能性があります。
        </p>
        <div className="disqualify-block">
          <Controller
            name="employerInfo.complianceOaths.hadMissingPersons"
            control={control}
            render={({ field }) => (
              <CheckboxRow
                id="hadMissingPersons"
                label="1年以内に特定技能外国人の行方不明者を発生させた"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="employerInfo.complianceOaths.hadIllegalDismissal"
            control={control}
            render={({ field }) => (
              <CheckboxRow
                id="hadIllegalDismissal"
                label="1年以内に特定技能外国人を不当に解雇したことがある"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="employerInfo.complianceOaths.hadLaborLawPenalty"
            control={control}
            render={({ field }) => (
              <CheckboxRow
                id="hadLaborLawPenalty"
                label="5年以内に労働関係法令違反で罰則を受けたことがある"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
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
            <>
              <FormField
                label="登録支援機関の名称"
                required
                error={emp?.supportAgencyName?.message}
              >
                <FormInput
                  {...register('employerInfo.supportAgencyName')}
                  placeholder="例: 株式会社〇〇支援機関"
                  error={!!emp?.supportAgencyName}
                />
              </FormField>
              <FormField
                label="登録支援機関 登録番号"
                hint="例: 20登-000000"
                error={emp?.supportAgencyRegistrationNumber?.message}
              >
                <FormInput
                  {...register('employerInfo.supportAgencyRegistrationNumber')}
                  placeholder="例: 20登-000000"
                  error={!!emp?.supportAgencyRegistrationNumber}
                />
              </FormField>
            </>
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
    </div>
  );
}
