import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MyInquiry {
  id: string;
  subject: string;
  body: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Timestamp | Date | string;
  userId: string;
}

export function useMyInquiries() {
  const { currentUser, loading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState<MyInquiry[]>([]);
  // subscriptionLoading: onSnapshot コールバック内でのみ更新 (effect 内で同期 setState しない)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 認証ロード中 or 未ログインの場合はサブスクリプションを開始しない
    if (authLoading || !currentUser) return;

    setSubscriptionLoading(true);

    const q = query(
      collection(db, 'inquiries'),
      where('userId', '==', currentUser.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MyInquiry[];
        setInquiries(data);
        setSubscriptionLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching my inquiries:', err);
        setError(err);
        setSubscriptionLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, authLoading]);

  // loading は「認証ロード中」または「Firestore購読の初回取得中」のいずれかで true
  const loading = authLoading || subscriptionLoading;

  return { inquiries, loading, error };
}
