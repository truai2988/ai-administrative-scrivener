import { db } from '@/lib/firebase/client';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import type { DocumentTemplate } from '@/types/database';

/**
 * テンプレートマスターの一覧を取得する
 */
export async function fetchDocumentTemplates(): Promise<DocumentTemplate[]> {
  const q = query(
    collection(db, 'document_templates'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      formId: data.formId,
      formName: data.formName,
      fileType: data.fileType,
      storagePath: data.storagePath,
      downloadUrl: data.downloadUrl,
      uploadedBy: data.uploadedBy,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as DocumentTemplate;
  });
}
