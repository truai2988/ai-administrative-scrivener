'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { Plus, Trash2, User, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import type { RenewalApplicationFormData, AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';
import type { GlobalLimitContext } from '@/lib/utils/fileUtils';
import {
  DESIRED_STAY_PERIOD_OPTIONS,
  SKILL_CERT_METHOD_OPTIONS,
  SPECIFIC_SKILL_CATEGORY_OPTIONS,
} from '@/types/renewalApplication';
import { FormField } from '../ui/FormField';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormRadioGroup } from '../ui/FormRadio';
import { FormTextarea } from '../ui/FormTextarea';
import { SharedFileUploader } from '@/components/ui/SharedFileUploader';
import { useOcrExtract } from '@/hooks/useOcrExtract';

interface ForeignerInfoSectionProps {
  isEditable?: boolean;
  applicationId?: string;
  initialAttachments?: AttachmentMeta[];
  globalLimitContext?: GlobalLimitContext;
}

export function ForeignerInfoSection({
  isEditable = true,
  applicationId,
  initialAttachments,
  globalLimitContext,
}: ForeignerInfoSectionProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RenewalApplicationFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'foreignerInfo.relatives',
  });

  const info = errors.foreignerInfo;
  const desiredStayPeriod = watch('foreignerInfo.desiredStayPeriod');
  const criminalRecord = watch('foreignerInfo.criminalRecord');
  const depositCharged = watch('foreignerInfo.depositCharged');
  const feeCharged = watch('foreignerInfo.feeCharged');
  const hasResidenceCard = watch('foreignerInfo.hasResidenceCard');
  const hasRelatives = watch('foreignerInfo.hasRelatives');
  const skillMethod = watch('foreignerInfo.skillCertifications.0.method');
  const langMethod = watch('foreignerInfo.languageCertifications.0.method');

  // 書類ファーストワークフローの制御
  const [isManualInputEnabled, setIsManualInputEnabled] = useState(false);
  const watchedAttachments = useWatch({ control, name: 'attachments.foreignerInfo' });
  const attachments = useMemo(
    () => watchedAttachments || initialAttachments || [],
    [watchedAttachments, initialAttachments]
  );
  const hasAttachments = attachments.length > 0;
  
  // 編集モードかつ（書類が添付されている OR 手動入力がオン）の場合のみフィールドを有効化
  const isFieldsEnabled = isEditable && (hasAttachments || isManualInputEnabled);

  // --- OCR 関連 state ---
  const { runOcr, isOcring, ocrResult, ocrError } = useOcrExtract();
  // OCR で自動入力されたフィールドのパス集合（ハイライト用）
  const [ocrHighlightedFields, setOcrHighlightedFields] = useState<Set<string>>(new Set());
  // ハイライトを一定時間後に消すタイマー
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 新しいファイルがアップロードされたとき（onAttachmentsChange で呼ばれる）に
   * OCR を走らせ、結果をフォームに反映する。
   */
  const handleAttachmentsChange = useCallback(
    async (updatedAttachments: AttachmentMeta[]) => {
      // 新しく追加されたファイルのみ対象（最後尾の要素）
      const prevCount = (attachments as AttachmentMeta[]).length;
      const newFile = updatedAttachments[updatedAttachments.length - 1];
      if (!newFile || updatedAttachments.length <= prevCount) return;

      // PDF はスキップ（スキャン画像のみ対象）
      if (newFile.mimeType === 'application/pdf') return;

      const result = await runOcr({
        storagePath: newFile.path,
        mimeType: newFile.mimeType,
      });

      if (!result || !result.formData) return;

      // フォームに setValue
      const newHighlights = new Set<string>();
      for (const [key, value] of Object.entries(result.formData) as [keyof RenewalApplicationFormData['foreignerInfo'], string][]) {
        if (value !== undefined && value !== '') {
          setValue(`foreignerInfo.${key}` as Parameters<typeof setValue>[0], value, { shouldValidate: true });
          newHighlights.add(`foreignerInfo.${key}`);
        }
      }

      // ハイライト適用（3秒後に自動解除）
      setOcrHighlightedFields(newHighlights);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setOcrHighlightedFields(new Set());
      }, 6000);
    },
    [attachments, runOcr, setValue]
  );

  /** フィールドが OCR で自動入力されたかを判定するヘルパー */
  const isOcrFilled = (fieldPath: string) => ocrHighlightedFields.has(fieldPath);

  return (
    <div className={`section-container${!isEditable ? ' section-container--readonly' : ''}`}>
      {!isEditable && (
        <div className="section-readonly-banner">
          🔒 このセクションは閲覧のみです。自分の担当のタブのみ編集できます。
        </div>
      )}
      
      <div className="section-header">
        <User size={20} className="section-icon" />
        <h2 className="section-title">外国人本人情報</h2>
        <p className="section-desc">申請人等作成用（1〜3）に対応する項目です</p>
      </div>

      {/* ─── 添付書類 (最上部配置) ────────────────────────────────────────── */}
      <div className="subsection subsection--attachments">
        <SharedFileUploader
          applicationId={applicationId}
          attachmentKey="foreignerInfo"
          tabLabel="外国人本人"
          initialAttachments={initialAttachments}
          readonly={!isEditable}
          globalLimitContext={globalLimitContext}
          onAttachmentsChange={handleAttachmentsChange}
          hints={[
            'パスポート顔写真ページ',
            '在留カード（表面）',
            '在留カード（裏面）',
            '課税証明書',
            '合格証明書（技能・日本語）',
            '在日親族の在留カード',
          ]}
        />

        {/* OCR バナー */}
        {isOcring && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginTop: '0.75rem', padding: '0.75rem 1rem',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '0.5rem', color: '#4f46e5', fontSize: '0.85rem'
          }}>
            <Sparkles size={15} style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            <span>AIが書類を読み取っています…少しお待ちください</span>
          </div>
        )}

        {ocrResult && ocrHighlightedFields.size > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            marginTop: '0.75rem', padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '0.5rem', color: '#059669', fontSize: '0.85rem'
          }}>
            <CheckCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: 700 }}>OCR自動入力完了</span>
              <span>　{ocrResult.extractedFields.length}項目を抽出しました（信頼度 {Math.round(ocrResult.confidence * 100)}%）。</span>
              <br />
              <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>青くハイライトされている欄を目視確認してください。</span>
            </div>
          </div>
        )}

        {ocrError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginTop: '0.75rem', padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.07)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.85rem'
          }}>
            <AlertCircle size={15} />
            <span>OCR読み取り失敗: {ocrError}（手動で入力してください）</span>
          </div>
        )}
        
        {isEditable && !hasAttachments && (
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

      {/* ─── ① 基本属性 ─────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">基本情報</h3>
        <div className="form-grid form-grid--3">
          <FormField label="国籍・地域" required error={info?.nationality?.message}>
            <FormInput
              {...register('foreignerInfo.nationality')}
              placeholder="例: 中国"
              error={!!info?.nationality}
              style={isOcrFilled('foreignerInfo.nationality') ? { background: '#eff6ff', borderColor: '#93c5fd', transition: 'background 0.5s' } : undefined}
            />
          </FormField>

          <FormField label="生年月日" required error={info?.birthDate?.message}>
            <FormInput
              type="date"
              {...register('foreignerInfo.birthDate')}
              error={!!info?.birthDate}
              style={isOcrFilled('foreignerInfo.birthDate') ? { background: '#eff6ff', borderColor: '#93c5fd', transition: 'background 0.5s' } : undefined}
            />
          </FormField>

          <FormField label="性別" required error={info?.gender?.message}>
            <Controller
              name="foreignerInfo.gender"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.gender"
                  options={[
                    { value: 'male', label: '男' },
                    { value: 'female', label: '女' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  error={!!info?.gender}
                />
              )}
            />
          </FormField>

          <FormField
            label="氏名（ローマ字）"
            required
            hint="例: KOU OTUHEI（姓・名の順）"
            error={info?.nameEn?.message}
          >
            <FormInput
              {...register('foreignerInfo.nameEn')}
              placeholder="例: KOU OTUHEI"
              error={!!info?.nameEn}
              style={isOcrFilled('foreignerInfo.nameEn') ? { background: '#eff6ff', borderColor: '#93c5fd', transition: 'background 0.5s' } : undefined}
            />
          </FormField>

          <FormField
            label="氏名（漢字など母国語）"
            hint="母国語での氏名（任意）"
            error={info?.nameKanji?.message}
          >
            <FormInput
              {...register('foreignerInfo.nameKanji')}
              placeholder="例: 甲 乙丙"
              error={!!info?.nameKanji}
            />
          </FormField>

          <FormField label="配偶者の有無" required error={info?.maritalStatus?.message}>
            <Controller
              name="foreignerInfo.maritalStatus"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.maritalStatus"
                  options={[
                    { value: 'married', label: '有' },
                    { value: 'unmarried', label: '無' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  error={!!info?.maritalStatus}
                />
              )}
            />
          </FormField>

          <FormField label="職業" required error={info?.occupation?.message}>
            <FormInput
              {...register('foreignerInfo.occupation')}
              placeholder="例: 溶接工"
              error={!!info?.occupation}
            />
          </FormField>
        </div>
      </div>

      {/* ─── ② 住所・連絡先 ──────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">居住地・連絡先</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="日本における居住地"
            required
            hint="都道府県〜マンション名まで"
            error={info?.japanAddress?.message}
          >
            <FormInput
              {...register('foreignerInfo.japanAddress')}
              placeholder="例: 〇〇県〇〇市〇〇町1-2-3 〇〇マンション101号"
              error={!!info?.japanAddress}
            />
          </FormField>

          <FormField
            label="本国における居住地"
            required
            error={info?.homeCountryAddress?.message}
          >
            <FormInput
              {...register('foreignerInfo.homeCountryAddress')}
              placeholder="例: 〇〇省〇〇市〇〇区..."
              error={!!info?.homeCountryAddress}
            />
          </FormField>

          <FormField
            label="電話番号"
            required
            hint="ハイフンなし 例: 0312345678"
            error={info?.phoneNumber?.message}
          >
            <FormInput
              {...register('foreignerInfo.phoneNumber')}
              type="tel"
              placeholder="0312345678"
              error={!!info?.phoneNumber}
            />
          </FormField>

          <FormField
            label="携帯電話番号"
            hint="ハイフンなし 例: 09012345678（任意）"
            error={info?.mobileNumber?.message}
          >
            <FormInput
              {...register('foreignerInfo.mobileNumber')}
              type="tel"
              placeholder="09012345678"
              error={!!info?.mobileNumber}
            />
          </FormField>
        </div>
      </div>

      {/* ─── ③ 旅券情報 ──────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">旅券（パスポート）情報</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="旅券番号"
            required
            hint="例: G123456789"
            error={info?.passportNumber?.message}
          >
            <FormInput
              {...register('foreignerInfo.passportNumber')}
              placeholder="G123456789"
              error={!!info?.passportNumber}
            />
          </FormField>

          <FormField label="旅券有効期限" required error={info?.passportExpiryDate?.message}>
            <FormInput
              type="date"
              {...register('foreignerInfo.passportExpiryDate')}
              error={!!info?.passportExpiryDate}
            />
          </FormField>
        </div>
      </div>

      {/* ─── ④ 在留情報 ──────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">現在の在留情報</h3>
        <div className="form-grid form-grid--3">
          <FormField
            label="現に有する在留資格"
            required
            error={info?.currentResidenceStatus?.message}
          >
            <FormInput
              {...register('foreignerInfo.currentResidenceStatus')}
              placeholder="例: 特定技能"
              error={!!info?.currentResidenceStatus}
              style={isOcrFilled('foreignerInfo.currentResidenceStatus') ? { background: '#eff6ff', borderColor: '#93c5fd', transition: 'background 0.5s' } : undefined}
            />
          </FormField>

          <FormField label="在留期間" required error={info?.currentStayPeriod?.message}>
            <FormInput
              {...register('foreignerInfo.currentStayPeriod')}
              placeholder="例: 1年"
              error={!!info?.currentStayPeriod}
            />
          </FormField>

          <FormField label="在留期間の満了日" required error={info?.stayExpiryDate?.message}>
            <FormInput
              type="date"
              {...register('foreignerInfo.stayExpiryDate')}
              error={!!info?.stayExpiryDate}
              style={isOcrFilled('foreignerInfo.stayExpiryDate') ? { background: '#eff6ff', borderColor: '#93c5fd', transition: 'background 0.5s' } : undefined}
            />
          </FormField>

          <FormField
            label="在留カードの有無"
            required
            error={info?.hasResidenceCard?.message}
          >
            <Controller
              name="foreignerInfo.hasResidenceCard"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.hasResidenceCard"
                  options={[
                    { value: 'true', label: '有' },
                    { value: 'false', label: '無' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.hasResidenceCard}
                />
              )}
            />
          </FormField>

          {hasResidenceCard && (
            <FormField
              label="在留カード番号"
              required
              hint="英2桁+数8桁+英2桁 例: AB12345678CD"
              error={info?.residenceCardNumber?.message}
            >
              <FormInput
                {...register('foreignerInfo.residenceCardNumber')}
                placeholder="AB12345678CD"
                error={!!info?.residenceCardNumber}
                style={isOcrFilled('foreignerInfo.residenceCardNumber') ? { background: '#eff6ff', borderColor: '#93c5fd', transition: 'background 0.5s' } : undefined}
              />
            </FormField>
          )}
        </div>
      </div>

      {/* ─── ⑤ 申請内容 ──────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">更新申請内容</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="希望する在留期間"
            required
            error={info?.desiredStayPeriod?.message}
          >
            <Controller
              name="foreignerInfo.desiredStayPeriod"
              control={control}
              render={({ field }) => (
                <FormSelect
                  options={DESIRED_STAY_PERIOD_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  error={!!info?.desiredStayPeriod}
                />
              )}
            />
          </FormField>

          {desiredStayPeriod === 'other' && (
            <FormField
              label="希望する在留期間（具体的に）"
              required
              error={info?.desiredStayPeriodOther?.message}
            >
              <FormInput
                {...register('foreignerInfo.desiredStayPeriodOther')}
                placeholder="例: 3年"
                error={!!info?.desiredStayPeriodOther}
              />
            </FormField>
          )}
        </div>

        <FormField
          label="在留期間更新の理由"
          required
          hint="10文字以上で入力してください"
          error={info?.renewalReason?.message}
        >
          <FormTextarea
            {...register('foreignerInfo.renewalReason')}
            rows={4}
            placeholder="例: 1号特定技能外国人として継続して就労するため"
            error={!!info?.renewalReason}
          />
        </FormField>
      </div>

      {/* ─── ⑥ 犯罪歴 ───────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">犯罪・違反歴</h3>
        <FormField
          label="犯罪を理由とする処分を受けたことの有無（日本国外を含む）"
          required
          error={info?.criminalRecord?.message}
        >
          <Controller
            name="foreignerInfo.criminalRecord"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="foreignerInfo.criminalRecord"
                options={[
                  { value: 'false', label: '無' },
                  { value: 'true', label: '有' },
                ]}
                value={String(field.value ?? '')}
                onChange={(v) => field.onChange(v === 'true')}
                error={!!info?.criminalRecord}
              />
            )}
          />
        </FormField>

        {criminalRecord && (
          <FormField
            label="犯罪歴の詳細"
            required
            error={info?.criminalRecordDetail?.message}
          >
            <FormTextarea
              {...register('foreignerInfo.criminalRecordDetail')}
              rows={3}
              placeholder="犯罪・処分の内容を記入してください"
              error={!!info?.criminalRecordDetail}
            />
          </FormField>
        )}
      </div>

      {/* ─── ⑦ 特定技能固有 ──────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">特定技能に関する事項</h3>

        <FormField
          label="特定技能の区分"
          required
          error={info?.specificSkillCategory?.message}
        >
          <Controller
            name="foreignerInfo.specificSkillCategory"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="foreignerInfo.specificSkillCategory"
                options={SPECIFIC_SKILL_CATEGORY_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                value={field.value}
                onChange={field.onChange}
                error={!!info?.specificSkillCategory}
              />
            )}
          />
        </FormField>

        {/* 技能水準 */}
        <div className="cert-block">
          <p className="cert-block-label">技能水準の証明方法</p>
          <div className="form-grid form-grid--3">
            <FormField
              label="証明方法"
              required
              error={info?.skillCertifications?.[0]?.method?.message}
            >
              <Controller
                name="foreignerInfo.skillCertifications.0.method"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    options={SKILL_CERT_METHOD_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    error={!!info?.skillCertifications?.[0]?.method}
                  />
                )}
              />
            </FormField>

            {skillMethod === 'exam' && (
              <>
                <FormField
                  label="試験名"
                  required
                  error={info?.skillCertifications?.[0]?.examName?.message}
                >
                  <FormInput
                    {...register('foreignerInfo.skillCertifications.0.examName')}
                    placeholder="例: 溶接技能試験"
                    error={!!info?.skillCertifications?.[0]?.examName}
                  />
                </FormField>
                <FormField
                  label="受験地"
                  error={info?.skillCertifications?.[0]?.examLocation?.message}
                >
                  <FormInput
                    {...register('foreignerInfo.skillCertifications.0.examLocation')}
                    placeholder="例: 東京"
                    error={!!info?.skillCertifications?.[0]?.examLocation}
                  />
                </FormField>
              </>
            )}
          </div>
        </div>

        {/* 日本語能力 */}
        <div className="cert-block">
          <p className="cert-block-label">日本語能力の証明方法</p>
          <div className="form-grid form-grid--3">
            <FormField
              label="証明方法"
              required
              error={info?.languageCertifications?.[0]?.method?.message}
            >
              <Controller
                name="foreignerInfo.languageCertifications.0.method"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    options={SKILL_CERT_METHOD_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    error={!!info?.languageCertifications?.[0]?.method}
                  />
                )}
              />
            </FormField>

            {langMethod === 'exam' && (
              <>
                <FormField
                  label="試験名"
                  required
                  error={info?.languageCertifications?.[0]?.examName?.message}
                >
                  <FormInput
                    {...register('foreignerInfo.languageCertifications.0.examName')}
                    placeholder="例: 日本語能力試験 N4"
                    error={!!info?.languageCertifications?.[0]?.examName}
                  />
                </FormField>
                <FormField
                  label="受験地"
                  error={info?.languageCertifications?.[0]?.examLocation?.message}
                >
                  <FormInput
                    {...register('foreignerInfo.languageCertifications.0.examLocation')}
                    placeholder="例: 上海"
                    error={!!info?.languageCertifications?.[0]?.examLocation}
                  />
                </FormField>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── ⑧ 保証金・費用 ──────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">保証金・費用の支払</h3>
        <div className="form-grid form-grid--2">
          <FormField
            label="保証金・担保の提供に係る契約"
            required
            error={info?.depositCharged?.message}
          >
            <Controller
              name="foreignerInfo.depositCharged"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.depositCharged"
                  options={[
                    { value: 'false', label: '無' },
                    { value: 'true', label: '有' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.depositCharged}
                />
              )}
            />
          </FormField>

          {depositCharged && (
            <>
              <FormField label="徴収・管理機関名" error={info?.depositOrganizationName?.message}>
                <FormInput
                  {...register('foreignerInfo.depositOrganizationName')}
                  placeholder="機関名"
                  error={!!info?.depositOrganizationName}
                />
              </FormField>
              <FormField label="保証金の金額（円）" error={info?.depositAmount?.message}>
                <FormInput
                  type="number"
                  {...register('foreignerInfo.depositAmount', { valueAsNumber: true })}
                  placeholder="0"
                  error={!!info?.depositAmount}
                />
              </FormField>
            </>
          )}

          <FormField
            label="費用の支払に係る契約"
            required
            error={info?.feeCharged?.message}
          >
            <Controller
              name="foreignerInfo.feeCharged"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.feeCharged"
                  options={[
                    { value: 'false', label: '無' },
                    { value: 'true', label: '有' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.feeCharged}
                />
              )}
            />
          </FormField>

          {feeCharged && (
            <>
              <FormField label="外国の機関名" error={info?.foreignOrganizationName?.message}>
                <FormInput
                  {...register('foreignerInfo.foreignOrganizationName')}
                  placeholder="機関名"
                  error={!!info?.foreignOrganizationName}
                />
              </FormField>
              <FormField label="費用の金額（円）" error={info?.feeAmount?.message}>
                <FormInput
                  type="number"
                  {...register('foreignerInfo.feeAmount', { valueAsNumber: true })}
                  placeholder="0"
                  error={!!info?.feeAmount}
                />
              </FormField>
            </>
          )}
        </div>
      </div>

      {/* ─── ⑨ 在日親族・同居者 ─────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">在日親族・同居者</h3>

        <FormField
          label="在日親族・同居者の有無"
          required
          error={info?.hasRelatives?.message}
        >
          <Controller
            name="foreignerInfo.hasRelatives"
            control={control}
            render={({ field }) => (
              <FormRadioGroup
                name="foreignerInfo.hasRelatives"
                options={[
                  { value: 'false', label: '無' },
                  { value: 'true', label: '有' },
                ]}
                value={String(field.value ?? 'false')}
                onChange={(v) => field.onChange(v === 'true')}
                error={!!info?.hasRelatives}
              />
            )}
          />
        </FormField>

        {hasRelatives && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="subsection-header-row mb-4">
              <h4 className="text-sm font-bold text-slate-700">登録済み親族・同居者</h4>
              <button
                type="button"
                className="btn-add"
                onClick={() =>
                  append({
                    relationship: '',
                    name: '',
                    birthDate: '',
                    nationality: '',
                    cohabitation: false,
                    workplace: '',
                    residenceCardNumber: '',
                  })
                }
              >
                <Plus size={16} />
                追加
              </button>
            </div>

            {fields.length === 0 && (
              <p className="empty-list-hint">
                在日親族・同居者がいる場合は「追加」ボタンから入力してください
              </p>
            )}

            {fields.map((field, index) => {
              const rel = info?.relatives?.[index];
              return (
                <div key={field.id} className="relative-row">
                  <div className="relative-row-header">
                    <span className="relative-row-number">同居者 #{index + 1}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={14} />
                      削除
                    </button>
                  </div>
                  <div className="form-grid form-grid--3">
                    <FormField label="続柄" required error={rel?.relationship?.message}>
                      <FormInput
                        {...register(`foreignerInfo.relatives.${index}.relationship`)}
                        placeholder="例: 配偶者"
                        error={!!rel?.relationship}
                      />
                    </FormField>
                    <FormField label="氏名" required error={rel?.name?.message}>
                      <FormInput
                        {...register(`foreignerInfo.relatives.${index}.name`)}
                        placeholder="氏名"
                        error={!!rel?.name}
                      />
                    </FormField>
                    <FormField label="生年月日" required error={rel?.birthDate?.message}>
                      <FormInput
                        type="date"
                        {...register(`foreignerInfo.relatives.${index}.birthDate`)}
                        error={!!rel?.birthDate}
                      />
                    </FormField>
                    <FormField label="国籍・地域" required error={rel?.nationality?.message}>
                      <FormInput
                        {...register(`foreignerInfo.relatives.${index}.nationality`)}
                        placeholder="例: ブラジル"
                        error={!!rel?.nationality}
                      />
                    </FormField>
                    <FormField label="勤務先・通学先" error={rel?.workplace?.message}>
                      <FormInput
                        {...register(`foreignerInfo.relatives.${index}.workplace`)}
                        placeholder="例: 〇〇小学校"
                        error={!!rel?.workplace}
                      />
                    </FormField>
                    <FormField
                      label="在留カード番号（任意）"
                      error={rel?.residenceCardNumber?.message}
                    >
                      <FormInput
                        {...register(`foreignerInfo.relatives.${index}.residenceCardNumber`)}
                        placeholder="AB12345678CD"
                        error={!!rel?.residenceCardNumber}
                      />
                    </FormField>
                    <FormField label="同居の有無" error={rel?.cohabitation?.message}>
                      <Controller
                        name={`foreignerInfo.relatives.${index}.cohabitation`}
                        control={control}
                        render={({ field: f }) => (
                          <FormRadioGroup
                            name={`relatives-cohabitation-${index}`}
                            options={[
                              { value: 'true', label: '同居' },
                              { value: 'false', label: '別居' },
                            ]}
                            value={String(f.value ?? '')}
                            onChange={(v) => f.onChange(v === 'true')}
                            error={!!rel?.cohabitation}
                          />
                        )}
                      />
                    </FormField>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </fieldset>
    </div>
  );
}
