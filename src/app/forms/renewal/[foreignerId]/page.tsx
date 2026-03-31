import type { Metadata } from 'next';
import { RenewalFormLoader } from '@/components/forms/RenewalFormLoader';

export const metadata: Metadata = {
  title: '在留期間更新許可申請書（編集）| Noctiluca',
  description: '在留期間更新許可申請書の入力・編集フォームです。',
};

interface PageProps {
  params: Promise<{ foreignerId: string }>;
}

export default async function RenewalFormDynamicPage({ params }: PageProps) {
  const { foreignerId } = await params;

  return (
    <main className="renewal-page">
      <RenewalFormLoader foreignerId={foreignerId} />
    </main>
  );
}
