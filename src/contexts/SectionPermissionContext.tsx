'use client';

/**
 * SectionPermissionContext
 *
 * タブ（セクション）ごとの編集権限を管理するコンテキスト。
 *
 * - scrivener（行政書士）は常に全タブ編集可能
 * - branch_staff / enterprise_staff は設定画面で設定されたテンプレートに従い、
 *   担当タブのみ編集可能
 *
 * ■ 担当者設定は「申請種別ごと」に設定画面（/settings）で一元管理する。
 *   個別申請ドキュメントへの assignments 書き込みは行わない。
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import type { ApplicationKind, TabAssignmentTemplate } from '@/lib/constants/assignmentTemplates';
import { DEFAULT_ASSIGNMENT_TEMPLATES } from '@/lib/constants/assignmentTemplates';
import type { UserRole } from '@/types/database';

/** タブIDは申請種別ごとに異なるため string で管理 */
type TabId = string;

// ─── コンテキスト型定義 ──────────────────────────────────────────────────────

interface SectionPermissionContextType {
  /** タブIDを渡すと、現在のユーザーが編集可能かどうかを返す */
  isEditable: (tabId: TabId) => boolean;
  /** DBから取得した最新のテンプレート設定 */
  templatesRecord: Record<ApplicationKind, TabAssignmentTemplate>;
}

const SectionPermissionContext = createContext<SectionPermissionContextType>({
  isEditable: () => true,
  templatesRecord: DEFAULT_ASSIGNMENT_TEMPLATES,
});

// ─── プロバイダー ─────────────────────────────────────────────────────────────

interface SectionPermissionProviderProps {
  children: React.ReactNode;
  /** 現在ログイン中のユーザーのロール */
  currentUserRole: UserRole;
  /** DBから取得したテンプレート（無い場合はデフォルトが使われる） */
  templatesRecord?: Record<ApplicationKind, TabAssignmentTemplate>;
}

export function SectionPermissionProvider({
  children,
  currentUserRole,
  templatesRecord = DEFAULT_ASSIGNMENT_TEMPLATES,
}: SectionPermissionProviderProps) {

  const isEditable = useCallback(
    (tabId: TabId): boolean => {
      // 所属企業（enterprise_staff）は「所属機関タブ（employer）」のみ閲覧・編集可
      if (currentUserRole === 'enterprise_staff') {
        return tabId === 'employer';
      }
      
      // それ以外の権限（行政書士、東京直轄、登録した担当支部）は全てのタブを閲覧・編集可
      return true;
    },
    [currentUserRole]
  );

  const value = useMemo(
    () => ({ isEditable, templatesRecord }),
    [isEditable, templatesRecord]
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
