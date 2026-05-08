'use client';

/**
 * AiExtractionSidebar.tsx
 *
 * AI書類読取から抽出されたデータをClick-to-Fillで
 * フォームに流し込むためのサイドバーコンポーネント。
 *
 * FormProvider の内側に配置し、useClickToFill フックと連携する。
 *
 * ■ データソース:
 *   1. ユーザーが画像をアップロード → /api/extract で Gemini API 抽出
 *   2. props.items で外部から直接注入（テスト用・既存データの再利用）
 *
 * 両方が供給された場合はアップロードの結果が優先される。
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointerClick,
  ClipboardPaste,
  Sparkles,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  X,
  RotateCcw,
  FileSearch,
  ChevronDown,
  Upload,
  Loader2,
  AlertCircle,
  ImagePlus,
  FileImage,
  Wand2,
} from 'lucide-react';
import type { FieldValues } from 'react-hook-form';
import type { ExtractedItem } from '@/types/extractedItem';
import { useClickToFillRequired } from '@/contexts/ClickToFillContext';
import type { UseClickToFillReturn } from '@/hooks/useClickToFill';
import { useDocumentExtraction } from '@/hooks/useDocumentExtraction';
import { useAttachmentContext } from '@/contexts/AttachmentContext';
import { FileList } from '@/components/ui/SharedFileUploader/FileList';
import type { AttachmentTabId } from '@/lib/utils/fileUtils';
import imageCompression from 'browser-image-compression';

// ============================================================
// Props
// ============================================================

export interface AiExtractionSidebarProps {
  /** 外部から注入する抽出データ配列（オプション） */
  items?: ExtractedItem[];
  /** サイドバーの開閉状態 */
  isOpen: boolean;
  /** 開閉トグルコールバック */
  onToggle: () => void;
  /** フィールドパス → 日本語ラベルのマップ（マッピング履歴表示用） */
  fieldLabels?: Record<string, string>;
  /** サイドバー自体のヘッダーを隠すかどうか（外部タブ化用） */
  hideHeader?: boolean;
  /** 現在アクティブなタブのID（推奨書類タグの切り替えなどに使用） */
  activeTab?: string;
}

// ============================================================
// Floating Tooltip (追従ツールチップ)
// ============================================================

function FloatingTooltip({ text }: { text: string }) {
  const [pos, setPos] = React.useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed z-9999 pointer-events-none"
      style={{ left: pos.x + 16, top: pos.y - 8 }}
    >
      <div className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-white text-xs font-medium shadow-lg shadow-indigo-500/30">
        <ClipboardPaste size={13} />
        <span className="max-w-[180px] truncate">{text}</span>
      </div>
    </motion.div>
  );
}

// ============================================================
// Upload Area (書類アップロードエリア)
// ============================================================

function UploadArea({
  onFileSelect,
  isLoading,
  error,
  hasData,
  fileName,
  onClearError,
}: {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  hasData: boolean;
  fileName: string | null;
  onClearError: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
      // 同じファイルの再選択を許可
      e.target.value = '';
    },
    [onFileSelect],
  );

  // ── ローディング中 ──
  if (isLoading) {
    return (
      <div className="px-4 py-6 border-b border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          >
            <Loader2 size={28} className="text-indigo-500" />
          </motion.div>
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-600">AIが読み取っています...</p>
            <p className="text-xs text-slate-500 mt-1">書類から情報を自動抽出中</p>
          </div>
          <motion.div
            className="w-full h-1 bg-slate-200 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full bg-linear-to-r from-indigo-400 via-purple-500 to-indigo-400 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{ width: '50%' }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // ── エラー表示 ──
  if (error) {
    return (
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200">
          <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-rose-600">読み取りエラー</p>
            <p className="text-xs text-rose-500 mt-0.5 wrap-break-word">{error}</p>
          </div>
          <button
            type="button"
            onClick={onClearError}
            className="p-1 rounded hover:bg-rose-500/20 transition-colors shrink-0"
          >
            <X size={12} className="text-rose-400" />
          </button>
        </div>
      </div>
    );
  }

  // ── アップロード済みの場合（コンパクト表示） ──
  if (hasData && fileName) {
    return (
      <div className="px-4 py-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FileImage size={14} className="text-emerald-400 shrink-0" />
          <span className="truncate font-medium">{fileName}</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="ml-auto text-indigo-600 hover:text-indigo-700 font-medium transition-colors whitespace-nowrap"
          >
            別のファイル
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // ── 初期状態（ドラッグ&ドロップエリア） ──
  return (
    <div className="px-3 pt-3 pb-2 border-b border-slate-200">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-200
          ${
            isDragOver
              ? 'border-indigo-400 bg-indigo-50 shadow-inner'
              : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
          }
        `}
      >
        <motion.div
          animate={isDragOver ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {isDragOver ? (
            <Upload size={24} className="text-indigo-400" />
          ) : (
            <ImagePlus size={24} className="text-slate-400" />
          )}
        </motion.div>

        <div className="text-center">
          <p className="text-xs font-semibold text-slate-700">
            {isDragOver ? 'ここにドロップ' : '書類をアップロード'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            JPG, PNG, WebP, PDF（最大10MB）
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ============================================================
// Extracted Data Card (抽出データカード)
// ============================================================

function ExtractedCard({
  item,
  isHolding,
  onSelect,
  onDeselect,
  fieldLabels,
}: {
  item: ExtractedItem;
  isHolding: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  fieldLabels?: Record<string, string>;
}) {
  const confidenceColor =
    item.confidence !== null
      ? item.confidence >= 0.9
        ? 'text-emerald-700'
        : item.confidence >= 0.75
          ? 'text-amber-700'
          : 'text-rose-600'
      : '';

  return (
    <motion.button
      layout
      onClick={isHolding ? onDeselect : onSelect}
      disabled={false}
      className={`
        group relative w-full text-left rounded-xl border p-3 transition-all duration-200 
        ${
          isHolding
            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-200/50 scale-[1.02] cursor-pointer'
            : item.mapped
              ? item.autoFilled
                ? 'border-violet-200 bg-violet-50 opacity-80 hover:opacity-100 hover:border-indigo-400 cursor-pointer hover:shadow-md'
                : 'border-emerald-200 bg-emerald-50 opacity-70 hover:opacity-100 hover:border-indigo-400 cursor-pointer hover:shadow-md'
              : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100/50 cursor-pointer'
        }
      `}
      whileTap={!isHolding ? { scale: 0.97 } : undefined}
    >
      {/* Grip icon */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical size={14} className="text-slate-400" />
      </div>

      <div className="pl-3">
        {/* パンくずリスト */}
        {item.breadcrumb ? (
          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
            <Sparkles size={12} className="text-indigo-400 shrink-0" />
            {item.breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={10} className="text-slate-400 shrink-0" />}
                <span className="text-xs font-medium text-indigo-600 bg-indigo-100 rounded px-1.5 py-0.5">
                  {crumb}
                </span>
              </React.Fragment>
            ))}
            {item.confidence !== null && (
              <span className={`text-xs ml-auto ${confidenceColor} font-medium`}>
                {Math.round(item.confidence * 100)}%
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-xs text-slate-500 italic">推測なし</span>
          </div>
        )}

        {/* 抽出テキスト */}
        <p
          className={`text-sm font-semibold leading-snug ${
            item.mapped
              ? item.autoFilled
                ? 'text-violet-600 line-through decoration-violet-400/50'
                : 'text-emerald-600 line-through decoration-emerald-400/50'
              : 'text-slate-800'
          }`}
        >
          {item.value}
        </p>

        {/* マッピング済みラベル: 手動 vs 自動 で表示を分岐 */}
        {item.mapped && item.mappedTo && (
          item.autoFilled ? (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-violet-600">
              <Wand2 size={12} />
              <span>✨ 学習により自動入力 → {fieldLabels?.[item.mappedTo] || item.mappedTo}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600">
              <CheckCircle2 size={12} />
              <span>→ {fieldLabels?.[item.mappedTo] || item.mappedTo} に代入済み</span>
            </div>
          )
        )}
      </div>

      {/* 選択中インジケーター */}
      {isHolding && (
        <motion.div
          layoutId="holding-indicator"
          className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-md"
        >
          <MousePointerClick size={11} className="text-white" />
        </motion.div>
      )}

      {/* Auto-Fill バッジ */}
      {item.autoFilled && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shadow-md"
        >
          <Wand2 size={11} className="text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

// ============================================================
// Main Sidebar Component
// ============================================================

export function AiExtractionSidebar({
  items,
  isOpen,
  onToggle,
  fieldLabels,
  hideHeader,
  activeTab = 'foreigner',
}: AiExtractionSidebarProps) {
  const ctf: UseClickToFillReturn<FieldValues> = useClickToFillRequired();
  const extraction = useDocumentExtraction();
  const { uploadToTab, attachmentsByTab, deleteFile, isUploading } = useAttachmentContext();
  
  // Defaulting to activeTab or 'foreignerInfo' if none provided
  const resolvedTabId = activeTab === 'foreigner' ? 'foreignerInfo' : activeTab === 'employer' ? 'employerInfo' : activeTab;
  const tabId = (['foreignerInfo', 'employerInfo', 'simultaneous'].includes(resolvedTabId) ? resolvedTabId : 'foreignerInfo') as AttachmentTabId;
  const currentAttachments = attachmentsByTab[tabId] || [];

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [autoFilledCount, setAutoFilledCount] = useState<number>(0);
  const [selectedHint, setSelectedHint] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [useHybridMode, setUseHybridMode] = useState<boolean>(false);

  // 動的推奨タグの定義
  const hintsMap: Record<AttachmentTabId, string[]> = {
    foreignerInfo: ['パスポート写し', '在留カード写し', '顔写真 (3x4cm)', '住民税課税証明書', '住民税納税証明書'],
    employerInfo: ['労働条件通知書', '36協定', '決算書（転職時）', '雇用保険被保険料納付証明', '社会保険料納付証明'],
    simultaneous: ['婚姻証明書（配偶者の場合）', '出生証明書（子の場合）', '再入国許可申請書', '資格外活動許可証明書'],
  };
  const hints = hintsMap[tabId] || [];

  // 外部 items が変わったら初期化（アップロード結果がない場合のみ）
  useEffect(() => {
    if (items && items.length > 0 && extraction.items.length === 0) {
      ctf.initData(items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // アップロード抽出が完了したら Click-to-Fill に注入
  useEffect(() => {
    if (extraction.items.length > 0) {
      ctf.initData(extraction.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraction.items]);

  // ── 学習辞書による Auto-Fill トリガー ──────────────────────────────────
  // initData でデータがセットされた直後、学習済み辞書と照合して
  // 既知マッピングを自動適用する。
  useEffect(() => {
    console.log(`[Sidebar AutoFill Check] 発火チェック開始`);
    console.log(` - extractedData 件数: ${ctf.extractedData.length}`);
    console.log(` - learnedMappings 件数: ${Object.keys(ctf.learnedMappings).length}`);
    console.log(` - 全て未マッピングか？: ${ctf.extractedData.every((d) => !d.mapped)}`);

    if (
      ctf.extractedData.length > 0 &&
      Object.keys(ctf.learnedMappings).length > 0 &&
      // まだ1件もマッピングされていない初期状態のときだけ発火
      ctf.extractedData.every((d) => !d.mapped)
    ) {
      console.log(`[Sidebar AutoFill Check] 条件クリア！ autoFillKnownMappings を実行します`);
      const count = ctf.autoFillKnownMappings();
      setAutoFilledCount(count);
      if (count > 0) {
        console.log(`[AutoFill] ✨ 学習辞書により ${count} 件を自動入力しました`);
      } else {
        console.log(`[AutoFill] 実行されましたが、自動入力された件数は0件でした`);
      }
    } else {
      console.log(`[Sidebar AutoFill Check] 条件を満たさないためスキップしました`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctf.extractedData.length, ctf.learnedMappings]);

  // ファイルアップロード処理
  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadedFileName(file.name);
      setAutoFilledCount(0);
      // リセットして新規抽出開始
      ctf.resetAll();
      
      const tag = selectedHint || undefined;
      
      let fileToProcess = file;

      // 画像ファイルの場合はクライアントサイド圧縮を実行
      if (file.type.startsWith('image/')) {
        setIsCompressing(true);
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          console.log(`[Compression] Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
          const compressedBlob = await imageCompression(file, options);
          
          // BlobをFileオブジェクトに変換し、元のファイル名を維持
          fileToProcess = new File([compressedBlob], file.name, {
            type: compressedBlob.type,
            lastModified: Date.now(),
          });
          console.log(`[Compression] Compressed size: ${(fileToProcess.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (error) {
          console.error('[Compression] 画像の圧縮に失敗しました:', error);
          // 失敗した場合は元のファイルをそのまま使用する（フォールバック）
        } finally {
          setIsCompressing(false);
        }
      }
      
      // 並行処理で Firebase Storage 保存と OCR を実行
      await Promise.all([
        uploadToTab(fileToProcess, tabId, tag),
        extraction.extractFromFile(fileToProcess, useHybridMode)
      ]);
      
      // アップロード開始後に選択状態とハイブリッド設定をクリア
      setSelectedHint(null);
      setUseHybridMode(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extraction.extractFromFile, uploadToTab, tabId, selectedHint, useHybridMode],
  );

  const mappedCount = ctf.extractedData.filter((d) => d.mapped).length;
  const totalCount = ctf.extractedData.length;

  const handleFullReset = useCallback(() => {
    ctf.resetAll();
    extraction.clearItems();
    setUploadedFileName(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraction.clearItems]);

  return (
    <>
      {/* Floating Tooltip（グローバル） */}
      <AnimatePresence>
        {ctf.heldData && <FloatingTooltip text={ctf.heldData} />}
      </AnimatePresence>

      {/* サイドバーコンテナ */}
      <div className={`ai-extraction-sidebar rounded-xl border border-slate-200 bg-white shadow-sm ${hideHeader ? '' : 'mb-4'}`}>
        {/* ヘッダー（トグル） */}
        {!hideHeader && (
          <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 rounded-t-xl"
        >
          <div className="flex items-center gap-2">
            <FileSearch size={16} className="text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">📄 書類から自動入力</span>
            {totalCount > 0 && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full px-2 py-0.5">
                {mappedCount}/{totalCount}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className="text-slate-400" />
          </motion.div>
        </button>
        )}

        {/* コンテンツ（アコーディオン） */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              {/* 📎 アップロードエリア */}
              <UploadArea
                onFileSelect={handleFileSelect}
                isLoading={isCompressing || extraction.isLoading || isUploading}
                error={extraction.error}
                hasData={ctf.extractedData.length > 0}
                fileName={uploadedFileName}
                onClearError={extraction.clearError}
              />
              
              {/* ─── 高精度抽出トグル ─── */}
              <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 size={14} className={useHybridMode ? "text-amber-400" : "text-slate-400"} />
                  <span className="text-xs text-slate-600">高精度ハイブリッド抽出 (コスト増)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseHybridMode(!useHybridMode)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                    useHybridMode ? 'bg-amber-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      useHybridMode ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* ─── 推奨書類ヒント（クリックして事前選択可能） ─── */}
              {hints.length > 0 && (
                <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/50">
                  <div className="text-xs text-slate-500 mb-2">推奨書類 (アップロード前に選択):</div>
                  <div className="flex flex-wrap gap-2">
                    {hints.map((hint) => {
                      const isSelected = selectedHint === hint;
                      const isDone = currentAttachments.some(a => a.tag === hint);
                      return (
                        <button
                          key={hint}
                          type="button"
                          onClick={() => setSelectedHint(isSelected ? null : hint)}
                          className={`px-2.5 py-1 text-[10px] rounded-full transition-all border ${
                            isDone 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : isSelected 
                                ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/20' 
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                          title={isDone ? 'アップロード済み' : '選択してアップロード'}
                        >
                          {isDone && <CheckCircle2 size={10} className="inline mr-1" />}
                          {!isDone && isSelected && <CheckCircle2 size={10} className="inline mr-1" />}
                          {hint}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 添付ファイル一覧表示 */}
              <div className="px-4 py-2 border-b border-slate-200">
                <FileList 
                  attachments={currentAttachments} 
                  onDelete={(id) => deleteFile(tabId, id)} 
                  readonly={false} 
                />
              </div>

              {/* ホールド中バナー */}
              <AnimatePresence>
                {ctf.heldData && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-indigo-200 bg-linear-to-r from-indigo-50 to-purple-50"
                  >
                    <div className="px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <MousePointerClick size={14} className="text-indigo-600" />
                        </motion.div>
                        <span className="text-xs font-medium text-indigo-700">
                          「<span className="font-bold">{ctf.heldData}</span>」を保持中
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={ctf.releaseItem}
                        className="p-1 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        <X size={14} className="text-indigo-500" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 進捗バー */}
              {totalCount > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium">マッピング進捗</span>
                    <span className="font-bold text-indigo-600">
                      {Math.round((mappedCount / totalCount) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-linear-to-r from-indigo-400 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(mappedCount / totalCount) * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Auto-Fill 成功バナー */}
              <AnimatePresence>
                {autoFilledCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 pt-2"
                  >
                    <div className="flex items-center gap-2 rounded-lg bg-violet-50 border border-violet-200 px-3 py-2">
                      <Wand2 size={14} className="text-violet-500 shrink-0" />
                      <span className="text-xs font-medium text-violet-700">
                        ✨ 学習により <span className="font-bold">{autoFilledCount}件</span> を自動入力しました
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* カードリスト */}
              <div className="px-3 py-3 space-y-2">
                {ctf.extractedData.length === 0 && !extraction.isLoading ? (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    書類をアップロードすると、AIが自動で情報を読み取ります
                  </div>
                ) : (
                  ctf.extractedData.map((item) => (
                    <ExtractedCard
                      key={item.id}
                      item={item}
                      isHolding={ctf.heldItemId === item.id}
                      onSelect={() => ctf.holdItem(item)}
                      onDeselect={ctf.releaseItem}
                      fieldLabels={fieldLabels}
                    />
                  ))
                )}
              </div>

              {/* マッピング履歴 */}
              {ctf.mappingLog.length > 0 && (
                <div className="border-t border-slate-200 px-4 py-3">
                  <h4 className="text-xs font-bold text-slate-500 mb-2">マッピング履歴</h4>
                  <div className="space-y-1.5">
                    {ctf.mappingLog.map((log, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        <span className="font-medium truncate">{log.from}</span>
                        <ChevronRight size={10} className="text-slate-300 shrink-0" />
                        <span className="text-indigo-600 font-medium truncate">
                          {fieldLabels?.[log.to] || log.to}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* フッター */}
              <div className="border-t border-slate-200 px-4 py-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleFullReset}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <RotateCcw size={12} />
                  リセット
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// --- Context / Hook の re-export ---
export { ClickToFillProvider, useClickToFillContext } from '@/contexts/ClickToFillContext';
export type { UseClickToFillReturn } from '@/hooks/useClickToFill';
export type { ExtractedItem } from '@/types/extractedItem';
