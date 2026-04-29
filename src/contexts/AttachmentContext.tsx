'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { AttachmentMeta } from '@/lib/schemas/renewalApplicationSchema';
import type { AttachmentTabId, GlobalLimitContext } from '@/lib/utils/fileUtils';
import { useFileUpload } from '@/hooks/useFileUpload';
import { calculateTotalSize } from '@/lib/utils/fileUtils';

export interface AttachmentContextValue {
  /** 全タブの添付ファイルリスト（フラット） */
  allAttachments: AttachmentMeta[];
  /** タブごとの添付ファイルマップ */
  attachmentsByTab: Record<AttachmentTabId, AttachmentMeta[]>;
  /** グローバル使用量（ファイル数、サイズ） */
  globalLimitContext: GlobalLimitContext;
  /**
   * 指定したタブにファイルをアップロードする
   * @param file アップロードするファイル
   * @param tabId 紐付けるタブ
   * @param tag （任意）付与するタグ（例：事前選択した書類種別）
   */
  uploadToTab: (file: File, tabId: AttachmentTabId, tag?: string) => Promise<void>;
  /** 指定ファイルを削除する */
  deleteFile: (tabId: AttachmentTabId, attachmentId: string) => Promise<void>;
  
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  clearError: () => void;
}

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

export interface AttachmentProviderProps {
  children: React.ReactNode;
  applicationId: string | undefined;
  /** DBからロードした初期の添付ファイルマップ */
  initialAttachments?: Record<AttachmentTabId, AttachmentMeta[]>;
  readonly?: boolean;
}

export function AttachmentProvider({
  children,
  applicationId,
  initialAttachments = { foreignerInfo: [], employerInfo: [], simultaneous: [] },
  readonly = false,
}: AttachmentProviderProps) {
  const [attachmentsByTab, setAttachmentsByTab] = useState<Record<AttachmentTabId, AttachmentMeta[]>>(initialAttachments);

  const allAttachments = useMemo(() => {
    return [
      ...(attachmentsByTab.foreignerInfo || []),
      ...(attachmentsByTab.employerInfo || []),
      ...(attachmentsByTab.simultaneous || []),
    ];
  }, [attachmentsByTab]);

  const globalLimitContext = useMemo<GlobalLimitContext>(() => ({
    totalFileCount: allAttachments.length,
    totalSizeBytes: calculateTotalSize(allAttachments),
  }), [allAttachments]);

  // Hook for each tab - since hooks can't be called conditionally or in a loop with dynamic keys easily,
  // we initialize them for all known tabs.
  const foreignerInfoUploader = useFileUpload({
    applicationId: applicationId ?? '',
    attachmentKey: 'foreignerInfo',
    initialAttachments: initialAttachments.foreignerInfo || [],
    readonly,
    globalLimitContext,
    onAttachmentsChange: (list) => setAttachmentsByTab(prev => ({ ...prev, foreignerInfo: list })),
  });
  
  const employerInfoUploader = useFileUpload({
    applicationId: applicationId ?? '',
    attachmentKey: 'employerInfo',
    initialAttachments: initialAttachments.employerInfo || [],
    readonly,
    globalLimitContext,
    onAttachmentsChange: (list) => setAttachmentsByTab(prev => ({ ...prev, employerInfo: list })),
  });
  
  const simultaneousUploader = useFileUpload({
    applicationId: applicationId ?? '',
    attachmentKey: 'simultaneous',
    initialAttachments: initialAttachments.simultaneous || [],
    readonly,
    globalLimitContext,
    onAttachmentsChange: (list) => setAttachmentsByTab(prev => ({ ...prev, simultaneous: list })),
  });

  const uploaders = useMemo(() => ({
    foreignerInfo: foreignerInfoUploader,
    employerInfo: employerInfoUploader,
    simultaneous: simultaneousUploader,
  }), [foreignerInfoUploader, employerInfoUploader, simultaneousUploader]);

  const uploadToTab = useCallback(async (file: File, tabId: AttachmentTabId, tag?: string) => {
    return uploaders[tabId].uploadFile(file, tag);
  }, [uploaders]);

  const deleteFile = useCallback(async (tabId: AttachmentTabId, attachmentId: string) => {
    return uploaders[tabId].deleteFile(attachmentId);
  }, [uploaders]);

  const isUploading = uploaders.foreignerInfo.isUploading || uploaders.employerInfo.isUploading || uploaders.simultaneous.isUploading;
  
  // Aggregate progress (simple max for now, usually only 1 file uploads at a time)
  const uploadProgress = Math.max(
    uploaders.foreignerInfo.uploadProgress,
    uploaders.employerInfo.uploadProgress,
    uploaders.simultaneous.uploadProgress
  );

  const error = uploaders.foreignerInfo.error || uploaders.employerInfo.error || uploaders.simultaneous.error;

  const clearError = useCallback(() => {
    uploaders.foreignerInfo.clearError();
    uploaders.employerInfo.clearError();
    uploaders.simultaneous.clearError();
  }, [uploaders]);

  const value = useMemo<AttachmentContextValue>(() => ({
    allAttachments,
    attachmentsByTab,
    globalLimitContext,
    uploadToTab,
    deleteFile,
    isUploading,
    uploadProgress,
    error,
    clearError,
  }), [
    allAttachments, attachmentsByTab, globalLimitContext, uploadToTab, deleteFile,
    isUploading, uploadProgress, error, clearError
  ]);

  return (
    <AttachmentContext.Provider value={value}>
      {children}
    </AttachmentContext.Provider>
  );
}

export function useAttachmentContext() {
  const context = useContext(AttachmentContext);
  if (!context) {
    throw new Error('useAttachmentContext must be used within an AttachmentProvider');
  }
  return context;
}
