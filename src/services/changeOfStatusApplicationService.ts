/**
 * changeOfStatusApplicationService.ts
 * 在留資格変更許可申請フォームのFirebase保存サービス
 *
 * Firestore コレクション: "change_of_status_applications"
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
import { type ChangeOfStatusApplicationFormData, type AttachmentsMap } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { COLLECTIONS, APPLICATION_STATUS } from '@/constants/firestore';
import { mapChangeOfStatusFormDataToForeigner } from '@/lib/utils/foreignerSyncMapper';
import { sanitizeForFirestore, isValidPersonName } from '@/lib/utils/firestoreUtils';

const COLLECTION_NAME = COLLECTIONS.CHANGE_OF_STATUS_APPLICATIONS;

export type ChangeOfStatusApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

export interface ChangeOfStatusApplicationRecord {
  id: string;
  foreignerId?: string;        // 紐付ける外国人ドキュメントID（任意）
  status: ChangeOfStatusApplicationStatus;
  formData: ChangeOfStatusApplicationFormData | null;
  /** useFileUpload によって更新されるドキュメントルートの添付ファイルデータ */
  attachments?: AttachmentsMap;
  createdAt: string;
  updatedAt: string;
}

// sanitizeForFirestore は @/lib/utils/firestoreUtils からインポートして使用

/**
 * 内部ヘルパー：申請書保存時に対応する外国人マスタ（Foreigner）を自動検索・Upsertする
 */
async function _syncForeignerMaster(
  formData: ChangeOfStatusApplicationFormData,
  applicationId: string,
  appStatus: string,
  providedForeignerId?: string,
  organizationId?: string
): Promise<string | null> {
  const foreignersCol = collection(db, COLLECTIONS.FOREIGNERS);
  
  let matchedDocId: string | null = providedForeignerId || null;
  
  if (!matchedDocId) {
    const cardNum = formData.foreignerInfo.residenceCardNumber?.replace(/[^A-Za-z0-9]/g, '');
    const passportNum = formData.foreignerInfo.passportNumber?.replace(/[^A-Za-z0-9]/g, '');
    const name = formData.foreignerInfo.nameKanji || formData.foreignerInfo.nameEn || '';
    const birthDate = formData.foreignerInfo.birthDate || '';

    // ③ '名称未設定' も含めて「有効な識別情報がない」場合はマスタレコードを作成しない
    if (!cardNum && !passportNum && !isValidPersonName(name)) {
      return null;
    }

    // ②在留カード番号で完全一致検索
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

  const syncData = mapChangeOfStatusFormDataToForeigner(formData, applicationId, appStatus);
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

export const changeOfStatusApplicationService = {
  /**
   * 申請フォームデータを保存（新規 or 更新）
   * ステータスは常に 'editing' に移行する
   */
  async save(
    formData: ChangeOfStatusApplicationFormData,
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
      const existingDocData = snap.data();
      const existingForeignerId = existingDocData?.foreignerId;
      const resolvedForeignerId = foreignerId || existingForeignerId;

      // マスタへの自動同期
      const syncedForeignerId = await _syncForeignerMaster(safeFormData, existingId, APPLICATION_STATUS.EDITING, resolvedForeignerId, organizationId);

      const rootAttachments = existingDocData?.attachments as AttachmentsMap | undefined;
      const mergedAttachments: AttachmentsMap = {
        ...(safeFormData.attachments || {}),
        ...(rootAttachments || {}),
      };
      if (Object.keys(mergedAttachments).length > 0) {
        safeFormData.attachments = mergedAttachments;
      }
      // ────────────────────────────────────────────────────────────────────

      const updateData: Record<string, unknown> = {
        formData: safeFormData,
        attachments: safeFormData.attachments ?? {},
        status: APPLICATION_STATUS.EDITING,
        updatedAt: now,
        ...(foreignerId ? { foreignerId } : {}),
      };

      if (syncedForeignerId) {
        updateData.foreignerId = syncedForeignerId;
      }

      await updateDoc(docRef, updateData);

      return existingId;
    } else {
      // 新規作成
      const cardNum = formData.foreignerInfo.residenceCardNumber?.replace(/[^A-Za-z0-9]/g, '') || 'UNKNOWN';
      const ts      = Date.now().toString(36).toUpperCase();
      const newId   = `change_status_${cardNum}_${ts}`;

      // マスタへの自動同期
      const syncedForeignerId = await _syncForeignerMaster(safeFormData, newId, APPLICATION_STATUS.EDITING, foreignerId, organizationId);

      const docRef = doc(db, COLLECTION_NAME, newId);
      const record: ChangeOfStatusApplicationRecord = {
        id: newId,
        status: APPLICATION_STATUS.EDITING,
        formData: safeFormData,
        createdAt: now,
        updatedAt: now,
        ...(foreignerId ? { foreignerId } : {}),
      };

      if (syncedForeignerId) {
        record.foreignerId = syncedForeignerId;
      }

      await setDoc(docRef, record);

      return newId;
    }
  },

  /**
   * 既存レコードの取得（IDで直接）
   */
  async getById(id: string): Promise<ChangeOfStatusApplicationRecord | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap   = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ChangeOfStatusApplicationRecord;
  },

  async getByForeignerId(foreignerId: string): Promise<ChangeOfStatusApplicationRecord | null> {
    const col = collection(db, COLLECTION_NAME);
    const q   = query(col, where('foreignerId', '==', foreignerId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChangeOfStatusApplicationRecord));

    // 優先順位
    docs.sort((a, b) => {
      const aHasData = a.formData !== null && a.formData !== undefined ? 1 : 0;
      const bHasData = b.formData !== null && b.formData !== undefined ? 1 : 0;
      if (aHasData !== bHasData) return bHasData - aHasData;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    return docs[0];
  },

  /**
   * 先行保存
   */
  async createDraft(foreignerId?: string): Promise<string> {
    const now  = new Date().toISOString();
    const ts   = Date.now().toString(36).toUpperCase();
    const newId = `change_status_draft_${ts}`;

    const docRef = doc(db, COLLECTION_NAME, newId);
    const record = {
      id:         newId,
      status:     APPLICATION_STATUS.DRAFT,
      formData:   null,
      createdAt:  now,
      updatedAt:  now,
      ...(foreignerId ? { foreignerId } : {}),
    };

    await setDoc(docRef, record);
    return newId;
  },
};
