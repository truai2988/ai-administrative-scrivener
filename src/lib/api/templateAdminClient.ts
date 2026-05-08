import { db, storage } from '@/lib/firebase/client';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
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

/**
 * テンプレートをStorageにアップロードし、Firestoreにメタデータを保存する
 */
export async function uploadDocumentTemplate(
  file: File,
  formId: string,
  formName: string,
  fileType: 'excel' | 'word',
  uid: string,
  onProgress?: (progress: number) => void
): Promise<DocumentTemplate> {
  // 元のファイル名を利用するが、タイムスタンプを付与して一意性を担保
  const safeFileName = `${Date.now()}_${file.name}`;
  // ユーザー指定のパス構造: templates/{formId}/{fileType}/{fileName}
  const storagePath = `templates/${formId}/${fileType}/${safeFileName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Storage upload error:', error);
        reject(new Error('ファイルのアップロードに失敗しました。'));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Firestoreに保存
          const newDocRef = doc(collection(db, 'document_templates'));
          const now = new Date().toISOString();
          
          const templateData = {
            id: newDocRef.id,
            formId,
            formName,
            fileType,
            storagePath,
            downloadUrl,
            uploadedBy: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(newDocRef, templateData);

          resolve({
            ...templateData,
            createdAt: now,
            updatedAt: now,
          } as DocumentTemplate);
        } catch (error) {
          console.error('Firestore save error:', error);
          reject(new Error('テンプレート情報の保存に失敗しました。'));
        }
      }
    );
  });
}

/**
 * テンプレートを削除する（Storage + Firestore）
 */
export async function deleteDocumentTemplate(id: string, storagePath: string): Promise<void> {
  try {
    // 1. Storageから削除
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error: unknown) {
    const err = error as { code?: string };
    // Storage上にファイルが存在しない(404)場合は無視してFirestore削除へ進む
    if (err.code !== 'storage/object-not-found') {
      console.error('Storage delete error:', error);
      throw new Error('ファイルの削除に失敗しました。');
    }
  }

  try {
    // 2. Firestoreから削除
    await deleteDoc(doc(db, 'document_templates', id));
  } catch (error) {
    console.error('Firestore delete error:', error);
    throw new Error('テンプレート情報の削除に失敗しました。');
  }
}
