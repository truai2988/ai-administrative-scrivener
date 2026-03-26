import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from "firebase/auth";
import { app } from "./client";

const auth = getAuth(app);

/**
 * メール・パスワードでログイン
 */
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * ログアウト
 */
export async function signOut() {
  return firebaseSignOut(auth);
}

/**
 * 認証状態の変化を監視
 */
export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * 現在のIDトークンを取得（Middleware用Cookie設定に使用）
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export { auth };
