import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

db = getFirestore(app);

// Next.js環境（SSR）ではブラウザ側だけで実行させる
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('複数タブが開かれているため、オフラインキャッシュは1つのタブでのみ有効になります。');
    } else if (err.code === 'unimplemented') {
      console.warn('このブラウザはオフラインキャッシュ機能をサポートしていません。');
    }
  });
}

const storage = getStorage(app);

export { app, db, storage };
