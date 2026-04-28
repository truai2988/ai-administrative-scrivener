'use client';

/**
 * SectionPermissionContext
 *
 * タブ（セクション）ごとの編集権限を管理するコンテキスト。
 *
 * - scrivener（行政書士）・hq_admin（本部管理者）は常に全タブ編集可能
 * - branch_staff / enterprise_staff は assignments で担当になっているタブのみ編集可能
 *
 * ダミーユーザー（TEST_USERS）は完全撤廃し、useAuth から取得した
 * 実際のユーザー情報（role / id）で権限を管理する。
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { ApplicationKind, TabAssignmentTemplate } from '@/lib/constants/assignmentTemplates';
import type { TabId, TabAssignments } from '@/lib/schemas/renewalApplicationSchema';
import { DEFAULT_ASSIGNMENT_TEMPLATES } from '@/lib/constants/assignmentTemplates';
import type { UserRole } from '@/types/database';

// ─── コンテキスト型定義 ──────────────────────────────────────────────────────

interface SectionPermissionContextType {
  /** タブIDを渡すと、現在のユーザーが編集可能かどうかを返す */
  isEditable: (tabId: TabId) => boolean;
  /** 現在の担当者割り当てマップ */
  assignments: TabAssignments;
  /** 担当者を割り当てる（行政書士専用） */
  assignUser: (tabId: TabId, userId: string) => void;
  /** 全タブの担当者をまとめて割り当てる */
  assignAllUsers: (newAssignments: TabAssignments) => void;
  /** 担当者割り当てUI（TabAssignmentPanel）を表示・操作できるか（行政書士・東京本部専用） */
  canAssignUsers: boolean;
  /** DBから取得した最新のテンプレート設定 */
  templatesRecord: Record<ApplicationKind, TabAssignmentTemplate>;
}

const SectionPermissionContext = createContext<SectionPermissionContextType>({
  isEditable: () => true,
  assignments: {},
  assignUser: () => {},
  assignAllUsers: () => {},
  canAssignUsers: false,
  templatesRecord: DEFAULT_ASSIGNMENT_TEMPLATES,
});

// ─── プロバイダー ─────────────────────────────────────────────────────────────

interface SectionPermissionProviderProps {
  children: React.ReactNode;
  /** 現在ログイン中のユーザーのロール */
  currentUserRole: UserRole;
  /** 初期割り当てマップ（既存レコードから読み込んだ値） */
  initialAssignments?: TabAssignments;
  /** DBから取得したテンプレート（無い場合はデフォルトが使われる） */
  templatesRecord?: Record<ApplicationKind, TabAssignmentTemplate>;
  /** 割り当て変更時のコールバック（Firestoreへの保存などに利用） */
  onAssignmentsChange?: (assignments: TabAssignments) => void;
}

export function SectionPermissionProvider({
  children,
  currentUserRole,
  initialAssignments = {},
  templatesRecord = DEFAULT_ASSIGNMENT_TEMPLATES,
  onAssignmentsChange,
}: SectionPermissionProviderProps) {
  const [assignments, setAssignments] = useState<TabAssignments>(initialAssignments);

  /**
   * canAssignUsers: 担当者割り当てパネル（TabAssignmentPanel）の表示・操作権限
   * → scrivener（行政書士）および hq_admin（本部管理者）が担当者割り当てを変更できる。
   */
  const canAssignUsers = currentUserRole === 'scrivener' || currentUserRole === 'hq_admin';

  const isEditable = useCallback(
    (tabId: TabId): boolean => {
      // 所属企業（enterprise_staff）は「所属機関タブ（employer）」のみ閲覧・編集可
      if (currentUserRole === 'enterprise_staff') {
        return tabId === 'employer';
      }
      
      // それ以外の権限（行政書士、東京直轄、登録した担当支部）は全てのタブを閲覧・編集可
      // ※担当者割り当て(assignments)に関わらず、アクセス権を持つ関係者は常に編集可能とする
      return true;
    },
    [currentUserRole]
  );

  /**
   * タブに担当者を割り当てる
   * 行政書士・東京本部のみ呼び出せる想定（UI側でも制御）
   */
  const assignUser = useCallback(
    (tabId: TabId, userId: string) => {
      const next = { ...assignments, [tabId]: userId || undefined } as TabAssignments;
      if (!userId) {
        delete next[tabId];
      }
      setAssignments(next);
      onAssignmentsChange?.(next);
    },
    [assignments, onAssignmentsChange]
  );

  const assignAllUsers = useCallback(
    (newAssignments: TabAssignments) => {
      setAssignments(newAssignments);
      onAssignmentsChange?.(newAssignments);
    },
    [onAssignmentsChange]
  );

  const value = useMemo(
    () => ({ isEditable, assignments, assignUser, assignAllUsers, canAssignUsers, templatesRecord }),
    [isEditable, assignments, assignUser, assignAllUsers, canAssignUsers, templatesRecord]
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
