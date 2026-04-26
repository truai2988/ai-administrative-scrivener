/**
 * companyMasterService.ts
 * 「企業マスタ」のFirestore CRUD サービス
 *
 * Firestore コレクション: "company_masters"
 * organizationId を使って RBAC フィルタリングを行う。
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { CompanyMaster } from '@/types/database';
import { COLLECTIONS } from '@/constants/firestore';

const COL = COLLECTIONS.COMPANY_MASTERS;

export const companyMasterService = {
  /**
   * 所属支部の企業マスタ一覧を取得する
   * @param organizationId 所属支部/企業ID
   */
  async getAll(organizationId: string): Promise<CompanyMaster[]> {
    const col = collection(db, COL);
    const q = query(
      col,
      where('organizationId', '==', organizationId),
      orderBy('companyNameJa', 'asc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompanyMaster));
  },

  /**
   * ID で1件取得する
   */
  async getById(id: string): Promise<CompanyMaster | null> {
    const ref = doc(db, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as CompanyMaster;
  },

  /**
   * 新規企業マスタを登録する
   * @returns 発行された Firestore Document ID
   */
  async create(
    data: Omit<CompanyMaster, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  },

  /**
   * 既存企業マスタを更新する
   */
  async update(
    id: string,
    data: Partial<Omit<CompanyMaster, 'id' | 'createdAt'>>
  ): Promise<void> {
    const ref = doc(db, COL, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * 企業マスタを削除する
   */
  async delete(id: string): Promise<void> {
    const ref = doc(db, COL, id);
    await deleteDoc(ref);
  },
};
