import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getApps().length > 0 ? getFirestore(app) : initializeFirestore(app, { experimentalForceLongPolling: true });

export { app, db };
