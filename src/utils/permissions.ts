import type { UserRole } from "@/types/database";

/**
 * ロールベースの権限チェックユーティリティ
 *
 * 権限マトリクス:
 * | 操作                 | branch_staff | hq_admin | scrivener |
 * |----------------------|:---:|:---:|:---:|
 * | 自支部データの閲覧     | ✅ | ✅ | ✅ |
 * | 他支部データの閲覧     | ❌ | ✅ | ✅ |
 * | データの作成          | ✅ | ✅ | ✅ |
 * | データの編集          | ✅ | ✅ | ✅ |
 * | データの承認・差し戻し   | ❌ | ❌ | ✅ |
 * | ステータス変更         | ❌ | ❌ | ✅ |
 */

/** 全支部のデータを閲覧できるか */
export function canViewAllBranches(role: UserRole): boolean {
  return role === "hq_admin" || role === "scrivener";
}

/** 外国人データを編集できるか */
export function canEditForeigner(role: UserRole): boolean {
  return role === "branch_staff" || role === "hq_admin" || role === "scrivener";
}

/** 外国人データを新規作成できるか */
export function canCreateForeigner(role: UserRole): boolean {
  return role === "branch_staff" || role === "hq_admin" || role === "scrivener";
}

/** データの承認・差し戻しができるか（最終確認者権限） */
export function canApproveReject(role: UserRole): boolean {
  return role === "scrivener";
}

/** ステータスを変更できるか */
export function canChangeStatus(role: UserRole): boolean {
  return role === "scrivener";
}

/** ダッシュボードのサマリー（集計）を表示できるか */
export function canViewSummary(): boolean {
  return true; // 全ロールでサマリー表示可能（自分が見えるデータの範囲で）
}

/** CSVエクスポートができるか */
export function canExportCsv(role: UserRole): boolean {
  return role === "scrivener";
}
