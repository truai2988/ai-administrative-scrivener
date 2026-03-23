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
    console.log('[DEBUG_SERVICE] getAllForeigners: クエリを実行します...');
    const q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    console.log(`[DEBUG_SERVICE] getAllForeigners: クエリを実行しました。取得件数: ${querySnapshot.docs.length}件`);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Foreigner[];
    
    console.log('[DEBUG_SERVICE] getAllForeigners: マッピング完了', results.slice(0, 2));
    return results;
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
  },

  /**
   * 行政書士専用：ダッシュボードからのデータ直接編集・上書き
   * 法拠となる originalSubmittedData は保持しつつ、メインのデータを上書きし isEditedByAdmin を true にする
   */
  async updateForeignerDataAdmin(id: string, data: Partial<Foreigner>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      isEditedByAdmin: true,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * デモデータ一括投入
   */
  async seedDemoData(): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date();
      
      const date1 = new Date();
      date1.setMonth(now.getMonth() + 2);
      const idSuffix = Date.now().toString().slice(-6); // ユニーク化のためのサフィックス

      const demo1: Foreigner = {
        id: `demo-normal-${idSuffix}`,
        name: 'CHEN WEI',
        residenceCardNumber: 'AB12345678CD',
        expiryDate: date1.toISOString().split('T')[0],
        birthDate: '1995-05-15',
        nationality: '中国',
        passportImageUrl: 'https://placehold.jp/400x300.png?text=Passport+Demo',
        status: '準備中',
        company: '株式会社テクノレイド',
        visaType: '技術・人文知識・国際業務',
        aiReview: {
          riskScore: 15,
          reason: '職歴と業務内容に矛盾はありません。',
          checkedAt: now.toISOString(),
          jobTitle: 'ソフトウェアエンジニア',
          pastExperience: '北京のIT企業で5年の開発経験あり。'
        },
        consentLog: {
          ipAddress: '203.0.113.45',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15',
          agreedAt: now.toISOString(),
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      // デモデータの原本保全スナップショット
      demo1.originalSubmittedData = { ...demo1 };

      const date2 = new Date();
      date2.setDate(now.getDate() + 21);
      
      const demo2: Foreigner = {
        id: `demo-warning-${idSuffix}`,
        name: 'NGUYEN VAN A',
        residenceCardNumber: 'XY98765432ZZ',
        expiryDate: date2.toISOString().split('T')[0],
        birthDate: '1998-10-20',
        nationality: 'ベトナム',
        passportImageUrl: 'https://placehold.jp/400x300.png?text=Passport+Demo',
        status: 'チェック中',
        company: '未来創生建設',
        visaType: '技術・人文知識・国際業務',
        aiReview: {
          riskScore: 85,
          reason: '【警告】過去の経歴と従事業務の関連性が薄く、理由書の詳細化が必要です。',
          checkedAt: now.toISOString(),
          jobTitle: '施工管理補助',
          pastExperience: '母国の大学で経済学を専攻。建設関連の実務経験なし。'
        },
        consentLog: {
          ipAddress: '203.0.113.60',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
          agreedAt: now.toISOString(),
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      demo2.originalSubmittedData = { ...demo2 };

      const date3 = new Date();
      date3.setMonth(now.getMonth() + 4);
      
      const demo3: Foreigner = {
        id: `demo-completed-${idSuffix}`,
        name: 'MARIA GARCIA',
        residenceCardNumber: 'JK11223344ML',
        expiryDate: date3.toISOString().split('T')[0],
        birthDate: '1992-03-10',
        nationality: 'フィリピン',
        passportImageUrl: 'https://placehold.jp/400x300.png?text=Passport+Demo',
        status: '申請済',
        company: 'さくらフーズ',
        visaType: '特定技能',
        aiReview: {
          riskScore: 5,
          reason: '全ての書類が揃っており、要件を満たしています。',
          checkedAt: now.toISOString(),
          jobTitle: '外食業',
          pastExperience: 'フィリピンのレストランでの実務経験3年。特定技能評価試験合格済み。'
        },
        consentLog: {
          ipAddress: '203.0.113.88',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          agreedAt: now.toISOString(),
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      demo3.originalSubmittedData = { ...demo3 };

      // demo2を最初から「編集済み」としてマークし、ボタンを確認しやすくする
      demo2.isEditedByAdmin = true;

      console.log(`[DEBUG_SERVICE] seedDemoData: Firebaseへの一括登録を開始します。`);
      await Promise.all([
        setDoc(doc(db, COLLECTION_NAME, demo1.id), demo1),
        setDoc(doc(db, COLLECTION_NAME, demo2.id), demo2),
        setDoc(doc(db, COLLECTION_NAME, demo3.id), demo3),
      ]);
      console.log(`[DEBUG_SERVICE] seedDemoData: Firebaseへの一括登録が成功しました。`);

      return { success: true };
    } catch (error) {
      console.error('[DEBUG_SERVICE] seedDemoData Error:', error);
      return { success: false, error: String(error) };
    }
  }
};
