'use client';

import React, { useReducer, useState } from 'react';
import { Foreigner } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { foreignerService } from '@/services/foreignerService';
import { Save, Loader2, AlertCircle, ImageIcon } from 'lucide-react';

// ─── フィールド定義 ─────────────────────────────────────────────────────────────
// 項目の追加は、このFIELD_DEFS配列に1オブジェクトを追加するだけで完結します。
// Phase 2 で editableBy?: UserRole[] を追加して権限制御を行う予定です。

type FieldType = 'text' | 'date' | 'select' | 'boolean' | 'image' | 'readonly' | 'textarea';

interface FieldDef {
  section: string;
  key: keyof Foreigner;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}

const FIELD_DEFS: FieldDef[] = [
  // ── 基本情報 ──
  { section: '基本情報', key: 'name',                 label: '氏名（フルネーム）',       type: 'text',     placeholder: '例: NGUYEN VAN A' },
  { section: '基本情報', key: 'nationality',           label: '国籍',                     type: 'text',     placeholder: '例: ベトナム' },
  { section: '基本情報', key: 'birthDate',             label: '生年月日',                 type: 'date' },
  { section: '基本情報', key: 'email',                 label: 'メールアドレス',            type: 'text',     placeholder: '例: example@email.com' },
  // ── 在留情報 ──
  { section: '在留情報', key: 'residenceCardNumber',   label: '在留カード番号',            type: 'text',     placeholder: '例: AB12345678CD' },
  { section: '在留情報', key: 'expiryDate',            label: '在留期限',                  type: 'date' },
  { section: '在留情報', key: 'visaType',              label: '在留資格',                  type: 'select',   options: ['技術・人文知識・国際業務', '特定技能1号', '特定技能2号', '技能実習', '留学', '定住者', '永住者', 'その他'] },
  // ── 就労・受入情報 ──
  { section: '就労・受入情報', key: 'company',          label: '所属機関（会社名）',        type: 'text',     placeholder: '例: 株式会社〇〇' },
  { section: '就労・受入情報', key: 'jobTitle',         label: '職務の名称',                type: 'text',     placeholder: '例: エンジニア' },
  { section: '就労・受入情報', key: 'experience',       label: '経験・スキル要約',          type: 'textarea', placeholder: '職務経歴や保有スキルを記入' },
  // ── 待遇情報 ──
  { section: '待遇情報', key: 'salary',                label: '基本給（月額）',            type: 'text',     placeholder: '例: 250,000' },
  { section: '待遇情報', key: 'allowances',            label: '諸手当（月額）',            type: 'text',     placeholder: '例: 30,000' },
  { section: '待遇情報', key: 'socialInsurance',       label: '社会保険加入',              type: 'boolean' },
  { section: '待遇情報', key: 'housingProvided',       label: '住宅の提供',                type: 'boolean' },
  // ── 添付書類（参照のみ） ──
  { section: '添付書類（参照のみ）', key: 'photoUrl',                label: '顔写真',                    type: 'image' },
  { section: '添付書類（参照のみ）', key: 'passportImageUrl',         label: 'パスポート',                type: 'image' },
  { section: '添付書類（参照のみ）', key: 'residenceCardFrontUrl',    label: '在留カード（表）',          type: 'image' },
  { section: '添付書類（参照のみ）', key: 'residenceCardBackUrl',     label: '在留カード（裏）',          type: 'image' },
];

// ─── セクションでグループ化 ───────────────────────────────────────────────────
function groupBySection(fields: FieldDef[]): Map<string, FieldDef[]> {
  return fields.reduce((acc, f) => {
    const list = acc.get(f.section) ?? [];
    list.push(f);
    acc.set(f.section, list);
    return acc;
  }, new Map<string, FieldDef[]>());
}

// ─── Reducer（変更分のみ蓄積してre-renderを最小化） ────────────────────────────
type ChangeAction =
  | { type: 'SET'; key: keyof Foreigner; value: Foreigner[keyof Foreigner] }
  | { type: 'RESET' };

function changesReducer(
  state: Partial<Foreigner>,
  action: ChangeAction
): Partial<Foreigner> {
  if (action.type === 'RESET') return {};
  return { ...state, [action.key]: action.value };
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface InlineEditFormProps {
  foreigner: Foreigner;
  onSuccess: (updated: Partial<Foreigner>) => void;
  onCancel: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function InlineEditForm({ foreigner, onSuccess, onCancel }: InlineEditFormProps) {
  const { currentUser } = useAuth();
  const [changes, dispatch] = useReducer(changesReducer, {});
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = groupBySection(FIELD_DEFS);
  const hasChanges = Object.keys(changes).length > 0;

  // 現在の表示値（変更があれば変更後の値、なければ元データの値）
  const getValue = (key: keyof Foreigner): Foreigner[keyof Foreigner] =>
    key in changes ? changes[key as keyof typeof changes] : foreigner[key];

  const handleChange = (key: keyof Foreigner, value: Foreigner[keyof Foreigner]) => {
    dispatch({ type: 'SET', key, value });
  };

  const handleSave = async () => {
    if (!reason.trim()) {
      setError('修正理由を入力してください。');
      return;
    }
    if (!hasChanges) {
      setError('変更された項目がありません。');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await foreignerService.correctForeignerData(
        foreigner.id,
        changes,
        reason.trim(),
        currentUser?.id || 'unknown'
      );
      onSuccess(changes);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 修正理由・操作バー ── */}
      <div className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">
              修正理由 <span className="text-rose-500">※必須</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="例: 在留カード番号の転記ミス"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {hasChanges ? `${Object.keys(changes).length}件 修正を保存` : '修正を保存'}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-2 text-rose-600 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* ── セクション別フィールド ── */}
      <div className="px-8 pb-16 space-y-8">
        {Array.from(sections.entries()).map(([sectionName, fields]) => (
          <div key={sectionName}>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              {sectionName}
            </h3>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
              {fields.map(field => (
                <FieldRow
                  key={String(field.key)}
                  field={field}
                  value={getValue(field.key)}
                  isModified={field.key in changes}
                  onChange={val => handleChange(field.key, val)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FieldRow ─────────────────────────────────────────────────────────────────
interface FieldRowProps {
  field: FieldDef;
  value: Foreigner[keyof Foreigner];
  isModified: boolean;
  onChange: (val: Foreigner[keyof Foreigner]) => void;
}

function FieldRow({ field, value, isModified, onChange }: FieldRowProps) {
  const strVal = value != null ? String(value) : '';

  const inputCls =
    `w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-white ` +
    (isModified
      ? 'border-amber-300 focus:ring-amber-200 bg-amber-50/30'
      : 'border-slate-200 focus:ring-indigo-200');

  return (
    <div className={`flex items-start gap-4 px-5 py-3.5 ${isModified ? 'bg-amber-50/40' : ''}`}>
      {/* ラベル */}
      <div className="w-44 shrink-0 pt-2">
        <span className="text-xs font-bold text-slate-500">{field.label}</span>
        {isModified && (
          <span className="ml-2 text-[9px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
            変更
          </span>
        )}
      </div>

      {/* 入力コントロール */}
      <div className="flex-1">
        {field.type === 'text' && (
          <input
            type="text"
            value={strVal}
            placeholder={field.placeholder}
            onChange={e => onChange(e.target.value)}
            className={inputCls}
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            value={strVal}
            placeholder={field.placeholder}
            rows={3}
            onChange={e => onChange(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        )}
        {field.type === 'date' && (
          <input
            type="date"
            value={strVal}
            onChange={e => onChange(e.target.value)}
            className={inputCls}
          />
        )}
        {field.type === 'select' && (
          <select
            value={strVal}
            onChange={e => onChange(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">-- 選択してください --</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}
        {field.type === 'boolean' && (
          <div className="flex gap-4 pt-1.5">
            {(['あり', 'なし'] as const).map(label => {
              const boolVal = label === 'あり';
              const checked = value === boolVal;
              return (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={String(field.key)}
                    checked={checked}
                    onChange={() => onChange(boolVal)}
                    className="accent-indigo-600"
                  />
                  <span className={`text-sm font-bold ${checked ? 'text-indigo-700' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {field.type === 'image' && (
          <div className="flex items-center gap-3">
            {strVal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={strVal}
                alt={field.label}
                className="h-20 w-auto rounded-xl border border-slate-200 object-contain bg-slate-50"
              />
            ) : (
              <div className="h-20 w-32 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1">
                <ImageIcon className="h-6 w-6 text-slate-300" />
                <span className="text-[10px] text-slate-400">未登録</span>
              </div>
            )}
            <span className="text-xs text-slate-400">（画像の変更は別途対応予定）</span>
          </div>
        )}
        {field.type === 'readonly' && (
          <span className="text-sm text-slate-500 py-2 block">{strVal || '—'}</span>
        )}
      </div>
    </div>
  );
}
