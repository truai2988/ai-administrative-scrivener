'use client';

/**
 * PDF Overlay テストページ
 *
 * ダミーPDFの上に text / check / radio / circle の
 * 4種類のオーバーレイフィールドを配置し、動作を確認する。
 */

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { OverlayField } from '@/types/pdfOverlay';

// SSRを無効化してPdfOverlayRendererを動的インポートする
const PdfOverlayRenderer = dynamic(
  () => import('@/components/forms/PdfOverlayRenderer').then(mod => mod.PdfOverlayRenderer),
  { ssr: false }
);

// ============================================================
// ダミーフィールド定義
// ============================================================
// 座標は dummy.pdf のレイアウトに対応（スケール1基準, pt単位）

const initialFields: OverlayField[] = [
  // テキスト入力
  {
    id: 'name',
    type: 'text',
    x: 120,
    y: 145,
    width: 250,
    height: 22,
    value: '',
    label: '名前を入力',
  },
  {
    id: 'address',
    type: 'text',
    x: 120,
    y: 185,
    width: 250,
    height: 22,
    value: '',
    label: '住所を入力',
  },

  // チェックボックス
  {
    id: 'optionA',
    type: 'check',
    x: 55,
    y: 278,
    width: 16,
    height: 16,
    value: false,
    label: 'Option A',
  },
  {
    id: 'optionB',
    type: 'check',
    x: 55,
    y: 308,
    width: 16,
    height: 16,
    value: false,
    label: 'Option B',
  },

  // ラジオボタン
  {
    id: 'genderMale',
    type: 'radio',
    x: 55,
    y: 398,
    width: 16,
    height: 16,
    value: false,
    label: 'Male',
    radioGroup: 'gender',
  },
  {
    id: 'genderFemale',
    type: 'radio',
    x: 55,
    y: 428,
    width: 16,
    height: 16,
    value: false,
    label: 'Female',
    radioGroup: 'gender',
  },

  // 丸囲み
  {
    id: 'classA',
    type: 'circle',
    x: 70,
    y: 515,
    width: 28,
    height: 28,
    value: false,
    label: 'A',
  },
  {
    id: 'classB',
    type: 'circle',
    x: 110,
    y: 515,
    width: 28,
    height: 28,
    value: false,
    label: 'B',
  },
  {
    id: 'classC',
    type: 'circle',
    x: 150,
    y: 515,
    width: 28,
    height: 28,
    value: false,
    label: 'C',
  },
];

// ============================================================
// テストページ本体
// ============================================================

export default function PdfTestPage() {
  const [fields, setFields] = useState<OverlayField[]>(initialFields);

  const handleFieldChange = useCallback((id: string, value: string | boolean) => {
    setFields((prev) => {
      const target = prev.find((f) => f.id === id);
      if (!target) return prev;

      // ラジオボタンの排他制御
      if (target.type === 'radio' && target.radioGroup && value === true) {
        return prev.map((f) => {
          if (f.radioGroup === target.radioGroup) {
            return { ...f, value: f.id === id };
          }
          return f;
        });
      }

      return prev.map((f) => (f.id === id ? { ...f, value } : f));
    });
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100">
      {/* ヘッダー */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-slate-800">
          📄 PDF Overlay テスト
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          PDFの上にテキスト入力・チェックボックス・ラジオボタン・丸囲みを重畳表示するテストです
        </p>
      </div>

      {/* PDF + Overlay */}
      <div className="flex-1 overflow-hidden">
        <PdfOverlayRenderer
          pdfUrl="/dummy.pdf"
          fields={fields}
          onFieldChange={handleFieldChange}
          initialScale={1.2}
        />
      </div>
    </div>
  );
}
