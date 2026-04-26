import { useState, useEffect, useCallback } from 'react';
import { foreignerService } from '@/services/foreignerService';
import { Foreigner, UserRole, DEFAULT_BRANCH_ID, isGlobalAdmin } from '@/types/database';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, collection, query, where, getCountFromServer, DocumentData, QueryDocumentSnapshot, Query } from 'firebase/firestore';

interface UseForeignersUser {
  role?: UserRole | string;
  organizationId?: string | null;
}

export function useForeigners(currentUser: UseForeignersUser | null, initialData: Foreigner[] = [], activeBranchId: string = 'all', statusFilter: string = 'all') {
  const [data, setData] = useState<Foreigner[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, expiringSoon: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // 1. Stats and Realtime Summary
  useEffect(() => {
    let isSubscribed = true;
    if (!currentUser || !currentUser.role) {
       Promise.resolve().then(() => { if (isSubscribed) setStatsLoading(false); });
       return;
    }

    const targetId = isGlobalAdmin(currentUser.role as UserRole) 
      ? (activeBranchId === 'all' ? 'global' : activeBranchId) 
      : (currentUser.organizationId || DEFAULT_BRANCH_ID);
    const statsRef = doc(db, 'foreigner_stats', targetId);

    const fetchExpiringCount = async () => {
      try {
        const now = new Date();
        const threshold = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        const todayStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
        const thresholdStr = [threshold.getFullYear(), String(threshold.getMonth() + 1).padStart(2, '0'), String(threshold.getDate()).padStart(2, '0')].join('-');

        let q: Query<DocumentData> = collection(db, 'foreigners');
        if (!isGlobalAdmin(currentUser.role as UserRole) || activeBranchId !== 'all') {
            q = query(q, where('branchId', '==', targetId));
        }
        
        q = query(q, 
            where('expiryDate', '>=', todayStr),
            where('expiryDate', '<=', thresholdStr)
        );

        const snap = await getCountFromServer(q);
        return snap.data().count;
      } catch (e) {
        console.error(e);
        return 0;
      }
    };

    const unsubscribe = onSnapshot(statsRef, async (docSnap) => {
      if (!isSubscribed) return;
      const docData = docSnap.exists() ? docSnap.data() : { total: 0, pending: 0, completed: 0 };
      const expiringSoon = await fetchExpiringCount();
      
      if (!isSubscribed) return;
      setStats({
          // ⑤ カウンターがDBでマイナスになっても表示は最低0でクランプ
          total: Math.max(0, docData.total || 0),
          pending: Math.max(0, docData.pending || 0),
          completed: Math.max(0, docData.completed || 0),
          expiringSoon
      });
      setStatsLoading(false);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [currentUser, activeBranchId]);

  // 2. Initial Data Fetch (Pagination)
  useEffect(() => {
    let isMounted = true;
    if (!currentUser || !currentUser.role) {
      if (initialData.length === 0) {
          Promise.resolve().then(() => { if (isMounted) setLoading(false); });
      }
      return;
    }

    Promise.resolve().then(() => { if (isMounted) setLoading(true); });

    foreignerService.getForeignersPage(
      currentUser.role as UserRole,
      isGlobalAdmin(currentUser.role as UserRole) ? (activeBranchId === 'all' ? undefined : activeBranchId) : (currentUser.organizationId || DEFAULT_BRANCH_ID),
      50,
      null,
      statusFilter
    ).then(res => {
      if (isMounted) {
        setData(res.docs);
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
        setLoading(false);
        setError(null);
      }
    }).catch(err => {
      if (isMounted) {
        setData([]);
        setError(err instanceof Error ? err : new Error('Unknown error in useForeigners'));
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [currentUser, activeBranchId, statusFilter, initialData.length]);

  const loadMore = useCallback(async () => {
    if (!currentUser || !currentUser.role || !hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const res = await foreignerService.getForeignersPage(
        currentUser.role as UserRole,
        isGlobalAdmin(currentUser.role as UserRole) ? (activeBranchId === 'all' ? undefined : activeBranchId) : (currentUser.organizationId || DEFAULT_BRANCH_ID),
        50,
        lastDoc,
        statusFilter
      );
      
      setData(prev => {
        // IDで重複チェックをしてからマージ（ReactのStrictMode対策等）
        const newDocs = res.docs.filter(newDoc => !prev.some(p => p.id === newDoc.id));
        return [...prev, ...newDocs];
      });
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Error loading more'));
    } finally {
      setLoadingMore(false);
    }
  }, [currentUser, hasMore, loadingMore, lastDoc, activeBranchId, statusFilter]);

  // refreshメソッド（何か登録した後に一覧をリフレッシュしたい場合などに備えて）
  const refresh = useCallback(() => {
    if (!currentUser || !currentUser.role) return;
    setLoading(true);
    foreignerService.getForeignersPage(
      currentUser.role as UserRole,
      isGlobalAdmin(currentUser.role as UserRole) ? (activeBranchId === 'all' ? undefined : activeBranchId) : (currentUser.organizationId || DEFAULT_BRANCH_ID),
      50,
      null,
      statusFilter
    ).then(res => {
      setData(res.docs);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
      setLoading(false);
      setError(null);
    }).catch(err => {
      setData([]);
      setError(err instanceof Error ? err : new Error('Unknown error in refresh'));
      setLoading(false);
    });
  }, [currentUser, activeBranchId, statusFilter]);

  return { data, stats, statsLoading, loading, loadingMore, hasMore, error, setData, loadMore, refresh };
}
