'use client';

/**
 * AiDiagnosticPanel
 *
 * AI診断結果を表示するスライドイン Drawer コンポーネント。
 * 画面右側からスライドインし、critical / warning / suggestion を色分けして表示します。
 */

import React, { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Loader2,
  Sparkles,
  CheckCircle2,
  FileSearch,
  Scale,
  ClipboardCheck,
} from 'lucide-react';
import type { DiagnosticItem, DiagnosticCategory, DiagnosticLevel, AiDiagnosticsStatus } from '@/types/aiDiagnostics';

// ─── レベル設定 ────────────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<
  DiagnosticLevel,
  { label: string; color: string; bgColor: string; borderColor: string; Icon: React.ElementType }
> = {
  critical: {
    label: '要対応',
    color: '#f87171',
    bgColor: 'rgba(248, 113, 113, 0.08)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
    Icon: AlertCircle,
  },
  warning: {
    label: '要確認',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    Icon: AlertTriangle,
  },
  suggestion: {
    label: '改善提案',
    color: '#34d399',
    bgColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
    Icon: Lightbulb,
  },
};

// ─── カテゴリ設定 ──────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  DiagnosticCategory,
  { label: string; Icon: React.ElementType }
> = {
  input:       { label: '入力チェック',     Icon: ClipboardCheck },
  consistency: { label: '整合性チェック',   Icon: FileSearch },
  legal:       { label: '法的リスク',       Icon: Scale },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface AiDiagnosticPanelProps {
  status: AiDiagnosticsStatus;
  diagnostics: DiagnosticItem[];
  counts: { critical: number; warning: number; suggestion: number };
  errorMessage?: string;
}

// ─── 診断アイテムカード ───────────────────────────────────────────────────────
function DiagnosticCard({ item }: { item: DiagnosticItem }) {
  const level = LEVEL_CONFIG[item.level];
  const { Icon } = level;

  return (
    <div className="ai-diag-item" style={{
      background: level.bgColor,
      borderColor: level.borderColor,
    }}>
      <div className="ai-diag-item-header">
        <Icon size={15} style={{ color: level.color, flexShrink: 0 }} />
        <span className="ai-diag-item-level" style={{ color: level.color }}>
          {level.label}
        </span>
        <span className="ai-diag-item-field">{item.field}</span>
      </div>
      <p className="ai-diag-item-message">{item.message}</p>
    </div>
  );
}

// ─── カテゴリグループ ────────────────────────────────────────────────────────
function CategoryGroup({
  category,
  items,
}: {
  category: DiagnosticCategory;
  items: DiagnosticItem[];
}) {
  if (items.length === 0) return null;
  const { label, Icon } = CATEGORY_CONFIG[category];

  return (
    <div className="ai-diag-group">
      <div className="ai-diag-group-header">
        <Icon size={14} className="ai-diag-group-icon" />
        <span>{label}</span>
        <span className="ai-diag-group-count">{items.length}件</span>
      </div>
      <div className="ai-diag-group-items">
        {items.map((item, i) => (
          <DiagnosticCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

export function AiDiagnosticPanel({
  status,
  diagnostics,
  counts,
  errorMessage,
}: AiDiagnosticPanelProps) {

  // カテゴリ別グループ化
  const grouped = useMemo(() => ({
    legal:       diagnostics.filter((d) => d.category === 'legal'),
    consistency: diagnostics.filter((d) => d.category === 'consistency'),
    input:       diagnostics.filter((d) => d.category === 'input'),
  }), [diagnostics]);

  const allClear = status === 'success' && diagnostics.length === 0;

  return (
    <>
      {/* ─── Drawerパネル ─── */}
      <aside
        className="ai-diag-drawer"
        role="complementary"
        aria-label="AI診断結果パネル"
      >
        {/* ヘッダー */}
        <div className="ai-diag-header">
          <div className="ai-diag-header-title">
            <Sparkles size={18} className="ai-diag-sparkle" />
            <span>AI診断レポート</span>
          </div>
        </div>

        {/* ─── ローディング ─── */}
        {status === 'loading' && (
          <div className="ai-diag-loading">
            <div className="ai-diag-loading-icon">
              <Loader2 size={36} className="spin" style={{ color: '#818cf8' }} />
            </div>
            <p className="ai-diag-loading-title">入管業務AIが診断中...</p>
            <p className="ai-diag-loading-desc">
              入力内容・整合性・法的リスクを厳密にチェックしています
            </p>
            <div className="ai-diag-loading-steps">
              {['入力フィールドの確認', '書類整合性の検証', '法令要件との照合'].map((step, i) => (
                <div key={i} className="ai-diag-loading-step">
                  <Loader2 size={12} className="spin" style={{ color: '#818cf8' }} />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── エラー ─── */}
        {status === 'error' && (
          <div className="ai-diag-error">
            <AlertCircle size={32} style={{ color: '#f87171' }} />
            <p className="ai-diag-error-title">診断に失敗しました</p>
            <p className="ai-diag-error-msg">{errorMessage}</p>
          </div>
        )}

        {/* ─── 診断完了 ─── */}
        {status === 'success' && (
          <div className="ai-diag-body">
            {/* サマリーバッジ */}
            <div className="ai-diag-summary">
              {counts.critical > 0 && (
                <div className="ai-diag-badge ai-diag-badge--critical">
                  <AlertCircle size={13} />
                  <span>要対応 {counts.critical}件</span>
                </div>
              )}
              {counts.warning > 0 && (
                <div className="ai-diag-badge ai-diag-badge--warning">
                  <AlertTriangle size={13} />
                  <span>要確認 {counts.warning}件</span>
                </div>
              )}
              {counts.suggestion > 0 && (
                <div className="ai-diag-badge ai-diag-badge--suggestion">
                  <Lightbulb size={13} />
                  <span>改善提案 {counts.suggestion}件</span>
                </div>
              )}
              {allClear && (
                <div className="ai-diag-badge ai-diag-badge--clear">
                  <CheckCircle2 size={13} />
                  <span>問題なし</span>
                </div>
              )}
            </div>

            {/* 全クリアメッセージ */}
            {allClear ? (
              <div className="ai-diag-all-clear">
                <CheckCircle2 size={40} style={{ color: '#34d399' }} />
                <p className="ai-diag-all-clear-title">診断クリア！</p>
                <p className="ai-diag-all-clear-desc">
                  入力内容・整合性・法的要件に問題は検出されませんでした。
                  このまま申請準備を進めてください。
                </p>
              </div>
            ) : (
              /* カテゴリ別グループ（法的リスク → 整合性 → 入力 の優先順） */
              <div className="ai-diag-groups">
                <CategoryGroup category="legal" items={grouped.legal} />
                <CategoryGroup category="consistency" items={grouped.consistency} />
                <CategoryGroup category="input" items={grouped.input} />
              </div>
            )}

            {/* フッター注記 */}
            <div className="ai-diag-footer">
              <p>
                ※ この診断はAIによる補助的なチェックです。
                実際の申請においては担当行政書士による最終確認を必ず行ってください。
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
