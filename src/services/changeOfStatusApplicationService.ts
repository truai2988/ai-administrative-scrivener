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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { type ChangeOfStatusApplicationFormData, type AttachmentsMap } from '@/lib/schemas/changeOfStatusApplicationSchema';
import { type DiagnosticItem, type AiDiagnosticsData } from '@/types/aiDiagnostics';
import { COLLECTIONS, APPLICATION_STATUS } from '@/constants/firestore';
import { mapChangeOfStatusFormDataToForeigner } from '@/lib/utils/foreignerSyncMapper';
import { sanitizeForFirestore } from '@/lib/utils/firestoreUtils';
import { foreignerService } from '@/services/foreignerService';

const COLLECTION_NAME = COLLECTIONS.CHANGE_OF_STATUS_APPLICATIONS;

export type ChangeOfStatusApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

export interface ChangeOfStatusApplicationRecord {
  id: string;
  foreignerId?: string;        // 紐付ける外国人ドキュメントID（任意）
  status: ChangeOfStatusApplicationStatus;
  formData: ChangeOfStatusApplicationFormData | null;
  /** useFileUpload によって更新されるドキュメントルートの添付ファイルデータ */
  attachments?: AttachmentsMap;
  /** AI診断結果 */
  aiDiagnostics?: AiDiagnosticsData;
  createdAt: string;
  updatedAt: string;
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

    // ⑦ マスタ同期用の識別子と変換済みデータを準備（ChangeOfStatusは在留カード＋パスポート両対応）
    const buildSyncParams = (applicationId: string) => ({
      syncData: mapChangeOfStatusFormDataToForeigner(safeFormData, applicationId, APPLICATION_STATUS.EDITING) as import('@/types/database').Foreigner,
      identifiers: {
        residenceCardNumber: safeFormData.foreignerInfo?.residenceCardNumber,
        passportNumber: safeFormData.foreignerInfo?.passportNumber,
        name: safeFormData.foreignerInfo?.nameKanji || safeFormData.foreignerInfo?.nameEn || '',
        birthDate: safeFormData.foreignerInfo?.birthDate || '',
      },
      applicationId,
      organizationId,
    });

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

      // ⑦ 共通マスタ同期
      const syncedForeignerId = await foreignerService.syncForeignerMasterRecord({
        ...buildSyncParams(existingId),
        providedForeignerId: resolvedForeignerId,
      });

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

      // ⑦ 共通マスタ同期
      const syncedForeignerId = await foreignerService.syncForeignerMasterRecord({
        ...buildSyncParams(newId),
        providedForeignerId: foreignerId,
      });

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
