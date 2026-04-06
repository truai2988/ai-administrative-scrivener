'use client';

/**
 * SharedFileUploader/index.tsx
 *
 * タブごとの添付ファイルアップロード・管理UIの統合コンポーネント。
 *
 * ■ 2026年1月仕様対応:
 *   - 申請全体のグローバル制限（20ファイル / 25MB）を表示・強制
 *   - グローバル使用量ゲージを UI に表示
 *   - DropZone に即時バリデーション用エラーコールバックを渡す
 *   - ファイル形式: JPEG（顔写真）/ PDF（書類）のみ
 */

import React, { useCallback, useState } from 'react';
import { Paperclip, AlertCircle, X, HardDrive, CheckCircle2 } from 'lucide-react';
import { DropZone } from './DropZone';
import { FileList } from './FileList';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';
import type { AttachmentTabId, GlobalLimitContext } from '@/lib/utils/fileUtils';
import {
  GLOBAL_MAX_FILES,
  GLOBAL_MAX_SIZE_BYTES,
  ACCEPT_LABEL,
  formatFileSize,
  calculateTotalSize,
  calcGlobalRemaining,
} from '@/lib/utils/fileUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SharedFileUploaderProps {
  /**
   * Firestore renewal_applications ドキュメントID。
   * undefined の場合（=申請書未保存）はアップロードを無効化し、
   * 先に保存するよう案内メッセージを表示する。
   */
  applicationId: string | undefined;
  /**
   * Firestore・Storage で使用するタブキー。
   */
  attachmentKey: AttachmentTabId;
  /** タブの表示名（UI ラベル・アクセシビリティ用） */
  tabLabel: string;
  /** 初期値（既存の添付ファイルリスト） */
  initialAttachments?: AttachmentMeta[];
  /**
   * 読み取り専用フラグ。
   */
  readonly?: boolean;
  /**
   * 添付推奨書類のヒントリスト（任意）。
   */
  hints?: string[];
  /**
   * 申請全体（全タブ合計）のグローバル使用量コンテキスト。
   * RenewalApplicationForm から全タブの attachments を集計して渡す。
   * これにより申請横断での 20ファイル / 25MB 制限が機能する。
   */
  globalLimitContext?: GlobalLimitContext;
  /** 添付ファイルリスト変更時コールバック */
  onAttachmentsChange?: (attachments: AttachmentMeta[]) => void;
}

// ─── コンポーネント ───────────────────────────────────────────────────────────

export function SharedFileUploader({
  applicationId,
  attachmentKey,
  tabLabel,
  initialAttachments = [],
  readonly = false,
  hints = [],
  globalLimitContext,
  onAttachmentsChange,
}: SharedFileUploaderProps) {
  const {
    attachments,
    isUploading,
    uploadProgress,
    error,
    uploadFile,
    deleteFile,
    clearError,
  } = useFileUpload({
    applicationId: applicationId ?? '',
    attachmentKey,
    initialAttachments,
    readonly,
    globalLimitContext,
    onAttachmentsChange,
  });

  // 即時バリデーションエラーを error state に合流させる
  const handleImmediateError = useCallback(
    (message: string) => {
      // useFileUpload の setError は内部なので、
      // DropZone からのエラーは uploadFile 経由でなく直接 clearError + uploadFile で処理される。
      // DropZone の onImmediateError は error state を直接更新できないため、
      // ここでは onFilesSelected を介さず、uploadFile を呼ぶことで error state を更新する。
      // ─ 実装上は validateFile を DropZone 内で呼んで onFilesSelected をブロック済みのため、
      //   onImmediateError でのエラー表示は SharedFileUploader の error state ではなく
      //   DropZone 内ローカルエラーとして表示する。
      // ここには何もしない（DropZone 側で表示済み）
      void message;
    },
    []
  );

  // 事前選択された書類種別タグ
  const [selectedHint, setSelectedHint] = useState<string | null>(null);

  // 複数ファイルが drop された際、順番に処理する
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      for (let i = 0; i < files.length; i++) {
        // 複数ファイル同時ドロップ時、互いに上書きし合わないようタグは最初のファイルにのみ付与する
        const tag = i === 0 && selectedHint ? selectedHint : undefined;
        await uploadFile(files[i], tag);
      }
      // アップロード開始後に選択状態をクリア
      setSelectedHint(null);
    },
    [uploadFile, selectedHint]
  );

  // グローバル残量の計算
  // （globalLimitContext が未指定の場合は、このタブ内のみで計算）
  const effectiveGlobalCtx: GlobalLimitContext = globalLimitContext ?? {
    totalFileCount: attachments.length,
    totalSizeBytes: calculateTotalSize(attachments),
  };
  const { remainingFiles, remainingBytes, usagePercent } = calcGlobalRemaining(effectiveGlobalCtx);

  const isGlobalFull =
    effectiveGlobalCtx.totalFileCount >= GLOBAL_MAX_FILES ||
    effectiveGlobalCtx.totalSizeBytes >= GLOBAL_MAX_SIZE_BYTES;

  const isNearGlobalLimit =
    !isGlobalFull && (
      effectiveGlobalCtx.totalFileCount >= GLOBAL_MAX_FILES - 3 ||
      usagePercent >= 80
    );

  // このタブのファイル数・サイズ（「このタブ」情報表示用）
  const tabFileCount = attachments.length;

  return (
    <section className="shared-file-uploader" aria-label={`${tabLabel}の添付書類`}>

      {/* ─── ヘッダー ─────────────────────────────────────────────────────── */}
      <div className="shared-file-uploader__header">
        <div className="shared-file-uploader__title-row">
          <Paperclip size={18} className="shared-file-uploader__title-icon" />
          <h3 className="shared-file-uploader__title">添付書類</h3>
          <span className="shared-file-uploader__count" aria-live="polite">
            このタブ {tabFileCount} 件
          </span>
        </div>
      </div>

      {/* ─── グローバル使用量ゲージ ─────────────────────────────────────────── */}
      {!readonly && (
        <div className="shared-file-uploader__global-gauge">
          <div className="shared-file-uploader__global-gauge-header">
            <span className="shared-file-uploader__global-gauge-label">
              <HardDrive size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              申請全体の使用量
            </span>
            <span
              className={`shared-file-uploader__global-gauge-value ${
                isGlobalFull ? 'shared-file-uploader__global-gauge-value--full' :
                isNearGlobalLimit ? 'shared-file-uploader__global-gauge-value--near' : ''
              }`}
            >
              {effectiveGlobalCtx.totalFileCount} / {GLOBAL_MAX_FILES} 件&nbsp;•&nbsp;
              {formatFileSize(effectiveGlobalCtx.totalSizeBytes)} / {formatFileSize(GLOBAL_MAX_SIZE_BYTES)}
            </span>
          </div>
          <div className="shared-file-uploader__global-bar-track">
            <div
              className={`shared-file-uploader__global-bar-fill ${
                isGlobalFull ? 'shared-file-uploader__global-bar-fill--full' :
                isNearGlobalLimit ? 'shared-file-uploader__global-bar-fill--near' : ''
              }`}
              style={{ width: `${usagePercent}%` }}
              role="progressbar"
              aria-valuenow={usagePercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`申請全体の使用量 ${usagePercent}%`}
            />
          </div>
          <p className="shared-file-uploader__global-gauge-remaining">
            残り {remainingFiles} ファイル / {formatFileSize(remainingBytes)}
          </p>
        </div>
      )}

      {/* ─── 推奨書類ヒント（クリックして事前選択可能） ────────────────────────────── */}
      {hints.length > 0 && (() => {
        // 既にアップロード済みのタグ一覧を抽出
        const uploadedTags = new Set(attachments.map(a => a.tag).filter(Boolean));
        return (
          <div className="shared-file-uploader__hints">
            <span className="shared-file-uploader__hints-label">推奨書類 (事前選択):</span>
            <div className="shared-file-uploader__hints-chips">
              {hints.map((hint) => {
                const isSelected = selectedHint === hint;
                const isDone     = uploadedTags.has(hint);
                return (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setSelectedHint(isSelected ? null : hint)}
                    className={`shared-file-uploader__hint-chip ${
                      isDone     ? 'shared-file-uploader__hint-chip--done' :
                      isSelected ? 'shared-file-uploader__hint-chip--selected' : ''
                    }`}
                    aria-pressed={isSelected}
                    title={
                      isDone
                        ? `${hint} は添付済みです（クリックで上書きアップロード可能）`
                        : `${hint} をアップロードする前に選択してください`
                    }
                  >
                    {isDone     && <CheckCircle2 size={12} style={{ marginRight: '4px', display: 'inline-block', flexShrink: 0 }} />}
                    {!isDone && isSelected && <CheckCircle2 size={12} style={{ marginRight: '4px', display: 'inline-block', flexShrink: 0 }} />}
                    {hint}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ─── 対応形式の案内 ─────────────────────────────────────────────────── */}
      {!readonly && (
        <p className="shared-file-uploader__format-note">
          対応形式: <strong>{ACCEPT_LABEL}</strong>
        </p>
      )}

      {/* ─── 未保存の案内メッセージ ─────────────────────────────────────────── */}
      {!applicationId && !readonly && (
        <div className="shared-file-uploader__notice" role="status">
          <AlertCircle size={16} />
          <span>申請書を一度「保存」すると、書類の添付が可能になります。</span>
        </div>
      )}

      {/* ─── ドロップゾーン（applicationId がある場合のみ表示） ─────────────── */}
      {(applicationId || readonly) && !isGlobalFull && (
        <DropZone
          onFilesSelected={handleFilesSelected}
          onImmediateError={handleImmediateError}
          isUploading={isUploading}
          readonly={readonly}
          tabLabel={tabLabel}
          globalLimitContext={effectiveGlobalCtx}
          disabledReason={
            hints.length > 0 && !selectedHint
              ? '「推奨書類 (事前選択)」から、これからアップロードする書類の種類を1つ選んでください。'
              : undefined
          }
        />
      )}

      {/* ─── グローバル上限到達メッセージ ──────────────────────────────────── */}
      {isGlobalFull && !readonly && (
        <div className="shared-file-uploader__limit-reached" role="status">
          <AlertCircle size={16} />
          <span>
            申請全体の上限（{GLOBAL_MAX_FILES}件 / {formatFileSize(GLOBAL_MAX_SIZE_BYTES)}）に達しました。
            追加するには既存ファイルを削除してください。
          </span>
        </div>
      )}

      {/* ─── 上限接近警告 ─────────────────────────────────────────────────── */}
      {isNearGlobalLimit && !readonly && (
        <div className="shared-file-uploader__limit-warning" role="status">
          <span>
            申請全体の残り容量: {remainingFiles} ファイル / {formatFileSize(remainingBytes)}
          </span>
        </div>
      )}

      {/* ─── 進捗バー ─────────────────────────────────────────────────────── */}
      {isUploading && (
        <div
          className="shared-file-uploader__progress-wrap"
          role="progressbar"
          aria-valuenow={uploadProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="アップロード中"
        >
          <div className="shared-file-uploader__progress-bar">
            <div
              className="shared-file-uploader__progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="shared-file-uploader__progress-text">
            {uploadProgress}%
          </span>
        </div>
      )}

      {/* ─── エラー表示 ────────────────────────────────────────────────────── */}
      {error && (
        <div className="shared-file-uploader__error" role="alert">
          <AlertCircle size={16} className="shared-file-uploader__error-icon" />
          <span className="shared-file-uploader__error-text">{error}</span>
          <button
            type="button"
            className="shared-file-uploader__error-close"
            onClick={clearError}
            aria-label="エラーを閉じる"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── ファイル一覧 ──────────────────────────────────────────────────── */}
      <FileList
        attachments={attachments}
        onDelete={deleteFile}
        isDeleting={isUploading}
        readonly={readonly}
      />

    </section>
  );
}
