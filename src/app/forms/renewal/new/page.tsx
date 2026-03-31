import type { Metadata } from 'next';
import '../renewal-form.css';
import { RenewalApplicationForm } from '@/components/forms/RenewalApplicationForm';

export const metadata: Metadata = {
  title: '在留期間更新許可申請書（新規作成）| Noctiluca',
  description:
    '特定技能の在留期間更新許可申請書（別記第29号の15様式）の電子入力フォームです。外国人本人情報と所属機関情報を入力してください。',
};

export default function RenewalFormNewPage() {
  return (
    <main className="renewal-page">
      <RenewalApplicationForm />
    </main>
  );
}
