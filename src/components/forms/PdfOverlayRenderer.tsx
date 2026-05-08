'use client';

/**
 * PdfOverlayRenderer
 *
 * PDFページを描画し、その上に position: absolute で
 * 各種入力UI（テキスト、チェック、ラジオ、丸囲み）を重畳表示する
 * 「DocuSign方式」の描画エンジン。
 */

import React, { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { OverlayField } from '@/types/pdfOverlay';

// PDF.js ワーカーの設定
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ============================================================
// Props
// ============================================================

interface PdfOverlayRendererProps {
  /** PDFファイルのURL */
  pdfUrl: string;
  /** PDF上に重畳表示するフィールド定義 */
  fields: OverlayField[];
  /** フィールド値の変更コールバック */
  onFieldChange?: (id: string, value: string | boolean) => void;
  /** 初期スケール（デフォルト: 1.0） */
  initialScale?: number;
}

// ============================================================
// 個別フィールドコンポーネント
// ============================================================

/** テキスト入力フィールド */
function TextOverlay({
  field,
  scale,
  onChange,
}: {
  field: OverlayField;
  scale: number;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      value={(field.value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.label || ''}
      style={{
        position: 'absolute',
        left: field.x * scale,
        top: field.y * scale,
        width: field.width * scale,
        height: field.height * scale,
        fontSize: Math.max(10, field.height * scale * 0.65),
      }}
      className="
        bg-blue-100/50 border border-blue-300/60 rounded-sm
        px-1 outline-none
        focus:bg-blue-100/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-400/40
        transition-all text-slate-800 font-medium
        placeholder:text-slate-400 placeholder:text-xs
      "
    />
  );
}

/** チェックボックスフィールド */
function CheckOverlay({
  field,
  scale,
  onChange,
}: {
  field: OverlayField;
  scale: number;
  onChange: (value: boolean) => void;
}) {
  const checked = !!field.value;
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        position: 'absolute',
        left: field.x * scale,
        top: field.y * scale,
        width: field.width * scale,
        height: field.height * scale,
        fontSize: Math.max(10, Math.min(field.width, field.height) * scale * 0.7),
      }}
      className={`
        flex items-center justify-center rounded-sm border-2 transition-all cursor-pointer
        ${checked
          ? 'bg-emerald-100/80 border-emerald-500 text-emerald-700'
          : 'bg-white/60 border-slate-300 text-transparent hover:border-emerald-400 hover:bg-emerald-50/50'
        }
      `}
      title={field.label || 'チェック'}
    >
      {checked ? '✓' : ''}
    </button>
  );
}

/** ラジオボタンフィールド */
function RadioOverlay({
  field,
  scale,
  onChange,
}: {
  field: OverlayField;
  scale: number;
  onChange: (value: boolean) => void;
}) {
  const selected = !!field.value;
  const size = Math.min(field.width, field.height) * scale;
  return (
    <button
      type="button"
      onClick={() => onChange(!selected)}
      style={{
        position: 'absolute',
        left: field.x * scale,
        top: field.y * scale,
        width: size,
        height: size,
      }}
      className={`
        flex items-center justify-center rounded-full border-2 transition-all cursor-pointer
        ${selected
          ? 'bg-indigo-100/80 border-indigo-500'
          : 'bg-white/60 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50'
        }
      `}
      title={field.label || 'ラジオ'}
    >
      {selected && (
        <div
          className="rounded-full bg-indigo-600"
          style={{ width: size * 0.5, height: size * 0.5 }}
        />
      )}
    </button>
  );
}

/** 丸囲み（circle）フィールド — テキストの上に赤い丸枠をON/OFFする */
function CircleOverlay({
  field,
  scale,
  onChange,
}: {
  field: OverlayField;
  scale: number;
  onChange: (value: boolean) => void;
}) {
  const active = !!field.value;
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      style={{
        position: 'absolute',
        left: field.x * scale,
        top: field.y * scale,
        width: field.width * scale,
        height: field.height * scale,
      }}
      className={`
        flex items-center justify-center rounded-full transition-all cursor-pointer
        ${active
          ? 'border-[3px] border-red-500 bg-transparent shadow-sm shadow-red-200'
          : 'border-2 border-transparent hover:border-red-300/60 bg-transparent'
        }
      `}
      title={field.label || '丸囲み'}
    >
      {/* circle は背景を透明にし、PDFのテキストがそのまま見えるようにする */}
    </button>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================

export function PdfOverlayRenderer({
  pdfUrl,
  fields,
  onFieldChange,
  initialScale = 1.0,
}: PdfOverlayRendererProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(initialScale);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // PDF読み込み完了時
  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  // ページレンダリング完了時にサイズを取得
  const onPageRenderSuccess = useCallback(() => {
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        setPageSize({ width: canvas.width, height: canvas.height });
      }
    }
  }, []);

  // フィールド変更ハンドラ
  const handleFieldChange = useCallback(
    (id: string, value: string | boolean) => {
      onFieldChange?.(id, value);
    },
    [onFieldChange],
  );

  // 現在のページに属するフィールドのみフィルタ
  const currentFields = fields.filter((f) => (f.page ?? 1) === currentPage);

  return (
    <div className="flex flex-col h-full bg-slate-200">
      {/* ─── ツールバー ─── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shrink-0 shadow-sm">
        {/* ページ操作 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-2 py-1 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          >
            ◀ 前
          </button>
          <span className="text-xs font-bold text-slate-700 tabular-nums">
            {currentPage} / {numPages || '…'}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="px-2 py-1 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          >
            次 ▶
          </button>
        </div>

        {/* ズーム操作 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="px-2 py-1 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            −
          </button>
          <span className="text-xs font-bold text-slate-700 tabular-nums w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3.0, s + 0.1))}
            className="px-2 py-1 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            ＋
          </button>
        </div>
      </div>

      {/* ─── PDF + Overlay ─── */}
      <div className="flex-1 overflow-auto flex justify-center py-4">
        <div ref={containerRef} className="relative inline-block shadow-2xl">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center w-[600px] h-[800px] bg-white">
                <p className="text-sm text-slate-500 font-medium animate-pulse">
                  PDFを読み込み中…
                </p>
              </div>
            }
            error={
              <div className="flex items-center justify-center w-[600px] h-[800px] bg-white">
                <p className="text-sm text-rose-500 font-semibold">
                  PDFの読み込みに失敗しました
                </p>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              onRenderSuccess={onPageRenderSuccess}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>

          {/* ─── オーバーレイフィールド群 ─── */}
          {pageSize && (
            <div
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: pageSize.width, height: pageSize.height }}
            >
              <div className="relative w-full h-full pointer-events-auto">
                {currentFields.map((field) => {
                  switch (field.type) {
                    case 'text':
                      return (
                        <TextOverlay
                          key={field.id}
                          field={field}
                          scale={scale}
                          onChange={(v) => handleFieldChange(field.id, v)}
                        />
                      );
                    case 'check':
                      return (
                        <CheckOverlay
                          key={field.id}
                          field={field}
                          scale={scale}
                          onChange={(v) => handleFieldChange(field.id, v)}
                        />
                      );
                    case 'radio':
                      return (
                        <RadioOverlay
                          key={field.id}
                          field={field}
                          scale={scale}
                          onChange={(v) => handleFieldChange(field.id, v)}
                        />
                      );
                    case 'circle':
                      return (
                        <CircleOverlay
                          key={field.id}
                          field={field}
                          scale={scale}
                          onChange={(v) => handleFieldChange(field.id, v)}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
