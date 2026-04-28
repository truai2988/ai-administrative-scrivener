'use client';

/**
 * Click-to-Fill サンドボックスページ
 *
 * 共通コンポーネント（AiExtractionSidebar / useClickToFill）の動作検証用。
 * 独立した簡易フォーム（FormProvider）内で Click-to-Fill のフルフローをテスト可能。
 */

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useWatch, type FieldPath } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardPaste,
  CheckCircle2,
  FileText,
  User,
  Briefcase,
  MapPin,
  Wand2,
} from 'lucide-react';
import type { ExtractedItem } from '@/types/extractedItem';
import { useClickToFill } from '@/hooks/useClickToFill';

// ============================================================
// Types (サンドボックス専用の簡易フォーム)
// ============================================================

interface FormValues {
  fullName: string;
  nationality: string;
  birthDate: string;
  gender: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  company: string;
  position: string;
  annualIncome: string;
  employmentPeriod: string;
}

// ============================================================
// Constants – ダミーデータ & タブ定義
// ============================================================

interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  fields: { name: FieldPath<FormValues>; label: string; placeholder: string }[];
}

const INITIAL_EXTRACTED_DATA: ExtractedItem[] = [
  { id: 'e1', value: 'JOHN DOE', breadcrumb: ['基本情報', '氏名'], confidence: 0.95, mapped: false, mappedTo: null },
  { id: 'e2', value: 'アメリカ', breadcrumb: ['基本情報', '国籍'], confidence: 0.88, mapped: false, mappedTo: null },
  { id: 'e3', value: '1990-03-15', breadcrumb: ['基本情報', '生年月日'], confidence: 0.92, mapped: false, mappedTo: null },
  { id: 'e4', value: '男', breadcrumb: ['基本情報', '性別'], confidence: 0.97, mapped: false, mappedTo: null },
  { id: 'e5', value: '106-0032', breadcrumb: ['住所', '郵便番号'], confidence: 0.90, mapped: false, mappedTo: null },
  { id: 'e6', value: '東京都', breadcrumb: ['住所', '都道府県'], confidence: 0.85, mapped: false, mappedTo: null },
  { id: 'e7', value: '港区六本木1-2-3', breadcrumb: null, confidence: null, mapped: false, mappedTo: null },
  { id: 'e8', value: '株式会社サンプル', breadcrumb: ['職業', '勤務先'], confidence: 0.78, mapped: false, mappedTo: null },
  { id: 'e9', value: 'ソフトウェアエンジニア', breadcrumb: ['職業', '役職'], confidence: 0.72, mapped: false, mappedTo: null },
  { id: 'e10', value: '¥6,000,000', breadcrumb: ['職業', '年収'], confidence: 0.65, mapped: false, mappedTo: null },
];

// 書類B: breadcrumb が同じだが値が異なるデータ（Auto-Fill テスト用）
const SECOND_EXTRACTED_DATA: ExtractedItem[] = [
  { id: 's1', value: 'JANE SMITH', breadcrumb: ['基本情報', '氏名'], confidence: 0.93, mapped: false, mappedTo: null },
  { id: 's2', value: 'カナダ', breadcrumb: ['基本情報', '国籍'], confidence: 0.91, mapped: false, mappedTo: null },
  { id: 's3', value: '1985-07-22', breadcrumb: ['基本情報', '生年月日'], confidence: 0.89, mapped: false, mappedTo: null },
  { id: 's4', value: '女', breadcrumb: ['基本情報', '性別'], confidence: 0.96, mapped: false, mappedTo: null },
  { id: 's5', value: '150-0001', breadcrumb: ['住所', '郵便番号'], confidence: 0.87, mapped: false, mappedTo: null },
  { id: 's6', value: '東京都', breadcrumb: ['住所', '都道府県'], confidence: 0.90, mapped: false, mappedTo: null },
  { id: 's7', value: '渋谷区神宮前4-5-6', breadcrumb: null, confidence: null, mapped: false, mappedTo: null },
  { id: 's8', value: '株式会社テスト', breadcrumb: ['職業', '勤務先'], confidence: 0.82, mapped: false, mappedTo: null },
];

const TABS: TabDef[] = [
  {
    id: 'basic',
    label: '基本情報',
    icon: <User size={16} />,
    fields: [
      { name: 'fullName', label: '氏名（フルネーム）', placeholder: '例: JOHN DOE' },
      { name: 'nationality', label: '国籍', placeholder: '例: アメリカ' },
      { name: 'birthDate', label: '生年月日', placeholder: '例: 1990-03-15' },
      { name: 'gender', label: '性別', placeholder: '例: 男' },
    ],
  },
  {
    id: 'address',
    label: '住所',
    icon: <MapPin size={16} />,
    fields: [
      { name: 'postalCode', label: '郵便番号', placeholder: '例: 106-0032' },
      { name: 'prefecture', label: '都道府県', placeholder: '例: 東京都' },
      { name: 'city', label: '市区町村', placeholder: '例: 港区' },
      { name: 'address', label: '番地・建物名', placeholder: '例: 六本木1-2-3' },
    ],
  },
  {
    id: 'employment',
    label: '職業',
    icon: <Briefcase size={16} />,
    fields: [
      { name: 'company', label: '勤務先', placeholder: '例: 株式会社サンプル' },
      { name: 'position', label: '役職・職種', placeholder: '例: ソフトウェアエンジニア' },
      { name: 'annualIncome', label: '年収', placeholder: '例: ¥6,000,000' },
      { name: 'employmentPeriod', label: '勤続年数', placeholder: '例: 3年' },
    ],
  },
];

const FIELD_LABELS: Record<string, string> = {};
TABS.forEach((tab) =>
  tab.fields.forEach((f) => {
    FIELD_LABELS[f.name] = f.label;
  }),
);

// ============================================================
// Floating Tooltip
// ============================================================

function FloatingTooltip({ text }: { text: string }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed z-9999 pointer-events-none"
      style={{ left: pos.x + 16, top: pos.y - 8 }}
    >
      <div className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-white text-xs font-medium shadow-lg shadow-indigo-500/30">
        <ClipboardPaste size={13} />
        <span className="max-w-[180px] truncate">{text}</span>
      </div>
    </motion.div>
  );
}

// ============================================================
// Inner Content (FormProvider の内側)
// ============================================================

function SandboxInner() {
  const { register, control, reset } = useForm<FormValues>({
    defaultValues: {
      fullName: '', nationality: '', birthDate: '', gender: '',
      postalCode: '', prefecture: '', city: '', address: '',
      company: '', position: '', annualIncome: '', employmentPeriod: '',
    },
  });

  // ---- このメソッドオブジェクトは FormProvider に渡されないので、
  //      useClickToFill 用に自前の FormProvider を SandboxInner の外側に配置する。
  //      → 実際には page 側で FormProvider を巻いている。

  const ctf = useClickToFill<FormValues>();

  // 初回データ注入
  useEffect(() => {
    ctf.initData(INITIAL_EXTRACTED_DATA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formValues = useWatch({ control });
  const [activeTab, setActiveTab] = useState('basic');
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  const handleReset = () => {
    reset();
    ctf.resetAll();
    ctf.initData(INITIAL_EXTRACTED_DATA);
  };

  // 書類B をロード: フォームをリセットし、学習辞書は保持したまま新データを注入
  const handleLoadDocB = () => {
    reset(); // フォーム値のみリセット
    ctf.initData(SECOND_EXTRACTED_DATA);
    // → useEffect で learnedMappings が残っていれば autoFillKnownMappings が発火
  };

  // Auto-Fill トリガー: extractedData が初期化された直後に学習辞書と照合
  useEffect(() => {
    if (
      ctf.extractedData.length > 0 &&
      Object.keys(ctf.learnedMappings).length > 0 &&
      ctf.extractedData.every((d) => !d.mapped)
    ) {
      const count = ctf.autoFillKnownMappings();
      if (count > 0) {
        console.log(`[Sandbox AutoFill] ✨ ${count} 件を自動入力しました`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctf.extractedData.length, ctf.learnedMappings]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-100 to-indigo-50">
      {/* Floating Tooltip */}
      <AnimatePresence>
        {ctf.heldData && <FloatingTooltip text={ctf.heldData} />}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-300/30">
              <ClipboardPaste size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">Click-to-Fill プロトタイプ</h1>
              <p className="text-xs text-slate-500">書類データ → フォームへの直接マッピング</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLoadDocB}
              className="flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              📄 書類Bをロード
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              ↺ リセット
            </button>
          </div>
        </div>

        {/* ホールド中バナー */}
        <AnimatePresence>
          {ctf.heldData && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-indigo-200 bg-linear-to-r from-indigo-50 to-purple-50"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2">
                <span className="text-xs font-medium text-indigo-700">
                  「<span className="font-bold">{ctf.heldData}</span>」を保持中 — 右側のフィールドをクリックして代入してください
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左ペイン: 抽出データ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                ✨ AI 抽出データ
                <span className="text-xs font-medium text-slate-400">{ctf.extractedData.length}件</span>
              </h2>
            </div>
            <div className="space-y-2">
              {ctf.extractedData.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.mapped ? undefined : ctf.heldItemId === item.id ? ctf.releaseItem : () => ctf.holdItem(item)}
                  disabled={item.mapped}
                  className={`
                    w-full text-left rounded-xl border p-3 transition-all duration-200
                    ${
                      item.mapped
                        ? item.autoFilled
                          ? 'border-violet-200 bg-violet-50/60 opacity-80 cursor-default'
                          : 'border-emerald-200 bg-emerald-50/60 opacity-70 cursor-default'
                        : ctf.heldItemId === item.id
                          ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-400/40 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md cursor-pointer'
                    }
                  `}
                >
                  {item.breadcrumb && (
                    <div className="flex items-center gap-1 mb-1 text-xs text-indigo-600">
                      {item.breadcrumb.join(' › ')}
                      {item.confidence !== null && (
                        <span className="ml-auto text-xs font-medium text-slate-400">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                  <p className={`text-sm font-semibold ${
                    item.mapped
                      ? item.autoFilled
                        ? 'text-violet-700 line-through decoration-violet-300'
                        : 'text-emerald-700 line-through decoration-emerald-300'
                      : 'text-slate-800'
                  }`}>
                    {item.value}
                  </p>
                  {item.mapped && item.mappedTo && (
                    item.autoFilled ? (
                      <div className="flex items-center gap-1 mt-1 text-xs text-violet-600">
                        <Wand2 size={12} />
                        <span>✨ 学習により自動入力 → {FIELD_LABELS[item.mappedTo] || item.mappedTo}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                        <CheckCircle2 size={12} />
                        <span>→ {FIELD_LABELS[item.mappedTo] || item.mappedTo}</span>
                      </div>
                    )
                  )}
                </button>
              ))}
            </div>

            {/* マッピング履歴 */}
            {ctf.mappingLog.length > 0 && (
              <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-white">
                <h3 className="text-xs font-bold text-slate-500 mb-2">マッピング履歴</h3>
                {ctf.mappingLog.map((log, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 py-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="font-medium">{log.from}</span>
                    <span className="text-slate-300">›</span>
                    <span className="text-indigo-600 font-medium">{FIELD_LABELS[log.to] || log.to}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右ペイン: 入力フォーム */}
          <div>
            {/* タブナビ */}
            <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all
                    ${activeTab === tab.id
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* フィールド */}
            <div className="space-y-4">
              {currentTab.fields.map((field) => {
                const fieldValue = formValues?.[field.name];
                const isFilled = fieldValue && fieldValue.length > 0;

                return (
                  <div
                    key={field.name}
                    onMouseDown={(e) => ctf.fillField(e, field.name)}
                    className={`
                      relative rounded-xl border p-4 transition-all duration-200
                      ${
                        ctf.isInFillMode
                          ? 'border-indigo-300 bg-white hover:border-indigo-400 hover:ring-2 hover:ring-indigo-200/50 hover:shadow-lg cursor-crosshair'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }
                    `}
                  >
                    {ctf.isInFillMode && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute right-3 top-3"
                      >
                        <ClipboardPaste size={16} className="text-indigo-400" />
                      </motion.div>
                    )}

                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      {...register(field.name)}
                      placeholder={field.placeholder}
                      className={`w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400
                        ${isFilled ? 'text-slate-800' : 'text-slate-500'}
                      `}
                    />
                    {isFilled && (
                      <div className="absolute left-3 top-3">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 確認ボタン */}
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => alert(JSON.stringify(formValues, null, 2))}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-300/40 hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileText size={16} />
                フォームデータを確認
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Page Component (FormProvider を巻く)
// ============================================================

export default function ClickToFillSandbox() {
  const methods = useForm<FormValues>({
    defaultValues: {
      fullName: '', nationality: '', birthDate: '', gender: '',
      postalCode: '', prefecture: '', city: '', address: '',
      company: '', position: '', annualIncome: '', employmentPeriod: '',
    },
  });

  return (
    <FormProvider {...methods}>
      <SandboxInner />
    </FormProvider>
  );
}
