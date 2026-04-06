'use client';

/**
 * useOcrExtract.ts
 *
 * SharedFileUploader でファイルがアップロードされた後に
 * /api/ocr/extract を呼び出し、Document AI の OCR結果を返すカスタムフック。
 *
 * 使い方:
 *   const { runOcr, isOcring, ocrResult, ocrError } = useOcrExtract();
 *   // アップロード完了後:
 *   await runOcr({ storagePath: attachment.path, mimeType: attachment.mimeType });
 */

import { useState, useCallback } from 'react';
import type { OcrExtractedField } from '@/lib/mappers/aiExtractedToFormData';
import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';

export interface OcrResult {
  formData: Partial<RenewalApplicationFormData['foreignerInfo']>;
  extractedFields: OcrExtractedField[];
  confidence: number;
  rawText: string;
}

interface RunOcrParams {
  storagePath: string;
  mimeType: string;
}

interface UseOcrExtractReturn {
  runOcr: (params: RunOcrParams) => Promise<OcrResult | null>;
  isOcring: boolean;
  ocrResult: OcrResult | null;
  ocrError: string | null;
  clearOcrResult: () => void;
}

export function useOcrExtract(): UseOcrExtractReturn {
  const [isOcring, setIsOcring] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const runOcr = useCallback(async (params: RunOcrParams): Promise<OcrResult | null> => {
    setIsOcring(true);
    setOcrError(null);

    try {
      const res = await fetch('/api/ocr/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'OCR 処理に失敗しました');
      }

      const result: OcrResult = {
        formData: data.formData,
        extractedFields: data.extractedFields,
        confidence: data.confidence,
        rawText: data.rawText,
      };

      console.log('============= OCR DEBUG =============');
      console.log('[Frontend] Raw OCR Text:', result.rawText);
      console.log('[Frontend] Mapped FormData:', result.formData);
      console.log('[Frontend] Extracted Fields mapping:', result.extractedFields);
      console.log('=====================================');

      setOcrResult(result);
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setOcrError(message);
      return null;
    } finally {
      setIsOcring(false);
    }
  }, []);

  const clearOcrResult = useCallback(() => {
    setOcrResult(null);
    setOcrError(null);
  }, []);

  return { runOcr, isOcring, ocrResult, ocrError, clearOcrResult };
}
