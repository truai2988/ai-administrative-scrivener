'use client';

/**
 * DocumentUploadArea.tsx
 *
 * 在留期間更新申請書の新規作成フォーム冒頭に表示する
 * PC向け書類アップロード & AIオートフィルUIコンポーネント。
 *
 * 責務:
 *   - 3種の書類（在留カード表/裏、パスポート）のドラッグ＆ドロップ受付
 *   - /api/validate-image へのPOST通信
 *   - AI結果を mapAiExtractedToFormData でフォームデータに変換 → 親へ通知
 *   - ローディング・成功・エラー状態のUI表示
 */

import React, { useCallback, useRef, useState, DragEvent, ChangeEvent } from 'react';
import {
  Upload, Sparkles, CheckCircle2, AlertCircle, Loader2,
  CreditCard, BookOpen, FileImage, X, RotateCcw,
} from 'lucide-react';
import {
  mapAiExtractedToFormData,
  countMappedFields,
  type AiExtractedData,
} from '@/lib/mappers/aiExtractedToFormData';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

interface DocumentUploadAreaProps {
  /** AI読み取り成功時に、変換済みフォームデータを呼び出し元へ渡す */
  onExtracted: (data: Partial<RenewalApplicationFormData>, fieldCount: number) => void;
  /** Toast通知を表示する関数（呼び出し元の useToast から渡す） */
  onError: (message: string) => void;
}

type DocSlotId = 'card_front' | 'card_back' | 'passport';

type SlotStatus = 'idle' | 'analyzing' | 'done' | 'error';

interface DocSlotState {
  file: File | null;
  status: SlotStatus;
  errorMessage: string;
  fieldCount: number;
}

type SlotsState = Record<DocSlotId, DocSlotState>;

// ─── 書類スロット定義 ─────────────────────────────────────────────────────────

const SLOT_DEFS: Array<{
  id: DocSlotId;
  label: string;
  note: string;
  icon: React.ElementType;
  acceptHint: string;
}> = [
  {
    id: 'card_front',
    label: '在留カード（表）',
    note: '氏名・在留資格・在留期限などが記載された面',
    icon: CreditCard,
    acceptHint: 'JPG / PNG',
  },
  {
    id: 'card_back',
    label: '在留カード（裏）',
    note: '就労制限・資格外活動許可などが記載された面',
    icon: CreditCard,
    acceptHint: 'JPG / PNG',
  },
  {
    id: 'passport',
    label: 'パスポート（顔写真ページ）',
    note: '旅券番号・有効期限・国籍が記載された顔写真のあるページ',
    icon: BookOpen,
    acceptHint: 'JPG / PNG',
  },
];

const INITIAL_SLOT_STATE: DocSlotState = {
  file: null,
  status: 'idle',
  errorMessage: '',
  fieldCount: 0,
};

const INITIAL_SLOTS_STATE: SlotsState = {
  card_front: { ...INITIAL_SLOT_STATE },
  card_back:  { ...INITIAL_SLOT_STATE },
  passport:   { ...INITIAL_SLOT_STATE },
};

// ─── メインコンポーネント ──────────────────────────────────────────────────────

export function DocumentUploadArea({ onExtracted, onError }: DocumentUploadAreaProps) {
  const [slots, setSlots] = useState<SlotsState>(INITIAL_SLOTS_STATE);
  const [dragOverSlot, setDragOverSlot] = useState<DocSlotId | null>(null);

  // anyスロットが解析中かどうか（全体ブロック用）
  const isAnyAnalyzing = Object.values(slots).some((s) => s.status === 'analyzing');

  // ─── ファイル処理 ──────────────────────────────────────────────────────────

  const processFile = useCallback(
    async (slotId: DocSlotId, file: File) => {
      // 画像ファイルのみ受付（PDF等は明示的に拒否）
      if (!file.type.startsWith('image/')) {
        onError('画像ファイル（JPG / PNG）のみ対応しています。PDFは選択できません。');
        return;
      }

      // ファイルサイズ上限: 10MB
      if (file.size > 10 * 1024 * 1024) {
        onError('ファイルサイズが大きすぎます（上限: 10MB）。');
        return;
      }

      // スロットを「解析中」に更新
      setSlots((prev) => ({
        ...prev,
        [slotId]: { file, status: 'analyzing', errorMessage: '', fieldCount: 0 },
      }));

      try {
        // FileReader で Base64 変換
        const imageBase64 = await readFileAsBase64(file);

        // /api/validate-image へ POST
        const res = await fetch('/api/validate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            mimeType: file.type,
          }),
        });

        if (!res.ok) {
          throw new Error(`APIエラー: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();

        if (!json.isValid) {
          // APIが「読み取り不可」と判定した場合
          const reason = json.reason || '画像が不鮮明か、対応していない書類です。';
          setSlots((prev) => ({
            ...prev,
            [slotId]: { file, status: 'error', errorMessage: reason, fieldCount: 0 },
          }));
          onError(`読み取りに失敗しました。手動で入力してください。（${reason}）`);
          return;
        }

        // 成功: マッパーでフォームデータへ変換
        const extracted: AiExtractedData = json.extractedData ?? {};
        const formData = mapAiExtractedToFormData(extracted);
        const fieldCount = countMappedFields(extracted);

        setSlots((prev) => ({
          ...prev,
          [slotId]: { file, status: 'done', errorMessage: '', fieldCount },
        }));

        // 親コンポーネントへ通知
        onExtracted(formData, fieldCount);
      } catch (err) {
        const message = err instanceof Error ? err.message : '通信エラーが発生しました。';
        setSlots((prev) => ({
          ...prev,
          [slotId]: { file, status: 'error', errorMessage: message, fieldCount: 0 },
        }));
        onError('読み取りに失敗しました。手動で入力してください。');
      }
    },
    [onExtracted, onError]
  );

  // ─── ドラッグ＆ドロップ ────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, slotId: DocSlotId) => {
    e.preventDefault();
    setDragOverSlot(slotId);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, slotId: DocSlotId) => {
      e.preventDefault();
      setDragOverSlot(null);
      const file = e.dataTransfer.files[0];
      if (file) processFile(slotId, file);
    },
    [processFile]
  );

  // ─── クリックで選択 ────────────────────────────────────────────────────────

  const fileInputRefs = useRef<Record<DocSlotId, HTMLInputElement | null>>({
    card_front: null,
    card_back: null,
    passport: null,
  });

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>, slotId: DocSlotId) => {
      const file = e.target.files?.[0];
      if (file) processFile(slotId, file);
      // 同じファイルを再選択できるようにリセット
      e.target.value = '';
    },
    [processFile]
  );

  // ─── スロットのリセット ────────────────────────────────────────────────────

  const handleReset = useCallback((slotId: DocSlotId) => {
    setSlots((prev) => ({
      ...prev,
      [slotId]: { ...INITIAL_SLOT_STATE },
    }));
  }, []);

  // ─── 全体ステータスの集計 ─────────────────────────────────────────────────

  const totalDone = Object.values(slots).filter((s) => s.status === 'done').length;
  const totalFieldCount = Object.values(slots).reduce((acc, s) => acc + s.fieldCount, 0);
  const hasAnyDone = totalDone > 0;

  // ─── 描画 ─────────────────────────────────────────────────────────────────

  return (
    <div className="doc-upload-area">
      {/* ─── ヘッダー */}
      <div className="doc-upload-header">
        <div className="doc-upload-header-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="doc-upload-title">書類スキャン・自動入力（AIアシスト）</h2>
          <p className="doc-upload-subtitle">
            書類の画像をアップロードすると、AIが文字を読み取ってフォームに自動入力します。
            <span className="doc-upload-badge">JPG / PNG のみ対応</span>
          </p>
        </div>
      </div>

      {/* ─── 成功バナー */}
      {hasAnyDone && (
        <div className="doc-upload-success-banner" role="status">
          <CheckCircle2 size={16} />
          <span>
            {totalDone}件の書類から <strong>{totalFieldCount}項目</strong> を読み取りました。フォームに自動入力済みです。
          </span>
        </div>
      )}

      {/* ─── ローディングオーバーレイ（解析中は全体ブロック） */}
      {isAnyAnalyzing && (
        <div className="doc-upload-analyzing-overlay" aria-live="polite" aria-label="AI解析中">
          <div className="doc-upload-analyzing-badge">
            <Loader2 size={18} className="spin" />
            <span>AIが書類を解析中...</span>
          </div>
        </div>
      )}

      {/* ─── スロットグリッド */}
      <div className="doc-upload-slots" style={{ pointerEvents: isAnyAnalyzing ? 'none' : 'auto' }}>
        {SLOT_DEFS.map((def) => {
          const slot = slots[def.id];
          const isDragOver = dragOverSlot === def.id;
          const Icon = def.icon;

          return (
            <div
              key={def.id}
              className={[
                'doc-slot',
                isDragOver           ? 'doc-slot--dragover'  : '',
                slot.status === 'done'  ? 'doc-slot--done'      : '',
                slot.status === 'error' ? 'doc-slot--error'     : '',
                slot.status === 'analyzing' ? 'doc-slot--analyzing' : '',
              ].filter(Boolean).join(' ')}
              onDragOver={(e) => handleDragOver(e, def.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, def.id)}
              onClick={() => {
                if (slot.status !== 'analyzing') {
                  fileInputRefs.current[def.id]?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${def.label}をアップロード`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (slot.status !== 'analyzing') {
                    fileInputRefs.current[def.id]?.click();
                  }
                }
              }}
            >
              {/* 非表示のファイル入力 */}
              <input
                ref={(el) => { fileInputRefs.current[def.id] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, def.id)}
                tabIndex={-1}
                aria-hidden="true"
              />

              {/* スロットコンテンツ */}
              <div className="doc-slot-inner">
                {/* ステータスアイコン */}
                <div className="doc-slot-icon-wrap">
                  {slot.status === 'idle' && <Icon size={28} className="doc-slot-icon" />}
                  {slot.status === 'analyzing' && <Loader2 size={28} className="doc-slot-icon spin" />}
                  {slot.status === 'done'  && <CheckCircle2 size={28} className="doc-slot-icon doc-slot-icon--done" />}
                  {slot.status === 'error' && <AlertCircle  size={28} className="doc-slot-icon doc-slot-icon--error" />}
                </div>

                {/* ラベル */}
                <div className="doc-slot-label">{def.label}</div>
                <div className="doc-slot-note">
                  {slot.status === 'idle' && def.note}
                  {slot.status === 'analyzing' && '解析中...'}
                  {slot.status === 'done' && (
                    <span className="doc-slot-result-done">
                      {slot.fieldCount}項目を読み取りました
                    </span>
                  )}
                  {slot.status === 'error' && (
                    <span className="doc-slot-result-error">{slot.errorMessage}</span>
                  )}
                </div>

                {/* ファイル名 */}
                {slot.file && slot.status !== 'idle' && (
                  <div className="doc-slot-filename">
                    <FileImage size={12} />
                    <span>{slot.file.name}</span>
                  </div>
                )}

                {/* アクションエリア */}
                {slot.status === 'idle' && (
                  <div className="doc-slot-drop-hint">
                    <Upload size={14} />
                    <span>ここにドロップ or クリックして選択</span>
                    <span className="doc-slot-accept">{def.acceptHint}</span>
                  </div>
                )}

                {/* 再試行ボタン */}
                {(slot.status === 'done' || slot.status === 'error') && (
                  <button
                    type="button"
                    className="doc-slot-reset-btn"
                    onClick={(e) => { e.stopPropagation(); handleReset(def.id); }}
                    aria-label={`${def.label}をリセット`}
                  >
                    <RotateCcw size={12} />
                    やり直す
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── スキップリンク */}
      <div className="doc-upload-skip">
        <X size={14} />
        <span>書類がない場合は、このまま手動でフォームに入力してください。</span>
      </div>
    </div>
  );
}

// ─── ユーティリティ ──────────────────────────────────────────────────────────

/** File を Base64 文字列（data URL）に変換 */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
    reader.readAsDataURL(file);
  });
}
