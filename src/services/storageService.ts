import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';

export const storageService = {
  /**
   * Upload a file to Firebase Storage
   * @param file File object to upload
   * @param path Storage path (e.g., 'foreigners/123/passport.jpg')
   * @returns Download URL of the uploaded file
   */
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  }
};
