import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { sanitizeForFirestore } from '@/lib/utils/firestoreUtils';

export const dynamicApplicationService = {
  getDraftId(formType: string, userId: string) {
    return `draft_${userId}_${formType}`;
  },

  async findLatestDraft(formType: string, userId: string): Promise<{ id: string, data: any } | null> {
    const draftId = this.getDraftId(formType, userId);
    const snap = await getDoc(doc(db, 'dynamic_applications', draftId));
    if (snap.exists() && snap.data().data) {
      return { id: draftId, data: snap.data().data };
    }
    return null;
  },

  async createDraft(formType: string, userId: string): Promise<string> {
    const draftId = this.getDraftId(formType, userId);
    const now = new Date().toISOString();
    // Use setDoc with merge: true to avoid overwriting existing data if it exists
    await setDoc(doc(db, 'dynamic_applications', draftId), {
      id: draftId,
      formType,
      userId,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    return draftId;
  },

  async save(id: string, formType: string, userId: string, data: any): Promise<void> {
    const docRef = doc(db, 'dynamic_applications', id);
    const now = new Date().toISOString();
    await updateDoc(docRef, {
      formType,
      userId,
      data: sanitizeForFirestore(data),
      updatedAt: now,
    });
  }
};
