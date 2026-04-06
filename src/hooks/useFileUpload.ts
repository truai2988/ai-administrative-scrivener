'use client';

/**
 * useFileUpload.ts
 *
 * Firebase Storage へのファイルアップロード・削除ロジックをカプセル化する汎用フック。
 *
 * 責務:
 *   1. ファイルのバリデーション（fileUtils の純粋関数に委譲）
 *   2. Firebase Storage へのアップロード（進捗率管理付き）
 *   3. Firestore の renewal_applications/{applicationId}.attachments の同期
 *   4. ファイル削除（Storage + Firestore 両方）
 *   5. ローカル状態（attachments, isUploading, progress, error）の管理
 *
 * ■ 2026年1月仕様対応:
 *   - グローバル制限コンテキスト（GlobalLimitContext）を外部から注入し、
 *     申請全体のファイル数・サイズをバリデーションに使用
 *   - ファイル名サニタイズに連番インデックスを伝播
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { storage, db } from '@/lib/firebase/client';
import type { AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';
import type { AttachmentTabId, GlobalLimitContext } from '@/lib/utils/fileUtils';
import {
  validateFile,
  sanitizeFileName,
  generateStoragePath,
} from '@/lib/utils/fileUtils';
import { COLLECTIONS } from '@/constants/firestore';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

export interface UseFileUploadOptions {
  /** Firestore の renewal_applications ドキュメントID */
  applicationId: string;
  /**
   * Storage および Firestore の添付キー。
   * fileUtils.ts の AttachmentTabId と一致させること。
   */
  attachmentKey: AttachmentTabId;
  /** 初期値（既存の添付ファイルリスト） */
  initialAttachments?: AttachmentMeta[];
  /** 読み取り専用モード（権限なし：true でアップロード・削除を無効化） */
  readonly?: boolean;
  /**
   * 申請全体のグローバル制限コンテキスト。
   * 親コンポーネント（RenewalApplicationForm）から全タブの集計値を注入する。
   * 省略時はグローバルチェックをスキップ（後方互換性維持）。
   */
  globalLimitContext?: GlobalLimitContext;
  /** 添付ファイルリスト変更時の外部コールバック（親への通知用） */
  onAttachmentsChange?: (attachments: AttachmentMeta[]) => void;
}

export interface UseFileUploadReturn {
  /** 現在の添付ファイルリスト */
  attachments: AttachmentMeta[];
  /** アップロード中フラグ */
  isUploading: boolean;
  /** アップロード進捗率（0〜100） */
  uploadProgress: number;
  /** エラーメッセージ（null = エラーなし） */
  error: string | null;
  /** ファイルをアップロードする */
  uploadFile: (file: File, tag?: string) => Promise<void>;
  /** 指定IDのファイルを削除する */
  deleteFile: (attachmentId: string) => Promise<void>;
  /** エラーをクリアする */
  clearError: () => void;
}

// ─── フック実装 ───────────────────────────────────────────────────────────────

export function useFileUpload({
  applicationId,
  attachmentKey,
  initialAttachments = [],
  readonly = false,
  globalLimitContext,
  onAttachmentsChange,
}: UseFileUploadOptions): UseFileUploadReturn {
  const [attachments, setAttachments] = useState<AttachmentMeta[]>(initialAttachments);
  const attachmentsRef = useRef<AttachmentMeta[]>(attachments);
  
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ─── 削除 ─────────────────────────────────────────────────────────────────

  const deleteFile = useCallback(
    async (attachmentId: string): Promise<void> => {
      if (readonly) {
        setError('このタブからのファイル削除権限がありません。');
        return;
      }

      const target = attachmentsRef.current.find((a) => a.id === attachmentId);
      if (!target) return;

      setError(null);

      try {
        // Storage からファイルを削除
        const storageRef = ref(storage, target.path);
        await deleteObject(storageRef);

        // Firestore の配列から削除（arrayRemove で対象オブジェクトを除去）
        const docRef = doc(db, COLLECTIONS.RENEWAL_APPLICATIONS, applicationId);
        await updateDoc(docRef, {
          [`attachments.${attachmentKey}`]: arrayRemove(target),
          updatedAt: new Date().toISOString(),
        });

        // ローカル状態を更新
        // ローカル状態と参照を即座に更新してから通知する
        const next = attachmentsRef.current.filter((a) => a.id !== attachmentId);
        attachmentsRef.current = next;
        setAttachments(next);
        onAttachmentsChange?.(next);
      } catch (err) {
        console.error('[useFileUpload] 削除エラー:', err);
        const message =
          err instanceof Error ? err.message : '不明なエラーが発生しました。';
        setError(`ファイルの削除に失敗しました: ${message}`);
      }
    },
    [readonly, applicationId, attachmentKey, onAttachmentsChange]
  );

  // ─── アップロード ─────────────────────────────────────────────────────────

  const uploadFile = useCallback(
    async (file: File, tag?: string): Promise<void> => {
      if (readonly) {
        setError('このタブへのファイルアップロード権限がありません。');
        return;
      }

      // applicationId が未設定（申請書未保存）の場合は先に保存を促す
      if (!applicationId) {
        setError('申請書を一度「保存」してからファイルをアップロードしてください。');
        return;
      }

      // 事前選択されたタグがあり、もしすでに同種（同タグ）の書類があれば事前に削除する
      if (tag) {
        const existingFile = attachmentsRef.current.find((a) => a.tag === tag);
        if (existingFile && existingFile.id) {
          // 同種書類を削除（Firestore と Storage の両方から消える）
          await deleteFile(existingFile.id);
        }
      }

      // バリデーション（グローバル制限コンテキストを渡す）
      const validation = validateFile(file, globalLimitContext);
      if (!validation.valid) {
        setError(validation.error ?? 'ファイルのバリデーションに失敗しました。');
        return;
      }

      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // ファイル名サニタイズ（連番は現在のファイル数をインデックスとして使用）
        const sanitizedName = sanitizeFileName(file.name, attachmentsRef.current.length);
        const storagePath = generateStoragePath(applicationId, attachmentKey, sanitizedName);
        const storageRef = ref(storage, storagePath);

        // uploadBytesResumable で進捗付きアップロード
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
        });

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploadProgress(progress);
            },
            (err) => {
              reject(err);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

                const newAttachment: AttachmentMeta = {
                  id: crypto.randomUUID(),
                  name: file.name, // 表示名はオリジナルを保持
                  url: downloadUrl,
                  path: storagePath,
                  size: file.size,
                  mimeType: file.type,
                  uploadedAt: new Date().toISOString(),
                  ...(tag ? { tag } : {}),
                };

                // Firestore の attachments.{attachmentKey} 配列に追記
                const docRef = doc(db, COLLECTIONS.RENEWAL_APPLICATIONS, applicationId);
                await updateDoc(docRef, {
                  [`attachments.${attachmentKey}`]: arrayUnion(newAttachment),
                  updatedAt: new Date().toISOString(),
                });

                // ローカル状態と参照を即座に更新してから通知する
                const next = [...attachmentsRef.current, newAttachment];
                attachmentsRef.current = next;
                setAttachments(next);
                onAttachmentsChange?.(next);

                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      } catch (err) {
        console.error('[useFileUpload] アップロードエラー:', err);
        const message =
          err instanceof Error ? err.message : '不明なエラーが発生しました。';

        // Firebase Storage の権限エラーを分かりやすいメッセージに変換
        if (message.includes('storage/unauthorized')) {
          setError('アップロード権限がありません。担当者として割り当てられているか確認してください。');
        } else if (message.includes('storage/quota-exceeded')) {
          setError('ストレージの容量上限に達しました。管理者に連絡してください。');
        } else {
          setError(`アップロードに失敗しました: ${message}`);
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [readonly, applicationId, attachmentKey, globalLimitContext, onAttachmentsChange, deleteFile]
  );

  return {
    attachments,
    isUploading,
    uploadProgress,
    error,
    uploadFile,
    deleteFile,
    clearError,
  };
}
