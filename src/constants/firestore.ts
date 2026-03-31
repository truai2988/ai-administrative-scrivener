/**
 * Firestore コレクション名の定数
 * ハードコードを避け、全サービスからここを参照する
 */
export const COLLECTIONS = {
  FOREIGNERS: 'foreigners',
  RENEWAL_APPLICATIONS: 'renewal_applications',
  BRANCHES: 'branches',
  USERS: 'users',
} as const;

/**
 * 更新申請書のステータス定数
 */
export const APPLICATION_STATUS = {
  EDITING: 'editing',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
} as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];
