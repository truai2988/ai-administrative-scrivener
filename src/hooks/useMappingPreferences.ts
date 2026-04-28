'use client';

/**
 * useMappingPreferences.ts
 *
 * Firestore の users/{userId}/mappingPreferences/default ドキュメントを
 * 読み書きするカスタムフック。
 *
 * ■ 読み込み: ページロード時に onSnapshot でリアルタイム同期
 * ■ 書き込み: setDoc(merge: true) でキー単位の上書き
 *
 * 学習辞書 (MappingDictionary) を useClickToFill の setLearnedMappings に
 * 注入するブリッジとして機能する。
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MappingDictionary } from '@/hooks/useClickToFill';

// ─── Firestore ドキュメント構造 ──────────────────────────────────────────────

interface MappingPreferencesDoc {
  /** breadcrumbKey → fieldPath のマッピング辞書 */
  mappings: MappingDictionary;
  /** 最終更新日時 */
  updatedAt?: Date;
}

// ─── Return 型 ───────────────────────────────────────────────────────────────

export interface UseMappingPreferencesReturn {
  /** Firestore から読み込んだ学習辞書 */
  mappings: MappingDictionary;
  /** ロード中フラグ */
  isLoading: boolean;
  /** 単一マッピングを Firestore に保存（キー上書き） */
  saveMappingToFirestore: (breadcrumbKey: string, fieldPath: string) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMappingPreferences(): UseMappingPreferencesReturn {
  const { currentUser } = useAuth();
  const [mappings, setMappings] = useState<MappingDictionary>({});
  const [isLoading, setIsLoading] = useState(true);

  // 重複初回ロードを防止する ref
  const loadedRef = useRef(false);

  // ── 初回ロード: Firestore からマッピング辞書を取得 ─────────────────────
  useEffect(() => {
    if (!currentUser?.id || loadedRef.current) {
      setIsLoading(false);
      return;
    }

    const loadMappings = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.id, 'mappingPreferences', 'default');
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as MappingPreferencesDoc;
          setMappings(data.mappings || {});
          console.log(
            `[MappingPreferences] ✅ ${Object.keys(data.mappings || {}).length} 件の学習データをロードしました`,
          );
        } else {
          console.log('[MappingPreferences] 📄 学習データなし（新規ユーザー）');
          setMappings({});
        }

        loadedRef.current = true;
      } catch (err) {
        console.error('[MappingPreferences] ❌ ロード失敗:', err);
        setMappings({});
      } finally {
        setIsLoading(false);
      }
    };

    loadMappings();
  }, [currentUser?.id]);

  // ── 単一マッピングの保存（Fire-and-forget） ───────────────────────────
  const saveMappingToFirestore = useCallback(
    (breadcrumbKey: string, fieldPath: string) => {
      if (!currentUser?.id) {
        console.warn('[MappingPreferences] ユーザー未認証のため保存をスキップ');
        return;
      }

      // ローカル state を即座に更新（楽観的更新）
      setMappings((prev) => ({ ...prev, [breadcrumbKey]: fieldPath }));

      // Firestore への書き込み（Fire-and-forget）
      const docRef = doc(db, 'users', currentUser.id, 'mappingPreferences', 'default');
      setDoc(
        docRef,
        {
          mappings: { [breadcrumbKey]: fieldPath },
          updatedAt: new Date(),
        },
        { merge: true },
      ).then(() => {
        console.log(`[MappingPreferences] 💾 保存: "${breadcrumbKey}" → "${fieldPath}"`);
      }).catch((err) => {
        console.warn('[MappingPreferences] 保存失敗（無視）:', err);
      });
    },
    [currentUser?.id],
  );

  return {
    mappings,
    isLoading,
    saveMappingToFirestore,
  };
}
