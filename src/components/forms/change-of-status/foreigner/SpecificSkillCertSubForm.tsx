'use client';

import { useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import type { ChangeOfStatusApplicationFormData } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { FormField } from '../../ui/FormField';
import { FormInput } from '../../ui/FormInput';
import { FormSelect } from '../../ui/FormSelect';
import { changeFormOptions, getTechnicalInternWorkOptions } from '@/lib/constants/changeFormOptions';

export function SpecificSkillCertSubForm() {
  const { register, control, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const infoError = errors.foreignerInfo;

  // useFieldArray for dynamic lists
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: 'foreignerInfo.skillCertifications',
  });

  const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({
    control,
    name: 'foreignerInfo.languageCertifications',
  });

  const { fields: internFields, append: appendIntern, remove: removeIntern } = useFieldArray({
    control,
    name: 'foreignerInfo.technicalInternRecords',
  });

  const methodOptions = [
    { value: 'exam', label: '試験合格' },
    { value: 'technical_intern', label: '技能実習2号良好修了' },
    { value: 'none', label: '免除対象' },
  ];

  return (
    <div className="subsection mt-8">
      <h3 className="subsection-title">特定技能評価・証明情報 (特定技能区分向け)</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <FormField label="特定技能の区分" error={infoError?.specificSkillCategory?.message}>
          <FormSelect
            {...register('foreignerInfo.specificSkillCategory')}
            options={[
              { value: '1', label: '特定技能1号' },
              { value: '2', label: '特定技能2号' },
            ]}
            error={!!infoError?.specificSkillCategory}
          />
        </FormField>
      </div>

      {/* 技能水準証明枠 */}
      <div className="mb-6 border border-slate-700/50 p-4 rounded-xl bg-slate-800/40">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-sm text-slate-300">技能水準証明</h4>
          <button
            type="button"
            onClick={() => appendSkill({ method: 'exam', examName: '', examLocation: '' })}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded"
          >
            + 追加
          </button>
        </div>
        
        {skillFields.map((field, index) => {
          const fieldError = infoError?.skillCertifications?.[index];
          return (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b last:border-b-0 last:pb-0">
              <FormField label="評価区分" required error={fieldError?.method?.message}>
                <FormSelect
                  {...register(`foreignerInfo.skillCertifications.${index}.method`)}
                  options={methodOptions}
                  error={!!fieldError?.method}
                />
              </FormField>
              <FormField label="合格した試験名" error={fieldError?.examName?.message}>
                <FormInput
                  {...register(`foreignerInfo.skillCertifications.${index}.examName`)}
                  placeholder="例: 介護技能評価試験"
                  error={!!fieldError?.examName}
                />
              </FormField>
              <div className="flex gap-2">
                <FormField label="受験地" className="flex-1" error={fieldError?.examLocation?.message}>
                  <FormInput
                    {...register(`foreignerInfo.skillCertifications.${index}.examLocation`)}
                    placeholder="例: 東京都"
                    error={!!fieldError?.examLocation}
                  />
                </FormField>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="mt-6 text-red-500 hover:text-red-700 p-2"
                  title="削除"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
        
        <FormField label="その他の評価方法（ある場合）" className="mt-4" error={infoError?.otherSkillCert?.message}>
          <FormInput
            {...register('foreignerInfo.otherSkillCert')}
            placeholder="その他の証明方法"
            error={!!infoError?.otherSkillCert}
          />
        </FormField>
      </div>

      {/* 日本語能力証明枠 */}
      <div className="mb-6 border border-slate-700/50 p-4 rounded-xl bg-slate-800/40">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-sm text-slate-300">日本語能力証明</h4>
          <button
            type="button"
            onClick={() => appendLang({ method: 'exam', examName: '', examLocation: '' })}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded"
          >
            + 追加
          </button>
        </div>
        
        {langFields.map((field, index) => {
          const fieldError = infoError?.languageCertifications?.[index];
          return (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b last:border-b-0 last:pb-0">
              <FormField label="評価区分" required error={fieldError?.method?.message}>
                <FormSelect
                  {...register(`foreignerInfo.languageCertifications.${index}.method`)}
                  options={methodOptions}
                  error={!!fieldError?.method}
                />
              </FormField>
              <FormField label="合格した試験名" error={fieldError?.examName?.message}>
                <FormInput
                  {...register(`foreignerInfo.languageCertifications.${index}.examName`)}
                  placeholder="例: 日本語能力試験 N4"
                  error={!!fieldError?.examName}
                />
              </FormField>
              <div className="flex gap-2">
                <FormField label="受験地" className="flex-1" error={fieldError?.examLocation?.message}>
                  <FormInput
                    {...register(`foreignerInfo.languageCertifications.${index}.examLocation`)}
                    placeholder="例: 東京都"
                    error={!!fieldError?.examLocation}
                  />
                </FormField>
                <button
                  type="button"
                  onClick={() => removeLang(index)}
                  className="mt-6 text-red-500 hover:text-red-700 p-2"
                  title="削除"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        <FormField label="その他の評価方法（ある場合）" className="mt-4" error={infoError?.otherLanguageCert?.message}>
          <FormInput
            {...register('foreignerInfo.otherLanguageCert')}
            placeholder="その他の証明方法"
            error={!!infoError?.otherLanguageCert}
          />
        </FormField>
      </div>

      {/* 技能実習2号良好修了記録 */}
      <div className="mb-6 border border-slate-700/50 p-4 rounded-xl bg-slate-800/40">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-sm text-slate-300">技能実習2号良好修了記録 (最大2件)</h4>
          <button
            type="button"
            onClick={() => {
              if (internFields.length < 2) {
                appendIntern({ jobType: '', workType: '', completionProof: '' });
              }
            }}
            disabled={internFields.length >= 2}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-400 text-white px-2 py-1 rounded"
          >
            + 追加
          </button>
        </div>

        {internFields.map((field, index) => {
          return (
            <TechnicalInternRecordItem 
              key={field.id} 
              index={index} 
              onRemove={() => removeIntern(index)} 
            />
          );
        })}
      </div>

      {/* 特定技能1号通算在留期間 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="特定技能1号通算在留期間(年)" error={infoError?.totalSpecificSkillStayYears?.message}>
            <FormInput
              type="number"
              min="0"
              max="5"
              {...register('foreignerInfo.totalSpecificSkillStayYears', { valueAsNumber: true })}
              error={!!infoError?.totalSpecificSkillStayYears}
            />
          </FormField>
          <FormField label="特定技能1号通算在留期間(月)" error={infoError?.totalSpecificSkillStayMonths?.message}>
            <FormInput
              type="number"
              min="0"
              max="11"
              {...register('foreignerInfo.totalSpecificSkillStayMonths', { valueAsNumber: true })}
              error={!!infoError?.totalSpecificSkillStayMonths}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}

/**
 * 技能実習記録の各要素コンポーネント（カスケード対応のため分離）
 */
function TechnicalInternRecordItem({ index, onRemove }: { index: number, onRemove: () => void }) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ChangeOfStatusApplicationFormData>();
  const fieldError = errors.foreignerInfo?.technicalInternRecords?.[index];

  const jobType = watch(`foreignerInfo.technicalInternRecords.${index}.jobType`);
  const workType = watch(`foreignerInfo.technicalInternRecords.${index}.workType`);

  // カスケード取得
  const workTypeOptions = getTechnicalInternWorkOptions(jobType);

  // カスケードリセットロジック
  useEffect(() => {
    if (workTypeOptions.length > 0 && workType) {
      const isValid = workTypeOptions.some(opt => opt.value === workType);
      if (!isValid) {
        setValue(`foreignerInfo.technicalInternRecords.${index}.workType`, '');
      }
    }
  }, [jobType, workTypeOptions, workType, setValue, index]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b last:border-b-0 last:pb-0">
      <FormField label="職種" error={fieldError?.jobType?.message}>
        <FormSelect
          {...register(`foreignerInfo.technicalInternRecords.${index}.jobType`)}
          options={changeFormOptions.technicalInternOccupation}
          error={!!fieldError?.jobType}
        />
      </FormField>
      <FormField label="作業" error={fieldError?.workType?.message}>
        <FormSelect
          {...register(`foreignerInfo.technicalInternRecords.${index}.workType`)}
          options={workTypeOptions}
          disabled={!jobType || workTypeOptions.length === 0}
          error={!!fieldError?.workType}
        />
      </FormField>
      <div className="flex gap-2">
        <FormField label="良好に修了したことの証明" className="flex-1" error={fieldError?.completionProof?.message}>
          <FormInput
            {...register(`foreignerInfo.technicalInternRecords.${index}.completionProof`)}
            placeholder="例: 技能実習修了証"
            error={!!fieldError?.completionProof}
          />
        </FormField>
        <button
          type="button"
          onClick={onRemove}
          className="mt-6 text-red-500 hover:text-red-700 p-2"
          title="削除"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
