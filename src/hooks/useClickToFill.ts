'use client';

/**
 * useClickToFill.ts
 *
 * Click-to-Fill（書類データ → フォーム直接代入）のステート管理カスタムフック。
 * FormProvider の内側で使用し、useFormContext 経由で setValue を実行する。
 *
 * ジェネリクス T extends FieldValues により、COE / Renewal / ChangeOfStatus
 * いずれのフォームスキーマでも型安全に使用可能。
 *
 * ■ 学習フィードバックループ:
 *   fillField() でマッピング成功時、breadcrumb → fieldPath のペアを
 *   POST /api/mappings/learn に Fire-and-forget で送信。
 *   initData() 時に過去の学習辞書と照合し、既知マッピングを自動適用。
 *
 * 使い方:
 *   const ctf = useClickToFill<CoeApplicationFormData>();
 *   ctf.initData(extractedItems);
 *   // カードクリック:  ctf.holdItem(item)
 *   // フィールド代入:  onMouseDown={(e) => ctf.fillField(e, 'identityInfo.nameEn')}
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';
import type { ExtractedItem, MappingEntry } from '@/types/extractedItem';
import { normalizeForField, findBestOptionMatch } from '@/utils/textNormalizer';

// ─── 学習辞書の型定義 ─────────────────────────────────────────────────────────

/** breadcrumb のキー（"身分事項 > 氏名（英字）" のように結合）→ fieldPath */
export type MappingDictionary = Record<string, string>;

// ─── 学習データ保存コールバック型 ──────────────────────────────────────────────

/**
 * 外部（useMappingPreferences）から注入される保存関数の型。
 * breadcrumbKey と fieldPath を受け取り、Firestore への書き込みを行う。
 */
export type SaveMappingCallback = (breadcrumbKey: string, fieldPath: string) => void;

// ─── breadcrumb → キー文字列変換 ─────────────────────────────────────────────

function breadcrumbToKey(breadcrumb: string[]): string {
  return breadcrumb.join(' > ');
}

// ─── Return 型 ────────────────────────────────────────────────────────────────

export interface UseClickToFillReturn<T extends FieldValues> {
  /** 現在保持中のテキストデータ */
  heldData: string | null;
  /** 現在保持中のアイテムID */
  heldItemId: string | null;
  /** 抽出データ配列（マッピング状態含む） */
  extractedData: ExtractedItem[];
  /** マッピング履歴 */
  mappingLog: MappingEntry[];
  /** 抽出データを初期化・更新する */
  initData: (items: ExtractedItem[]) => void;
  /** アイテムを保持する（左ペインのカードクリック） */
  holdItem: (item: ExtractedItem) => void;
  /** 保持を解除する */
  releaseItem: () => void;
  /** フィールドに代入する（右ペインの onMouseDown ハンドラ） */
  fillField: (e: React.MouseEvent, fieldPath: FieldPath<T>) => void;
  /** 全状態をリセットする */
  resetAll: () => void;
  /** フィルモード中かどうか */
  isInFillMode: boolean;
  /** 学習辞書をセットする（外部からの注入用） */
  setLearnedMappings: (dict: MappingDictionary) => void;
  /** 現在の学習辞書 */
  learnedMappings: MappingDictionary;
  /** 既知マッピングの一括自動適用 */
  autoFillKnownMappings: () => number;
}

/** オプション: Firestore 保存コールバックを外部から注入 */
interface UseClickToFillOptions {
  /** Firestore への保存関数（useMappingPreferences から注入） */
  onSaveMapping?: SaveMappingCallback;
  /** UiConfig 由来の静的初期マッピング（breadcrumbKey → fieldPath） */
  staticMappings?: Record<string, string>;
}

export function useClickToFill<T extends FieldValues>(
  options?: UseClickToFillOptions,
): UseClickToFillReturn<T> {
  const { setValue } = useFormContext<T>();

  const [heldData, setHeldData] = useState<string | null>(null);
  const [heldItemId, setHeldItemId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedItem[]>([]);
  const [mappingLog, setMappingLog] = useState<MappingEntry[]>([]);

  // 学習辞書: breadcrumbKey → fieldPath
  const [learnedMappings, setLearnedMappings] = useState<MappingDictionary>({});

  // extractedData の最新値を ref で保持（autoFill 内で使用）
  const extractedDataRef = useRef<ExtractedItem[]>([]);
  useEffect(() => {
    extractedDataRef.current = extractedData;
  }, [extractedData]);

  // --- body に cursor-crosshair を適用（フィルモード中のみ） ---
  useEffect(() => {
    if (heldData) {
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.cursor = '';
    }
    return () => {
      document.body.style.cursor = '';
    };
  }, [heldData]);

  // --- 抽出データの初期化 ---
  const initData = useCallback((items: ExtractedItem[]) => {
    setExtractedData(items);
    setMappingLog([]);
    setHeldData(null);
    setHeldItemId(null);
  }, []);

  // --- アイテムを保持する ---
  const holdItem = useCallback((item: ExtractedItem) => {
    setHeldData(item.value);
    setHeldItemId(item.id);
  }, []);

  // --- 保持を解除する ---
  const releaseItem = useCallback(() => {
    setHeldData(null);
    setHeldItemId(null);
  }, []);

  // --- フィールドに代入する ---
  // onMouseDown + preventDefault パターン:
  //   フィルモード時は input のフォーカスを奪わずに値だけを代入。
  //   heldData が null の場合は何もせず、通常のフォーカス→手入力が機能する。
  //
  // 正規化レイヤー:
  //   代入前に normalizeForField() を通し、Zod スキーマが要求する形式に自動変換。
  //   <select> 要素の場合は options から部分一致で最適な value を検索する。
  const fillField = useCallback(
    (e: React.MouseEvent, fieldPath: FieldPath<T>) => {
      console.log(`[ClickToFill] 🟢 fillField開始: target=${fieldPath}`);
      if (!heldData || !heldItemId) {
        console.log(`[ClickToFill] 🟡 保持データがないためキャンセル (heldData=${heldData}, heldItemId=${heldItemId})`);
        return;
      }

      // input へのフォーカスを阻止（フィルモード専用）
      e.preventDefault();

      // --- 正規化 + セレクトボックス対応 ---
      let valueToFill: string = normalizeForField(heldData, fieldPath);
      console.log(`[ClickToFill] 🔵 正規化後: "${heldData}" -> "${valueToFill}"`);

      // <select> 要素の場合: options から部分一致検索
      const targetEl = e.currentTarget as HTMLElement;
      console.log(`[ClickToFill] 🔵 ターゲット要素: ${targetEl.tagName}`);

      if (targetEl.tagName === 'SELECT') {
        const selectEl = targetEl as HTMLSelectElement;
        const selectOptions = Array.from(selectEl.options)
          .filter((opt) => opt.value !== '') // placeholder を除外
          .map((opt) => ({ value: opt.value, label: opt.textContent ?? '' }));

        const matched = findBestOptionMatch(heldData, selectOptions);

        if (matched !== null) {
          valueToFill = matched;
          console.log(`[ClickToFill] 🔵 セレクト一致: "${heldData}" -> value="${matched}"`);
        } else {
          console.log(`[ClickToFill] 🟡 セレクト一致なし: そのまま代入`);
        }
      }

      // React Hook Form に正規化済みの値を代入
      console.log(`[ClickToFill] 🟣 setValue実行: path=${fieldPath}, value=${valueToFill}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(fieldPath, valueToFill as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true });

      // register ベースの非制御コンポーネント対応
      if (targetEl instanceof HTMLSelectElement || targetEl instanceof HTMLInputElement || targetEl instanceof HTMLTextAreaElement) {
        targetEl.value = valueToFill;
        console.log(`[ClickToFill] 🟣 DOM直接更新: tag=${targetEl.tagName}, value=${valueToFill}`);
      }

      // ── 学習フィードバック: breadcrumb → fieldPath を送信 ──────────────
      // 現在保持中のアイテムの breadcrumb を取得して学習データを送信
      const currentItem = extractedDataRef.current.find((item) => item.id === heldItemId);
      if (currentItem?.breadcrumb && currentItem.breadcrumb.length > 0) {
        // ローカル辞書にも即座に反映（次回の autoFill に利用）
        const key = breadcrumbToKey(currentItem.breadcrumb);
        setLearnedMappings((prev) => ({ ...prev, [key]: fieldPath }));

        // Firestore への永続化（Fire-and-forget）
        if (options?.onSaveMapping) {
          options.onSaveMapping(key, fieldPath);
        }
      }

      // 抽出データを「マッピング済み」に更新
      const capturedItemId = heldItemId;
      setExtractedData((prev) =>
        prev.map((item) =>
          item.id === capturedItemId ? { ...item, mapped: true, mappedTo: fieldPath } : item,
        ),
      );

      // マッピングログに追加（変換前→変換後を記録）
      setMappingLog((prev) => [
        ...prev,
        { from: heldData, to: fieldPath, value: valueToFill },
      ]);

      // 保持状態を解除
      setHeldData(null);
      setHeldItemId(null);
    },
    [heldData, heldItemId, setValue, options],
  );

  // --- 既知マッピングの一括自動適用（2段構え）---
  // ① まず静的マッピング（UiConfig.fieldMappings 由来）を照合
  // ② 次に動的マッピング（Firestore 学習辞書）を照合して残りを自動入力
  // 戻り値: 自動適用された件数
  const autoFillKnownMappings = useCallback((): number => {
    console.log(`[AutoFill] 🔄 autoFillKnownMappings 開始`);
    // useEffect のタイミングズレによる race condition を防ぐため、ref ではなく state を直接参照する
    const currentItems = extractedData;
    if (currentItems.length === 0) {
      console.log(`[AutoFill] 🟡 抽出データなし`);
      return 0;
    }

    const combinedMappings: Record<string, string> = {
      ...(options?.staticMappings || {}),
      ...learnedMappings,
    };
    console.log(`[AutoFill] ℹ️ マッピング辞書: ${Object.keys(combinedMappings).length}件`, combinedMappings);

    if (Object.keys(combinedMappings).length === 0) return 0;

    let filledCount = 0;
    const updatedItems = [...currentItems];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      if (item.mapped || !item.breadcrumb || item.breadcrumb.length === 0) continue;

      const key = breadcrumbToKey(item.breadcrumb);
      let targetFieldPath = combinedMappings[key];
      if (!targetFieldPath) continue;

      let el = document.querySelector(`[name="${targetFieldPath}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      
      // 🔄 フォールバック: 学習済みマッピングのDOM要素が存在しない場合、静的マッピングを試す
      if (!el && options?.staticMappings && options.staticMappings[key] && options.staticMappings[key] !== targetFieldPath) {
        console.warn(`[AutoFill] ⚠️ 学習済みマッピング [name="${targetFieldPath}"] が見つかりません。静的マッピング [name="${options.staticMappings[key]}"] にフォールバックします。`);
        targetFieldPath = options.staticMappings[key];
        el = document.querySelector(`[name="${targetFieldPath}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      }

      const normalized = normalizeForField(item.value, targetFieldPath);
      console.log(`[AutoFill] 🟢 マッチ成功: [${key}] -> ${targetFieldPath} (値: "${normalized}")`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(targetFieldPath as FieldPath<T>, normalized as any, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      if (el) {
        el.value = normalized;
        console.log(`[AutoFill] 🟣 DOM直接更新: tag=${el.tagName}, name=${targetFieldPath}`);
        
        updatedItems[i] = { ...item, mapped: true, mappedTo: targetFieldPath, autoFilled: true };
        filledCount++;

        setMappingLog((prev) => [
          ...prev,
          { from: item.value, to: targetFieldPath, value: normalized },
        ]);
      } else {
        console.warn(`[AutoFill] ⚠️ DOM要素が見つかりません（別フォームの項目の可能性）: [name="${targetFieldPath}"]`);
      }
    }

    if (filledCount > 0) {
      console.log(`[AutoFill] ✅ 自動入力完了: ${filledCount}件`);
      setExtractedData(updatedItems);
    } else {
      console.log(`[AutoFill] 🟡 自動入力対象なし`);
    }

    return filledCount;
  }, [extractedData, learnedMappings, setValue, options]);

  // --- 全状態をリセット ---
  const resetAll = useCallback(() => {
    setExtractedData((prev) =>
      prev.map((item) => ({ ...item, mapped: false, mappedTo: null })),
    );
    setMappingLog([]);
    setHeldData(null);
    setHeldItemId(null);
  }, []);

  return {
    heldData,
    heldItemId,
    extractedData,
    mappingLog,
    initData,
    holdItem,
    releaseItem,
    fillField,
    resetAll,
    isInFillMode: heldData !== null,
    setLearnedMappings,
    learnedMappings,
    autoFillKnownMappings,
  };
}
