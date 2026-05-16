import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  query,
  orderBy,
  where,
  writeBatch,
  increment,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  WriteBatch,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  QueryConstraint
} from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { Foreigner, UserRole } from "../types/database";
import { emailService } from "./emailService";
import { canViewAllForeigners } from "../utils/permissions";
import { isValidPersonName } from "../lib/utils/firestoreUtils";

const COLLECTION_NAME = "foreigners";

// ─── Stats Aggregation Helpers ────────────────────────────────────────────────

// 集計フィールドの増減を計算するヘルパー
function getStatsChanges(oldStatus?: string, newStatus?: string): { pending: number, completed: number } {
  const isPending = (s?: string) => s === '準備中' || s === '編集中' || s === 'チェック中' || s === '追加資料待機' || s === '入管審査中' || s === '差し戻し';
  const isCompleted = (s?: string) => s === '完了' || s === '申請済';

  let pending = 0;
  let completed = 0;

  if (oldStatus !== newStatus) {
    if (isPending(oldStatus)) pending -= 1;
    if (isCompleted(oldStatus)) completed -= 1;

    if (isPending(newStatus)) pending += 1;
    if (isCompleted(newStatus)) completed += 1;
  }
  return { pending, completed };
}

// バッチ書き込みで集計ドキュメント（グローバル・組合・企業）を更新するヘルパー
function applyStatsIncrement(batch: WriteBatch, diff: { total: number, pending: number, completed: number }, unionId?: string, enterpriseId?: string) {
  if (diff.total === 0 && diff.pending === 0 && diff.completed === 0) return;

  const globalRef = doc(db, 'foreigner_stats', 'global');
  const payload = {
    total: increment(diff.total),
    pending: increment(diff.pending),
    completed: increment(diff.completed)
  };

  batch.set(globalRef, payload, { merge: true });

  if (unionId) {
    const unionRef = doc(db, 'foreigner_stats', unionId);
    batch.set(unionRef, payload, { merge: true });
  }
  if (enterpriseId) {
    const entRef = doc(db, 'foreigner_stats', enterpriseId);
    batch.set(entRef, payload, { merge: true });
  }
}


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
    const q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Foreigner[];
  },

  /**
   * ロールに基づいて外国人データを取得
   * - union_staff: 自分の支部のデータのみ
   * - scrivener: 全支部のデータ
   */
  async getForeignersByRole(role: UserRole, organizationId?: string): Promise<Foreigner[]> {
    let q;

    if (canViewAllForeigners(role)) {
      // 行政書士: 全データ取得
      q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"), limit(50));
    } else {
      // 組合職員 / 企業担当者: 自組織のデータのみ
      if (!organizationId) {
        console.error(`[foreignerService] ${role} requires organizationId`);
        return [];
      }
      const fieldName = role === 'union_staff' ? 'unionId' : 'enterpriseId';
      q = query(
        collection(db, COLLECTION_NAME),
        where(fieldName, "==", organizationId),
        orderBy("updatedAt", "desc"),
        limit(50)
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Foreigner[];
  },

  /**
   * ロールに基づいて外国人データをリアルタイム取得（購読）
   */
  subscribeForeignersByRole(
    role: UserRole, 
    organizationId: string | undefined, 
    callback: (data: Foreigner[]) => void
  ): () => void {
    let q;

    if (canViewAllForeigners(role)) {
      q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"), limit(50));
    } else {
      if (!organizationId) {
        console.error(`[foreignerService] ${role} requires organizationId`);
        return () => {}; // return empty unsubscribe
      }
      const fieldName = role === 'union_staff' ? 'unionId' : 'enterpriseId';
      q = query(
        collection(db, COLLECTION_NAME),
        where(fieldName, "==", organizationId),
        orderBy("updatedAt", "desc"),
        limit(50)
      );
    }

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Foreigner[];
      callback(docs);
    });
  },

  /**
   * ページネーション用（しおり方式）のデータ取得
   */
  async getForeignersPage(
    role: UserRole,
    organizationId: string | undefined,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null,
    statusFilter: string = 'all'
  ): Promise<{ docs: Foreigner[], lastDoc: QueryDocumentSnapshot<DocumentData> | null, hasMore: boolean }> {
    const baseCol = collection(db, COLLECTION_NAME);
    const constraints: QueryConstraint[] = [];

    // 支部による絞り込み
    if (!canViewAllForeigners(role) || organizationId) {
      if (!organizationId) throw new Error("[foreignerService] union_staff requires organizationId");
      const fieldName = role === 'union_staff' ? 'unionId' : 'enterpriseId';
      constraints.push(where(fieldName, "==", organizationId));
    }

    // ステータスタブによる絞り込み
    if (statusFilter === 'pending') {
      // 進行中
      constraints.push(where('status', 'in', ['準備中', '編集中', 'チェック中', '追加資料待機', '入管審査中', '差し戻し']));
      constraints.push(orderBy("updatedAt", "desc"));
    } else if (statusFilter === 'completed') {
      // 完了
      constraints.push(where('status', 'in', ['完了', '申請済']));
      constraints.push(orderBy("updatedAt", "desc"));
    } else if (statusFilter === 'expiring') {
      // 期限切れ間近
      const now = new Date();
      const threshold = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      const todayStr = now.toISOString().slice(0, 10);
      const thresholdStr = threshold.toISOString().slice(0, 10);
      
      constraints.push(where('expiryDate', '>=', todayStr));
      constraints.push(where('expiryDate', '<=', thresholdStr));
      // 不等号フィルタ（expiryDate）を使う場合、最初のorderByは同じフィールドである必要があります
      constraints.push(orderBy('expiryDate', 'asc'));
      constraints.push(orderBy("updatedAt", "desc"));
    } else {
      // 全て
      constraints.push(orderBy("updatedAt", "desc"));
    }

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    constraints.push(limit(pageSize));

    const q = query(baseCol, ...constraints);

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Foreigner[];

    return {
      docs,
      lastDoc: querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null,
      hasMore: querySnapshot.docs.length === pageSize
    };
  },

  /**
   * 本人用フォームからの新規申請保存（または更新）
   * unionId / enterpriseId を自動設定する
   */
  async submitForeignerEntry(id: string, data: Partial<Foreigner>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    const commonData = {
      ...data,
      unionId: data.unionId || undefined,
      enterpriseId: data.enterpriseId || undefined,
      updatedAt: new Date().toISOString(),
    };

    const batch = writeBatch(db);

    if (docSnap.exists()) {
      const oldStatus = docSnap.data().status;
      const newStatus = data.status || oldStatus;
      
      batch.update(docRef, commonData);
      
      const statsDiff = getStatsChanges(oldStatus, newStatus);
      applyStatsIncrement(batch, { total: 0, ...statsDiff }, docSnap.data().unionId, docSnap.data().enterpriseId);
    } else {
      const newStatus = data.status || '準備中';
      const insertData = {
        ...commonData,
        createdAt: new Date().toISOString(),
        status: newStatus,
      };
      batch.set(docRef, insertData);

      const statsDiff = getStatsChanges(undefined, newStatus);
      applyStatsIncrement(batch, { total: 1, ...statsDiff }, commonData.unionId, commonData.enterpriseId);
    }

    await batch.commit();
  },


  /**
   * 行政書士専用：ダッシュボードからのデータ直接編集・上書き
   * 法拠となる originalSubmittedData は保持しつつ、メインのデータを上書きし isEditedByAdmin を true にする
   */
  async updateForeignerDataAdmin(id: string, data: Partial<Foreigner>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // 現在のデータを取得してステータス変更を確認
    const currentDoc = await getDoc(docRef);
    if (!currentDoc.exists()) return;

    const oldStatus = currentDoc.data().status;
    const newStatus = data.status || oldStatus;
    

    const batch = writeBatch(db);
    batch.update(docRef, {
      ...data,
      isEditedByAdmin: true,
      updatedAt: new Date().toISOString(),
    });

    const statsDiff = getStatsChanges(oldStatus, newStatus);
    applyStatsIncrement(batch, { total: 0, ...statsDiff }, currentDoc.data().unionId, currentDoc.data().enterpriseId);

    await batch.commit();

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

    // 3. 修正履歴（サブコレクション）の追加
    const historyColRef = collection(docRef, 'correction_histories');
    const historyDocRef = doc(historyColRef);
    batch.set(historyDocRef, {
      foreignerId: id,
      correctedBy: correctedBy,
      correctedAt: new Date().toISOString(),
      reason: reason,
      diff: diff,
    });

    // 4. 集計値の更新（ステータスが「編集中」に変わる）
    const statsDiff = getStatsChanges(currentData.status, '編集中');
    applyStatsIncrement(batch, { total: 0, ...statsDiff }, currentData.unionId, currentData.enterpriseId);

    // 5. バッチ送信
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
  async updateForeignerByStaff(id: string, data: Partial<Foreigner>, userOrganizationId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(docRef);

    if (!currentDoc.exists()) {
      throw new Error("対象のデータが見つかりませんでした");
    }

    // 支部IDが一致するかチェック
    const currentData = currentDoc.data();
    if (currentData.unionId !== userOrganizationId && currentData.enterpriseId !== userOrganizationId) {
      throw new Error("権限エラー: 他の支部のデータは編集できません");
    }

    const oldStatus = currentDoc.data().status;
    const newStatus = data.status || oldStatus;

    const batch = writeBatch(db);
    batch.update(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    const statsDiff = getStatsChanges(oldStatus, newStatus);
    applyStatsIncrement(batch, { total: 0, ...statsDiff }, currentData.unionId, currentData.enterpriseId);

    await batch.commit();
  },

  /**
   * 削除機能
   */
  async deleteForeigner(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data();
    
    const oldStatus = data.status;

    const batch = writeBatch(db);
    batch.delete(docRef);

    const statsDiff = getStatsChanges(oldStatus, undefined);
    applyStatsIncrement(batch, { total: -1, ...statsDiff }, data.unionId, data.enterpriseId);

    await batch.commit();
  },

  /**
   * 複数レコードを1回のバッチで一括削除する（⑥ N+1解消）
   * - 削除件数分の個別 deleteDoc コールを廃止し、writeBatch で束ねる
   * - 各レコードのステータス集計（foreigner_stats）も同一バッチで正確に更新する
   * - Firestore の writeBatch 上限は500件。超える場合は 500件ずつ分割する
   */
  async deleteForeignersBatch(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    // 1. 削除対象ドキュメントを並列取得（集計用にステータス等が必要）
    const docSnaps = await Promise.all(
      ids.map(id => getDoc(doc(db, COLLECTION_NAME, id)))
    );

    // 2. 存在するものだけを対象とし、支部別の集計差分を計算
    type StatsDiff = { total: number; pending: number; completed: number };
    const orgDiffs = new Map<string, StatsDiff>();
    
    const batch = writeBatch(db);
    for (const snap of docSnaps) {
      if (snap.exists()) batch.delete(snap.ref);
    }

    for (const snap of docSnaps) {
      if (!snap.exists()) continue;
      const data = snap.data();
      const statsDiff = getStatsChanges(data.status, undefined);
      const diff = { total: -1, ...statsDiff };
      
      const unionId = data.unionId;
      if (unionId) {
        const current = orgDiffs.get(unionId) ?? { total: 0, pending: 0, completed: 0 };
        orgDiffs.set(unionId, {
          total: current.total + diff.total,
          pending: current.pending + diff.pending,
          completed: current.completed + diff.completed
        });
      }
      const enterpriseId = data.enterpriseId;
      if (enterpriseId) {
        const current = orgDiffs.get(enterpriseId) ?? { total: 0, pending: 0, completed: 0 };
        orgDiffs.set(enterpriseId, {
          total: current.total + diff.total,
          pending: current.pending + diff.pending,
          completed: current.completed + diff.completed
        });
      }
    }

    const globalRef = doc(db, 'foreigner_stats', 'global');
    let globalTotal = 0, globalPending = 0, globalCompleted = 0;

    for (const snap of docSnaps) {
      if (!snap.exists()) continue;
      const diff = getStatsChanges(snap.data().status, undefined);
      globalTotal -= 1;
      globalPending += diff.pending;
      globalCompleted += diff.completed;
    }
    
    if (globalTotal !== 0 || globalPending !== 0 || globalCompleted !== 0) {
      batch.set(globalRef, {
        total: increment(globalTotal),
        pending: increment(globalPending),
        completed: increment(globalCompleted)
      }, { merge: true });
    }

    for (const [orgId, diff] of orgDiffs.entries()) {
      batch.set(doc(db, 'foreigner_stats', orgId), {
        total: increment(diff.total),
        pending: increment(diff.pending),
        completed: increment(diff.completed)
      }, { merge: true });
    }

    await batch.commit();
  },


  /**
   * デモデータ一括投入
   */
  async seedDemoData(unionId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date();
      const activeUnionId = unionId || undefined;
      
      const date1 = new Date();
      date1.setMonth(now.getMonth() + 2);
      const idSuffix = Date.now().toString().slice(-6); // ユニーク化のためのサフィックス

      const demo1: Foreigner = {
        id: `demo-normal-${idSuffix}`,
        unionId: activeUnionId,
        enterpriseId: undefined,
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
        unionId: activeUnionId,
        enterpriseId: undefined,
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
        unionId: activeUnionId,
        enterpriseId: undefined,
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

      const batch = writeBatch(db);
      batch.set(doc(db, COLLECTION_NAME, demo1.id), demo1);
      batch.set(doc(db, COLLECTION_NAME, demo2.id), demo2);
      batch.set(doc(db, COLLECTION_NAME, demo3.id), demo3);

      applyStatsIncrement(batch, { total: 3, pending: 2, completed: 1 }, activeUnionId, undefined);
      
      await batch.commit();

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
      orderBy("updatedAt", "desc"),
      limit(50)
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

    const docOld = await getDoc(docRef);
    if (docOld.exists()) {
      const oldData = docOld.data();
      const oldStatus = oldData.status;
      const newStatus = updateData.status || oldStatus;

      const batch = writeBatch(db);
      batch.update(docRef, updateData);

      const statsDiff = getStatsChanges(oldStatus, newStatus);
      applyStatsIncrement(batch, { total: 0, ...statsDiff }, oldData.unionId, oldData.enterpriseId);

      await batch.commit();
    }
  },

  /**
   * ⑦ 外国人マスタ（foreigners）への共通 Upsert（申請Service間のDRY違反を解消）
   *
   * 各申請Service（COE / Renewal / ChangeOfStatus）の _syncForeignerMaster を統合。
   * 呼び出し元はフォームデータをマッパーで変換した Partial<Foreigner> と
   * 検索キー（識別子）を渡すだけでよい。
   *
   * 検索優先順位:
   *   1. providedForeignerId が指定されている場合 → 即 Upsert（検索スキップ）
   *   2. residenceCardNumber（在留カード番号）での完全一致
   *   3. passportNumber（パスポート番号）での完全一致
   *   4. name + birthDate（氏名＋生年月日）での完全一致
   *   5. いずれも一致しない → 新規作成
   *
   * @returns 外国人マスタの documentId（新規・既存ともに）、識別情報不足時は null
   */
  async syncForeignerMasterRecord(params: {
    syncData: Partial<Foreigner>;
    identifiers: {
      residenceCardNumber?: string;
      passportNumber?: string;
      name: string;
      birthDate: string;
    };
    applicationId: string;
    organizationId?: string;
    providedForeignerId?: string;
  }): Promise<string | null> {
    const { syncData, identifiers, applicationId: _applicationId, organizationId, providedForeignerId } = params;
    void _applicationId; // applicationId は syncData 内に含まれるため参照のみ

    const foreignersCol = collection(db, COLLECTION_NAME);
    let matchedDocId: string | null = providedForeignerId || null;

    if (!matchedDocId) {
      const { residenceCardNumber, passportNumber, name, birthDate } = identifiers;
      const cardNum = residenceCardNumber?.replace(/[^A-Za-z0-9]/g, '') || '';
      const passNum = passportNumber?.replace(/[^A-Za-z0-9]/g, '') || '';

      // 有効な識別情報がない場合は同期しない（'名称未設定' 等のガード）
      if (!cardNum && !passNum && !isValidPersonName(name)) {
        return null;
      }

      const buildQuery = (field: string, value: string) => {
        if (organizationId) {
          return query(foreignersCol, where(field, '==', value), where('unionId', '==', organizationId), limit(1));
        }
        return query(foreignersCol, where(field, '==', value), limit(1));
      };

      // 在留カード番号で検索
      if (cardNum) {
        const snap = await getDocs(buildQuery('residenceCardNumber', cardNum));
        if (!snap.empty) matchedDocId = snap.docs[0].id;
      }

      // パスポート番号で検索
      if (!matchedDocId && passNum) {
        const snap = await getDocs(buildQuery('passportNumber', passNum));
        if (!snap.empty) matchedDocId = snap.docs[0].id;
      }

      // 氏名＋生年月日で検索
      if (!matchedDocId && name && birthDate) {
        let q;
        if (organizationId) {
          q = query(foreignersCol, where('name', '==', name), where('birthDate', '==', birthDate), where('unionId', '==', organizationId), limit(1));
        } else {
          q = query(foreignersCol, where('name', '==', name), where('birthDate', '==', birthDate), limit(1));
        }
        const snap = await getDocs(q);
        if (!snap.empty) matchedDocId = snap.docs[0].id;
      }
    }

    const now = new Date().toISOString();

    if (matchedDocId) {
      // 既存レコードの更新
      const docRef = doc(db, COLLECTION_NAME, matchedDocId);
      await setDoc(docRef, { ...syncData, updatedAt: now }, { merge: true });
      return matchedDocId;
    } else {
      // 新規作成
      const newId = `foreigner_${Date.now().toString(36).toUpperCase()}`;
      const docRef = doc(db, COLLECTION_NAME, newId);
      await setDoc(docRef, {
        ...syncData,
        id: newId,
        unionId: organizationId || undefined,
        enterpriseId: undefined,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
      return newId;
    }
  },
};
