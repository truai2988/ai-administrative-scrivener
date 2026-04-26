import type { Metadata } from 'next';
import { ChangeOfStatusFormLoader } from '@/components/forms/change-of-status/ChangeOfStatusFormLoader';

export const metadata: Metadata = {
  title: '在留資格変更許可申請書（編集）| Noctiluca',
  description: '在留資格変更許可申請書の入力・編集フォームです。',
};

interface PageProps {
  params: Promise<{ foreignerId: string }>;
}

export default async function ChangeOfStatusFormDynamicPage({ params }: PageProps) {
  const { foreignerId } = await params;

  return (
    <main className="change-of-status-page">
      <ChangeOfStatusFormLoader foreignerId={foreignerId} />
    </main>
  );
}
