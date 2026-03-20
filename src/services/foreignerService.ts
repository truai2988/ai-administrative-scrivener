import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { Foreigner } from "../types/database";

const COLLECTION_NAME = "foreigners";

export const foreignerService = {
  /**
   * IDで外国人を取得
   */
  async getForeignerById(id: string): Promise<Foreigner | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Foreigner;
    }
    return null;
  },

  /**
   * 全外国人を取得（一覧用）
   */
  async getAllForeigners(): Promise<Foreigner[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Foreigner[];
  },

  /**
   * 本人用フォームからの新規申請保存（または更新）
   */
  async submitForeignerEntry(id: string, data: Partial<Foreigner>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    const commonData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, commonData);
    } else {
      await setDoc(docRef, {
        ...commonData,
        createdAt: new Date().toISOString(),
        status: '準備中', // 初期ステータス
      });
    }
  },

  /**
   * 支援機関用フォームからの追記・ステータス更新
   */
  async updateBySupportAgency(id: string, data: Partial<Foreigner>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    await updateDoc(docRef, {
      ...data,
      status: 'チェック中', // 行政書士への依頼時はこのステータス
      updatedAt: new Date().toISOString(),
    });
  }
};
