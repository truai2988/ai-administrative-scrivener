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
  MousePointerClick,
} from 'lucide-react';
import type { DiagnosticItem, DiagnosticCategory, DiagnosticLevel, AiDiagnosticsStatus } from '@/types/aiDiagnostics';
import { translateFieldPath } from '@/lib/constants/fieldTranslations';

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
  errorMessage?: string;
  onDiagnose?: () => void;
  /** エラー項目がクリックされたときのハンドラー */
  onFieldClick?: (fieldPath: string) => void;
}

// ─── 診断アイテムカード ───────────────────────────────────────────────────────
function DiagnosticCard({ item, onClick }: { item: DiagnosticItem; onClick?: () => void }) {
  const level = LEVEL_CONFIG[item.level];
  const { Icon } = level;

  return (
    <div 
      className={`ai-diag-item ${onClick ? 'cursor-pointer hover:bg-slate-800/50 transition-colors' : ''}`}
      style={{
        background: level.bgColor,
        borderColor: level.borderColor,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={onClick ? "クリックして該当の入力欄へ移動" : undefined}
    >
      <div className="ai-diag-item-header">
        <Icon size={15} style={{ color: level.color, flexShrink: 0 }} />
        <span className="ai-diag-item-level" style={{ color: level.color }}>
          {level.label}
        </span>
        <span className="ai-diag-item-field flex-1 truncate" title={item.field}>
          {translateFieldPath(item.field)}
        </span>
        {onClick && (
          <MousePointerClick size={14} className="text-slate-500 shrink-0 ml-1 opacity-50" />
        )}
      </div>
      <p className="ai-diag-item-message">{item.message}</p>
    </div>
  );
}

// ─── カテゴリグループ ────────────────────────────────────────────────────────
function CategoryGroup({
  category,
  items,
  onFieldClick,
}: {
  category: DiagnosticCategory;
  items: DiagnosticItem[];
  onFieldClick?: (fieldPath: string) => void;
}) {
  if (items.length === 0) return null;
  const { label, Icon } = CATEGORY_CONFIG[category];

  return (
    <div className="ai-diag-group">
      <div className="ai-diag-group-header">
        <Icon size={14} className="ai-diag-group-icon" />
        <span>{label}</span>
      </div>
      <div className="ai-diag-group-items">
        {items.map((item, i) => (
          <DiagnosticCard 
            key={i} 
            item={item} 
            onClick={onFieldClick ? () => onFieldClick(item.field) : undefined} 
          />
        ))}
      </div>
    </div>
  );
}

export function AiDiagnosticPanel({
  status,
  diagnostics,
  errorMessage,
  onDiagnose,
  onFieldClick,
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
          {onDiagnose ? (
            <button
              type="button"
              className={`ai-check-btn ${status === 'loading' ? 'ai-check-btn--loading' : ''} flex-1 justify-center`}
              onClick={onDiagnose}
              disabled={status === 'loading'}
              title="入力内容・整合性・法的リスクをAIが診断します"
            >
              {status === 'loading' ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Sparkles size={16} />
              )}
              <span className="hidden sm:inline">
                {status === 'loading' ? 'AI診断中...' : 'AIで書類・入力内容を診断する'}
              </span>
              <span className="sm:hidden">
                {status === 'loading' ? '解析中...' : 'AI診断'}
              </span>
            </button>
          ) : (
            <div className="ai-diag-header-title">
              <Sparkles size={18} className="ai-diag-sparkle" />
              <span>AI診断レポート</span>
            </div>
          )}
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
          <div className="ai-diag-body">            {/* 全クリアメッセージ */}
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
                <CategoryGroup category="legal" items={grouped.legal} onFieldClick={onFieldClick} />
                <CategoryGroup category="consistency" items={grouped.consistency} onFieldClick={onFieldClick} />
                <CategoryGroup category="input" items={grouped.input} onFieldClick={onFieldClick} />
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
