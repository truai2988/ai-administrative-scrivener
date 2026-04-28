'use client';

/**
 * useDiagnosticJumpLearning.ts
 *
 * AI診断パネルのエラーカードから入力欄へのジャンプ先を学習する機能のカスタムフック。
 *
 * ■ 機能:
 *   - リンク修正モードの状態管理（isLinkingMode / linkingField）
 *   - document クリックイベントリスナーによるフィールド name 属性の取得
 *   - Firestore 学習辞書（mappingPreferences）への保存（diag:: プレフィックス付き）
 *   - handleFieldClick 時の辞書優先参照
 *
 * ■ React の堅牢性:
 *   - useEffect のクリーンアップ関数で removeEventListener を確実に実行
 *   - e.target.closest('[name]') でアイコン等をクリックしても正確にフィールドパスを取得
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useMappingPreferences } from '@/hooks/useMappingPreferences';

/** diag:: プレフィックス付きのキーを生成 */
function diagKey(diagnosticField: string): string {
  return `diag::${diagnosticField}`;
}

interface UseDiagnosticJumpLearningOptions {
  /** トースト通知用コールバック（任意） */
  onToast?: (message: string) => void;
}

interface UseDiagnosticJumpLearningReturn {
  /** リンクモード中かどうか */
  isLinkingMode: boolean;
  /** 現在修正対象のエラーフィールド */
  linkingField: string | null;
  /** 学習済みフィールドキーのセット */
  learnedFields: Set<string>;
  /** リンクモードを開始する */
  startLinking: (diagnosticField: string) => void;
  /** リンクモードを解除する */
  cancelLinking: () => void;
  /** 学習辞書を考慮したフィールドパスの解決（辞書にあればそちらを返す） */
  resolveFieldPath: (diagnosticField: string) => string | null;
}

export function useDiagnosticJumpLearning(
  options?: UseDiagnosticJumpLearningOptions,
): UseDiagnosticJumpLearningReturn {
  const prefs = useMappingPreferences();
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [linkingField, setLinkingField] = useState<string | null>(null);

  // 最新のコールバックをrefで保持（useEffect依存から除外するため）
  const onToastRef = useRef(options?.onToast);
  onToastRef.current = options?.onToast;

  const linkingFieldRef = useRef<string | null>(null);
  linkingFieldRef.current = linkingField;

  // 学習済みフィールドキーのセット
  const learnedFields = useMemo(() => {
    const set = new Set<string>();
    for (const key of Object.keys(prefs.mappings)) {
      if (key.startsWith('diag::')) {
        set.add(key);
      }
    }
    return set;
  }, [prefs.mappings]);

  // ── リンクモード開始 ─────────────────────────────────────────────
  const startLinking = useCallback((diagnosticField: string) => {
    setLinkingField(diagnosticField);
    setIsLinkingMode(true);
  }, []);

  // ── リンクモード解除 ─────────────────────────────────────────────
  const cancelLinking = useCallback(() => {
    setIsLinkingMode(false);
    setLinkingField(null);
  }, []);

  // ── リンクモード中の document クリックリスナー ──────────────────
  useEffect(() => {
    if (!isLinkingMode) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // AI診断パネル内のクリックは無視（パネル自身のボタン等を誤検知しないため）
      if (target.closest('.ai-diag-drawer')) return;

      // 最寄りの name 属性を持つ要素を取得（アイコン・span等を考慮）
      const fieldEl = target.closest('[name]') as HTMLElement | null;
      if (!fieldEl) return;

      const fieldPath = fieldEl.getAttribute('name');
      if (!fieldPath) return;

      const currentLinkingField = linkingFieldRef.current;
      if (!currentLinkingField) return;

      // イベントの通常動作を阻止（フォーカス移動を維持しつつ、他の処理は止める）
      e.stopPropagation();

      // 学習データを Firestore に保存
      const key = diagKey(currentLinkingField);
      prefs.saveMappingToFirestore(key, fieldPath);

      console.log(
        `[DiagJumpLearning] 🎯 学習保存: "${currentLinkingField}" → "${fieldPath}"`,
      );

      // リンクモードを解除
      setIsLinkingMode(false);
      setLinkingField(null);

      // トースト通知
      if (onToastRef.current) {
        onToastRef.current('ジャンプ先を学習しました');
      }
    };

    // capture: true でフォーム内の他のハンドラーより先に処理する
    document.addEventListener('click', handleDocumentClick, { capture: true });

    // クリーンアップ: メモリリーク防止 & 多重発火防止
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, [isLinkingMode, prefs]);

  // ── 学習辞書を考慮したフィールドパスの解決 ─────────────────────
  const resolveFieldPath = useCallback(
    (diagnosticField: string): string | null => {
      const key = diagKey(diagnosticField);
      return prefs.mappings[key] || null;
    },
    [prefs.mappings],
  );

  return {
    isLinkingMode,
    linkingField,
    learnedFields,
    startLinking,
    cancelLinking,
    resolveFieldPath,
  };
}
