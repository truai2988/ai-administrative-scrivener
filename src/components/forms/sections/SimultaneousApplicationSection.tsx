'use client';

import React, { useState } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { FileStack } from 'lucide-react';
import type { RenewalApplicationFormData, AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';
import type { GlobalLimitContext } from '@/lib/utils/fileUtils';
import { FormField } from '../ui/FormField';
import { FormRadioGroup } from '../ui/FormRadio';
import { SharedFileUploader } from '@/components/ui/SharedFileUploader';

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
    formState: { errors },
  } = useFormContext<RenewalApplicationFormData>();

  const sim = errors.simultaneousApplication;

  // 書類ファーストワークフローの制御
  const [isManualInputEnabled, setIsManualInputEnabled] = useState(false);
  const attachments = useWatch({ control, name: 'attachments.simultaneous' }) || initialAttachments || [];
  const hasAttachments = attachments.length > 0;
  
  // 編集モードかつ（書類が添付されている OR 手動入力がオン）の場合のみフィールドを有効化
  const isFieldsEnabled = isEditable && (hasAttachments || isManualInputEnabled);

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
        <SharedFileUploader
          applicationId={applicationId}
          attachmentKey="simultaneous"
          tabLabel="同時申請"
          initialAttachments={initialAttachments}
          readonly={!isEditable}
          globalLimitContext={globalLimitContext}
          hints={[
            '婚姻証明書（配偶者の場合）',
            '出生証明書（子の場合）',
            '再入国許可用深知書',
            '資格外活動許可証明書（再発行申請時）',
          ]}
        />
        
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
