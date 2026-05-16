/**
 * Firebase Admin SDK 初期化
 *
 * サーバーサイド（API Route / Server Actions）専用。
 * クライアントコンポーネントからは絶対にインポートしないこと。
 *
 * 必要な環境変数（.env.local）:
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY  ← 改行は \n でエスケープして記述
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let _app: App | null = null;

/**
 * 遅延初期化されたFirebase Admin Appを取得する
 * モジュールのトップレベルでは実行されないため、ビルド時に環境変数が
 * 存在しなくてもビルドが通る（リクエスト時のみ評価される）
 */
function getAdminApp(): App {
  if (_app) return _app;

  // 既に別な箇所で初期化済みの場合はそれを利用
  const existingApps = getApps();
  if (existingApps.length > 0) {
    _app = existingApps[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[Firebase Admin] 環境変数が未設定です。' +
        'FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY を .env.local に設定してください。'
    );
  }

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  });

  return _app;
}

/** Firebase Admin Auth インスタンス（遅延取得） */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

let _db: Firestore | null = null;

/** Firebase Admin Firestore インスタンス（遅延取得） */
export function getAdminDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getAdminApp());
  try {
    _db.settings({ ignoreUndefinedProperties: true });
  } catch (e) {
    console.warn('[Firebase Admin] Failed to set ignoreUndefinedProperties:', e);
  }
  return _db;
}

/** Firebase Admin Storage インスタンス（遅延取得） */
export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}

// 後方互換のためのエイリアス（既存コードが壊れないよう）
export const adminAuth = {
  verifyIdToken: (...args: Parameters<Auth['verifyIdToken']>) => getAdminAuth().verifyIdToken(...args),
  createUser: (...args: Parameters<Auth['createUser']>) => getAdminAuth().createUser(...args),
  updateUser: (...args: Parameters<Auth['updateUser']>) => getAdminAuth().updateUser(...args),
  deleteUser: (...args: Parameters<Auth['deleteUser']>) => getAdminAuth().deleteUser(...args),
};

export const adminDb = {
  collection: (...args: Parameters<Firestore['collection']>) => getAdminDb().collection(...args),
};
