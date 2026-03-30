'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FileStack } from 'lucide-react';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import { FormField } from '../ui/FormField';
import { FormRadioGroup } from '../ui/FormRadio';

export function SimultaneousApplicationSection() {
  const {
    control,
    formState: { errors },
  } = useFormContext<RenewalApplicationFormData>();

  const sim = errors.simultaneousApplication;

  return (
    <div className="section-container">
      <div className="section-header">
        <FileStack size={20} className="section-icon" />
        <h2 className="section-title">同時申請</h2>
        <p className="section-desc">
          在留期間更新と同時に申請する手続きを選択してください（任意）
        </p>
      </div>

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

      {/* 補足メモ */}
      <div className="subsection">
        <div className="info-box">
          <p className="info-box-text">
            ※ 同時申請を行う場合、別途それぞれの申請書および必要書類が必要となります。詳細は担当行政書士にご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
}
