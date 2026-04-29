import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  Firestore 
} from "firebase/firestore";
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


// Next.js環境（SSR）ではブラウザ側だけで実行させる
if (typeof window !== "undefined") {
  // 開発環境のホットリロード（HMR）時に IndexedDB のリースクラッシュ（Backfill Indexes）
  // エラーがコンソールを埋め尽くすのを防ぐため、開発環境では通常の getFirestore を使用。
  if (process.env.NODE_ENV === 'development') {
    db = getFirestore(app);
  } else {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      // 既に初期化済みの場合はフォールバック
      db = getFirestore(app);
    }
  }
} else {
  // SSR時のフォールバック用初期化
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, db, storage };
