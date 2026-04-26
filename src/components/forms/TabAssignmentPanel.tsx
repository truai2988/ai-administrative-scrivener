'use client';

/**
 * TabAssignmentPanel
 * 各タブに担当者を割り当てるUI。
 *
 * - 行政書士のみが操作できる（それ以外は非表示）
 * - 新規申請書作成時はテンプレートから自動セットされた状態で開く
 * - 手動変更した場合は「手動変更」バッジに切り替わる
 * - 「テンプレートに戻す」ボタンで自動セット状態に戻せる
 */

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, UserCog, RotateCcw } from 'lucide-react';
import { useSectionPermission } from '@/contexts/SectionPermissionContext';
import { TEST_USERS } from '@/lib/constants/testUsers';
import type { TabId } from '@/lib/schemas/renewalApplicationSchema';
import { resolveTemplate, isTemplateDefault } from '@/lib/constants/assignmentTemplates';

const TAB_LABELS: Record<TabId, string> = {
  foreigner:    '外国人本人情報',
  employer:     '所属機関（企業）情報',
  simultaneous: '同時申請',
};

const TAB_IDS: TabId[] = ['foreigner', 'employer', 'simultaneous'];

export function TabAssignmentPanel() {
  const { isScrivener, assignments, assignUser, assignAllUsers, templatesRecord } = useSectionPermission();
  const [isOpen, setIsOpen] = useState(false);

  // 現在のassignmentsがテンプレートのデフォルト値と一致しているか
  const isDefault = isTemplateDefault('renewal', assignments, undefined, templatesRecord);

  // テンプレートに戻す処理
  const handleResetToTemplate = useCallback(() => {
    const templateAssignments = resolveTemplate('renewal', undefined, templatesRecord);
    
    // テンプレートの値を元に新しいオブジェクトを構築し、一括でセットする
    const newAssignments: Partial<Record<TabId, string>> = {};
    TAB_IDS.forEach((tabId) => {
      const templateVal = templateAssignments[tabId];
      if (templateVal) {
        newAssignments[tabId] = templateVal;
      }
    });
    assignAllUsers(newAssignments);
  }, [assignAllUsers, templatesRecord]);

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
        <UserCog size={14} />
        <span>担当者</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className="tab-assignment-body">
          <div className="tab-assignment-header-row">
            <p className="tab-assignment-desc">
              各タブの担当者を指定します。担当者はそのタブのみ編集できます（行政書士は常に全タブ編集可）。
            </p>
            {/* テンプレートに戻すボタン（手動変更された場合のみ表示） */}
            {!isDefault && (
              <button
                type="button"
                className="tab-assignment-reset-btn"
                onClick={handleResetToTemplate}
                title="申請種別のデフォルト担当者に戻す"
              >
                <RotateCcw size={12} />
                テンプレートに戻す
              </button>
            )}
          </div>

          <div className="tab-assignment-rows">
            {TAB_IDS.map((tabId) => {
              const templateValue = resolveTemplate('renewal', undefined, templatesRecord)[tabId] || '';
              const currentValue = assignments[tabId] || '';
              const isTabModified = currentValue !== templateValue;

              return (
                <div key={tabId} className="tab-assignment-row">
                  <label
                    htmlFor={`assign-${tabId}`}
                    className="tab-assignment-tab-label"
                  >
                    {TAB_LABELS[tabId]}
                    {/* タブ単位の変更インジケーター */}
                    {isTabModified && (
                      <span className="tab-assignment-tab-modified">変更済</span>
                    )}
                  </label>
                  <div className="tab-assignment-controls">
                    <select
                      id={`assign-${tabId}`}
                      className="tab-assignment-select"
                      value={assignments[tabId] ?? ''}
                      onChange={(e) => assignUser(tabId, e.target.value)}
                    >
                      <option value="">担当者なし（行政書士のみ）</option>
                      {/* ダミーの担当者リスト。将来はFirestoreのusersコレクションから動的に取得 */}
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
