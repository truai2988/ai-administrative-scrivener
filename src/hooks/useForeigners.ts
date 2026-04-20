import { useState, useEffect } from 'react';
import { foreignerService } from '@/services/foreignerService';
import { Foreigner, UserRole } from '@/types/database';

interface UseForeignersUser {
  role?: UserRole | string;
  organizationId?: string | null;
}

export function useForeigners(currentUser: UseForeignersUser | null, initialData: Foreigner[] = []) {
  const [data, setData] = useState<Foreigner[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    if (!currentUser || !currentUser.role) {
      Promise.resolve().then(() => {
        if (isSubscribed) setLoading(false);
      });
      return () => {
        isSubscribed = false;
      };
    }

    setLoading(true);

    try {
      const unsubscribe = foreignerService.subscribeForeignersByRole(
        currentUser.role as UserRole,
        currentUser.organizationId ?? undefined,
        (fetchedData) => {
          if (isSubscribed) {
            setData(fetchedData);
            setLoading(false);
            setError(null);
          }
        }
      );

      return () => {
        isSubscribed = false;
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (err) {
      if (isSubscribed) {
        setError(err instanceof Error ? err : new Error('Unknown error in useForeigners'));
        setLoading(false);
      }
      return () => {
        isSubscribed = false;
      };
    }
  }, [currentUser]);

  return { data, loading, error, setData };
}
