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
import { type RenewalApplicationFormData, type AttachmentsMap } from '@/lib/schemas/renewalApplicationSchema';
import { COLLECTIONS, APPLICATION_STATUS } from '@/constants/firestore';
import { mapFormDataToForeigner } from '@/lib/utils/foreignerSyncMapper';

const COLLECTION_NAME = COLLECTIONS.RENEWAL_APPLICATIONS;

export type RenewalApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

export interface RenewalApplicationRecord {
  id: string;
  foreignerId?: string;        // 紐付ける外国人ドキュメントID（任意）
  status: RenewalApplicationStatus;
  formData: RenewalApplicationFormData;
  /** useFileUpload によって更新されるドキュメントルートの添付ファイルデータ */
  attachments?: AttachmentsMap;
  createdAt: string;
  updatedAt: string;
}

/**
 * Firestoreは undefined 値を受け付けないため、保存前に除去する。
 * JSON.stringify は undefined を自動的に取り除くため、
 * ネストの深さに関わらず確実に動作する。
 * （フォームデータはDate/Symbolを含まないため安全）
 */
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * 内部ヘルパー：申請書保存時に対応する外国人マスタ（Foreigner）を自動検索・Upsertする
 */
async function _syncForeignerMaster(
  formData: RenewalApplicationFormData,
  applicationId: string,
  appStatus: string,
  providedForeignerId?: string,
  organizationId?: string
): Promise<string> {
  const foreignersCol = collection(db, COLLECTIONS.FOREIGNERS);
  
  let matchedDocId: string | null = providedForeignerId || null;
  
  if (!matchedDocId) {
    const cardNum = formData.foreignerInfo.residenceCardNumber?.replace(/[^A-Za-z0-9]/g, '');
    const name = formData.foreignerInfo.nameKanji || formData.foreignerInfo.nameEn || '';
    const birthDate = formData.foreignerInfo.birthDate || '';

    // ①在留カード番号で完全一致検索
    if (cardNum && cardNum.length > 0) {
      let qCard;
      if (organizationId && organizationId !== 'hq_direct') {
        qCard = query(foreignersCol, where('residenceCardNumber', '==', cardNum), where('branchId', '==', organizationId), limit(1));
      } else {
        qCard = query(foreignersCol, where('residenceCardNumber', '==', cardNum), limit(1));
      }
      const snapCard = await getDocs(qCard);
      if (!snapCard.empty) {
        matchedDocId = snapCard.docs[0].id;
      }
    }

    // ②名前＋生年月日で完全一致検索
    if (!matchedDocId && name.length > 0 && birthDate.length > 0) {
      let qProfile;
      if (organizationId && organizationId !== 'hq_direct') {
        qProfile = query(foreignersCol, where('name', '==', name), where('birthDate', '==', birthDate), where('branchId', '==', organizationId), limit(1));
      } else {
        qProfile = query(foreignersCol, where('name', '==', name), where('birthDate', '==', birthDate), limit(1));
      }
      const snapProfile = await getDocs(qProfile);
      if (!snapProfile.empty) {
        matchedDocId = snapProfile.docs[0].id;
      }
    }
  }

  const syncData = mapFormDataToForeigner(formData, applicationId, appStatus);
  const now = new Date().toISOString();

  if (matchedDocId) {
    const docRef = doc(db, COLLECTIONS.FOREIGNERS, matchedDocId);
    await setDoc(docRef, { ...syncData, updatedAt: now }, { merge: true });
    return matchedDocId;
  } else {
    // 新規作成
    const newId = `foreigner_${Date.now().toString(36).toUpperCase()}`;
    const docRef = doc(db, COLLECTIONS.FOREIGNERS, newId);
    await setDoc(docRef, {
      ...syncData,
      id: newId,
      branchId: organizationId || 'hq_direct',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    return newId;
  }
}

export const renewalApplicationService = {
  /**
   * 申請フォームデータを保存（新規 or 更新）
   * ステータスは常に 'editing' に移行する
   */
  async save(
    formData: RenewalApplicationFormData,
    existingId?: string,
    foreignerId?: string,
    organizationId?: string
  ): Promise<string> {
    const now = new Date().toISOString();
    const safeFormData = sanitizeForFirestore(formData);

    if (existingId) {
      // 既存レコードの更新
      const docRef = doc(db, COLLECTION_NAME, existingId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        throw new Error(`申請書が見つかりません (id: ${existingId})`);
      }

      // ─── attachments の補完 ──────────────────────────────────────────────
      // useFileUploadはルートの attachments を直接更新するが、
      // formDataの中のattachmentsはReact Hook Form経由で更新される。
      // 保存時に両者を確実にマージして整合性を保つ。
      const existingDocData = snap.data();
      const rootAttachments = existingDocData?.attachments as AttachmentsMap | undefined;
      // ルートのattachments と formDataのattachments をマージ（ルートのデータを優先）
      const mergedAttachments: AttachmentsMap = {
        ...(safeFormData.attachments || {}),
        ...(rootAttachments || {}),
      };
      if (Object.keys(mergedAttachments).length > 0) {
        safeFormData.attachments = mergedAttachments;
      }
      // ────────────────────────────────────────────────────────────────────

      // デバッグログ（確認後に削除可能）
      console.log('[renewalApplicationService.save] 保存する formData.attachments:', JSON.stringify(safeFormData.attachments));

      await updateDoc(docRef, {
        formData: safeFormData,
        // ルートのattachmentsもformDataと同期させる（次回読込時の整合性確保）
        attachments: safeFormData.attachments ?? {},
        status: APPLICATION_STATUS.EDITING,
        updatedAt: now,
        ...(foreignerId ? { foreignerId } : {}),
      });

      // マスタへの自動同期
      await _syncForeignerMaster(safeFormData, existingId, APPLICATION_STATUS.EDITING, foreignerId, organizationId);

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
        status: APPLICATION_STATUS.EDITING,
        formData: safeFormData,
        createdAt: now,
        updatedAt: now,
        ...(foreignerId ? { foreignerId } : {}),
      };

      await setDoc(docRef, record);

      // マスタへの自動同期
      await _syncForeignerMaster(safeFormData, newId, APPLICATION_STATUS.EDITING, foreignerId, organizationId);

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

  async getByForeignerId(foreignerId: string): Promise<RenewalApplicationRecord | null> {
    const col = collection(db, COLLECTION_NAME);
    const q   = query(col, where('foreignerId', '==', foreignerId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RenewalApplicationRecord));

    // 優先順位:
    // 1. formData が null でない（実際のデータがある）ものを先頭に
    // 2. 同順位内では updatedAt の降順（最新順）
    docs.sort((a, b) => {
      const aHasData = a.formData !== null && a.formData !== undefined ? 1 : 0;
      const bHasData = b.formData !== null && b.formData !== undefined ? 1 : 0;
      if (aHasData !== bHasData) return bHasData - aHasData;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    return docs[0];
  },

  /**
   * 先行保存: フォームデータなしでステータス draft の空ドキュメントを作成し、
   * applicationId を即座に発行する（書類ファーストワークフロー用）。
   *
   * @param foreignerId - 紐付ける外国人ID（任意）
   * @returns 発行された applicationId
   */
  async createDraft(foreignerId?: string): Promise<string> {
    const now  = new Date().toISOString();
    const ts   = Date.now().toString(36).toUpperCase();
    const newId = `renewal_draft_${ts}`;

    const docRef = doc(db, COLLECTION_NAME, newId);
    const record = {
      id:         newId,
      status:     APPLICATION_STATUS.DRAFT,
      formData:   null,          // フォームデータはまだ存在しない
      createdAt:  now,
      updatedAt:  now,
      ...(foreignerId ? { foreignerId } : {}),
    };

    await setDoc(docRef, record);
    return newId;
  },
};

