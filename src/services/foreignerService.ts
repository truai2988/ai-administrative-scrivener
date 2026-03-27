import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query,
  orderBy,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { Foreigner, UserRole, DEFAULT_BRANCH_ID } from "../types/database";
import { emailService } from "./emailService";
import { canViewAllBranches } from "../utils/permissions";

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
   * 全外国人を取得（一覧用）- 後方互換性のため残す
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
   * ロールに基づいて外国人データを取得
   * - branch_staff: 自分の支部のデータのみ
   * - hq_admin / scrivener: 全支部のデータ
   */
  async getForeignersByRole(role: UserRole, branchId?: string): Promise<Foreigner[]> {
    let q;

    if (canViewAllBranches(role)) {
      // 本部管理者・行政書士: 全データ取得
      q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"));
    } else {
      // 支部事務員: 自支部のデータのみ
      if (!branchId) {
        console.error("[foreignerService] branch_staff requires branchId");
        return [];
      }
      q = query(
        collection(db, COLLECTION_NAME),
        where("branchId", "==", branchId),
        orderBy("updatedAt", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Foreigner[];
  },

  /**
   * 本人用フォームからの新規申請保存（または更新）
   * branchId を自動設定する
   */
  async submitForeignerEntry(id: string, data: Partial<Foreigner>, branchId?: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    const commonData = {
      ...data,
      branchId: branchId || data.branchId || DEFAULT_BRANCH_ID,
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
   * 行政書士専用：ダッシュボードからのデータ直接編集・上書き
   * 法拠となる originalSubmittedData は保持しつつ、メインのデータを上書きし isEditedByAdmin を true にする
   */
  async updateForeignerDataAdmin(id: string, data: Partial<Foreigner>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // 現在のデータを取得してステータス変更を確認
    const currentDoc = await getDoc(docRef);
    const oldStatus = currentDoc.exists() ? currentDoc.data().status : null;

    await updateDoc(docRef, {
      ...data,
      isEditedByAdmin: true,
      updatedAt: new Date().toISOString(),
    });

    // ステータスが変わった場合にメール送信
    if (data.status && data.status !== oldStatus) {
      const updatedForeigner = { id, ...currentDoc.data(), ...data } as Foreigner;
      await emailService.sendStatusUpdateNotification(updatedForeigner);
    }
  },

  /**
   * 行政書士専用：修正モードを用いたデータ修正（サーバーサイドでの差分計算と履歴のバッチ保存を含む）
   */
  async correctForeignerData(
    id: string,
    updatedData: Partial<Foreigner>,
    reason: string,
    correctedBy: string
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(docRef);

    if (!currentDoc.exists()) {
      throw new Error("対象のデータが見つかりませんでした");
    }

    const currentData = currentDoc.data() as Foreigner;

    // 変更差分の検出（ネストしないプリミティブ値を中心に比較）
    const diff: Record<string, { old: unknown; new: unknown }> = {};
    const IGNORED_KEYS = ['id', 'updatedAt', 'originalSubmittedData'];
    
    for (const key of Object.keys(updatedData) as (keyof Foreigner)[]) {
      if (IGNORED_KEYS.includes(key as string)) continue;

      const newVal = updatedData[key];
      const oldVal = currentData[key];

      // 単純な JSON 比較で値の変更をチェック
      if (newVal !== undefined && JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        diff[key as string] = { old: oldVal ?? null, new: newVal };
      }
    }

    const batch = writeBatch(db);

    // 1. 本体の更新（isEditedByAdminもtrueにする、ステータスを編集中に変更）
    const updatePayload: Partial<Foreigner> & Record<string, unknown> = {
      ...updatedData,
      isEditedByAdmin: true,
      status: '編集中',
      approvalStatus: 'draft', // 確認依頼前なのでクリア（draftに戻す）する
      updatedAt: new Date().toISOString(),
    };
    batch.update(docRef, updatePayload);

    // 2. 修正履歴（サブコレクション）の追加
    const historyColRef = collection(docRef, 'correction_histories');
    const historyDocRef = doc(historyColRef);
    batch.set(historyDocRef, {
      foreignerId: id,
      correctedBy: correctedBy,
      correctedAt: new Date().toISOString(),
      reason: reason,
      diff: diff,
    });

    // 3. バッチ送信
    await batch.commit();

    // ステータス等の変更があれば通知（任意）
    if (updatedData.status && updatedData.status !== currentData.status) {
      const updatedForeigner = { ...currentData, ...updatePayload } as Foreigner;
      await emailService.sendStatusUpdateNotification(updatedForeigner);
    }
  },

  /**
   * 支部事務員用：自支部のデータを編集
   */
  async updateForeignerByStaff(id: string, data: Partial<Foreigner>, userBranchId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(docRef);

    if (!currentDoc.exists()) {
      throw new Error("対象のデータが見つかりませんでした");
    }

    // 支部IDが一致するかチェック
    const docBranchId = currentDoc.data().branchId;
    if (docBranchId !== userBranchId) {
      throw new Error("権限エラー: 他の支部のデータは編集できません");
    }

    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * デモデータ一括投入
   */
  async seedDemoData(branchId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date();
      const activeBranchId = branchId || DEFAULT_BRANCH_ID;
      
      const date1 = new Date();
      date1.setMonth(now.getMonth() + 2);
      const idSuffix = Date.now().toString().slice(-6); // ユニーク化のためのサフィックス

      const demo1: Foreigner = {
        id: `demo-normal-${idSuffix}`,
        branchId: activeBranchId,
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
        branchId: activeBranchId,
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
        branchId: activeBranchId,
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

      await Promise.all([
        setDoc(doc(db, COLLECTION_NAME, demo1.id), demo1),
        setDoc(doc(db, COLLECTION_NAME, demo2.id), demo2),
        setDoc(doc(db, COLLECTION_NAME, demo3.id), demo3),
      ]);

      return { success: true };
    } catch (error) {
      console.error('[DEBUG_SERVICE] seedDemoData Error:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * 行政書士用: 確認待ち(pending_review)の外国人一覧を取得
   */
  async getPendingReviewForeigners(): Promise<Foreigner[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("approvalStatus", "==", "pending_review"),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Foreigner[];
  },

  /**
   * 承認ステータスのみ更新（status フィールドとは独立）
   */
  async updateApprovalStatus(
    id: string,
    approvalStatus: string,
    returnReason?: string
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: Record<string, string> = {
      approvalStatus,
      updatedAt: new Date().toISOString(),
    };
    if (returnReason !== undefined) {
      updateData.returnReason = returnReason;
    }

    // 進捗ステータス（status）の自動連動
    if (approvalStatus === 'pending_review') {
      updateData.status = 'チェック中';
    } else if (approvalStatus === 'returned') {
      updateData.status = '差し戻し';
    } else if (approvalStatus === 'approved') {
      updateData.status = '申請済';
    }

    await updateDoc(docRef, updateData);
  },
};
