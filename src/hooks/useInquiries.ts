import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { UserRole } from '@/types/database';

export interface Inquiry {
  id: string;
  subject: string;
  body: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Timestamp | Date;
  tenantId: string;
  organizationId: string;
  userId: string;
  userRole: UserRole | string;
}

export function useInquiries(userRole?: UserRole | string) {
  const isAllowed = userRole === 'scrivener';
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(isAllowed);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only fetch if scrivener
    if (!isAllowed) {
      return;
    }

    const q = query(
      collection(db, 'inquiries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Inquiry[];
        setInquiries(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching inquiries:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAllowed]);

  return { inquiries, loading, error };
}
