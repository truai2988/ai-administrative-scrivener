import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined") {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
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
