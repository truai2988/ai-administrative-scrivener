'use client';

/**
 * ClickToFillContext.tsx
 *
 * Click-to-Fill の状態をコンポーネントツリー全体で共有するための React Context。
 *
 * アーキテクチャ:
 *   ClickToFillProvider（FormProvider の内側に配置）
 *     ├─ AiExtractionSidebar（カード一覧・保持操作）
 *     ├─ FormInput / FormSelect / FormTextarea（受け手：onMouseDown で代入）
 *     └─ 各セクションコンポーネント
 *
 * FormProvider が存在しないページ（未対応のフォーム等）では Provider を配置しなければ
 * 共通コンポーネントは通常動作のまま（Context が null のためフィルモード無効）。
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import type { UseClickToFillReturn } from '@/hooks/useClickToFill';
import { useClickToFill } from '@/hooks/useClickToFill';
import { useMappingPreferences } from '@/hooks/useMappingPreferences';
import type { FieldValues } from 'react-hook-form';

// ============================================================
// Context
// ============================================================

const ClickToFillContext = createContext<UseClickToFillReturn<FieldValues> | null>(null);

// ============================================================
// Provider
// ============================================================

/**
 * ClickToFillProvider
 *
 * FormProvider の **内側** に配置する。
 * 内部で useClickToFill() と useMappingPreferences() を統合し、
 * Firestore から学習辞書を読み込み → useClickToFill に注入 → 保存時に Firestore に永続化 する。
 */
export function ClickToFillProvider({ children }: { children: React.ReactNode }) {
  const prefs = useMappingPreferences();
  const ctf = useClickToFill<FieldValues>({
    onSaveMapping: prefs.saveMappingToFirestore,
  });

  // Firestore からロードした辞書を useClickToFill に注入（初回のみ）
  const injectedRef = useRef(false);
  useEffect(() => {
    if (!prefs.isLoading && !injectedRef.current && Object.keys(prefs.mappings).length > 0) {
      ctf.setLearnedMappings(prefs.mappings);
      injectedRef.current = true;
      console.log(`[ClickToFillProvider] 📚 Firestore辞書を注入: ${Object.keys(prefs.mappings).length}件`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.isLoading, prefs.mappings]);

  return (
    <ClickToFillContext.Provider value={ctf}>
      {children}
    </ClickToFillContext.Provider>
  );
}

// ============================================================
// Consumer Hook
// ============================================================

/**
 * useClickToFillContext
 *
 * Provider が存在しない場合は null を返す（安全なフォールバック）。
 * 共通フォーム部品（FormInput 等）はこのフックで Context を取得し、
 * null の場合は通常動作、非 null の場合はフィルモード対応する。
 */
export function useClickToFillContext(): UseClickToFillReturn<FieldValues> | null {
  return useContext(ClickToFillContext);
}

/**
 * useClickToFillRequired
 *
 * Provider の存在が保証されるコンポーネント（AiExtractionSidebar 等）用。
 * null の場合はエラーを投げる。
 */
export function useClickToFillRequired(): UseClickToFillReturn<FieldValues> {
  const ctx = useContext(ClickToFillContext);
  if (!ctx) {
    throw new Error('useClickToFillRequired must be used within a ClickToFillProvider');
  }
  return ctx;
}
