'use client';

import { useState, useEffect } from 'react';
import { companyMasterService } from '@/services/companyMasterService';
import type { CompanyMaster } from '@/types/database';

/**
 * useCompanyMasters
 * 指定の organizationId に紐づく企業マスタ一覧を取得するフック。
 * フォームのプルダウン選択用途で使用する。
 */
export function useCompanyMasters(organizationId: string | null | undefined) {
  const [companies, setCompanies] = useState<CompanyMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setCompanies([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    companyMasterService
      .getAll(organizationId)
      .then((data) => {
        if (isMounted) {
          setCompanies(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('企業マスタの取得に失敗しました'));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [organizationId]);

  const refresh = () => {
    if (!organizationId) return;
    setLoading(true);
    companyMasterService
      .getAll(organizationId)
      .then((data) => {
        setCompanies(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error('企業マスタの取得に失敗しました'));
      })
      .finally(() => setLoading(false));
  };

  return { companies, loading, error, refresh };
}
