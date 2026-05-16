import type { UserRole } from "@/types/database";

/**
 * ロールベースの権限チェックユーティリティ
 *
 * 権限マトリクス:
 * | 操作                 | union_staff | scrivener |
 * |----------------------|:---:|:---:|
 * | 自組合データの閲覧     | ✅ | ✅ |
 * | 他組合データの閲覧     | ❌ | ✅ |
 * | データの作成（新規申請） | ✅ | ✅ |
 * | データの編集          | ✅ | ✅ |
 * | データの承認・差し戻し   | ❌ | ✅ |
 * | ステータス変更         | ❌ | ✅ |
 */

/** 全データの閲覧ができるか */
export function canViewAllForeigners(role: UserRole): boolean {
  return role === "scrivener";
}

/** 外国人データを編集できるか */
export function canEditForeigner(role: UserRole): boolean {
  return role === "scrivener" || role === "union_staff";
}

/** 外国人データを新規作成できるか */
export function canCreateForeigner(role: UserRole): boolean {
  return role === 'scrivener' || role === 'union_staff';
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



/** 行政書士への確認依頼ができるか（union_staffのみ） */
export function canRequestReview(role: UserRole): boolean {
  return role === "union_staff";
}

/** 承認・差し戻しができるか（scrivenerのみ） */
export function canApproveOrReturn(role: UserRole): boolean {
  return role === "scrivener";
}

/** 修正履歴を閲覧できるか */
export function canViewHistory(role: UserRole): boolean {
  return role === "union_staff" || role === "scrivener";
}

/** 修正モードによるデータ編集ができるか（全ログインユーザー共通） */
export function canCorrectData(role: UserRole): boolean {
  return role === 'union_staff' || role === 'scrivener';
}

/** 申請書フォームを作成・編集できるか（行政書士のみ） */
export function canEditApplication(role: UserRole): boolean {
  return role === 'scrivener';
}

/** 書類アップロードができるか（組合職員 / 企業担当者 / 行政書士） */
export function canUploadDocuments(role: UserRole): boolean {
  return role === 'union_staff' || role === 'enterprise_staff' || role === 'scrivener';
}
