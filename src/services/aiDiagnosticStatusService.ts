/**
 * aiDiagnosticStatusService.ts
 *
 * 各申請書コレクション（COE / 更新 / 変更）に保存された aiDiagnostics を
 * 外国人IDごとに集約し、トップページ一覧のアイコン表示に必要なサマリーを返す。
 *
 * Firestore の `in` クエリは最大30件のため、チャンク分割で安全に取得する。
 */

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/constants/firestore';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

/** 外国人1名あたりの AI 診断集約結果 */
export interface AiDiagnosticSummary {
  critical: number;
  warning: number;
  suggestion: number;
  /** 最も新しい診断日時（ISO 8601）。未実施の場合は null */
  checkedAt: string | null;
  /** 診断後にフォームが更新された場合 true（「要再診断」状態） */
  stale: boolean;
}

/** Firestore に保存される aiDiagnostics フィールドの構造 */
interface StoredDiagnostics {
  diagnostics?: Array<{
    level: 'critical' | 'warning' | 'suggestion';
    category?: string;
    field?: string;
    message?: string;
  }>;
  checkedAt?: string;
  checkedBy?: string;
  lastDiagnosticHash?: string;
}

// ─── 内部ユーティリティ ─────────────────────────────────────────────────────

/**
 * 配列を指定サイズのチャンクに分割する。
 * Firestore `in` クエリの制限（最大30件）を安全に扱うため。
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** 空のサマリーオブジェクト */
function emptySummary(): AiDiagnosticSummary {
  return { critical: 0, warning: 0, suggestion: 0, checkedAt: null, stale: false };
}

// ─── メイン関数 ──────────────────────────────────────────────────────────────

/**
 * 外国人IDのリストに紐づく申請書から AI 診断結果を一括取得し、
 * foreignerId → AiDiagnosticSummary のレコードとして返す。
 *
 * 複数の申請書が同一外国人に紐づいている場合は、全件の診断結果を合算する。
 *
 * @param foreignerIds - 取得対象の外国人IDリスト
 * @returns foreignerId をキーとする診断サマリーの Record
 */
export async function fetchAiDiagnosticSummaries(
  foreignerIds: string[]
): Promise<Record<string, AiDiagnosticSummary>> {
  if (foreignerIds.length === 0) return {};

  console.log('[aiDiagStatus] 取得開始: foreignerIds=', foreignerIds.length, '件', foreignerIds.slice(0, 5));
  const result: Record<string, AiDiagnosticSummary> = {};

  // 対象の3コレクション
  const targetCollections = [
    COLLECTIONS.COE_APPLICATIONS,
    COLLECTIONS.RENEWAL_APPLICATIONS,
    COLLECTIONS.CHANGE_OF_STATUS_APPLICATIONS,
  ];

  // Firestore `in` クエリの上限は30件のため、チャンク分割して発行
  const CHUNK_SIZE = 30;
  const chunks = chunkArray(foreignerIds, CHUNK_SIZE);

  // 全コレクション × 全チャンクのクエリを並列実行
  const promises: Promise<void>[] = [];

  for (const collectionName of targetCollections) {
    for (const chunk of chunks) {
      const p = (async () => {
        try {
          const col = collection(db, collectionName);
          const q = query(col, where('foreignerId', 'in', chunk));
          const snapshot = await getDocs(q);

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const fId = data.foreignerId as string | undefined;
            if (!fId) continue;

            const stored = data.aiDiagnostics as StoredDiagnostics | undefined;
            console.log(`[aiDiagStatus] ドキュメント検出: ${collectionName}/${docSnap.id}, foreignerId=${fId}, aiDiagnostics存在=${!!stored}, diagnostics件数=${stored?.diagnostics?.length ?? 0}`);
            if (!stored?.diagnostics || stored.diagnostics.length === 0) continue;

            // 既存エントリを取得または初期化
            if (!result[fId]) {
              result[fId] = emptySummary();
            }
            const summary = result[fId];

            // 診断項目を集計
            for (const item of stored.diagnostics) {
              if (item.level === 'critical') summary.critical++;
              else if (item.level === 'warning') summary.warning++;
              else if (item.level === 'suggestion') summary.suggestion++;
            }

            // checkedAt は最新のものを採用
            if (stored.checkedAt) {
              if (!summary.checkedAt || stored.checkedAt > summary.checkedAt) {
                summary.checkedAt = stored.checkedAt;
              }
            }

            // 診断後にフォームが更新されたかを判定（stale 検知）
            const appUpdatedAt = data.updatedAt as string | undefined;
            if (stored.checkedAt && appUpdatedAt && appUpdatedAt > stored.checkedAt) {
              summary.stale = true;
            }
          }
        } catch (err) {
          // 個別コレクションのエラーは他に影響させない
          console.warn(
            `[aiDiagnosticStatusService] ${collectionName} の取得に失敗:`,
            err
          );
        }
      })();
      promises.push(p);
    }
  }

  await Promise.all(promises);

  console.log('[aiDiagStatus] 取得完了: 結果件数=', Object.keys(result).length, ', データ=', JSON.stringify(result));
  return result;
}
