'use client';

/**
 * リーガルチェック・ダッシュボード
 *
 * 複数のPDFファイルをドラッグ＆ドロップでアップロードし、
 * FastAPI + Gemini AI のマルチモーダル機能で入管審査官視点のリーガルチェック（リスク判定）を実行する。
 * AI診断ルール管理で登録されたカスタムルールも自動的に適用される。
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Scale,
  FileWarning,
  CheckCircle2,
  Sparkles,
  Settings,
  Cloud,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getIdToken } from '@/lib/firebase/auth';
import type { AiDiagnosticRule } from '@/types/database';
import type { AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';

// ── 型定義 ──

interface RiskItem {
  type: string;
  issue: string;
  reason: string;
  suggestion: string;
}

interface LegalCheckResponse {
  success: boolean;
  message: string;
  source_files: string[];
  overall_risk_level: string;
  summary: string;
  risks: RiskItem[];
  raw_json: Record<string, unknown> | null;
}

// ── バックエンドURL ──
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ── リスクレベル設定 ──
const RISK_CONFIG: Record<string, {
  label: string;
  bg: string;
  border: string;
  text: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  glowClass: string;
}> = {
  High: {
    label: '高リスク',
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    icon: '🔴',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white',
    glowClass: 'shadow-red-200/60',
  },
  Medium: {
    label: '中リスク',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    icon: '🟡',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    glowClass: 'shadow-amber-200/60',
  },
  Low: {
    label: '低リスク',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    icon: '🟢',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    glowClass: 'shadow-emerald-200/60',
  },
};

// ── リスク種別の設定 ──
const RISK_TYPE_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  '整合性エラー': {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <FileWarning size={14} className="text-red-600" />,
  },
  '要件未達': {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: <Scale size={14} className="text-amber-600" />,
  },
  '合理性': {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <Lightbulb size={14} className="text-blue-600" />,
  },
};

// ============================================================
// リスクカードコンポーネント
// ============================================================

function RiskCard({ risk, index }: { risk: RiskItem; index: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const typeConfig = RISK_TYPE_CONFIG[risk.type] || {
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    icon: <AlertTriangle size={14} className="text-slate-600" />,
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* ヘッダー */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/80 transition-colors text-left"
      >
        <div className="shrink-0">
          <AlertTriangle size={18} className="text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${typeConfig.bgColor} ${typeConfig.color}`}
            >
              {typeConfig.icon}
              {risk.type}
            </span>
            <span className="text-sm font-semibold text-slate-800 truncate">
              {risk.issue}
            </span>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown size={16} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-slate-400 shrink-0" />
        )}
      </button>

      {/* 詳細 */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {/* 不許可理由 */}
          <div className="flex gap-2">
            <div className="shrink-0 mt-0.5">
              <AlertCircle size={14} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-600 mb-0.5">不許可になり得る理由</p>
              <p className="text-sm text-slate-700 leading-relaxed">{risk.reason}</p>
            </div>
          </div>
          {/* リカバリー案 */}
          <div className="flex gap-2">
            <div className="shrink-0 mt-0.5">
              <Lightbulb size={14} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 mb-0.5">推奨リカバリー案</p>
              <p className="text-sm text-slate-700 leading-relaxed">{risk.suggestion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// メインページコンポーネント
// ============================================================

export default function LegalCheckPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<LegalCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // ── 申請フォームデータ（連携用） ──
  const [applicationData, setApplicationData] = useState<Record<string, unknown> | null>(null);
  const [appDataLoading, setAppDataLoading] = useState(false);
  const [attachedDocs, setAttachedDocs] = useState<AttachmentMeta[]>([]);
  const [excludedDocIds, setExcludedDocIds] = useState<Set<string>>(new Set());

  // ── カスタムルール ──
  const [customRules, setCustomRules] = useState<AiDiagnosticRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);

  // ── 認証チェック ──
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // ── カスタムルール取得 ──
  useEffect(() => {
    if (authLoading || !currentUser) return;

    const fetchRules = async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch('/api/ai-rules', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const enabledRules = (data.rules ?? []).filter((r: AiDiagnosticRule) => r.enabled);
          setCustomRules(enabledRules);
          console.log(`[LegalCheck] カスタムルール取得完了: ${enabledRules.length}件`);
        } else {
          console.warn('[LegalCheck] カスタムルール取得失敗:', res.status);
        }
      } catch (err) {
        console.warn('[LegalCheck] カスタムルール取得エラー:', err);
      } finally {
        setRulesLoading(false);
      }
    };

    fetchRules();
  }, [authLoading, currentUser]);

  // ── 申請フォームデータの取得 ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const appId = searchParams.get('applicationId');
    if (appId) {
      setAppDataLoading(true);
      fetch(`/api/applications/${appId}`)
        .then(res => res.json())
        .then(data => {
          if (data.formData) {
            setApplicationData(data.formData);
            console.log(`[LegalCheck] 申請フォームデータ連携成功: ${appId}`);
          }
          if (data.attachments) {
            const docs: AttachmentMeta[] = [];
            ['foreignerInfo', 'employerInfo', 'simultaneous'].forEach(tab => {
              if (data.attachments[tab] && Array.isArray(data.attachments[tab])) {
                docs.push(...data.attachments[tab]);
              }
            });
            setAttachedDocs(docs);
            console.log(`[LegalCheck] 添付ファイル ${docs.length}件を取得しました`);
          }
        })
        .catch(err => {
          console.warn('[LegalCheck] 申請データ取得エラー:', err);
        })
        .finally(() => {
          setAppDataLoading(false);
        });
    }
  }, []);

  const toggleDocExclusion = (docId: string) => {
    setExcludedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  // ── リーガルチェック実行 ──
  const handleLegalCheck = async () => {
    const includedDocs = attachedDocs.filter(d => !excludedDocIds.has(d.id));
    if (includedDocs.length === 0) {
      setError('審査対象の書類が1つ以上必要です');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();

      // ── クラウド上の書類URLリストをFormDataに追加 ──
      if (includedDocs.length > 0) {
        const documentUrls = includedDocs.map(doc => ({
          url: doc.url,
          filename: doc.name
        }));
        formData.append('document_urls', JSON.stringify(documentUrls));
        console.log(`[LegalCheck] クラウド上ファイルURL ${includedDocs.length}件をリクエストに追加`);
      }

      // ── 申請フォームデータをFormDataに追加 ──
      if (applicationData) {
        formData.append('application_data', JSON.stringify(applicationData));
        console.log(`[LegalCheck] 申請フォームデータ（クロスチェック用）を追加しました`);
      }

      // ── カスタムルールをFormDataに追加 ──
      if (customRules.length > 0) {
        const rulesText = customRules.map((rule, index) => {
          const ruleContent = rule.type === 'pdf'
            ? (rule.pdfExtractedText || '（テキスト抽出なし）')
            : (rule.content || '');
          return `[ルール${index + 1}: ${rule.title}]\n${ruleContent}`;
        }).join('\n\n');
        formData.append('custom_rules', rulesText);
        console.log(`[LegalCheck] カスタムルール ${customRules.length}件をリクエストに追加`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

      const response = await fetch(`${API_BASE_URL}/legal-check`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '不明なエラー' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: サーバーエラー`);
      }

      const data: LegalCheckResponse = await response.json();
      setResult(data);
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'チェック中にエラーが発生しました';
      if (msg.includes('Failed to fetch')) {
        msg = 'バックエンドサーバー（FastAPI）に接続できませんでした。別ターミナルで backend ディレクトリに移動し、uvicorn main:app --port 8000 を実行してサーバーを起動してください。';
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        msg = 'リクエストがタイムアウトしました（10分）。ファイルサイズを小さくするか、ファイル数を減らしてお試しください。';
      } else if (msg.includes('timed out') || msg.includes('504') || msg.includes('タイムアウト')) {
        msg = 'AI解析がタイムアウトしました。ファイルを分割して少数ずつアップロードするか、しばらく待ってから再試行してください。';
      }
      console.error('[LegalCheck] エラー:', err);
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── ファイルアイコン取得 ──
  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) {
      return <FileText size={18} className="text-red-500" />;
    }
    return <FileText size={18} className="text-blue-500" />;
  };

  // ── リスク設定取得 ──
  const riskConfig = result ? (RISK_CONFIG[result.overall_risk_level] || RISK_CONFIG.Low) : null;

  // ── リスク種別ごとの件数集計 ──
  const riskTypeCounts = result?.risks.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ── 認証ローディング ──
  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* ── ヘッダー ── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">戻る</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck size={20} className="text-indigo-600" />
            AI審査官 リーガルチェック
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* ── タイトル説明文と連携バッジ ── */}
        <div className="mb-4">
          <p className="text-slate-500 text-sm">
            連携された申請書類（PDF）を用いて、Gemini AIによる横断的な入管審査リスク判定を実行します。
          </p>

          {/* 申請フォームデータ連携バッジ */}
          {(applicationData || appDataLoading) && (
            <div className="mt-4 flex items-center gap-2">
              {appDataLoading ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                  <Loader2 size={14} className="animate-spin" />
                  <span>申請データ確認中...</span>
                </div>
              ) : applicationData ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-sm">
                  <FileText size={14} />
                  <span>📄 申請フォームデータとの突合チェック：有効</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ── カスタムルール適用インジケーター ── */}
        <section>
          {rulesLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={12} className="animate-spin" />
              カスタムルールを読み込み中…
            </div>
          ) : customRules.length > 0 ? (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700">
                  カスタムルール: {customRules.length}件適用中
                </span>
                <span className="text-xs text-indigo-500">
                  （{customRules.map(r => r.title).join('、')}）
                </span>
              </div>
              {currentUser.role === 'scrivener' && (
                <Link
                  href="/settings/ai-rules"
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Settings size={12} />
                  ルール管理
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">
                  カスタムルール: 未登録（基本審査基準のみ適用）
                </span>
              </div>
              {currentUser.role === 'scrivener' && (
                <Link
                  href="/settings/ai-rules"
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Settings size={12} />
                  ルール追加
                </Link>
              )}
            </div>
          )}
        </section>
        {/* ── 案件に紐づけられた書類（クラウド上のファイル） ── */}
        {attachedDocs.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Cloud size={16} className="text-indigo-500" />
                案件に紐づけられた書類 ({attachedDocs.length}件)
              </h2>
              <span className="text-xs text-slate-500">
                チェックを外したファイルは審査から除外されます
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attachedDocs.map((doc) => {
                const isExcluded = excludedDocIds.has(doc.id);
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 shadow-sm transition-opacity ${
                      isExcluded ? 'border-slate-200 opacity-50' : 'border-indigo-100 hover:border-indigo-300'
                    }`}
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={!isExcluded}
                        onChange={() => toggleDocExclusion(doc.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      {getFileIcon(doc.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400">
                          {(doc.size / 1024).toFixed(1)} KB {doc.tag ? ` • ${doc.tag}` : ''}
                        </p>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* チェック開始ボタン */}
        <section>
          <button
            type="button"
            onClick={handleLegalCheck}
            disabled={
              isAnalyzing || 
              attachedDocs.length === 0 || 
              attachedDocs.filter(d => !excludedDocIds.has(d.id)).length === 0
            }
            className={`
              w-full py-4 rounded-2xl font-black text-lg transition-all
              flex items-center justify-center gap-3 shadow-lg
              ${
                isAnalyzing || attachedDocs.length === 0 || attachedDocs.filter(d => !excludedDocIds.has(d.id)).length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-linear-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 hover:-translate-y-1 hover:shadow-indigo-300/50'
              }
            `}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                AI審査官がチェック中…（数十秒かかります）
              </>
            ) : attachedDocs.length === 0 ? (
              <>
                <FileWarning size={24} />
                審査対象の書類がありません
              </>
            ) : (
              <>
                <ShieldCheck size={24} />
                🚀 AIリーガルチェックを実行する（計{attachedDocs.filter(d => !excludedDocIds.has(d.id)).length}件のファイル）
              </>
            )}
          </button>
        </section>

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

        {/* ── リーガルチェック結果 ── */}
        {result && riskConfig && (
          <section className="space-y-6">
            {/* リスクレベルバッジ */}
            <div
              className={`rounded-2xl border-2 ${riskConfig.border} ${riskConfig.bg} p-6 shadow-lg ${riskConfig.glowClass}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${riskConfig.badgeBg} flex items-center justify-center shadow-md`}
                >
                  {result.overall_risk_level === 'High' && (
                    <ShieldAlert size={28} className="text-white" />
                  )}
                  {result.overall_risk_level === 'Medium' && (
                    <AlertTriangle size={28} className="text-white" />
                  )}
                  {result.overall_risk_level === 'Low' && (
                    <ShieldCheck size={28} className="text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black">{riskConfig.icon}</span>
                    <span className={`text-xl font-black ${riskConfig.text}`}>
                      {riskConfig.label}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskConfig.badgeBg} ${riskConfig.badgeText}`}
                    >
                      {result.overall_risk_level}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {result.message}
                  </p>
                </div>
              </div>

              {/* 審査官コメント */}
              <div className="bg-white/70 rounded-xl p-4 border border-white/50">
                <p className="text-xs font-bold text-slate-500 mb-1.5">🏛️ 審査官所見</p>
                <p className="text-sm text-slate-800 leading-relaxed">{result.summary}</p>
              </div>

              {/* 対象ファイル */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.source_files.map((f) => (
                  <span
                    key={f}
                    className="text-xs bg-white/60 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200"
                  >
                    📄 {f}
                  </span>
                ))}
              </div>
            </div>

            {/* リスク種別サマリー */}
            {result.risks.length > 0 && riskTypeCounts && (
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(RISK_TYPE_CONFIG).map(([typeName, config]) => {
                  const count = riskTypeCounts[typeName] || 0;
                  return (
                    <div
                      key={typeName}
                      className={`rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm ${
                        count > 0 ? '' : 'opacity-50'
                      }`}
                    >
                      <div className="flex justify-center mb-1.5">{config.icon}</div>
                      <p className="text-2xl font-black text-slate-800">{count}</p>
                      <p className={`text-xs font-bold ${config.color}`}>{typeName}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* リスクリスト */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-amber-500" />
                  検出リスク一覧（{result.risks.length}件）
                </h2>
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {showRawJson ? '⬅ リスト表示に戻す' : 'Raw JSON を表示'}
                </button>
              </div>

              {showRawJson ? (
                <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-auto max-h-[600px] font-mono leading-relaxed">
                  {JSON.stringify(result.raw_json, null, 2)}
                </pre>
              ) : result.risks.length > 0 ? (
                <div className="space-y-3">
                  {result.risks.map((risk, i) => (
                    <RiskCard key={`risk-${i}`} risk={risk} index={i} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4">
                  <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">リスクは検出されませんでした</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      提出書類に重大な問題は見つかりませんでした。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
