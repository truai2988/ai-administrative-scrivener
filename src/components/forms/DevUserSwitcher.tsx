'use client';

/**
 * DevUserSwitcher
 * 開発環境でのみ表示されるテスト用ユーザー切り替えUI。
 * フォーム上部にフローティングバーとして配置する。
 */

import React from 'react';
import { useSectionPermission } from '@/contexts/SectionPermissionContext';
import { TEST_USERS } from '@/lib/constants/testUsers';

const ROLE_ICONS: Record<string, string> = {
  scrivener: '⚖️',
  hq_admin: '🏢',
  branch_staff: '🏪',
  enterprise_staff: '🏭',
};

export function DevUserSwitcher() {
  const { currentTestUser, setCurrentTestUser } = useSectionPermission();

  return (
    <div className="dev-switcher" role="region" aria-label="テスト用ユーザー切り替え">
      <span className="dev-switcher__label">
        🔧 テスト: ログインユーザーを切り替え
      </span>
      <div className="dev-switcher__buttons">
        {TEST_USERS.map((user) => (
          <button
            key={user.id}
            type="button"
            className={`dev-switcher__btn ${
              currentTestUser.id === user.id ? 'dev-switcher__btn--active' : ''
            }`}
            onClick={() => setCurrentTestUser(user)}
          >
            {ROLE_ICONS[user.role] ?? '👤'}
            {user.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
