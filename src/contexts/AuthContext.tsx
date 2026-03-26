"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { signIn, signOut, onAuthStateChanged, getIdToken } from "@/lib/firebase/auth";
import { User } from "@/types/database";

interface AuthContextType {
  /** Firestore から取得したユーザー情報（ロール含む） */
  currentUser: User | null;
  /** 認証状態のロード中フラグ */
  loading: boolean;
  /** ログイン */
  login: (email: string, password: string) => Promise<void>;
  /** ログアウト */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

/**
 * 認証状態を管理するプロバイダーコンポーネント
 * Firebase Auth の認証状態を監視し、Firestoreからユーザードキュメント（ロール情報）を取得する
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Firestore の users コレクションからロール情報を取得
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
          } else {
            // Firestore にユーザードキュメントがない場合はログアウト
            console.error("User document not found in Firestore for UID:", firebaseUser.uid);
            await signOut();
            setCurrentUser(null);
          }

          // Middleware 用にセッション Cookie をセット
          const token = await getIdToken();
          if (token) {
            document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;
          }
        } catch (error) {
          console.error("Failed to fetch user document:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        // セッション Cookie をクリア
        document.cookie = "__session=; path=/; max-age=0";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const userCredential = await signIn(email, password);
    // onAuthStateChanged の非同期反映を待たずに、即座にセッション Cookie をセットして 
    // 次に発生する Next.js の router.push("/") 時の Middleware でのリダイレクトを防ぐ
    if (userCredential && userCredential.user) {
      const token = await userCredential.user.getIdToken();
      if (token) {
        document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
    document.cookie = "__session=; path=/; max-age=0";
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 認証コンテキストを取得するカスタムフック
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
