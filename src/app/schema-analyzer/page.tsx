'use client';

/**
 * Schema Analyzer（書類横断解析ページ）
 *
 * 複数のExcel/Wordファイルをドラッグ＆ドロップでアップロードし、
 * FastAPI + Gemini AI で横断解析して共通JSONスキーマを生成・表示する。
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ── 型定義 ──

interface FieldDefinition {
  field_id: string;
  label_ja: string;
  label_en: string;
  field_type: string;
  required: boolean;
  options: string[];
  source_file: string;
  notes: string;
}

interface SchemaCategory {
  category_id: string;
  category_label: string;
  fields: FieldDefinition[];
}

interface AnalysisResponse {
  success: boolean;
  message: string;
  source_files: string[];
  total_fields: number;
  categories: SchemaCategory[];
  raw_json: Record<string, unknown> | null;
}

// ── バックエンドURL ──
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ============================================================
// カテゴリツリーコンポーネント
// ============================================================

function CategoryTree({ categories }: { categories: SchemaCategory[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(categories.map((c) => c.category_id)));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fieldTypeColor: Record<string, string> = {
    text: 'bg-blue-100 text-blue-700',
    number: 'bg-emerald-100 text-emerald-700',
    date: 'bg-amber-100 text-amber-700',
    select: 'bg-purple-100 text-purple-700',
    checkbox: 'bg-pink-100 text-pink-700',
    radio: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat.category_id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {/* カテゴリヘッダー */}
          <button
            type="button"
            onClick={() => toggle(cat.category_id)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            {expanded.has(cat.category_id) ? (
              <ChevronDown size={16} className="text-slate-400 shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
            )}
            <span className="font-bold text-sm text-slate-800">{cat.category_label}</span>
            <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full px-2 py-0.5">
              {cat.fields.length}項目
            </span>
          </button>

          {/* フィールド一覧 */}
          {expanded.has(cat.category_id) && (
            <div className="divide-y divide-slate-100">
              {cat.fields.map((field) => (
                <div key={field.field_id} className="px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{field.label_ja}</span>
                        {field.required && (
                          <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full uppercase">
                            必須
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            fieldTypeColor[field.field_type] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {field.field_type}
                        </span>
                      </div>
                      {field.label_en && (
                        <p className="text-xs text-slate-400 mt-0.5">{field.label_en}</p>
                      )}
                      {field.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">📝 {field.notes}</p>
                      )}
                      {field.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {field.options.map((opt) => (
                            <span
                              key={opt}
                              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <code className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded font-mono shrink-0">
                      {field.field_id}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// メインページコンポーネント
// ============================================================

export default function SchemaAnalyzerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // ── ドラッグ＆ドロップ設定 ──
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── 解析実行 ──
  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError('ファイルを1つ以上アップロードしてください');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      // タイムアウト10分（Gemini APIのリトライを考慮して長めに設定）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '不明なエラー' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: サーバーエラー`);
      }

      const data: AnalysisResponse = await response.json();
      setResult(data);
    } catch (err) {
      let msg = err instanceof Error ? err.message : '解析中にエラーが発生しました';
      if (msg.includes('Failed to fetch')) {
        msg = 'バックエンドサーバー（FastAPI）に接続できませんでした。別ターミナルで `backend` ディレクトリに移動し、`uvicorn main:app --port 8000` を実行してサーバーを起動してください。';
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        msg = 'リクエストがタイムアウトしました（10分）。ファイルサイズを小さくするか、ファイル数を減らしてお試しください。';
      } else if (msg.includes('timed out') || msg.includes('504') || msg.includes('タイムアウト')) {
        msg = `AI解析がタイムアウトしました。バックエンドで自動リトライを実行しましたが成功しませんでした。ファイルを分割して少数ずつアップロードするか、しばらく待ってから再試行してください。`;
      }
      console.error('[SchemaAnalyzer] 解析エラー:', err);
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── ファイルアイコン取得 ──
  const getFileIcon = (name: string) => {
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return <FileSpreadsheet size={18} className="text-emerald-500" />;
    }
    return <FileText size={18} className="text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* ── ヘッダー ── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">ダッシュボード</span>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-500" />
            書類横断解析
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* ── ドロップゾーン ── */}
        <section>
          <div
            {...getRootProps()}
            className={`
              relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
              transition-all duration-300
              ${
                isDragActive
                  ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100/50 scale-[1.01]'
                  : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-md'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div
                className={`p-4 rounded-2xl transition-colors ${
                  isDragActive ? 'bg-indigo-100' : 'bg-slate-100'
                }`}
              >
                <Upload size={32} className={isDragActive ? 'text-indigo-500' : 'text-slate-400'} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {isDragActive ? 'ここにドロップしてください' : '行政書類をドラッグ＆ドロップ'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Excel (.xlsx) / Word (.docx) 形式 — 複数ファイル対応（最大50MB/ファイル）
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── アップロード済みファイル一覧 ── */}
        {files.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700">
              📎 アップロード済みファイル ({files.length}件)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm"
                >
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* 解析ボタン */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`
                w-full py-3 rounded-xl font-bold text-sm transition-all
                flex items-center justify-center gap-2
                ${
                  isAnalyzing
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-200/50 hover:shadow-xl'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Gemini AIで解析中…（数十秒かかります）
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  解析開始（{files.length}件のファイル）
                </>
              )}
            </button>
          </section>
        )}

        {/* ── エラー表示 ── */}
        {error && (
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-700">エラーが発生しました</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── 解析結果 ── */}
        {result && (
          <section className="space-y-4">
            {/* サマリ */}
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">{result.message}</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  対象ファイル: {result.source_files.join(', ')}
                </p>
              </div>
              <span className="ml-auto text-lg font-black text-emerald-700">{result.total_fields}</span>
            </div>

            {/* カテゴリツリー */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">📋 マスタースキーマ</h2>
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {showRawJson ? 'ツリー表示に戻す' : 'Raw JSON を表示'}
              </button>
            </div>

            {showRawJson ? (
              <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-auto max-h-[600px] font-mono leading-relaxed">
                {JSON.stringify(result.raw_json, null, 2)}
              </pre>
            ) : (
              <CategoryTree categories={result.categories} />
            )}
          </section>
        )}
      </main>
    </div>
  );
}
