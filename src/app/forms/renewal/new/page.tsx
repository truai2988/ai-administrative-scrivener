'use client';

import React, { useEffect, useState } from 'react';
import '../renewal-form.css';
import { RenewalApplicationForm } from '@/components/forms/RenewalApplicationForm';

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 更新申請書 新規作成ページ（空フォーム／テスト用）
 *
 * 設定画面などで変更した「最新のデフォルトテンプレート」を引っ張ってきてから
 * フォームを描画する。
 */
export default function RenewalFormNewPage() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <main className="renewal-page" style={{ alignItems: 'center' }}>
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>認証状態を確認中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="renewal-page">
      <div className="renewal-form">
        <RenewalApplicationForm />
      </div>
    </main>
  );
}
