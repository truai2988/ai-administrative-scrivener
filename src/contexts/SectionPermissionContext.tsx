'use client';

/**
 * SectionPermissionContext
 *
 * タブ（セクション）ごとの編集権限を管理するコンテキスト。
 *
 * - 行政書士（scrivener）・本部管理者（hq_admin）は常に全タブ編集可能
 * - それ以外のロールは assignments で担当になっているタブのみ編集可能
 * - テスト用として devUser（仮ユーザー）を切り替える機能も内包
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { TabId, TabAssignments } from '@/lib/schemas/renewalApplicationSchema';
import type { UserRole } from '@/types/database';

// ─── テスト用ダミーユーザー定義 ──────────────────────────────────────────────

export interface TestUser {
  id: string;
  displayName: string;
  role: UserRole | 'enterprise_staff'; // enterprise_staffは企業担当者（system外の想定）
  /** 行政書士・本部管理者であれば全タブ書き込み可 */
  isAdmin: boolean;
}

export const TEST_USERS: TestUser[] = [
  {
    id: 'scrivener_01',
    displayName: '行政書士（管理者）',
    role: 'scrivener',
    isAdmin: true,
  },
  {
    id: 'branch_staff_01',
    displayName: 'A支部 事務員',
    role: 'branch_staff',
    isAdmin: false,
  },
  {
    id: 'enterprise_01',
    displayName: 'B企業 担当者',
    role: 'enterprise_staff',
    isAdmin: false,
  },
];

// ─── コンテキスト型定義 ──────────────────────────────────────────────────────

interface SectionPermissionContextType {
  /** 現在のテスト用ユーザー */
  currentTestUser: TestUser;
  /** テスト用ユーザーを変更 */
  setCurrentTestUser: (user: TestUser) => void;
  /** タブIDを渡すと、現在のユーザーが編集可能かどうかを返す */
  isEditable: (tabId: TabId) => boolean;
  /** 現在の担当者割り当てマップ */
  assignments: TabAssignments;
  /** 担当者を割り当てる（行政書士専用） */
  assignUser: (tabId: TabId, userId: string) => void;
  /** 行政書士か（担当者割り当てUI表示制御用） */
  isScrivener: boolean;
}

const SectionPermissionContext = createContext<SectionPermissionContextType>({
  currentTestUser: TEST_USERS[0],
  setCurrentTestUser: () => {},
  isEditable: () => true,
  assignments: {},
  assignUser: () => {},
  isScrivener: true,
});

// ─── プロバイダー ─────────────────────────────────────────────────────────────

interface SectionPermissionProviderProps {
  children: React.ReactNode;
  /** 初期割り当てマップ（既存レコードから読み込んだ値） */
  initialAssignments?: TabAssignments;
  /** 割り当て変更時のコールバック（Firestoreへの保存などに利用） */
  onAssignmentsChange?: (assignments: TabAssignments) => void;
}

export function SectionPermissionProvider({
  children,
  initialAssignments = {},
  onAssignmentsChange,
}: SectionPermissionProviderProps) {
  const [currentTestUser, setCurrentTestUserState] = useState<TestUser>(TEST_USERS[0]);
  const [assignments, setAssignments] = useState<TabAssignments>(initialAssignments);

  const setCurrentTestUser = useCallback((user: TestUser) => {
    setCurrentTestUserState(user);
  }, []);

  const isScrivener = currentTestUser.isAdmin;

  /**
   * 現在のユーザーがタブを編集できるか判断
   * - 管理者（行政書士・本部管理者）: 常にtrue
   * - それ以外: assignments[tabId] === currentTestUser.id のときのみtrue
   */
  const isEditable = useCallback(
    (tabId: TabId): boolean => {
      if (currentTestUser.isAdmin) return true;
      return assignments[tabId] === currentTestUser.id;
    },
    [currentTestUser, assignments]
  );

  /**
   * タブに担当者を割り当てる
   * 行政書士のみ呼び出せる想定（UI側でも制御）
   */
  const assignUser = useCallback(
    (tabId: TabId, userId: string) => {
      const next = { ...assignments, [tabId]: userId || undefined } as TabAssignments;
      // userId が空文字なら割り当てを解除
      if (!userId) {
        delete next[tabId];
      }
      setAssignments(next);
      onAssignmentsChange?.(next);
    },
    [assignments, onAssignmentsChange]
  );

  const value = useMemo(
    () => ({ currentTestUser, setCurrentTestUser, isEditable, assignments, assignUser, isScrivener }),
    [currentTestUser, setCurrentTestUser, isEditable, assignments, assignUser, isScrivener]
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
