import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined") {
    // 開発環境のHot Reload時にFirestoreがIndexedDBのprimary leaseを取得し損ねるエラーを防ぐため、
    // dev環境では memoryLocalCache を使用し、本番環境のみ persistentLocalCache を有効にする
    const isDev = process.env.NODE_ENV === 'development';
    db = initializeFirestore(app, {
      localCache: isDev 
        ? memoryLocalCache() 
        : persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } else {
    db = getFirestore(app);
  }
} else {
  app = getApp();
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, db, storage };
