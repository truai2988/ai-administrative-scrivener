'use client';

import React, { useState } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { FileStack } from 'lucide-react';
import type { RenewalApplicationFormData, AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';
import type { GlobalLimitContext } from '@/lib/utils/fileUtils';
import { FormField } from '../ui/FormField';
import { FormRadioGroup } from '../ui/FormRadio';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormTextarea } from '../ui/FormTextarea';
import { renewalFormOptions } from '@/lib/constants/renewalFormOptions';
import { useAuth } from '@/contexts/AuthContext';

interface SimultaneousApplicationSectionProps {
  isEditable?: boolean;
  applicationId?: string;
  initialAttachments?: AttachmentMeta[];
  globalLimitContext?: GlobalLimitContext;
}

export function SimultaneousApplicationSection({
  isEditable = true,
  applicationId,
  initialAttachments,
  globalLimitContext,
}: SimultaneousApplicationSectionProps) {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RenewalApplicationFormData>();

  const sim = errors.simultaneousApplication;
  const reErr = sim?.reEntryPermit as Record<string, { message?: string }> | undefined;
  const actErr = sim?.activityOutsideStatus as Record<string, { message?: string }> | undefined;
  const authErr = sim?.authEmploymentCert as Record<string, { message?: string }> | undefined;

  // 動的表示フラグの監視
  const applyForReEntry = useWatch({ control, name: 'simultaneousApplication.applyForReEntry' });
  const applyForActivityOutsideStatus = useWatch({ control, name: 'simultaneousApplication.applyForActivityOutsideStatus' });
  const applyForAuthEmployment = useWatch({ control, name: 'simultaneousApplication.applyForAuthEmployment' });

  const hasCriminalRecord = useWatch({ control, name: 'simultaneousApplication.reEntryPermit.hasCriminalRecord' });
  const hasPendingCriminalCase = useWatch({ control, name: 'simultaneousApplication.reEntryPermit.hasPendingCriminalCase' });
  const newActivityHasPayment = useWatch({ control, name: 'simultaneousApplication.activityOutsideStatus.newActivityHasPayment' });

  // 書類ファーストワークフローの制御
  const [isManualInputEnabled, setIsManualInputEnabled] = useState(false);
  const attachments = useWatch({ control, name: 'attachments.simultaneous' }) || initialAttachments || [];
  const hasAttachments = attachments.length > 0;
  
  // 行政書士・本部は手動入力を常に許可する
  const { currentUser } = useAuth();
  const hasFullAccess = currentUser?.role === 'scrivener' || currentUser?.role === 'hq_admin';

  // 編集モードかつ（書類が添付されている OR 手動入力がオン OR フルアクセス権限）の場合のみフィールドを有効化
  const isFieldsEnabled = isEditable && (hasAttachments || isManualInputEnabled || hasFullAccess);

  return (
    <div className={`section-container${!isEditable ? ' section-container--readonly' : ''}`}>
      {!isEditable && (
        <div className="section-readonly-banner">
          🔒 このセクションは閲覧のみです。自分の担当のタブのみ編集できます。
        </div>
      )}
      
      <div className="section-header">
        <FileStack size={20} className="section-icon" />
        <h2 className="section-title">同時申請</h2>
        <p className="section-desc">
          在留期間更新と同時に申請する手続きを選択してください（任意）
        </p>
      </div>

      {/* ─── 添付書類 (最上部配置) ────────────────────────────────────────── */}
      <div className="subsection subsection--attachments">
        {isEditable && !hasAttachments && !hasFullAccess && (
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
        )}
      </div>

      <fieldset disabled={!isFieldsEnabled} style={{ border: 'none', padding: 0, margin: 0, opacity: isFieldsEnabled ? 1 : 0.5, transition: 'opacity 0.2s', pointerEvents: isFieldsEnabled ? 'auto' : 'none' }}>


        {/* ─── 再入国許可申請 ──────────────────────────────────────────── */}
        <div className="subsection">
          <h3 className="subsection-title">再入国許可申請</h3>
          <p className="subsection-desc">
            在留期間更新許可申請と同時に再入国許可申請を行う場合に選択してください。
          </p>
          <div className="form-grid form-grid--2">
            <FormField
              label="再入国許可申請を同時に行いますか？"
              error={sim?.applyForReEntry?.message}
            >
              <Controller
                name="simultaneousApplication.applyForReEntry"
                control={control}
                render={({ field }) => (
                  <FormRadioGroup
                    name="simultaneousApplication.applyForReEntry"
                    options={[
                      { value: 'false', label: '申請しない' },
                      { value: 'true', label: '同時申請する' },
                    ]}
                    value={String(field.value ?? 'false')}
                    onChange={(v) => field.onChange(v === 'true')}
                    error={!!sim?.applyForReEntry}
                  />
                )}
              />
            </FormField>
          </div>

          {applyForReEntry && (
            <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>再入国許可申請 - 詳細情報</h4>
              
              <div className="form-grid form-grid--2">
                <FormField label="希望する再入国許可の種別" error={reErr?.desiredPermitType?.message}>
                  <FormInput {...register('simultaneousApplication.reEntryPermit.desiredPermitType')} placeholder="例: 数次" error={!!reErr?.desiredPermitType} />
                </FormField>
                <div style={{ gridColumn: '1 / -1' }} className="form-grid form-grid--3">
                  <FormField label="渡航目的 1" error={reErr?.travelPurpose1?.message}>
                    <FormInput {...register('simultaneousApplication.reEntryPermit.travelPurpose1')} error={!!reErr?.travelPurpose1} />
                  </FormField>
                  <FormField label="渡航目的 2" error={reErr?.travelPurpose2?.message}>
                    <FormInput {...register('simultaneousApplication.reEntryPermit.travelPurpose2')} error={!!reErr?.travelPurpose2} />
                  </FormField>
                  <FormField label="渡航目的 その他" error={reErr?.travelPurposeOther?.message}>
                    <FormInput {...register('simultaneousApplication.reEntryPermit.travelPurposeOther')} error={!!reErr?.travelPurposeOther} />
                  </FormField>
                </div>

                <FormField label="予定渡航先国名 1" error={reErr?.destinationCountry1?.message}>
                  <FormInput {...register('simultaneousApplication.reEntryPermit.destinationCountry1')} error={!!reErr?.destinationCountry1} />
                </FormField>
                <FormField label="予定渡航先国名 2" error={reErr?.destinationCountry2?.message}>
                  <FormInput {...register('simultaneousApplication.reEntryPermit.destinationCountry2')} error={!!reErr?.destinationCountry2} />
                </FormField>

                <FormField label="出国予定年月日(主)" error={reErr?.departureDatePrimary?.message}>
                  <FormInput type="date" {...register('simultaneousApplication.reEntryPermit.departureDatePrimary')} error={!!reErr?.departureDatePrimary} />
                </FormField>
                <FormField label="出国予定の日本(空)港(主)" error={reErr?.departurePortPrimary?.message}>
                  <FormInput {...register('simultaneousApplication.reEntryPermit.departurePortPrimary')} error={!!reErr?.departurePortPrimary} />
                </FormField>

                <FormField label="再入国予定年月日(主)" error={reErr?.reEntryDatePrimary?.message}>
                  <FormInput type="date" {...register('simultaneousApplication.reEntryPermit.reEntryDatePrimary')} error={!!reErr?.reEntryDatePrimary} />
                </FormField>
                <FormField label="再入国予定の日本(空)港(主)" error={reErr?.reEntryPortPrimary?.message}>
                  <FormInput {...register('simultaneousApplication.reEntryPermit.reEntryPortPrimary')} error={!!reErr?.reEntryPortPrimary} />
                </FormField>

                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="犯罪を理由とする処分の有無" error={reErr?.hasCriminalRecord?.message}>
                    <Controller
                      name="simultaneousApplication.reEntryPermit.hasCriminalRecord"
                      control={control}
                      render={({ field }) => (
                        <FormRadioGroup
                          name="simultaneousApplication.reEntryPermit.hasCriminalRecord"
                          options={[
                            { value: 'false', label: '無' },
                            { value: 'true', label: '有' },
                          ]}
                          value={field.value === undefined ? '' : String(field.value)}
                          onChange={(v) => field.onChange(v === 'true')}
                          error={!!reErr?.hasCriminalRecord}
                        />
                      )}
                    />
                  </FormField>
                  {hasCriminalRecord && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <FormTextarea {...register('simultaneousApplication.reEntryPermit.criminalRecordDetail')} placeholder="詳細を記入してください" />
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="確定前の刑事裁判の有無" error={reErr?.hasPendingCriminalCase?.message}>
                    <Controller
                      name="simultaneousApplication.reEntryPermit.hasPendingCriminalCase"
                      control={control}
                      render={({ field }) => (
                        <FormRadioGroup
                          name="simultaneousApplication.reEntryPermit.hasPendingCriminalCase"
                          options={[
                            { value: 'false', label: '無' },
                            { value: 'true', label: '有' },
                          ]}
                          value={field.value === undefined ? '' : String(field.value)}
                          onChange={(v) => field.onChange(v === 'true')}
                          error={!!reErr?.hasPendingCriminalCase}
                        />
                      )}
                    />
                  </FormField>
                  {hasPendingCriminalCase && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <FormTextarea {...register('simultaneousApplication.reEntryPermit.pendingCriminalCaseDetail')} placeholder="詳細を記入してください" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 資格外活動許可申請 ─────────────────────────────────────── */}
        <div className="subsection">
          <h3 className="subsection-title">資格外活動許可申請</h3>
          <p className="subsection-desc">
            特定技能の在留資格に係る資格外活動許可を同時申請する場合に選択してください。
          </p>
          <div className="form-grid form-grid--2">
            <FormField
              label="資格外活動許可申請を同時に行いますか？"
              error={sim?.applyForActivityOutsideStatus?.message}
            >
              <Controller
                name="simultaneousApplication.applyForActivityOutsideStatus"
                control={control}
                render={({ field }) => (
                  <FormRadioGroup
                    name="simultaneousApplication.applyForActivityOutsideStatus"
                    options={[
                      { value: 'false', label: '申請しない' },
                      { value: 'true', label: '同時申請する' },
                    ]}
                    value={String(field.value ?? 'false')}
                    onChange={(v) => field.onChange(v === 'true')}
                    error={!!sim?.applyForActivityOutsideStatus}
                  />
                )}
              />
            </FormField>
          </div>

          {applyForActivityOutsideStatus && (
            <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>資格外活動許可申請 - 詳細情報</h4>
              
              <div className="form-grid form-grid--1">
                <FormField label="現在の在留活動の内容" error={actErr?.currentActivityDescription?.message}>
                  <FormTextarea {...register('simultaneousApplication.activityOutsideStatus.currentActivityDescription')} error={!!actErr?.currentActivityDescription} />
                </FormField>
              </div>

              <div className="form-grid form-grid--2" style={{ marginTop: '1rem' }}>
                <FormField label="他に従事しようとする活動 職務内容1" error={actErr?.newActivityJob1?.message}>
                  <FormInput {...register('simultaneousApplication.activityOutsideStatus.newActivityJob1')} error={!!actErr?.newActivityJob1} />
                </FormField>
                <FormField label="職務内容2" error={actErr?.newActivityJob2?.message}>
                  <FormInput {...register('simultaneousApplication.activityOutsideStatus.newActivityJob2')} error={!!actErr?.newActivityJob2} />
                </FormField>
                
                <FormField label="雇用契約期間(年)" error={actErr?.newActivityContractYears?.message}>
                  <FormInput type="number" {...register('simultaneousApplication.activityOutsideStatus.newActivityContractYears', { valueAsNumber: true })} error={!!actErr?.newActivityContractYears} />
                </FormField>
                <FormField label="雇用契約期間(月)" error={actErr?.newActivityContractMonths?.message}>
                  <FormInput type="number" {...register('simultaneousApplication.activityOutsideStatus.newActivityContractMonths', { valueAsNumber: true })} error={!!actErr?.newActivityContractMonths} />
                </FormField>

                <FormField label="週間稼働時間 1" error={actErr?.newActivityWeeklyHours1?.message}>
                  <FormInput type="number" {...register('simultaneousApplication.activityOutsideStatus.newActivityWeeklyHours1', { valueAsNumber: true })} error={!!actErr?.newActivityWeeklyHours1} />
                </FormField>
                <FormField label="週間稼働時間 2" error={actErr?.newActivityWeeklyHours2?.message}>
                  <FormInput type="number" {...register('simultaneousApplication.activityOutsideStatus.newActivityWeeklyHours2', { valueAsNumber: true })} error={!!actErr?.newActivityWeeklyHours2} />
                </FormField>

                <FormField label="報酬の有無" error={actErr?.newActivityHasPayment?.message}>
                  <Controller
                    name="simultaneousApplication.activityOutsideStatus.newActivityHasPayment"
                    control={control}
                    render={({ field }) => (
                      <FormRadioGroup
                        name="simultaneousApplication.activityOutsideStatus.newActivityHasPayment"
                        options={[
                          { value: 'false', label: '無' },
                          { value: 'true', label: '有' },
                        ]}
                        value={field.value === undefined ? '' : String(field.value)}
                        onChange={(v) => field.onChange(v === 'true')}
                        error={!!actErr?.newActivityHasPayment}
                      />
                    )}
                  />
                </FormField>
                {newActivityHasPayment && (
                  <FormField label="月額報酬(円)" error={actErr?.newActivityMonthlySalary?.message}>
                    <FormInput type="number" {...register('simultaneousApplication.activityOutsideStatus.newActivityMonthlySalary', { valueAsNumber: true })} error={!!actErr?.newActivityMonthlySalary} />
                  </FormField>
                )}
              </div>

              <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>勤務先情報</div>
              <div className="form-grid form-grid--2">
                <FormField label="勤務先 名称 1" error={actErr?.workplaceName1?.message}>
                  <FormInput {...register('simultaneousApplication.activityOutsideStatus.workplaceName1')} error={!!actErr?.workplaceName1} />
                </FormField>
                <FormField label="郵便番号" error={actErr?.workplaceZipCode?.message}>
                  <FormInput {...register('simultaneousApplication.activityOutsideStatus.workplaceZipCode')} maxLength={7} error={!!actErr?.workplaceZipCode} />
                </FormField>
                <FormField label="都道府県" error={actErr?.workplacePrefecture?.message}>
                  <Controller
                    name="simultaneousApplication.activityOutsideStatus.workplacePrefecture"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        options={renewalFormOptions.prefectures}
                        value={field.value ?? ''}
                        onChange={(val) => {
                          field.onChange(val);
                          setValue('simultaneousApplication.activityOutsideStatus.workplaceCity', '');
                        }}
                        error={!!actErr?.workplacePrefecture}
                      />
                    )}
                  />
                </FormField>
                <FormField label="市区町村" error={actErr?.workplaceCity?.message}>
                  <Controller
                    name="simultaneousApplication.activityOutsideStatus.workplaceCity"
                    control={control}
                    render={({ field }) => {
                      const selectedPrefecture = watch('simultaneousApplication.activityOutsideStatus.workplacePrefecture');
                      const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                      return (
                        <FormSelect
                          options={cityOptions}
                          {...field}
                          error={!!actErr?.workplaceCity}
                          disabled={!selectedPrefecture || cityOptions.length === 0}
                        />
                      );
                    }}
                  />
                </FormField>
                <FormField label="電話番号" error={actErr?.workplacePhone1?.message}>
                  <FormInput {...register('simultaneousApplication.activityOutsideStatus.workplacePhone1')} error={!!actErr?.workplacePhone1} />
                </FormField>
                <FormField label="業種 1" error={actErr?.workplaceIndustry1?.message}>
                  <FormInput {...register('simultaneousApplication.activityOutsideStatus.workplaceIndustry1')} error={!!actErr?.workplaceIndustry1} />
                </FormField>
              </div>
            </div>
          )}
        </div>

        {/* ─── 就労資格証明書交付申請 ─────────────────────────────────── */}
        <div className="subsection">
          <h3 className="subsection-title">就労資格証明書交付申請</h3>
          <p className="subsection-desc">
            在留期間更新許可後の就労資格を証明する証明書の交付を同時申請する場合に選択してください。
          </p>
          <div className="form-grid form-grid--2">
            <FormField
              label="就労資格証明書交付申請を同時に行いますか？"
              error={sim?.applyForAuthEmployment?.message}
            >
              <Controller
                name="simultaneousApplication.applyForAuthEmployment"
                control={control}
                render={({ field }) => (
                  <FormRadioGroup
                    name="simultaneousApplication.applyForAuthEmployment"
                    options={[
                      { value: 'false', label: '申請しない' },
                      { value: 'true', label: '同時申請する' },
                    ]}
                    value={String(field.value ?? 'false')}
                    onChange={(v) => field.onChange(v === 'true')}
                    error={!!sim?.applyForAuthEmployment}
                  />
                )}
              />
            </FormField>
          </div>

          {applyForAuthEmployment && (
            <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>就労資格証明書交付申請 - 詳細情報</h4>
              
              <div className="form-grid form-grid--1">
                <FormField label="証明を希望する活動の内容" error={authErr?.certificationActivityDescription?.message}>
                  <FormTextarea {...register('simultaneousApplication.authEmploymentCert.certificationActivityDescription')} error={!!authErr?.certificationActivityDescription} />
                </FormField>
              </div>

              <div className="form-grid form-grid--2" style={{ marginTop: '1rem' }}>
                <FormField label="就労する期間(始期)" error={authErr?.employmentPeriodStart?.message}>
                  <FormInput type="date" {...register('simultaneousApplication.authEmploymentCert.employmentPeriodStart')} error={!!authErr?.employmentPeriodStart} />
                </FormField>
                <FormField label="就労する期間(終期)" error={authErr?.employmentPeriodEnd?.message}>
                  <FormInput type="date" {...register('simultaneousApplication.authEmploymentCert.employmentPeriodEnd')} error={!!authErr?.employmentPeriodEnd} />
                </FormField>
              </div>

              <div className="form-grid form-grid--1" style={{ marginTop: '1rem' }}>
                <FormField label="使用目的" error={authErr?.purpose?.message}>
                  <FormTextarea {...register('simultaneousApplication.authEmploymentCert.purpose')} error={!!authErr?.purpose} />
                </FormField>
              </div>
            </div>
          )}
        </div>

        <div className="subsection">
          <div className="info-box">
            <p className="info-box-text">
              ※ 同時申請を行う場合、別途それぞれの申請書および必要書類が必要となります。詳細は担当行政書士にご確認ください。
            </p>
          </div>
        </div>

      </fieldset>
    </div>
  );
}
