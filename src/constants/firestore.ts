/**
 * Firestore コレクション名の定数
 * ハードコードを避け、全サービスからここを参照する
 */
export const COLLECTIONS = {
  FOREIGNERS: 'foreigners',
  RENEWAL_APPLICATIONS: 'renewal_applications',
  CHANGE_OF_STATUS_APPLICATIONS: 'change_of_status_applications',
  COE_APPLICATIONS: 'coe_applications',
  BRANCHES: 'branches',
  USERS: 'users',
  COMPANY_MASTERS: 'company_masters',
  UNION_MASTERS: 'union_masters',
} as const;

/**
 * 更新申請書のステータス定数
 */
export const APPLICATION_STATUS = {
  DRAFT:     'draft',          // 作成中
  READY:     'ready',          // 作成完了
  SUBMITTED: 'submitted',      // 申請済
} as const;


export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];
