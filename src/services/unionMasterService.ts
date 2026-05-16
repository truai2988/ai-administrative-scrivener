/**
 * unionMasterService.ts
 * 「組合マスタ」のFirestore CRUD サービス
 *
 * Firestore コレクション: "union_masters"
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
import { UnionMaster } from '@/types/database';
import { COLLECTIONS } from '@/constants/firestore';

const COL = COLLECTIONS.UNION_MASTERS;

export const unionMasterService = {
  /**
   * 組合マスタ一覧を取得する
   * @param organizationId 絞り込む organizationId。未指定の場合はすべて取得する（管理者用）
   */
  async getAll(organizationId?: string): Promise<UnionMaster[]> {
    const col = collection(db, COL);
    let q;
    if (organizationId) {
      q = query(
        col,
        where('organizationId', '==', organizationId),
        orderBy('unionNameJa', 'asc'),
        limit(100)
      );
    } else {
      q = query(col, orderBy('unionNameJa', 'asc'), limit(100));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UnionMaster));
  },

  /**
   * ID で1件取得する
   */
  async getById(id: string): Promise<UnionMaster | null> {
    const ref = doc(db, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as UnionMaster;
  },

  /**
   * 新規組合マスタを登録する
   * @returns 発行された Firestore Document ID
   */
  async create(
    data: Omit<UnionMaster, 'id' | 'createdAt' | 'updatedAt'>
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
   * 既存組合マスタを更新する
   */
  async update(
    id: string,
    data: Partial<Omit<UnionMaster, 'id' | 'createdAt'>>
  ): Promise<void> {
    const ref = doc(db, COL, id);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * 組合マスタを削除する
   */
  async delete(id: string): Promise<void> {
    const ref = doc(db, COL, id);
    await deleteDoc(ref);
  },
};
