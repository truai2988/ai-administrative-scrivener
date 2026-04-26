import type { Metadata } from 'next';
import { CoeFormLoader } from '@/components/forms/coe/CoeFormLoader';
import '../../renewal/renewal-form.css';

export const metadata: Metadata = {
  title: '在留資格認定証明書交付申請書（編集）| Noctiluca',
  description: '在留資格認定証明書交付申請書の入力・編集フォームです。',
};

interface PageProps {
  params: Promise<{ foreignerId: string }>;
}

export default async function CoeFormDynamicPage({ params }: PageProps) {
  const { foreignerId } = await params;

  return (
    <main className="renewal-page">
      <CoeFormLoader foreignerId={foreignerId} />
    </main>
  );
}
