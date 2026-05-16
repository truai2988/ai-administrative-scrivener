'use client';

/**
 * SectionPermissionContext
 *
 * タブ（セクション）ごとの編集権限を管理するコンテキスト。
 *
 * - scrivener（行政書士）は常に全タブ編集可能
 * - union_staff / enterprise_staff はフォーム入力不可（読み取り専用）
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import type { UserRole } from '@/types/database';

/** タブIDは申請種別ごとに異なるため string で管理 */
type TabId = string;

// ─── コンテキスト型定義 ──────────────────────────────────────────────────────

interface SectionPermissionContextType {
  /** タブIDを渡すと、現在のユーザーが編集可能かどうかを返す */
  isEditable: (tabId: TabId) => boolean;
}

const SectionPermissionContext = createContext<SectionPermissionContextType>({
  isEditable: () => true,
});

// ─── プロバイダー ─────────────────────────────────────────────────────────────

interface SectionPermissionProviderProps {
  children: React.ReactNode;
  /** 現在ログイン中のユーザーのロール */
  currentUserRole: UserRole;
}

export function SectionPermissionProvider({
  children,
  currentUserRole,
}: SectionPermissionProviderProps) {

  const isEditable = useCallback(
    (): boolean => {
      // 行政書士は全タブ編集可能
      if (currentUserRole === 'scrivener') return true;

      // union_staff / enterprise_staff はフォーム入力不可（読み取り専用）
      // ※ 書類アップロード機能は AttachmentContext で別途制御するため、ここでは false
      return false;
    },
    [currentUserRole]
  );

  const value = useMemo(
    () => ({ isEditable }),
    [isEditable]
  );

  return (
    <SectionPermissionContext.Provider value={value}>
      {children}
    </SectionPermissionContext.Provider>
  );
}

// ─── カスタムフック ───────────────────────────────────────────────────────────

export function useSectionPermission() {
  return useContext(SectionPermissionContext);
}
