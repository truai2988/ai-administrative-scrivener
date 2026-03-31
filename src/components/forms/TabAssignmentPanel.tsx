'use client';

/**
 * TabAssignmentPanel
 * 各タブに担当者を割り当てるUI。
 * 行政書士のみが操作でき、タブナビゲーションの下に折りたたみで表示する。
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, UserCog } from 'lucide-react';
import { useSectionPermission, TEST_USERS } from '@/contexts/SectionPermissionContext';
import type { TabId } from '@/lib/schemas/renewalApplicationSchema';

const TAB_LABELS: Record<TabId, string> = {
  foreigner:    '外国人本人情報',
  employer:     '所属機関（企業）情報',
  simultaneous: '同時申請',
};

const TAB_IDS: TabId[] = ['foreigner', 'employer', 'simultaneous'];

export function TabAssignmentPanel() {
  const { isScrivener, assignments, assignUser } = useSectionPermission();
  const [isOpen, setIsOpen] = useState(false);

  // 行政書士以外には表示しない
  if (!isScrivener) return null;

  return (
    <div className="tab-assignment-panel">
      <button
        type="button"
        className="tab-assignment-toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <UserCog size={15} />
        <span>担当者割り当て設定</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className="tab-assignment-body">
          <p className="tab-assignment-desc">
            各タブの担当者を指定します。担当者はそのタブのみ編集できます（行政書士は常に全タブ編集可）。
          </p>
          <div className="tab-assignment-rows">
            {TAB_IDS.map((tabId) => (
              <div key={tabId} className="tab-assignment-row">
                <label
                  htmlFor={`assign-${tabId}`}
                  className="tab-assignment-tab-label"
                >
                  {TAB_LABELS[tabId]}
                </label>
                <select
                  id={`assign-${tabId}`}
                  className="tab-assignment-select"
                  value={assignments[tabId] ?? ''}
                  onChange={(e) => assignUser(tabId, e.target.value)}
                >
                  <option value="">担当者なし（行政書士のみ）</option>
                  {/* ダミーの担当者リスト。後でFirestoreのusersコレクションから動的に取得可能な設計 */}
                  {TEST_USERS.filter((u) => !u.isAdmin).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
                </select>
                <div className="tab-assignment-status">
                  {assignments[tabId] ? (
                    <span className="badge badge--assigned">
                      {TEST_USERS.find((u) => u.id === assignments[tabId])?.displayName ?? assignments[tabId]}
                    </span>
                  ) : (
                    <span className="badge badge--unassigned">未割り当て</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
