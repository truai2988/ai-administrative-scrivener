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
import { type CoeApplicationFormData, type TabAssignments } from '@/lib/schemas/coeApplicationSchema';
import { type AttachmentsMap } from '@/lib/schemas/renewalApplicationSchema';
import { type AiDiagnosticsData } from '@/types/aiDiagnostics';
import { COLLECTIONS, APPLICATION_STATUS } from '@/constants/firestore';
import { mapCoeFormDataToForeigner } from '@/lib/utils/foreignerSyncMapper';
import { sanitizeForFirestore } from '@/lib/utils/firestoreUtils';
import { foreignerService } from '@/services/foreignerService';

const COLLECTION_NAME = COLLECTIONS.COE_APPLICATIONS;

export type CoeApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

export interface CoeApplicationRecord {
  id: string;
  foreignerId?: string;        // 紐付ける外国人ドキュメントID（任意）
  status: CoeApplicationStatus;
  formData: CoeApplicationFormData | null;
  /** useFileUpload によって更新されるドキュメントルートの添付ファイルデータ */
  attachments?: AttachmentsMap;
  /** AI診断結果 */
  aiDiagnostics?: AiDiagnosticsData;
  createdAt: string;
  updatedAt: string;
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

    // ⑦ マスタ同期用の識別子と変換済みデータを準備（COEはpassportNumberのみ）
    const buildSyncParams = (applicationId: string) => ({
      syncData: mapCoeFormDataToForeigner(safeFormData, applicationId, APPLICATION_STATUS.EDITING) as import('@/types/database').Foreigner,
      identifiers: {
        passportNumber: safeFormData.identityInfo?.passportNumber,
        name: safeFormData.identityInfo?.nameKanji || safeFormData.identityInfo?.nameEn || '',
        birthDate: safeFormData.identityInfo?.birthDate || '',
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
      // ルートのattachments と formDataのattachments をマージ（ルートのデータを優先）
      const mergedAttachments: AttachmentsMap = {
        // ...(safeFormData.attachments || {}), // COEフォームにattachmentsが追加された場合用
        ...(rootAttachments || {}),
      };
      
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

      // ⑦ 共通マスタ同期
      const syncedForeignerId = await foreignerService.syncForeignerMasterRecord({
        ...buildSyncParams(newId),
        providedForeignerId: foreignerId,
      });

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

  /**
   * 担当者（assignments）のみを安全に部分更新する
   */
  async updateAssignments(id: string, assignments: TabAssignments): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const now = new Date().toISOString();
    
    // formDataが未定義（draft等）の場合を考慮し、merge: true の setDoc で安全に部分更新する
    await setDoc(docRef, {
      formData: { assignments },
      updatedAt: now,
    }, { merge: true });
  },
};
