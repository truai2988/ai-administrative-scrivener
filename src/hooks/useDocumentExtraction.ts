/**
 * useDocumentExtraction.ts
 *
 * 書類画像をアップロードし、AI (Gemini API) で構造化データを抽出するカスタムフック。
 *
 * ■ 責務:
 *   - ファイルの FormData 化と /api/extract への POST 送信
 *   - ローディング / エラー / 成功 の状態管理
 *   - APIレスポンスを ExtractedItem[] に変換
 *
 * ■ 使用箇所:
 *   AiExtractionSidebar 内のアップロードUIから呼び出す
 */

'use client';

import { useState, useCallback } from 'react';
import type { ExtractedItem } from '@/types/extractedItem';

// ─── 内部型 ───────────────────────────────────────────────────────────────────

interface ExtractionState {
  /** 通信中フラグ */
  isLoading: boolean;
  /** エラーメッセージ（null = エラーなし） */
  error: string | null;
  /** 抽出されたデータ */
  items: ExtractedItem[];
  /** レスポンスモード ('gemini' | 'mock' | null) */
  mode: string | null;
}

export interface UseDocumentExtractionReturn extends ExtractionState {
  /** ファイルを送信して抽出を実行する */
  extractFromFile: (file: File) => Promise<ExtractedItem[]>;
  /** エラー状態をクリアする */
  clearError: () => void;
  /** 抽出データをクリアする */
  clearItems: () => void;
}

// ─── フック本体 ───────────────────────────────────────────────────────────────

export function useDocumentExtraction(): UseDocumentExtractionReturn {
  const [state, setState] = useState<ExtractionState>({
    isLoading: false,
    error: null,
    items: [],
    mode: null,
  });

  /**
   * ファイルを /api/extract に送信し、構造化データを取得する。
   * 成功時は ExtractedItem[] を返し、内部 state も更新する。
   */
  const extractFromFile = useCallback(async (file: File): Promise<ExtractedItem[]> => {
    setState({ isLoading: true, error: null, items: [], mode: null });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'サーバーエラー' }));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.success || !Array.isArray(data.items)) {
        throw new Error('予期しないレスポンス形式です');
      }

      const items: ExtractedItem[] = data.items;
      setState({ isLoading: false, error: null, items, mode: data.mode ?? null });
      return items;
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearItems = useCallback(() => {
    setState({ isLoading: false, error: null, items: [], mode: null });
  }, []);

  return {
    ...state,
    extractFromFile,
    clearError,
    clearItems,
  };
}
