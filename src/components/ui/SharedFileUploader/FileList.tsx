'use client';

/**
 * FileList.tsx
 *
 * アップロード済みファイルの一覧表示・削除UIコンポーネント。
 * - ファイルアイコン（PDF/画像/不明）の視覚的識別
 * - ダウンロードリンク（新規タブで開く）
 * - 削除ボタン（readonly モードでは非表示）
 * - ファイル名・サイズの表示
 */

import React from 'react';
import { FileText, Image as ImageIcon, File, Trash2, ExternalLink, Paperclip } from 'lucide-react';
import type { AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';
import { formatFileSize, getFileIconType } from '@/lib/utils/fileUtils';

interface FileListProps {
  attachments: AttachmentMeta[];
  onDelete: (attachmentId: string) => void;
  isDeleting?: boolean;
  readonly: boolean;
}

export function FileList({ attachments, onDelete, isDeleting, readonly }: FileListProps) {
  if (attachments.length === 0) {
    return (
      <div className="file-list__empty">
        <Paperclip size={16} className="file-list__empty-icon" />
        <span>添付ファイルはまだありません</span>
      </div>
    );
  }

  return (
    <ul className="file-list" role="list" aria-label="添付ファイル一覧">
      {attachments.map((attachment) => {
        const iconType = getFileIconType(attachment.mimeType);
        const uploadDate = new Date(attachment.uploadedAt).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        return (
          <li key={attachment.id} className="file-list__item">
            {/* ─── ファイルアイコン ─────────────────────── */}
            <div className={`file-list__icon-wrap file-list__icon-wrap--${iconType}`}>
              {iconType === 'pdf'   && <FileText  size={18} aria-hidden="true" />}
              {iconType === 'image' && <ImageIcon size={18} aria-hidden="true" />}
              {iconType === 'unknown' && <File   size={18} aria-hidden="true" />}
            </div>

            {/* ─── ファイル情報 ─────────────────────────── */}
            <div className="file-list__info">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="file-list__name"
                title={`${attachment.name} を新規タブで開く`}
              >
                {attachment.name}
                <ExternalLink size={12} className="file-list__name-icon" />
              </a>
              <div className="file-list__meta">
                {attachment.tag && (
                  <>
                    <span className="file-list__tag-badge">{attachment.tag}</span>
                    <span className="file-list__sep">•</span>
                  </>
                )}
                <span className="file-list__size">{formatFileSize(attachment.size)}</span>
                <span className="file-list__sep">•</span>
                <span className="file-list__date">{uploadDate}</span>
              </div>
            </div>

            {/* ─── 削除ボタン ───────────────────────────── */}
            {!readonly && (
              <button
                type="button"
                className="file-list__delete-btn"
                onClick={() => onDelete(attachment.id)}
                disabled={isDeleting}
                aria-label={`${attachment.name} を削除`}
                title={`${attachment.name} を削除`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
