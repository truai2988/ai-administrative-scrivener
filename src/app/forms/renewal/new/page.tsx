'use client';

import React, { useEffect, useState } from 'react';
import '../renewal-form.css';
import { RenewalApplicationForm } from '@/components/forms/RenewalApplicationForm';
import { getAssignmentTemplates } from '@/lib/constants/assignmentTemplates';
import { resolveTemplate, type ApplicationKind, type TabAssignmentTemplate } from '@/lib/constants/assignmentTemplates';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 更新申請書 新規作成ページ（空フォーム／テスト用）
 *
 * 設定画面などで変更した「最新のデフォルトテンプレート」を引っ張ってきてから
 * フォームを描画するように修正。
 */
export default function RenewalFormNewPage() {
  const [templates, setTemplates] = useState<Record<ApplicationKind, TabAssignmentTemplate> | null>(null);
  const { loading } = useAuth();

  useEffect(() => {
    // 認証状態が確定するまで（loading中）はFirestoreにアクセスしない
    if (loading) return;
    
    let mounted = true;
    getAssignmentTemplates().then(data => {
      if (mounted) setTemplates(data);
    });
    return () => { mounted = false; };
  }, [loading]);

  if (loading || !templates) {
    return (
      <main className="renewal-page flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>{loading ? '認証状態を確認中...' : '設定を読み込み中...'}</p>
        </div>
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
