/**
 * fileUtils.ts
 *
 * ファイルアップロード関連の純粋関数・定数群。
 * このモジュールは UI・Firebase に一切依存しない。
 * 再利用性とテスト容易性を最大化するため、副作用を持たない純粋関数のみで構成する。
 *
 * ■ 2026年1月最新仕様
 *   - 顔写真: JPEG のみ (.jpg / .jpeg)
 *   - その他書類: PDF のみ
 *   - 申請全体で「最大20ファイル」「合計25MB以内」（タブをまたいだグローバル制限）
 *   - ファイル名: 全角スペース・記号を完全除去し半角英数字+アンダースコアのみに
 */

import type { TabId } from '@/lib/schemas/renewalApplicationSchema';
import type { AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';

// ─── 定数 ─────────────────────────────────────────────────────────────────────

/**
 * 申請全体（全タブ合計）の最大ファイル数。
 * 入管システムの2026年1月仕様に準拠。
 */
export const GLOBAL_MAX_FILES = 20;

/**
 * 申請全体（全タブ合計）の最大合計ファイルサイズ: 25MB。
 * 入管システムの2026年1月仕様に準拠。
 */
export const GLOBAL_MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

// ─── 許可ファイル形式（2026年1月最新仕様） ────────────────────────────────────

/**
 * 顔写真（フォト）のみ許可するMIMEタイプ。
 * JPEG のみ（PNG / WebP は不可）。
 */
export const PHOTO_MIME_TYPES = ['image/jpeg'] as const;

/**
 * 書類として許可するMIMEタイプ。
 * PDF のみ。
 */
export const DOCUMENT_MIME_TYPES = ['application/pdf'] as const;

/**
 * 申請書添付ファイルとして許可する全MIMEタイプ（顔写真 + 書類）。
 */
export const ALLOWED_MIME_TYPES = [
  ...PHOTO_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** ファイル選択ダイアログ用 accept 文字列 */
export const ACCEPT_STRING = ALLOWED_MIME_TYPES.join(',');

/** ユーザー向けの許可形式説明テキスト */
export const ACCEPT_LABEL = '顔写真: JPEG / 書類: PDF';

// ─── バリデーション ────────────────────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * グローバル（申請全体）のファイル制限チェック情報。
 * SharedFileUploader の親から注入し、タブをまたいだ集計を可能にする。
 */
export interface GlobalLimitContext {
  /** 現時点での申請全体のファイル総数（このタブ含む） */
  totalFileCount: number;
  /** 現時点での申請全体の合計ファイルサイズ（bytes）（このタブ含む） */
  totalSizeBytes: number;
}

/**
 * 単一ファイルのバリデーションを実行する（2026年1月仕様）。
 *
 * チェック項目:
 *   1. MIMEタイプ（JPEG または PDF のみ）
 *   2. グローバルファイル数上限（申請全体で20件以内）
 *   3. グローバル合計サイズ上限（申請全体で 25MB 以内）
 *
 * @param file         バリデーション対象のファイル
 * @param globalCtx    申請全体の現在の使用量（省略時はグローバル制限チェックをスキップ）
 */
export function validateFile(
  file: File,
  globalCtx?: GlobalLimitContext
): FileValidationResult {
  // ① MIMEタイプチェック（JPEG または PDF のみ）
  const isAllowedType = (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type);
  if (!isAllowedType) {
    const typeLabel = file.type.startsWith('image/')
      ? '画像（JPEGのみ対応）'
      : file.type === 'application/pdf'
      ? 'PDF'
      : file.type || '不明なファイル形式';
    return {
      valid: false,
      error: `対応していないファイル形式です（${typeLabel}）。\n顔写真は JPEG (.jpg/.jpeg)、書類は PDF (.pdf) のみアップロードできます。`,
    };
  }

  // ② グローバルファイル数チェック（申請全体で20件以内）
  if (globalCtx && globalCtx.totalFileCount >= GLOBAL_MAX_FILES) {
    return {
      valid: false,
      error: `申請全体のファイル数が上限（${GLOBAL_MAX_FILES}件）に達しています。\n既存のファイルを削除してからアップロードしてください。`,
    };
  }

  // ③ グローバル合計サイズチェック（申請全体で 25MB 以内）
  if (globalCtx) {
    const newTotalBytes = globalCtx.totalSizeBytes + file.size;
    if (newTotalBytes > GLOBAL_MAX_SIZE_BYTES) {
      const remaining = GLOBAL_MAX_SIZE_BYTES - globalCtx.totalSizeBytes;
      return {
        valid: false,
        error: `申請全体の合計サイズが上限（${formatFileSize(GLOBAL_MAX_SIZE_BYTES)}）を超えます。\n残り使用可能: ${formatFileSize(remaining)}、このファイル: ${formatFileSize(file.size)}`,
      };
    }
  }

  return { valid: true };
}

// ─── ファイル名サニタイズ ──────────────────────────────────────────────────────

/**
 * Storage パスに安全なファイル名に変換する（2026年1月仕様強化版）。
 *
 * 変換ルール（入管システム互換）:
 *   1. 全角スペース（　）を半角アンダースコアに変換
 *   2. 半角/全角の括弧と数字 "(1)" "(２)" 等を完全除去
 *   3. 全角英数字を半角に正規化
 *   4. URLエンコードが必要な文字（日本語・記号等）を `_` に置換
 *   5. スラッシュ / バックスラッシュは除去（パストラバーサル防止）
 *   6. 連続するアンダースコアを1つに圧縮
 *   7. 先頭・末尾のアンダースコアを除去
 *   8. 先頭に連番インデックスを付与（同名ファイル衝突防止）
 *
 * @param originalName  オリジナルのファイル名（例: "　パスポート 写真 (1).pdf"）
 * @param index         このファイルの連番（0始まり）。省略時はタイムスタンプのみ付与
 * @returns サニタイズ済みのファイル名（例: "01_passport_20260404_120000.pdf"）
 */
export function sanitizeFileName(originalName: string, index?: number): string {
  const lastDotIndex = originalName.lastIndexOf('.');
  const nameWithoutExt =
    lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;
  const ext =
    lastDotIndex !== -1 ? originalName.slice(lastDotIndex).toLowerCase() : '';

  let base = nameWithoutExt;

  // Step 1: 全角スペースを半角アンダースコアに
  base = base.replace(/　/g, '_');

  // Step 2: "(1)" "(２)" "（1）"のような括弧付き数字を除去（全角括弧含む）
  base = base.replace(/[（(]\s*[0-9０-９]+\s*[）)]/g, '');

  // Step 3: 全角英数字を半角に正規化
  base = base.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );

  // Step 4: 半角英数字・ハイフン・ドット以外をアンダースコアに置換
  // \w = [a-zA-Z0-9_] を使い、日本語・記号を全て置換
  base = base.replace(/[^\w\-]/g, '_');

  // Step 5: 連続アンダースコアを1つに圧縮
  base = base.replace(/_+/g, '_');

  // Step 6: 先頭・末尾のアンダースコアを除去
  base = base.replace(/^_|_$/g, '');

  // タイムスタンプ付与（例: 20260404_120000）
  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  // フォールバック（空文字になった場合）
  base = base || 'file';

  // 連番プレフィックス（"01_", "02_" ...）
  const prefix = index !== undefined
    ? String(index + 1).padStart(2, '0') + '_'
    : '';

  return `${prefix}${base}_${ts}${ext}`;
}

// ─── Storageパス生成 ───────────────────────────────────────────────────────────

/**
 * Firebase Storage の保存パスを生成する。
 *
 * パス構造: `applications/{applicationId}/{tabId}/{sanitizedFileName}`
 *
 * @param applicationId  Firestore の renewal_applications ドキュメントID
 * @param tabId          タブID（'foreignerInfo' | 'employerInfo' | 'simultaneous'）
 * @param fileName       サニタイズ済みファイル名
 */
export function generateStoragePath(
  applicationId: string,
  tabId: AttachmentTabId,
  fileName: string
): string {
  return `applications/${applicationId}/${tabId}/${fileName}`;
}

// ─── サイズ・統計計算 ──────────────────────────────────────────────────────────

/**
 * 添付ファイルリストの合計サイズを計算する（バイト単位）。
 */
export function calculateTotalSize(attachments: AttachmentMeta[]): number {
  return attachments.reduce((sum, a) => sum + a.size, 0);
}

/**
 * バイト数を人が読みやすい文字列に変換する。
 * 例: 2,345,678 → "2.2 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * グローバル使用量から残り使用可能量を計算する。
 *
 * @returns { remainingFiles, remainingBytes, usagePercent }
 */
export function calcGlobalRemaining(ctx: GlobalLimitContext): {
  remainingFiles: number;
  remainingBytes: number;
  usagePercent: number; // 0〜100
} {
  const remainingFiles = Math.max(0, GLOBAL_MAX_FILES - ctx.totalFileCount);
  const remainingBytes = Math.max(0, GLOBAL_MAX_SIZE_BYTES - ctx.totalSizeBytes);
  const usagePercent  = Math.min(100, Math.round((ctx.totalSizeBytes / GLOBAL_MAX_SIZE_BYTES) * 100));
  return { remainingFiles, remainingBytes, usagePercent };
}

// ─── タブIDと Storage パスのマッピング ───────────────────────────────────────

/**
 * Storage で使用するタブID（Firestoreスキーマのキー名に合わせる）。
 * renewalApplicationSchema の attachments のキーと一致させること。
 */
export type AttachmentTabId = 'foreignerInfo' | 'employerInfo' | 'simultaneous';

/**
 * フォームの TabId から Storage/Firestore で使う AttachmentTabId に変換する。
 */
export const TAB_ID_TO_ATTACHMENT_KEY: Record<TabId, AttachmentTabId> = {
  foreigner:    'foreignerInfo',
  employer:     'employerInfo',
  simultaneous: 'simultaneous',
};

/**
 * AttachmentTabId から TabId に逆引きする。
 */
export const ATTACHMENT_KEY_TO_TAB_ID: Record<AttachmentTabId, TabId> = {
  foreignerInfo: 'foreigner',
  employerInfo:  'employer',
  simultaneous:  'simultaneous',
};

// ─── MIMEタイプからファイルアイコン種別を判定 ────────────────────────────────

export type FileIconType = 'pdf' | 'image' | 'unknown';

export function getFileIconType(mimeType: string): FileIconType {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  return 'unknown';
}

/**
 * MIMEタイプからユーザー向けの説明ラベルを返す。
 */
export function getMimeTypeLabel(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'JPEG 画像';
  if (mimeType === 'application/pdf') return 'PDF';
  return mimeType || '不明';
}
