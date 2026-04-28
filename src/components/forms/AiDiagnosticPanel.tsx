'use client';

/**
 * AiDiagnosticPanel
 *
 * AI診断結果を表示するスライドイン Drawer コンポーネント。
 * 画面右側からスライドインし、critical / warning / suggestion を色分けして表示します。
 *
 * ■ ジャンプ先学習機能（2026-04 追加）:
 *   各エラーカードに「🎯 ジャンプ先を修正」ボタンを配置。
 *   ボタン押下でリンク修正モードに入り、ユーザーが正しいフォームフィールドを
 *   クリックして学習データを保存する。
 */

import React, { useMemo, useState, useCallback } from 'react';
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
  Crosshair,
  Send,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import type { DiagnosticItem, DiagnosticCategory, DiagnosticLevel, AiDiagnosticsStatus } from '@/types/aiDiagnostics';
import { translateFieldPath } from '@/lib/constants/fieldTranslations';
import { getIdToken } from '@/lib/firebase/auth';

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
export interface AiDiagnosticPanelProps {
  status: AiDiagnosticsStatus;
  diagnostics: DiagnosticItem[];
  errorMessage?: string;
  onDiagnose?: () => void;
  /** エラー項目がクリックされたときのハンドラー */
  onFieldClick?: (fieldPath: string) => void;
  /** ジャンプ先修正モードを開始するハンドラー */
  onStartLinking?: (diagnosticField: string) => void;
  /** リンクモード中かどうか */
  isLinkingMode?: boolean;
  /** 現在リンク修正対象のフィールド */
  linkingField?: string | null;
  /** 学習済みフィールドのセット（学習済みかどうかの表示用） */
  learnedFields?: Set<string>;
}

// ─── クイックルール追加フォーム ───────────────────────────────────────────────
function QuickRuleAddForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: (msg: string) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      setError('ルール名と内容は必須です');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('ログインセッションが切れています');
      const res = await fetch('/api/ai-rules', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      onSuccess('新しいルールを学習しました。次回の診断から適用されます。');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }, [title, content, onClose, onSuccess]);

  return (
    <div className="ai-diag-quick-rule">
      <div className="ai-diag-quick-rule-header">
        <BookOpen size={14} />
        <span>AIに新しいルールを教える</span>
      </div>

      <div className="ai-diag-quick-rule-body">
        <div className="ai-diag-quick-rule-field">
          <label className="ai-diag-quick-rule-label">ルール名</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：パスポート番号の形式チェック"
            className="ai-diag-quick-rule-input"
            disabled={saving}
          />
        </div>
        <div className="ai-diag-quick-rule-field">
          <div className="ai-diag-quick-rule-label-row" style={{ justifyContent: 'space-between' }}>
            <label className="ai-diag-quick-rule-label">ルール内容（AIへの指示文）</label>
            <button
              type="button"
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <HelpCircle size={14} />
              {showHints ? '閉じる' : '記述例を見る'}
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder={"例：月給が180,000円を下回る場合は warning を出すこと。\nメッセージ：「2025年10月の最低賃金改定により…」"}
            className="ai-diag-quick-rule-textarea"
            disabled={saving}
          />
          
          {showHints && (
            <div className="ai-diag-quick-rule-hints-inline mt-2 p-3 bg-slate-800/80 border border-indigo-500/30 rounded-md text-slate-300 text-xs leading-relaxed space-y-3">
              <p className="font-bold text-indigo-300 border-b border-indigo-500/30 pb-1 mb-2">AI指示文の記述例</p>
              <div>
                <strong className="block text-indigo-400 mb-1">例1：項目間の整合性チェック</strong>
                <p>「『現在の在留資格』が「技術・人文知識・国際業務」の場合、『最終学歴』が「大学卒業」以上であるか、もしくは『職歴』に10年以上の記載があるかを必ず確認してください。どちらも満たしていない場合はエラーとして指摘してください。」</p>
              </div>
              <div>
                <strong className="block text-indigo-400 mb-1">例2：行政特有の厳格なフォーマット</strong>
                <p>「『氏名（英字）』の欄に、カンマ（,）が含まれている場合はエラーにしてください。パスポートのMRZ（機械読取領域）と同じく、スペース区切りのみ許容されます。」</p>
              </div>
              <div>
                <strong className="block text-indigo-400 mb-1">例3：実務上の「よくあるポカミス」</strong>
                <p>「『日本における連絡先（住所）』と『所属機関等の住所』が完全に一致している場合、リモートワークや個人事業主でない限り不自然です。『所属機関の住所を誤って個人の連絡先に入力していないか確認してください』という警告を出してください。」</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="ai-diag-quick-rule-error">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}

        <div className="ai-diag-quick-rule-actions">
          <button
            type="button"
            className="ai-diag-quick-rule-cancel"
            onClick={onClose}
            disabled={saving}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="ai-diag-quick-rule-submit"
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !content.trim()}
          >
            {saving ? (
              <Loader2 size={13} className="spin" />
            ) : (
              <Send size={13} />
            )}
            {saving ? '保存中...' : 'ルールを保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 診断アイテムカード ───────────────────────────────────────────────────────
function DiagnosticCard({
  item,
  onClick,
  onStartLinking,
  isLinkingMode,
  isLinkingTarget,
  isLearned,
}: {
  item: DiagnosticItem;
  onClick?: () => void;
  onStartLinking?: () => void;
  isLinkingMode?: boolean;
  isLinkingTarget?: boolean;
  isLearned?: boolean;
}) {
  const level = LEVEL_CONFIG[item.level];
  const { Icon } = level;

  return (
    <div
      className={[
        'ai-diag-item',
        onClick && !isLinkingMode ? 'cursor-pointer hover:bg-slate-800/50 transition-colors' : '',
        isLinkingTarget ? 'ai-diag-item--linking' : '',
      ].filter(Boolean).join(' ')}
      style={{
        background: isLinkingTarget ? 'rgba(56, 189, 248, 0.12)' : level.bgColor,
        borderColor: isLinkingTarget ? 'rgba(56, 189, 248, 0.6)' : level.borderColor,
      }}
      onClick={onClick && !isLinkingMode ? onClick : undefined}
      role={onClick && !isLinkingMode ? 'button' : undefined}
      tabIndex={onClick && !isLinkingMode ? 0 : undefined}
      title={onClick && !isLinkingMode ? "クリックして該当の入力欄へ移動" : undefined}
    >
      <div className="ai-diag-item-header">
        <Icon size={15} style={{ color: level.color, flexShrink: 0 }} />
        <span className="ai-diag-item-level" style={{ color: level.color }}>
          {level.label}
        </span>
        <span className="ai-diag-item-field flex-1 truncate" title={item.field}>
          {translateFieldPath(item.field)}
        </span>
        {isLearned && (
          <span className="ai-diag-learned-badge" title="ジャンプ先学習済み">✓</span>
        )}
        {onClick && !isLinkingMode && (
          <MousePointerClick size={14} className="text-slate-500 shrink-0 ml-1 opacity-50" />
        )}
      </div>
      <p className="ai-diag-item-message">{item.message}</p>

      {/* ─── ジャンプ先修正ボタン ─── */}
      {onStartLinking && (
        <div className="ai-diag-item-actions">
          {isLinkingTarget ? (
            <span className="ai-diag-linking-status">
              <Crosshair size={12} className="spin-slow" />
              入力欄をクリックしてください…
            </span>
          ) : (
            <button
              type="button"
              className="ai-diag-link-fix-btn"
              onClick={(e) => {
                e.stopPropagation();
                onStartLinking();
              }}
              disabled={isLinkingMode}
              title="このエラーのジャンプ先を手動で修正します"
            >
              <Crosshair size={12} />
              ジャンプ先を修正
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── カテゴリグループ ────────────────────────────────────────────────────────
function CategoryGroup({
  category,
  items,
  onFieldClick,
  onStartLinking,
  isLinkingMode,
  linkingField,
  learnedFields,
}: {
  category: DiagnosticCategory;
  items: DiagnosticItem[];
  onFieldClick?: (fieldPath: string) => void;
  onStartLinking?: (diagnosticField: string) => void;
  isLinkingMode?: boolean;
  linkingField?: string | null;
  learnedFields?: Set<string>;
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
            onStartLinking={onStartLinking ? () => onStartLinking(item.field) : undefined}
            isLinkingMode={isLinkingMode}
            isLinkingTarget={linkingField === item.field}
            isLearned={learnedFields?.has(`diag::${item.field}`)}
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
  onStartLinking,
  isLinkingMode,
  linkingField,
  learnedFields,
}: AiDiagnosticPanelProps) {

  // カテゴリ別グループ化
  const grouped = useMemo(() => ({
    legal:       diagnostics.filter((d) => d.category === 'legal'),
    consistency: diagnostics.filter((d) => d.category === 'consistency'),
    input:       diagnostics.filter((d) => d.category === 'input'),
  }), [diagnostics]);

  const allClear = status === 'success' && diagnostics.length === 0;

  // ── タブ・クイックルール追加の状態 ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'results' | 'rules'>('results');
  const [quickRuleToast, setQuickRuleToast] = useState<string | null>(null);

  const handleQuickRuleSuccess = useCallback((msg: string) => {
    setQuickRuleToast(msg);
    setTimeout(() => setQuickRuleToast(null), 4000);
    setActiveTab('results'); // switch back after saving
  }, []);

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

        {/* ─── タブナビゲーション ─── */}
        <div className="flex border-b border-indigo-500/20 bg-slate-900/50 shrink-0">
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'results' ? 'text-indigo-300 border-b-2 border-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Sparkles size={14} />
            診断結果
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'rules' ? 'text-indigo-300 border-b-2 border-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <BookOpen size={14} />
            AIルール学習
          </button>
        </div>

        {activeTab === 'rules' ? (
          <div className="ai-diag-body">
            <div className="p-4 pt-6 ai-diag-quick-rule-area border-none">
              {quickRuleToast && (
                <div className="ai-diag-quick-rule-toast mb-4">
                  <CheckCircle2 size={14} />
                  <span>{quickRuleToast}</span>
                </div>
              )}
              <QuickRuleAddForm
                onClose={() => setActiveTab('results')}
                onSuccess={handleQuickRuleSuccess}
              />
            </div>
          </div>
        ) : (
          <>
        {/* ─── リンクモード中バナー ─── */}
        {isLinkingMode && (
          <div className="ai-diag-linking-overlay">
            <Crosshair size={16} className="spin-slow" />
            <span>フォーム上の正しい入力欄をクリックしてください</span>
          </div>
        )}

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
                <CategoryGroup
                  category="legal"
                  items={grouped.legal}
                  onFieldClick={onFieldClick}
                  onStartLinking={onStartLinking}
                  isLinkingMode={isLinkingMode}
                  linkingField={linkingField}
                  learnedFields={learnedFields}
                />
                <CategoryGroup
                  category="consistency"
                  items={grouped.consistency}
                  onFieldClick={onFieldClick}
                  onStartLinking={onStartLinking}
                  isLinkingMode={isLinkingMode}
                  linkingField={linkingField}
                  learnedFields={learnedFields}
                />
                <CategoryGroup
                  category="input"
                  items={grouped.input}
                  onFieldClick={onFieldClick}
                  onStartLinking={onStartLinking}
                  isLinkingMode={isLinkingMode}
                  linkingField={linkingField}
                  learnedFields={learnedFields}
                />
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
        </>
        )}
      </aside>
    </>
  );
}
