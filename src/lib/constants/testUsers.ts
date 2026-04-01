import type { UserRole } from '@/types/database';

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
