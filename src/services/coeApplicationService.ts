/**
 * coeApplicationService.ts
 * 在留資格認定証明書交付申請フォームのFirebase保存サービス
 *
 * Firestore コレクション: "coe_applications"
 * Foreigner コレクションとは独立した別コレクションで管理する
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
import { type CoeApplicationFormData } from '@/lib/schemas/coeApplicationSchema';
import { type AttachmentsMap } from '@/lib/schemas/renewalApplicationSchema';
import { COLLECTIONS, APPLICATION_STATUS } from '@/constants/firestore';
import { mapCoeFormDataToForeigner } from '@/lib/utils/foreignerSyncMapper';
import { sanitizeForFirestore, isValidPersonName } from '@/lib/utils/firestoreUtils';

const COLLECTION_NAME = COLLECTIONS.COE_APPLICATIONS;

export type CoeApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

export interface CoeApplicationRecord {
  id: string;
  foreignerId?: string;        // 紐付ける外国人ドキュメントID（任意）
  status: CoeApplicationStatus;
  formData: CoeApplicationFormData | null;
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
  formData: CoeApplicationFormData,
  applicationId: string,
  appStatus: string,
  providedForeignerId?: string,
  organizationId?: string
): Promise<string | null> {
  const foreignersCol = collection(db, COLLECTIONS.FOREIGNERS);
  
  let matchedDocId: string | null = providedForeignerId || null;
  
  if (!matchedDocId) {
    const passportNum = formData.identityInfo.passportNumber?.replace(/[^A-Za-z0-9]/g, '');
    const name = formData.identityInfo.nameKanji || formData.identityInfo.nameEn || '';
    const birthDate = formData.identityInfo.birthDate || '';

    // ③ '名称未設定' も含めて「有効な識別情報がない」場合はマスタレコードを作成しない
    if (!passportNum && !isValidPersonName(name)) {
      return null;
    }

    // ②パスポート番号で完全一致検索 (COEでは在留カード番号がないため)
    if (passportNum && passportNum.length > 0) {
      let qPassport;
      if (organizationId && organizationId !== 'hq_direct') {
        qPassport = query(foreignersCol, where('passportNumber', '==', passportNum), where('branchId', '==', organizationId), limit(1));
      } else {
        qPassport = query(foreignersCol, where('passportNumber', '==', passportNum), limit(1));
      }
      const snapPassport = await getDocs(qPassport);
      if (!snapPassport.empty) {
        matchedDocId = snapPassport.docs[0].id;
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

  const syncData = mapCoeFormDataToForeigner(formData, applicationId, appStatus);
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

export const coeApplicationService = {
  /**
   * 申請フォームデータを保存（新規 or 更新）
   * ステータスは常に 'editing' に移行する
   */
  async save(
    formData: CoeApplicationFormData,
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
      // ルートのattachments と formDataのattachments をマージ（ルートのデータを優先）
      const mergedAttachments: AttachmentsMap = {
        // ...(safeFormData.attachments || {}), // COEフォームにattachmentsが追加された場合用
        ...(rootAttachments || {}),
      };
      
      // デバッグログ
      console.log('[coeApplicationService.save] 保存する attachments:', JSON.stringify(mergedAttachments));

      const updateData: Record<string, unknown> = {
        formData: safeFormData,
        // ルートのattachmentsも同期させる
        attachments: mergedAttachments,
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
      // パスポート番号 + タイムスタンプをIDの基底にする
      const passportNum = formData.identityInfo.passportNumber?.replace(/[^A-Za-z0-9]/g, '') || 'UNKNOWN';
      const ts      = Date.now().toString(36).toUpperCase();
      const newId   = `coe_${passportNum}_${ts}`;

      // マスタへの自動同期
      const syncedForeignerId = await _syncForeignerMaster(safeFormData, newId, APPLICATION_STATUS.EDITING, foreignerId, organizationId);

      const docRef = doc(db, COLLECTION_NAME, newId);
      const record: CoeApplicationRecord = {
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
  async getById(id: string): Promise<CoeApplicationRecord | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap   = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as CoeApplicationRecord;
  },

  async getByForeignerId(foreignerId: string): Promise<CoeApplicationRecord | null> {
    const col = collection(db, COLLECTION_NAME);
    const q   = query(col, where('foreignerId', '==', foreignerId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoeApplicationRecord));

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
    const newId = `coe_draft_${ts}`;

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
