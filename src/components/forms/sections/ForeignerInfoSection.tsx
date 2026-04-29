'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { Plus, Trash2, User, Sparkles, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { RenewalApplicationFormData, AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';
import type { GlobalLimitContext } from '@/lib/utils/fileUtils';

import { FormField } from '../ui/FormField';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormRadioGroup } from '../ui/FormRadio';
import { FormTextarea } from '../ui/FormTextarea';

import { useOcrExtract } from '@/hooks/useOcrExtract';
import { useAuth } from '@/contexts/AuthContext';
import { renewalFormOptions, getStayPeriodByStatus, getTechnicalInternWorkOptions } from '@/lib/constants/renewalFormOptions';

// ═══════════════════════════════════════════════════════════════════════
// 技能実習2号良好修了記録の1行コンポーネント（カスケード連動）
// 職種を選択すると、対応する作業一覧が連動で絞り込まれる
// ═══════════════════════════════════════════════════════════════════════
function InternRecordRow({
  idx,
  rec,
  control,
  register,
  watch,
  setValue,
  onRemove,
}: {
  idx: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rec: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
  onRemove: () => void;
}) {
  const selectedJobType = watch(`foreignerInfo.technicalInternRecords.${idx}.jobType`);
  const workOptions = useMemo(() => getTechnicalInternWorkOptions(selectedJobType), [selectedJobType]);

  // 職種が変わったら作業をリセット
  const prevJobRef = useRef(selectedJobType);
  useEffect(() => {
    if (prevJobRef.current !== selectedJobType && prevJobRef.current !== undefined) {
      setValue(`foreignerInfo.technicalInternRecords.${idx}.workType`, '');
    }
    prevJobRef.current = selectedJobType;
  }, [selectedJobType, setValue, idx]);

  return (
    <div className="relative-row">
      <div className="relative-row-header">
        <span className="relative-row-number">記録 #{idx + 1}</span>
        <button type="button" className="btn-remove" onClick={onRemove}>
          <Trash2 size={14} /> 削除
        </button>
      </div>
      <div className="form-grid form-grid--3">
        <FormField label="職種" error={(rec as {jobType?: {message?: string}} | undefined)?.jobType?.message}>
          <Controller
            name={`foreignerInfo.technicalInternRecords.${idx}.jobType`}
            control={control}
            render={({ field }) => (
              <FormSelect
                options={renewalFormOptions.technicalInternOccupation}
                {...field}
                error={!!(rec as {jobType?: unknown} | undefined)?.jobType}
                placeholder="職種を選択"
              />
            )}
          />
        </FormField>
        <FormField label="作業" error={(rec as {workType?: {message?: string}} | undefined)?.workType?.message}>
          <Controller
            name={`foreignerInfo.technicalInternRecords.${idx}.workType`}
            control={control}
            render={({ field }) => (
              <FormSelect
                options={workOptions}
                {...field}
                error={!!(rec as {workType?: unknown} | undefined)?.workType}
                disabled={!selectedJobType || workOptions.length === 0}
                placeholder={selectedJobType ? '作業を選択' : '先に職種を選択してください'}
              />
            )}
          />
        </FormField>
        <FormField label="良好修了の証明" error={(rec as {completionProof?: {message?: string}} | undefined)?.completionProof?.message}>
          <FormInput
            {...register(`foreignerInfo.technicalInternRecords.${idx}.completionProof`)}
            placeholder="例: 技能実習評価試験 専門級合格"
            error={!!(rec as {completionProof?: unknown} | undefined)?.completionProof}
          />
        </FormField>
      </div>
    </div>
  );
}

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
    getValues,
    formState: { errors },
  } = useFormContext<RenewalApplicationFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'foreignerInfo.relatives',
  });

  const {
    fields: internFields,
    append: appendIntern,
    remove: removeIntern,
  } = useFieldArray({
    control,
    name: 'foreignerInfo.technicalInternRecords',
  });

  const info = errors.foreignerInfo;
  const desiredStayPeriod = watch('foreignerInfo.desiredStayPeriod');
  const criminalRecord = watch('foreignerInfo.criminalRecord');
  const depositCharged = watch('foreignerInfo.depositCharged');
  const feeCharged = watch('foreignerInfo.feeCharged');
  const hasResidenceCard = watch('foreignerInfo.hasResidenceCard');
  const hasRelatives = watch('foreignerInfo.hasRelatives');
  const skillMethod = watch('foreignerInfo.skillCertifications.0.method');

  // ─ カスケード連動: 在留資格→在留期間 ─
  const currentResStatus = watch('foreignerInfo.currentResidenceStatus');
  const currentStayPeriod = watch('foreignerInfo.currentStayPeriod');
  const stayPeriodOptions = useMemo(() => getStayPeriodByStatus(currentResStatus), [currentResStatus]);
  // フォールバック: 既存値がマスタ選択肢に含まれないならテキスト入力にする
  const stayPeriodNeedsFallback = useMemo(() => {
    if (!currentStayPeriod) return false;
    if (stayPeriodOptions.length === 0) return true;
    return !stayPeriodOptions.some(o => o.value === currentStayPeriod);
  }, [currentStayPeriod, stayPeriodOptions]);

  // 在留資格が変更されたら在留期間をリセット
  const prevResStatusRef = useRef(currentResStatus);
  useEffect(() => {
    if (prevResStatusRef.current !== currentResStatus && prevResStatusRef.current !== undefined) {
      setValue('foreignerInfo.currentStayPeriod', '');
    }
    prevResStatusRef.current = currentResStatus;
  }, [currentResStatus, setValue]);
  const langMethod = watch('foreignerInfo.languageCertifications.0.method');

  // 代理人・取次者 アコーディオン状態
  const [showAgent, setShowAgent] = useState(false);
  const [showAgencyRep, setShowAgencyRep] = useState(false);

  // 書類ファーストワークフローの制御
  const [isManualInputEnabled, setIsManualInputEnabled] = useState(false);
  const watchedAttachments = useWatch({ control, name: 'attachments.foreignerInfo' });
  const attachments = useMemo(
    () => watchedAttachments || initialAttachments || [],
    [watchedAttachments, initialAttachments]
  );
  const hasAttachments = attachments.length > 0;
  
  // 行政書士・本部は手動入力を常に許可する
  const { currentUser } = useAuth();
  const hasFullAccess = currentUser?.role === 'scrivener' || currentUser?.role === 'hq_admin';
  
  // 編集モードかつ（書類が添付されている OR 手動入力がオン OR フルアクセス権限）の場合のみフィールドを有効化
  const isFieldsEnabled = isEditable && (hasAttachments || isManualInputEnabled || hasFullAccess);

  // --- OCR 関連 state ---
  const { runOcr, isOcring, ocrResult, ocrError } = useOcrExtract();
  // OCR で自動入力されたフィールドのパス集合（ハイライト用）
  const [ocrHighlightedFields, setOcrHighlightedFields] = useState<Set<string>>(new Set());
  
  // OCR で抽出されたフィールドの記録（削除時にそのファイルが読み込んだ項目をクリアするため）
  type FileOcrData = {
    filePath: string;
    extractedPaths: string[]; // このファイルが抽出・反映した全フィールド
  };
  const fileOcrDataRef = useRef<FileOcrData[]>([]);

  /**
   * 新しいファイルがアップロードされたとき（onAttachmentsChange で呼ばれる）に
   * OCR を走らせ、結果をフォームに反映する。
   */
  const handleAttachmentsChange = useCallback(
    async (updatedAttachments: AttachmentMeta[]) => {
      // getValuesを使って常にreact-hook-formが持つ最新の状態から前回値を取得する
      const prevAttachments = getValues('attachments.foreignerInfo') || [];
      const prevCount = prevAttachments.length;
      
      // 更新がなくても setValue で react-hook-form に同期しておく
      setValue('attachments.foreignerInfo', updatedAttachments);

      // ファイルが削除された場合のクリア処理
      if (updatedAttachments.length < prevCount) {
        const currentPaths = new Set(updatedAttachments.map(a => a.path));
        const deletedData = fileOcrDataRef.current.filter(b => !currentPaths.has(b.filePath));
        const remainingData = fileOcrDataRef.current.filter(b => currentPaths.has(b.filePath));
        
        // 記録配列から削除されたファイル分を取り除く
        fileOcrDataRef.current = remainingData;

        // 残存しているファイルが抽出したパスを収集（これらはクリアしてはいけない）
        const activeExtractedPaths = new Set<string>();
        remainingData.forEach(data => {
          data.extractedPaths.forEach(p => activeExtractedPaths.add(p));
        });

        // 削除されたファイルが読み取ったフィールドのうち、他生存ファイルが触っていないもののみ空にする
        deletedData.forEach(data => {
          data.extractedPaths.forEach(path => {
            if (!activeExtractedPaths.has(path)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue(path as any, '', { shouldValidate: true, shouldDirty: true });
            }
          });
        });
        
        setOcrHighlightedFields(activeExtractedPaths);
        return;
      }

      const newFile = updatedAttachments[updatedAttachments.length - 1];
      if (!newFile || updatedAttachments.length <= prevCount) return;

      const result = await runOcr({
        storagePath: newFile.path,
        mimeType: newFile.mimeType,
      });

      if (!result || !result.formData) {
        return;
      }

      const entries = Object.entries(result.formData);
      if (entries.length === 0) {
        alert('画像から情報を読み取れませんでした。画質が悪いか、対応していない形式の可能性があります。');
        return;
      }

      // ファイル単位での抽出データ記録オブジェクトを作成
      const ocrDataForFile: FileOcrData = {
        filePath: newFile.path,
        extractedPaths: []
      };

      // フォームに setValue
      const newHighlights = new Set<string>();
      for (const [key, value] of entries as [keyof RenewalApplicationFormData['foreignerInfo'], string][]) {
        if (value !== undefined && value !== '') {
          const fieldPath = `foreignerInfo.${key}`;
          
          ocrDataForFile.extractedPaths.push(fieldPath);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue(fieldPath as any, value, { shouldValidate: true, shouldDirty: true });
          newHighlights.add(fieldPath);
        }
      }

      // 抽出したフィールドがあれば記録を積む
      if (ocrDataForFile.extractedPaths.length > 0) {
        fileOcrDataRef.current.push(ocrDataForFile);
      }

      // ハイライト適用（解除タイマーは使用せず、永続化する）
      setOcrHighlightedFields(newHighlights);
    },
    [getValues, runOcr, setValue]
  );

  /** フィールドが OCR で自動入力されたかを判定するヘルパー */
  const isOcrFilled = (fieldPath: string) => ocrHighlightedFields.has(fieldPath);

  // 画面上に表示されない内部データ（住所分割情報など）を除外してカウントする
  // ユーザーが視認できる入力欄のハイライト数とカウントを一致させるため。
  const visibleExtractedCount = React.useMemo(() => {
    if (!ocrResult) return 0;
    const hiddenFields = [
      'foreignerInfo.japanZipCode',
      'foreignerInfo.japanPrefecture',
      'foreignerInfo.japanCity',
      'foreignerInfo.japanAddressLines',
    ];
    return ocrResult.extractedFields.filter(f => !hiddenFields.includes(f.fieldPath)).length;
  }, [ocrResult]);

  const highlightSelectors = Array.from(ocrHighlightedFields)
    .map((name) => `[name="${name}"]`)
    .join(', ');

  const highlightStyles = ocrHighlightedFields.size > 0 ? (
    <style>{`
      ${highlightSelectors} {
        border-color: #3b82f6 !important;
        border-width: 2px !important;
        background-color: transparent !important;
      }
    `}</style>
  ) : null;

  return (
    <div className={`section-container${!isEditable ? ' section-container--readonly' : ''}`}>
      {highlightStyles}
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
              <span>　{visibleExtractedCount}項目を抽出しました（信頼度 {Math.round(ocrResult.confidence * 100)}%）。</span>
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

      {/* ─── ① 基本属性 ─────────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">基本情報</h3>
        <div className="form-grid form-grid--3">
          <FormField label="国籍・地域" required error={info?.nationality?.message}>
            <Controller
              name="foreignerInfo.nationality"
              control={control}
              render={({ field }) => (
                <FormSelect
                  options={renewalFormOptions.nationality}
                  {...field}
                  error={!!info?.nationality}
                  style={isOcrFilled('foreignerInfo.nationality') ? { background: 'transparent', borderColor: '#3b82f6', borderStyle: 'solid', borderWidth: '2px' } : undefined}
                />
              )}
            />
          </FormField>

          <FormField label="生年月日" required error={info?.birthDate?.message}>
            <FormInput
              type="date"
              {...register('foreignerInfo.birthDate')}
              error={!!info?.birthDate}
            />
          </FormField>

          <FormField label="性別" required error={info?.gender?.message}>
            <Controller
              name="foreignerInfo.gender"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  
                  options={renewalFormOptions.gender}
                  {...field}
                  error={!!info?.gender}
                  isOcrHighlighted={isOcrFilled('foreignerInfo.gender')}
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
                  
                  options={renewalFormOptions.maritalStatus}
                  {...field}
                  error={!!info?.maritalStatus}
                  isOcrHighlighted={isOcrFilled('foreignerInfo.maritalStatus')}
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
            label="郵便番号"
            hint="7桁・ハイフンなし"
            error={info?.japanZipCode?.message}
          >
            <FormInput
              {...register('foreignerInfo.japanZipCode')}
              placeholder="1000001"
              maxLength={7}
              error={!!info?.japanZipCode}
            />
          </FormField>

          <FormField
            label="都道府県"
            required
            error={info?.japanPrefecture?.message}
          >
            <Controller
              name="foreignerInfo.japanPrefecture"
              control={control}
              render={({ field }) => (
                <FormSelect
                  options={renewalFormOptions.prefectures}
                  value={field.value ?? ''}
                  onChange={(val) => {
                    field.onChange(val);
                    // Reset city when prefecture changes
                    setValue('foreignerInfo.japanCity', '');
                  }}
                  error={!!info?.japanPrefecture}
                />
              )}
            />
          </FormField>

          <FormField
            label="市区町村"
            required
            error={info?.japanCity?.message}
          >
            <Controller
              name="foreignerInfo.japanCity"
              control={control}
              render={({ field }) => {
                const selectedPrefecture = watch('foreignerInfo.japanPrefecture');
                const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                return (
                  <FormSelect
                    options={cityOptions}
                    {...field}
                    error={!!info?.japanCity}
                    disabled={!selectedPrefecture || cityOptions.length === 0}
                  />
                );
              }}
            />
          </FormField>

          <FormField
            label="町名丁目番地号等"
            required
            error={info?.japanAddressLines?.message}
          >
            <FormInput
              {...register('foreignerInfo.japanAddressLines')}
              placeholder="例: 芝公園1-1-1"
              error={!!info?.japanAddressLines}
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

          <FormField
            label="メールアドレス"
            hint="任意"
            error={info?.email?.message}
          >
            <FormInput
              type="email"
              {...register('foreignerInfo.email')}
              placeholder="例: email@example.com"
              error={!!info?.email}
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

        <div className="form-grid form-grid--2 mt-4">
          <FormField label="EDカード番号（英字部分）" error={info?.edNumberAlpha?.message}>
            <FormInput
              {...register('foreignerInfo.edNumberAlpha')}
              placeholder="例: AB"
              maxLength={2}
              error={!!info?.edNumberAlpha}
            />
          </FormField>

          <FormField label="EDカード番号（数字部分）" error={info?.edNumberNumeric?.message}>
            <FormInput
              {...register('foreignerInfo.edNumberNumeric')}
              placeholder="例: 12345678"
              error={!!info?.edNumberNumeric}
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
            <Controller
              name="foreignerInfo.currentResidenceStatus"
              control={control}
              render={({ field }) => (
                <FormSelect
                  options={renewalFormOptions.residenceStatus}
                  {...field}
                  error={!!info?.currentResidenceStatus}
                  style={isOcrFilled('foreignerInfo.currentResidenceStatus') ? { background: 'transparent', borderColor: '#3b82f6', borderStyle: 'solid', borderWidth: '2px' } : undefined}
                />
              )}
            />
          </FormField>

          <FormField label="在留期間" required error={info?.currentStayPeriod?.message}>
            {stayPeriodOptions.length > 0 && !stayPeriodNeedsFallback ? (
              <Controller
                name="foreignerInfo.currentStayPeriod"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    options={stayPeriodOptions}
                    {...field}
                    error={!!info?.currentStayPeriod}
                    disabled={!currentResStatus}
                    placeholder={currentResStatus ? '在留期間を選択' : '先に在留資格を選択してください'}
                  />
                )}
              />
            ) : (
              <FormInput
                {...register('foreignerInfo.currentStayPeriod')}
                placeholder={currentResStatus ? '在留期間を入力' : '先に在留資格を選択してください'}
                error={!!info?.currentStayPeriod}
              />
            )}
          </FormField>

          <FormField label="在留期間の満了日" required error={info?.stayExpiryDate?.message}>
            <FormInput
              type="date"
              {...register('foreignerInfo.stayExpiryDate')}
              error={!!info?.stayExpiryDate}
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
                  isOcrHighlighted={isOcrFilled('foreignerInfo.hasResidenceCard')}
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
                    options={renewalFormOptions.desiredStayPeriod}
                    {...field}
                    error={!!info?.desiredStayPeriod}
                    style={isOcrFilled('foreignerInfo.desiredStayPeriod') ? { background: 'transparent', borderColor: '#3b82f6', borderStyle: 'solid', borderWidth: '2px' } : undefined}
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
                isOcrHighlighted={isOcrFilled('foreignerInfo.criminalRecord')}
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

        <div className="form-grid form-grid--2 mb-4">
          <FormField label="特定技能1号 通算年数" error={info?.totalSpecificSkillStayYears?.message}>
            <FormInput
              type="number"
              {...register('foreignerInfo.totalSpecificSkillStayYears', { valueAsNumber: true })}
              placeholder="0"
              error={!!info?.totalSpecificSkillStayYears}
            />
          </FormField>
          <FormField label="通算月数" error={info?.totalSpecificSkillStayMonths?.message}>
            <FormInput
              type="number"
              {...register('foreignerInfo.totalSpecificSkillStayMonths', { valueAsNumber: true })}
              placeholder="0"
              error={!!info?.totalSpecificSkillStayMonths}
            />
          </FormField>
        </div>

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
                
                options={renewalFormOptions.specificSkillCategory}
                {...field}
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
                    options={renewalFormOptions.skillCertMethod}
                    {...field}
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

            <FormField label="その他の技能証明" error={info?.otherSkillCert?.message}>
              <Controller
                name="foreignerInfo.otherSkillCert"
                control={control}
                render={({ field }) => (
                  <FormRadioGroup
                    name="foreignerInfo.otherSkillCert"
                    options={[
                      { value: 'false', label: '無' },
                      { value: 'true', label: '有' },
                    ]}
                    value={String(field.value ?? '')}
                    onChange={(v) => field.onChange(v === 'true')}
                    error={!!info?.otherSkillCert}
                  />
                )}
              />
            </FormField>
          </div>

          {/* 技能実習2号良好修了記録（technical_intern 選択時のみ展開） */}
          {skillMethod === 'technical_intern' && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99,102,241,0.04)', borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4338ca', margin: 0 }}>技能実習2号 良好修了記録（最大2件）</p>
                {internFields.length < 2 && (
                  <button
                    type="button"
                    className="btn-add"
                    onClick={() => appendIntern({ jobType: '', workType: '', completionProof: '' })}
                  >
                    <Plus size={14} />
                    追加
                  </button>
                )}
              </div>
              {internFields.length === 0 && (
                <p className="empty-list-hint">「追加」から修了した技能実習2号の職種・作業を記録してください（最大2件）</p>
              )}
              {internFields.map((f, idx) => {
                const rec = info?.technicalInternRecords?.[idx];
                return (
                  <InternRecordRow
                    key={f.id}
                    idx={idx}
                    rec={rec}
                    control={control}
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    onRemove={() => removeIntern(idx)}
                  />
                );
              })}
            </div>
          )}
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
                    options={renewalFormOptions.skillCertMethod}
                    {...field}
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

            <FormField label="その他の言語証明" error={info?.otherLanguageCert?.message}>
              <Controller
                name="foreignerInfo.otherLanguageCert"
                control={control}
                render={({ field }) => (
                  <FormRadioGroup
                    name="foreignerInfo.otherLanguageCert"
                    options={[
                      { value: 'false', label: '無' },
                      { value: 'true', label: '有' },
                    ]}
                    value={String(field.value ?? '')}
                    onChange={(v) => field.onChange(v === 'true')}
                    error={!!info?.otherLanguageCert}
                  />
                )}
              />
            </FormField>
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
                      <Controller
                        name={`foreignerInfo.relatives.${index}.relationship`}
                        control={control}
                        render={({ field }) => (
                          <FormSelect
                            {...field}
                            options={renewalFormOptions.relationship}
                            placeholder="続柄を選択"
                            error={!!rel?.relationship}
                          />
                        )}
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
                      <Controller
                        name={`foreignerInfo.relatives.${index}.nationality`}
                        control={control}
                        render={({ field }) => (
                          <FormSelect
                            {...field}
                            options={renewalFormOptions.nationality}
                            placeholder="国籍を選択"
                            error={!!rel?.nationality}
                          />
                        )}
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

      {/* ─── ⑩ 代理人・取次者 ────────────────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">代理人・取次者</h3>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>法定代理人または取次者（行政書士等）が申請を行う場合のみ入力してください。</p>

        {/* ── 代理人（法定代理人）アコーディオン ── */}
        <button
          type="button"
          onClick={() => setShowAgent(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            width: '100%', padding: '0.6rem 0.875rem',
            background: showAgent ? 'rgba(99,102,241,0.07)' : 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '0.5rem', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', color: '#3730a3',
            marginBottom: showAgent ? '0.75rem' : '0.5rem',
            textAlign: 'left',
          }}
        >
          {showAgent ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          代理人（法定代理人）を入力する
        </button>

        {showAgent && (
          <div
            style={{
              padding: '1rem', marginBottom: '1rem',
              background: 'rgba(99,102,241,0.04)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: '0.5rem',
            }}
          >
            <div className="form-grid form-grid--2">
              <FormField label="代理人 氏名" error={(info?.agent as {name?: {message?: string}} | undefined)?.name?.message}>
                <FormInput
                  {...register('foreignerInfo.agent.name')}
                  placeholder="例: 田中 一郎"
                  error={!!(info?.agent as {name?: unknown} | undefined)?.name}
                />
              </FormField>
              <FormField label="本人との関係" error={(info?.agent as {relationship?: {message?: string}} | undefined)?.relationship?.message}>
                <Controller
                  name="foreignerInfo.agent.relationship"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      {...field}
                      options={renewalFormOptions.relationship}
                      placeholder="関係を選択"
                      error={!!(info?.agent as {relationship?: unknown} | undefined)?.relationship}
                    />
                  )}
                />
              </FormField>
              <FormField label="郵便番号" hint="7桁・ハイフンなし" error={(info?.agent as {zipCode?: {message?: string}} | undefined)?.zipCode?.message}>
                <FormInput
                  {...register('foreignerInfo.agent.zipCode')}
                  placeholder="1000001"
                  maxLength={7}
                  error={!!(info?.agent as {zipCode?: unknown} | undefined)?.zipCode}
                />
              </FormField>
              <FormField label="都道府県" error={(info?.agent as {prefecture?: {message?: string}} | undefined)?.prefecture?.message}>
                <Controller
                  name="foreignerInfo.agent.prefecture"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      options={renewalFormOptions.prefectures}
                      value={field.value ?? ''}
                      onChange={(val) => {
                        field.onChange(val);
                        setValue('foreignerInfo.agent.city', '');
                      }}
                      error={!!(info?.agent as {prefecture?: unknown} | undefined)?.prefecture}
                    />
                  )}
                />
              </FormField>
              <FormField label="市区町村" error={(info?.agent as {city?: {message?: string}} | undefined)?.city?.message}>
                <Controller
                  name="foreignerInfo.agent.city"
                  control={control}
                  render={({ field }) => {
                    const selectedPrefecture = watch('foreignerInfo.agent.prefecture');
                    const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                    return (
                      <FormSelect
                        options={cityOptions}
                        {...field}
                        error={!!(info?.agent as {city?: unknown} | undefined)?.city}
                        disabled={!selectedPrefecture || cityOptions.length === 0}
                      />
                    );
                  }}
                />
              </FormField>
              <FormField label="町名丁目番地号等" error={(info?.agent as {addressLines?: {message?: string}} | undefined)?.addressLines?.message}>
                <FormInput
                  {...register('foreignerInfo.agent.addressLines')}
                  placeholder="例: 芝公園1-1-1"
                  error={!!(info?.agent as {addressLines?: unknown} | undefined)?.addressLines}
                />
              </FormField>
              <FormField label="電話番号" hint="ハイフンなし" error={(info?.agent as {phone?: {message?: string}} | undefined)?.phone?.message}>
                <FormInput
                  {...register('foreignerInfo.agent.phone')}
                  placeholder="0312345678"
                  error={!!(info?.agent as {phone?: unknown} | undefined)?.phone}
                />
              </FormField>
              <FormField label="携帯電話番号" hint="任意・ハイフンなし" error={(info?.agent as {mobilePhone?: {message?: string}} | undefined)?.mobilePhone?.message}>
                <FormInput
                  {...register('foreignerInfo.agent.mobilePhone')}
                  placeholder="09012345678"
                  error={!!(info?.agent as {mobilePhone?: unknown} | undefined)?.mobilePhone}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* ── 取次者（行政書士等）アコーディオン ── */}
        <button
          type="button"
          onClick={() => setShowAgencyRep(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            width: '100%', padding: '0.6rem 0.875rem',
            background: showAgencyRep ? 'rgba(16,185,129,0.07)' : 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '0.5rem', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', color: '#065f46',
            marginBottom: showAgencyRep ? '0.75rem' : 0,
            textAlign: 'left',
          }}
        >
          {showAgencyRep ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          取次者（行政書士・申請取次者等）を入力する
        </button>

        {showAgencyRep && (
          <div
            style={{
              padding: '1rem', marginTop: '0.75rem',
              background: 'rgba(16,185,129,0.04)',
              border: '1px solid rgba(16,185,129,0.15)',
              borderRadius: '0.5rem',
            }}
          >
            <div className="form-grid form-grid--2">
              <FormField label="取次者 氏名" error={(info?.agencyRep as {name?: {message?: string}} | undefined)?.name?.message}>
                <FormInput
                  {...register('foreignerInfo.agencyRep.name')}
                  placeholder="例: 行政書士 山田 花子"
                  error={!!(info?.agencyRep as {name?: unknown} | undefined)?.name}
                />
              </FormField>
              <FormField label="所属機関等" hint="事務所名・法人名" error={(info?.agencyRep as {organization?: {message?: string}} | undefined)?.organization?.message}>
                <FormInput
                  {...register('foreignerInfo.agencyRep.organization')}
                  placeholder="例: 山田行政書士事務所"
                  error={!!(info?.agencyRep as {organization?: unknown} | undefined)?.organization}
                />
              </FormField>
              <FormField label="郵便番号" hint="7桁・ハイフンなし" error={(info?.agencyRep as {zipCode?: {message?: string}} | undefined)?.zipCode?.message}>
                <FormInput
                  {...register('foreignerInfo.agencyRep.zipCode')}
                  placeholder="1000001"
                  maxLength={7}
                  error={!!(info?.agencyRep as {zipCode?: unknown} | undefined)?.zipCode}
                />
              </FormField>
              <FormField label="都道府県" error={(info?.agencyRep as {prefecture?: {message?: string}} | undefined)?.prefecture?.message}>
                <Controller
                  name="foreignerInfo.agencyRep.prefecture"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      options={renewalFormOptions.prefectures}
                      value={field.value ?? ''}
                      onChange={(val) => {
                        field.onChange(val);
                        setValue('foreignerInfo.agencyRep.city', '');
                      }}
                      error={!!(info?.agencyRep as {prefecture?: unknown} | undefined)?.prefecture}
                    />
                  )}
                />
              </FormField>
              <FormField label="市区町村" error={(info?.agencyRep as {city?: {message?: string}} | undefined)?.city?.message}>
                <Controller
                  name="foreignerInfo.agencyRep.city"
                  control={control}
                  render={({ field }) => {
                    const selectedPrefecture = watch('foreignerInfo.agencyRep.prefecture');
                    const cityOptions = selectedPrefecture ? renewalFormOptions.getCityOptions(selectedPrefecture) || [] : [];
                    return (
                      <FormSelect
                        options={cityOptions}
                        {...field}
                        error={!!(info?.agencyRep as {city?: unknown} | undefined)?.city}
                        disabled={!selectedPrefecture || cityOptions.length === 0}
                      />
                    );
                  }}
                />
              </FormField>
              <FormField label="町名丁目番地号等" error={(info?.agencyRep as {addressLines?: {message?: string}} | undefined)?.addressLines?.message}>
                <FormInput
                  {...register('foreignerInfo.agencyRep.addressLines')}
                  placeholder="例: 芝公園1-1-1"
                  error={!!(info?.agencyRep as {addressLines?: unknown} | undefined)?.addressLines}
                />
              </FormField>
              <FormField label="電話番号" hint="ハイフンなし" error={(info?.agencyRep as {phone?: {message?: string}} | undefined)?.phone?.message}>
                <FormInput
                  {...register('foreignerInfo.agencyRep.phone')}
                  placeholder="0312345678"
                  error={!!(info?.agencyRep as {phone?: unknown} | undefined)?.phone}
                />
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* ─── ⑪ 【特定技能特有】手続・処理情報 ───────────────────────────────────── */}
      <div className="subsection">
        <h3 className="subsection-title">手続・処理情報</h3>
        <p className="text-xs text-slate-500 mb-4">申請人の状況について該当するものを選択してください。</p>
        <div className="form-grid form-grid--2">
          <FormField label="本国等の手続遵守" error={info?.followsHomeCountryProcedures?.message}>
            <Controller
              name="foreignerInfo.followsHomeCountryProcedures"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.followsHomeCountryProcedures"
                  options={[
                    { value: 'true', label: 'はい（手続をした）' },
                    { value: 'false', label: 'いいえ' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.followsHomeCountryProcedures}
                />
              )}
            />
          </FormField>

          <FormField label="本邦で定期的に負担する費用への合意" error={info?.agreesToLocalCosts?.message}>
            <Controller
              name="foreignerInfo.agreesToLocalCosts"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.agreesToLocalCosts"
                  options={[
                    { value: 'true', label: 'はい' },
                    { value: 'false', label: 'いいえ' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.agreesToLocalCosts}
                />
              )}
            />
          </FormField>

          <FormField label="技能移転に努めることへの合意" error={info?.effortsToTransferSkills?.message}>
            <Controller
              name="foreignerInfo.effortsToTransferSkills"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.effortsToTransferSkills"
                  options={[
                    { value: 'true', label: 'はい' },
                    { value: 'false', label: 'いいえ' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.effortsToTransferSkills}
                />
              )}
            />
          </FormField>

          <FormField label="特定産業分野固有基準への適合" error={info?.meetsSpecificIndustryStandards?.message}>
            <Controller
              name="foreignerInfo.meetsSpecificIndustryStandards"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.meetsSpecificIndustryStandards"
                  options={[
                    { value: 'true', label: 'はい' },
                    { value: 'false', label: 'いいえ' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.meetsSpecificIndustryStandards}
                />
              )}
            />
          </FormField>

          <FormField label="非自発的離職" error={info?.wasInvoluntarilySeparated?.message}>
            <Controller
              name="foreignerInfo.wasInvoluntarilySeparated"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.wasInvoluntarilySeparated"
                  options={[
                    { value: 'true', label: 'はい' },
                    { value: 'false', label: 'いいえ' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.wasInvoluntarilySeparated}
                />
              )}
            />
          </FormField>

          <FormField label="行方不明者の発生の有無" error={info?.hasMissingPersonOccurred?.message}>
            <Controller
              name="foreignerInfo.hasMissingPersonOccurred"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.hasMissingPersonOccurred"
                  options={[
                    { value: 'true', label: 'はい' },
                    { value: 'false', label: 'いいえ' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.hasMissingPersonOccurred}
                />
              )}
            />
          </FormField>

          <FormField label="欠格事由の非該当" error={info?.notDisqualified?.message}>
            <Controller
              name="foreignerInfo.notDisqualified"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.notDisqualified"
                  options={[
                    { value: 'true', label: 'はい' },
                    { value: 'false', label: 'いいえ' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.notDisqualified}
                />
              )}
            />
          </FormField>

          <FormField label="本人申告の真正" error={info?.applicantDeclarationTrue?.message}>
            <Controller
              name="foreignerInfo.applicantDeclarationTrue"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.applicantDeclarationTrue"
                  options={[
                    { value: 'true', label: 'はい' },
                    { value: 'false', label: 'いいえ' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.applicantDeclarationTrue}
                />
              )}
            />
          </FormField>

          <FormField label="在留カード受領方法" error={info?.residenceCardReceiptMethod?.message}>
            <Controller
              name="foreignerInfo.residenceCardReceiptMethod"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.residenceCardReceiptMethod"
                  options={[
                    { value: '1', label: '窓口' },
                    { value: '2', label: '郵送' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v)}
                  error={!!info?.residenceCardReceiptMethod}
                />
              )}
            />
          </FormField>

          <FormField label="代理人等交付情報提供" error={info?.agentDeliveryInfo?.message}>
            <Controller
              name="foreignerInfo.agentDeliveryInfo"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.agentDeliveryInfo"
                  options={[
                    { value: '1', label: '提供する' },
                    { value: '2', label: '提供しない' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v)}
                  error={!!info?.agentDeliveryInfo}
                />
              )}
            />
          </FormField>
        </div>

        <h4 className="text-sm font-bold text-slate-700 mt-6 mb-4">申請受理・通知情報</h4>
        <div className="form-grid form-grid--2">
          <FormField label="申請対象者の住居地" error={info?.applicantResidencePlace?.message}>
            <FormInput
              {...register('foreignerInfo.applicantResidencePlace')}
              placeholder="例: 東京都港区..."
              error={!!info?.applicantResidencePlace}
            />
          </FormField>

          <FormField label="受領官署" error={info?.receivingOffice?.message}>
            <Controller
              name="foreignerInfo.receivingOffice"
              control={control}
              render={({ field }) => (
                <FormSelect
                  {...field}
                  options={renewalFormOptions.receivingOffice}
                  placeholder="受領官署を選択"
                  error={!!info?.receivingOffice}
                />
              )}
            />
          </FormField>

          <FormField label="通知送信用メールアドレス" error={info?.notificationEmail?.message}>
            <FormInput
              type="email"
              {...register('foreignerInfo.notificationEmail')}
              placeholder="例: notify@example.com"
              error={!!info?.notificationEmail}
            />
          </FormField>

          <FormField label="申請意思の確認" required error={info?.checkIntent?.message}>
            <Controller
              name="foreignerInfo.checkIntent"
              control={control}
              render={({ field }) => (
                <FormRadioGroup
                  name="foreignerInfo.checkIntent"
                  options={[
                    { value: 'true', label: '確認済み' },
                    { value: 'false', label: '未確認' },
                  ]}
                  value={String(field.value ?? '')}
                  onChange={(v) => field.onChange(v === 'true')}
                  error={!!info?.checkIntent}
                />
              )}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <FormField label="フリー欄 (自由記述)" error={info?.freeFormat?.message}>
            <FormTextarea
              {...register('foreignerInfo.freeFormat')}
              rows={3}
              placeholder="必要に応じてその他連絡事項を記入してください"
              error={!!info?.freeFormat}
            />
          </FormField>
        </div>
      </div>

      </fieldset>
    </div>
  );
}
