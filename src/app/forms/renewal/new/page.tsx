'use client';

import React, { useEffect, useState } from 'react';
import '../renewal-form.css';
import { RenewalApplicationForm } from '@/components/forms/RenewalApplicationForm';
import { getAssignmentTemplates } from '@/lib/constants/assignmentTemplates';
import { resolveTemplate, type ApplicationKind, type TabAssignmentTemplate } from '@/lib/constants/assignmentTemplates';

/**
 * 更新申請書 新規作成ページ（空フォーム／テスト用）
 *
 * 設定画面などで変更した「最新のデフォルトテンプレート」を引っ張ってきてから
 * フォームを描画するように修正。
 */
export default function RenewalFormNewPage() {
  const [templates, setTemplates] = useState<Record<ApplicationKind, TabAssignmentTemplate> | null>(null);

  useEffect(() => {
    let mounted = true;
    getAssignmentTemplates().then(data => {
      if (mounted) setTemplates(data);
    });
    return () => { mounted = false; };
  }, []);

  if (!templates) {
    return (
      <main className="renewal-page flex items-center justify-center">
        <div className="text-white text-sm">設定を読み込み中...</div>
      </main>
    );
  }

  // 「新規作成」として、最新のテンプレートから担当者を解決
  const initialAssignments = resolveTemplate('renewal', undefined, templates);

  return (
    <main className="renewal-page">
      <div className="renewal-form">
        <RenewalApplicationForm 
          templatesRecord={templates}
          initialAssignments={initialAssignments}
        />
      </div>
    </main>
  );
}
