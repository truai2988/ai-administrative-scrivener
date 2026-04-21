/**
 * Firestore コレクション名の定数
 * ハードコードを避け、全サービスからここを参照する
 */
export const COLLECTIONS = {
  FOREIGNERS: 'foreigners',
  RENEWAL_APPLICATIONS: 'renewal_applications',
  CHANGE_OF_STATUS_APPLICATIONS: 'change_of_status_applications',
  BRANCHES: 'branches',
  USERS: 'users',
} as const;

/**
 * 更新申請書のステータス定数
 */
export const APPLICATION_STATUS = {
  DRAFT:          'draft',          // 下書き（先行保存・書類添付待ち）
  EDITING:        'editing',        // 編集中（フォーム入力中）
  PENDING_REVIEW: 'pending_review',
  APPROVED:       'approved',
} as const;


export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];
