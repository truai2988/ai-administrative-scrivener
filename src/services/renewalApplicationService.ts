/**
 * renewalApplicationService.ts
 * 在留期間更新許可申請フォームのFirebase保存サービス
 *
 * Firestore コレクション: "renewal_applications"
 * Foreigner コレクションとは独立した別コレクションで管理する
 * (更新申請のフォームデータは申請書固有フィールドが多いため)
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';

const COLLECTION_NAME = 'renewal_applications';

export type RenewalApplicationStatus = 'editing' | 'pending_review' | 'approved';

export interface RenewalApplicationRecord {
  id: string;
  foreignerId?: string;        // 紐付ける外国人ドキュメントID（任意）
  status: RenewalApplicationStatus;
  formData: RenewalApplicationFormData;
  createdAt: string;
  updatedAt: string;
}

export const renewalApplicationService = {
  /**
   * 申請フォームデータを保存（新規 or 更新）
   * ステータスは常に 'editing' に移行する
   */
  async save(
    formData: RenewalApplicationFormData,
    existingId?: string,
    foreignerId?: string
  ): Promise<string> {
    const now = new Date().toISOString();

    if (existingId) {
      // 既存レコードの更新
      const docRef = doc(db, COLLECTION_NAME, existingId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        throw new Error(`申請書が見つかりません (id: ${existingId})`);
      }

      await updateDoc(docRef, {
        formData,
        status: 'editing',
        updatedAt: now,
        ...(foreignerId ? { foreignerId } : {}),
      });

      return existingId;
    } else {
      // 新規作成
      // 在留カード番号 + タイムスタンプをIDの基底にする
      const cardNum = formData.foreignerInfo.residenceCardNumber?.replace(/[^A-Za-z0-9]/g, '') || 'UNKNOWN';
      const ts      = Date.now().toString(36).toUpperCase();
      const newId   = `renewal_${cardNum}_${ts}`;

      const docRef = doc(db, COLLECTION_NAME, newId);
      const record: RenewalApplicationRecord = {
        id: newId,
        status: 'editing',
        formData,
        createdAt: now,
        updatedAt: now,
        ...(foreignerId ? { foreignerId } : {}),
      };

      await setDoc(docRef, record);
      return newId;
    }
  },

  /**
   * 既存レコードの取得（IDで直接）
   */
  async getById(id: string): Promise<RenewalApplicationRecord | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap   = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as RenewalApplicationRecord;
  },

  /**
   * 外国人IDに紐付く申請レコードを取得（最新1件）
   * 存在しない場合は null を返す
   */
  async getByForeignerId(foreignerId: string): Promise<RenewalApplicationRecord | null> {
    const col = collection(db, COLLECTION_NAME);
    const q   = query(col, where('foreignerId', '==', foreignerId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as RenewalApplicationRecord;
  },
};
