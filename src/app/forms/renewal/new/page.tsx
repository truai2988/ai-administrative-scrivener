import React from 'react';
import '../renewal-form.css';
import { RenewalApplicationForm } from '@/components/forms/RenewalApplicationForm';

/**
 * 更新申請書 新規作成ページ（空フォーム）
 *
 * 通常の申請書作成に使用するシンプルなエントリーポイント。
 * 書類スキャン（OCRアシスト）は /foreigners/new の外国人新規登録フローで行う。
 */
export default function RenewalFormNewPage() {
  return (
    <main className="renewal-page">
      <div className="renewal-form">
        <RenewalApplicationForm />
      </div>
    </main>
  );
}
