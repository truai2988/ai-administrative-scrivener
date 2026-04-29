/**
 * assignmentTemplates.ts
 *
 * 申請種別ごとのデフォルト担当者割り当てテンプレートを定義する定数ファイル。
 *
 * 現在はコード定数として管理しているが、将来的には
 * Firestore の `assignment_templates` コレクションに移行可能な設計にする。
 *
 * テンプレートは「ロール名」で担当を指定し、
 * resolveTemplate() で実際のユーザーIDに解決する。
 */

import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { TEST_USERS, type TestUser } from '@/lib/constants/testUsers';

/**
 * 汎用タブID型。
 * 申請種別ごとにタブ構成が異なるため、固定の union ではなく string で管理する。
 */
export type GenericTabId = string;
export type GenericTabAssignments = Record<string, string>;

// ─── 申請種別の型 ─────────────────────────────────────────────────────────────

/** 将来の拡張を見越した申請種別 */
export type ApplicationKind = 'renewal' | 'change' | 'certification';

/** 各タブに割り当てるデフォルトのロール（null = 行政書士のみ） */
export type DefaultAssignmentRole = 'branch_staff' | 'enterprise_staff' | null;

export interface TabAssignmentTemplate {
  /** 申請種別の日本語ラベル */
  description: string;
  /** タブごとのデフォルト担当ロール（キーは申請種別ごとのタブID） */
  roles: Record<string, DefaultAssignmentRole>;
}

// ─── デフォルトテンプレート定義 ──────────────────────────────────────────────

export const DEFAULT_ASSIGNMENT_TEMPLATES: Record<ApplicationKind, TabAssignmentTemplate> = {
  /** 在留期間更新許可申請 */
  renewal: {
    description: '在留期間更新許可申請',
    roles: {
      foreigner:    null,   // 外国人本人情報 → 行政書士のみ
      employer:     null,   // 所属機関情報 → 行政書士のみ
      simultaneous: null,   // 同時申請 → 行政書士のみ
    },
  },

  /** 在留資格変更許可申請 */
  change: {
    description: '在留資格変更許可申請',
    roles: {
      foreigner:    null,   // 外国人本人情報 → 行政書士のみ
      employer:     null,   // 所属機関情報 → 行政書士のみ
      simultaneous: null,   // 同時申請 → 行政書士のみ
    },
  },

  /** 在留資格認定証明書交付申請 */
  certification: {
    description: '在留資格認定証明書交付申請',
    roles: {
      identity:       null,   // 身分事項 → 行政書士のみ
      applicant:      null,   // 申請人情報 → 行政書士のみ
      employer:       null,   // 所属機関等 → 行政書士のみ
      representative: null,   // 代理人・取次者 → 行政書士のみ
      metadata:       null,   // 申請メタデータ → 行政書士のみ
    },
  },
};

// ─── テンプレート解決関数 ──────────────────────────────────────────────────────

/**
 * テンプレートのロール名を実際のユーザーIDに解決する。
 *
 * 現フェーズ: TEST_USERS（ダミーユーザー）から最初に一致するロールのIDを使用。
 * 将来フェーズ: users引数を Firestore の実ユーザー一覧に差し替えるだけで移行可能。
 *
 * @param kind - 申請種別
 * @param users - 解決に使うユーザーリスト（現在はTEST_USERS）
 * @returns タブIDをキー、ユーザーIDを値とする割り当てマップ
 */
export function resolveTemplate(
  kind: ApplicationKind,
  users: TestUser[] = TEST_USERS,
  templatesRecord: Record<ApplicationKind, TabAssignmentTemplate> = DEFAULT_ASSIGNMENT_TEMPLATES
): GenericTabAssignments {
  const template = templatesRecord[kind];
  const result: GenericTabAssignments = {};

  for (const [tabId, role] of Object.entries(template.roles) as [string, DefaultAssignmentRole][]) {
    if (role === null) {
      // null = 行政書士のみ（割り当てなし）
      continue;
    }
    // ロール名から最初に一致するユーザーを選択
    const matched = users.find((u) => u.role === role);
    if (matched) {
      result[tabId] = matched.id;
    }
  }

  return result;
}

/**
 * 与えられた assignments がデフォルトテンプレートと完全一致するか確認。
 * TabAssignmentPanel での「自動設定」バッジ表示判定に使用。
 */
export function isTemplateDefault(
  kind: ApplicationKind,
  assignments: GenericTabAssignments,
  users: TestUser[] = TEST_USERS,
  templatesRecord: Record<ApplicationKind, TabAssignmentTemplate> = DEFAULT_ASSIGNMENT_TEMPLATES
): boolean {
  const templateAssignments = resolveTemplate(kind, users, templatesRecord);
  // テンプレートの roles キーから動的にタブIDリストを取得
  const tabIds = Object.keys(templatesRecord[kind].roles);

  return tabIds.every((tabId) => {
    return (assignments[tabId] || '') === (templateAssignments[tabId] || '');
  });
}

// ─── Firestore連携 ───────────────────────────────────────────────────────────

export const SETTINGS_DOC_PATH = 'system_settings/assignment_templates';

/**
 * Firestoreからテンプレート設定を取得する。
 * 存在しない場合はデフォルト設定を返す。
 *
 * ■ マージ戦略:
 *   コード上の DEFAULT_ASSIGNMENT_TEMPLATES の roles キー構成を「正」とし、
 *   Firestore に保存された値を上書きマージする。
 *   これにより、コード側でタブ構成を変更した場合にも
 *   Firestore の古いデータで上書きされることを防ぐ。
 */
export async function getAssignmentTemplates(): Promise<Record<ApplicationKind, TabAssignmentTemplate>> {
  try {
    const docRef = doc(db, SETTINGS_DOC_PATH);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return DEFAULT_ASSIGNMENT_TEMPLATES;
    }

    const stored = snap.data() as Record<string, TabAssignmentTemplate>;
    const merged = { ...DEFAULT_ASSIGNMENT_TEMPLATES };

    for (const kind of Object.keys(DEFAULT_ASSIGNMENT_TEMPLATES) as ApplicationKind[]) {
      if (!stored[kind]) continue;

      // description はFirestoreの値を尊重（カスタマイズ可能に）
      merged[kind] = {
        ...DEFAULT_ASSIGNMENT_TEMPLATES[kind],
        description: stored[kind].description || DEFAULT_ASSIGNMENT_TEMPLATES[kind].description,
        roles: { ...DEFAULT_ASSIGNMENT_TEMPLATES[kind].roles },
      };

      // Firestoreの roles のうち、コードのデフォルトに存在するキーだけを上書き
      if (stored[kind].roles) {
        for (const tabId of Object.keys(DEFAULT_ASSIGNMENT_TEMPLATES[kind].roles)) {
          if (tabId in stored[kind].roles) {
            merged[kind].roles[tabId] = stored[kind].roles[tabId];
          }
        }
      }
    }

    return merged;
  } catch (error) {
    console.error('Failed to get assignment templates:', error);
    return DEFAULT_ASSIGNMENT_TEMPLATES;
  }
}

/**
 * Firestoreにテンプレート設定を保存する
 */
export async function saveAssignmentTemplates(templates: Record<ApplicationKind, TabAssignmentTemplate>): Promise<void> {
  const docRef = doc(db, SETTINGS_DOC_PATH);
  await setDoc(docRef, templates, { merge: true });
}
