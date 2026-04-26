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
  DocumentData
} from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { Foreigner, UserRole, DEFAULT_BRANCH_ID } from "../types/database";
import { emailService } from "./emailService";
import { canViewAllBranches } from "../utils/permissions";
import { isValidPersonName } from "../lib/utils/firestoreUtils";

const COLLECTION_NAME = "foreigners";

// ─── Stats Aggregation Helpers ────────────────────────────────────────────────

// 集計フィールドの増減を計算するヘルパー
function getStatsChanges(oldStatus?: string, newStatus?: string): { pending: number, completed: number } {
  const isPending = (s?: string) => s === 'チェック中' || s === '準備中' || s === '編集中' || s === '差し戻し';
  const isCompleted = (s?: string) => s === '申請済';

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

// バッチ書き込みで集計ドキュメント（グローバル・支部）を更新するヘルパー
function applyStatsIncrement(batch: WriteBatch, branchId: string, diff: { total: number, pending: number, completed: number }) {
  if (diff.total === 0 && diff.pending === 0 && diff.completed === 0) return;

  const globalRef = doc(db, 'foreigner_stats', 'global');
  const branchRef = doc(db, 'foreigner_stats', branchId);

  const payload = {
    total: increment(diff.total),
    pending: increment(diff.pending),
    completed: increment(diff.completed)
  };

  batch.set(globalRef, payload, { merge: true });
  batch.set(branchRef, payload, { merge: true });
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
   * - branch_staff: 自分の支部のデータのみ
   * - hq_admin / scrivener: 全支部のデータ
   */
  async getForeignersByRole(role: UserRole, branchId?: string): Promise<Foreigner[]> {
    let q;

    if (canViewAllBranches(role)) {
      // 本部管理者・行政書士: 全データ取得
      q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"), limit(50));
    } else {
      // 支部事務員: 自支部のデータのみ
      if (!branchId) {
        console.error("[foreignerService] branch_staff requires branchId");
        return [];
      }
      q = query(
        collection(db, COLLECTION_NAME),
        where("branchId", "==", branchId),
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
    branchId: string | undefined, 
    callback: (data: Foreigner[]) => void
  ): () => void {
    let q;

    if (canViewAllBranches(role)) {
      q = query(collection(db, COLLECTION_NAME), orderBy("updatedAt", "desc"), limit(50));
    } else {
      if (!branchId) {
        console.error("[foreignerService] branch_staff requires branchId");
        return () => {}; // return empty unsubscribe
      }
      q = query(
        collection(db, COLLECTION_NAME),
        where("branchId", "==", branchId),
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
    branchId: string | undefined,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null
  ): Promise<{ docs: Foreigner[], lastDoc: QueryDocumentSnapshot<DocumentData> | null, hasMore: boolean }> {
    let q;
    const baseCol = collection(db, COLLECTION_NAME);

    // 管理者で「すべての支部」を見る場合
    if (canViewAllBranches(role) && !branchId) {
      if (lastDoc) {
        q = query(baseCol, orderBy("updatedAt", "desc"), startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(baseCol, orderBy("updatedAt", "desc"), limit(pageSize));
      }
    } else {
      // 特定の支部のみを見る場合（管理者で支部タブを選んだ場合、または一般ユーザー）
      if (!branchId) {
        throw new Error("[foreignerService] branch_staff requires branchId");
      }
      if (lastDoc) {
        q = query(baseCol, where("branchId", "==", branchId), orderBy("updatedAt", "desc"), startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(baseCol, where("branchId", "==", branchId), orderBy("updatedAt", "desc"), limit(pageSize));
      }
    }

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

    const batch = writeBatch(db);

    if (docSnap.exists()) {
      const oldStatus = docSnap.data().status;
      const newStatus = data.status || oldStatus;
      
      batch.update(docRef, commonData);
      
      const statsDiff = getStatsChanges(oldStatus, newStatus);
      applyStatsIncrement(batch, docSnap.data().branchId, { total: 0, ...statsDiff });
    } else {
      const newStatus = data.status || '準備中';
      const insertData = {
        ...commonData,
        createdAt: new Date().toISOString(),
        status: newStatus,
      };
      batch.set(docRef, insertData);

      const statsDiff = getStatsChanges(undefined, newStatus);
      applyStatsIncrement(batch, commonData.branchId, { total: 1, ...statsDiff });
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
    const branchId = currentDoc.data().branchId;

    const batch = writeBatch(db);
    batch.update(docRef, {
      ...data,
      isEditedByAdmin: true,
      updatedAt: new Date().toISOString(),
    });

    const statsDiff = getStatsChanges(oldStatus, newStatus);
    applyStatsIncrement(batch, branchId, { total: 0, ...statsDiff });

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
    applyStatsIncrement(batch, currentData.branchId, { total: 0, ...statsDiff });

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
  async updateForeignerByStaff(id: string, data: Partial<Foreigner>, userBranchId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const currentDoc = await getDoc(docRef);

    if (!currentDoc.exists()) {
      throw new Error("対象のデータが見つかりませんでした");
    }

    // 支部IDが一致するかチェック
    const branchId = currentDoc.data().branchId;
    if (branchId !== userBranchId) {
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
    applyStatsIncrement(batch, branchId, { total: 0, ...statsDiff });

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
    const branchId = data.branchId;
    const oldStatus = data.status;

    const batch = writeBatch(db);
    batch.delete(docRef);

    const statsDiff = getStatsChanges(oldStatus, undefined);
    applyStatsIncrement(batch, branchId, { total: -1, ...statsDiff });

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

    // 1. 削除対象ドキュメントを並列取得（集計用にステータス・branchIdが必要）
    const snaps = await Promise.all(
      ids.map(id => getDoc(doc(db, COLLECTION_NAME, id)))
    );

    // 2. 存在するものだけを対象とし、支部別の集計差分を計算
    type StatsDiff = { total: number; pending: number; completed: number };
    const branchDiffs = new Map<string, StatsDiff>();

    const existingSnaps = snaps.filter(s => s.exists());
    for (const snap of existingSnaps) {
      const data = snap.data();
      const branchId: string = data.branchId ?? DEFAULT_BRANCH_ID;
      const oldStatus: string | undefined = data.status;
      const statsDiff = getStatsChanges(oldStatus, undefined);
      const current = branchDiffs.get(branchId) ?? { total: 0, pending: 0, completed: 0 };
      branchDiffs.set(branchId, {
        total: current.total - 1,
        pending: current.pending + statsDiff.pending,
        completed: current.completed + statsDiff.completed,
      });
    }

    // 3. 500件上限に対応した分割バッチで削除
    const BATCH_LIMIT = 500;
    for (let i = 0; i < existingSnaps.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = existingSnaps.slice(i, i + BATCH_LIMIT);

      for (const snap of chunk) {
        batch.delete(snap.ref);
      }

      // 集計更新は先頭バッチにのみ追加（全支部分をまとめて反映）
      if (i === 0) {
        for (const [branchId, diff] of branchDiffs.entries()) {
          applyStatsIncrement(batch, branchId, diff);
        }
      }

      await batch.commit();
    }
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

      const batch = writeBatch(db);
      batch.set(doc(db, COLLECTION_NAME, demo1.id), demo1);
      batch.set(doc(db, COLLECTION_NAME, demo2.id), demo2);
      batch.set(doc(db, COLLECTION_NAME, demo3.id), demo3);

      applyStatsIncrement(batch, activeBranchId, { total: 3, pending: 2, completed: 1 });
      
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
      const branchId = docOld.data().branchId;
      const oldStatus = docOld.data().status;
      const newStatus = updateData.status || oldStatus;

      const batch = writeBatch(db);
      batch.update(docRef, updateData);

      const statsDiff = getStatsChanges(oldStatus, newStatus);
      applyStatsIncrement(batch, branchId, { total: 0, ...statsDiff });

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
        if (organizationId && organizationId !== 'hq_direct') {
          return query(foreignersCol, where(field, '==', value), where('branchId', '==', organizationId), limit(1));
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
        if (organizationId && organizationId !== 'hq_direct') {
          q = query(foreignersCol, where('name', '==', name), where('birthDate', '==', birthDate), where('branchId', '==', organizationId), limit(1));
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
        branchId: organizationId || 'hq_direct',
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
      return newId;
    }
  },
};
