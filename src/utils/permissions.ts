import type { UserRole } from "@/types/database";

/**
 * ロールベースの権限チェックユーティリティ
 *
 * 権限マトリクス:
 * | 操作                 | branch_staff | hq_admin | scrivener |
 * |----------------------|:---:|:---:|:---:|
 * | 自支部データの閲覧     | ✅ | ✅ | ✅ |
 * | 他支部データの閲覧     | ❌ | ✅ | ✅ |
 * | データの作成（新規申請） | ✅ | ❌ | ❌ |
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
  return role === "branch_staff" || role === "hq_admin";
}

/** 外国人データを新規作成できるか（支部事務員のみ。管理者は申請不可） */
export function canCreateForeigner(role: UserRole): boolean {
  return role === 'branch_staff';
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



/** 行政書士への確認依頼ができるか（branch_staffのみ） */
export function canRequestReview(role: UserRole): boolean {
  return role === "branch_staff";
}

/** 承認・差し戻しができるか（scrivenerのみ） */
export function canApproveOrReturn(role: UserRole): boolean {
  return role === "scrivener";
}

/** 修正履歴を閲覧できるか */
export function canViewHistory(role: UserRole): boolean {
  return role === "hq_admin" || role === "branch_staff" || role === "scrivener";
}

/** 修正モードによるデータ編集ができるか（全ログインユーザー共通） */
export function canCorrectData(role: UserRole): boolean {
  return role === 'branch_staff' || role === 'hq_admin' || role === 'scrivener';
}
