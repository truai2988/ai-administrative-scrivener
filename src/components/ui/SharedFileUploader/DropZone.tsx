'use client';

/**
 * DropZone.tsx
 *
 * ドラッグ＆ドロップ対応のファイル投入エリア。
 * - SharedFileUploader から分離された純粋なUIコンポーネント
 * - ファイル選択後の処理はすべて onFilesSelected コールバックに委譲
 * - 読み取り専用モードでは UI をロック（スタイル変更 + 操作無効化）
 *
 * ■ 2026年1月仕様:
 *   - onFilesSelected 呼び出し前に即時フロントエンドバリデーションを実施
 *   - 非対応形式（JPEG/PDF 以外）は即座にエラー通知してブロック
 *   - グローバル制限情報を受け取り、上限到達時はドロップを拒否
 */

import React, { useCallback, useRef, useState } from 'react';
import { Upload, Lock } from 'lucide-react';
import {
  ACCEPT_STRING,
  ACCEPT_LABEL,
  formatFileSize,
  GLOBAL_MAX_FILES,
  GLOBAL_MAX_SIZE_BYTES,
  validateFile,
  type GlobalLimitContext,
} from '@/lib/utils/fileUtils';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  /** バリデーションエラーを親に通知するコールバック（即時バリデーション用） */
  onImmediateError?: (message: string) => void;
  isUploading: boolean;
  readonly: boolean;
  /** タブ名（アクセシビリティ用ラベルに使用） */
  tabLabel: string;
  /** 申請全体のグローバル使用量（即時バリデーション用） */
  globalLimitContext?: GlobalLimitContext;
  /** ドロップゾーンを無効化する理由（未選択など） */
  disabledReason?: string;
}

export function DropZone({
  onFilesSelected,
  onImmediateError,
  isUploading,
  readonly,
  tabLabel,
  globalLimitContext,
  disabledReason,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = isUploading || readonly || !!disabledReason;

  // ─── 即時バリデーション（ファイル選択 / ドロップ直後に実行） ─────────────

  const filterAndValidate = useCallback(
    (rawFiles: File[]): File[] => {
      const valid: File[] = [];
      for (const file of rawFiles) {
        const result = validateFile(file, globalLimitContext);
        if (!result.valid) {
          onImmediateError?.(result.error ?? 'ファイルのバリデーションに失敗しました。');
          return []; // 最初のエラーで全件ブロック
        }
        valid.push(file);
      }
      return valid;
    },
    [globalLimitContext, onImmediateError]
  );

  // ─── ドラッグ処理 ─────────────────────────────────────────────────────────

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!isDisabled) setIsDragOver(true);
    },
    [isDisabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (isDisabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const valid = filterAndValidate(files);
        if (valid.length > 0) onFilesSelected(valid);
      }
    },
    [isDisabled, filterAndValidate, onFilesSelected]
  );

  // ─── クリック選択 ─────────────────────────────────────────────────────────

  const handleClick = useCallback(() => {
    if (!isDisabled) fileInputRef.current?.click();
  }, [isDisabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) {
        const valid = filterAndValidate(files);
        if (valid.length > 0) onFilesSelected(valid);
      }
      // 同じファイルを再選択できるようリセット
      e.target.value = '';
    },
    [filterAndValidate, onFilesSelected]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [isDisabled]
  );

  // ─── 状態に応じたクラス名 ─────────────────────────────────────────────────

  const zoneClass = [
    'file-dropzone',
    isDragOver  ? 'file-dropzone--dragover'   : '',
    isUploading ? 'file-dropzone--uploading'  : '',
    readonly    ? 'file-dropzone--readonly'   : '',
    disabledReason ? 'file-dropzone--disabled-reason' : '',
    !isDisabled ? 'file-dropzone--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // 残り容量ヒント
  const remainingFiles = globalLimitContext
    ? Math.max(0, GLOBAL_MAX_FILES - globalLimitContext.totalFileCount)
    : undefined;
  const remainingBytes = globalLimitContext
    ? Math.max(0, GLOBAL_MAX_SIZE_BYTES - globalLimitContext.totalSizeBytes)
    : undefined;

  return (
    <div
      className={zoneClass}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isDisabled ? 'presentation' : 'button'}
      tabIndex={isDisabled ? -1 : 0}
      aria-label={
        readonly
          ? `${tabLabel}の添付ファイルエリア（閲覧のみ）`
          : `${tabLabel}へファイルをアップロード`
      }
      aria-disabled={isDisabled}
    >
      {/* 非表示インプット */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        multiple
        onChange={handleInputChange}
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
        disabled={isDisabled}
      />

      {/* ─── アイコン ───────────────────────────────────── */}
      <div className="file-dropzone__icon-wrap">
        {readonly || disabledReason ? (
          <Lock size={30} className="file-dropzone__icon file-dropzone__icon--readonly" />
        ) : (
          <Upload
            size={30}
            className={`file-dropzone__icon ${isDragOver ? 'file-dropzone__icon--active' : ''}`}
          />
        )}
      </div>

      {/* ─── テキスト ──────────────────────────────────── */}
      <div className="file-dropzone__text-wrap">
        {readonly ? (
          <>
            <p className="file-dropzone__title file-dropzone__title--readonly">
              閲覧のみ（編集権限なし）
            </p>
            <p className="file-dropzone__hint">
              担当者として割り当てられていないため、<br />ファイルのアップロードはできません。
            </p>
          </>
        ) : disabledReason ? (
          <>
            <p className="file-dropzone__title file-dropzone__title--readonly" style={{ color: '#fbbf24' }}>
              アップロードするには
            </p>
            <p className="file-dropzone__hint" style={{ color: '#fcd34d' }}>
              {disabledReason}
            </p>
          </>
        ) : isUploading ? (
          <>
            <p className="file-dropzone__title">アップロード中...</p>
          </>
        ) : isDragOver ? (
          <>
            <p className="file-dropzone__title file-dropzone__title--dragover">
              ここにドロップしてください
            </p>
          </>
        ) : (
          <>
            <p className="file-dropzone__title">
              ここにドロップ、またはクリックしてファイルを選択
            </p>
            <p className="file-dropzone__hint">
              {ACCEPT_LABEL}
            </p>
            {/* 残り使用量ヒント */}
            {remainingFiles !== undefined && remainingBytes !== undefined && (
              <p className="file-dropzone__remaining">
                残り {remainingFiles} ファイル / {formatFileSize(remainingBytes)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
