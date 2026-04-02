import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { User, Organization, DEFAULT_BRANCH_ID } from "../types/database";

/**
 * RBAC検証用の初期データ（ユーザーと組織）をFirestoreに投入するスクリプト
 *
 * ⚠️ 注意: このスクリプトは旧来の Branch 型から新しい Organization 型に移行済みです。
 * Firebase Authのユーザー登録は事前に行われている必要があります。
 * スクリプト内のUIDを実際のAuth UIDに書き換えてから実行してください。
 */

// テスト用組織データ（旧branchesコレクション → organizations コレクションに移行）
const TEST_ORGANIZATIONS: Organization[] = [
  {
    id: DEFAULT_BRANCH_ID,
    name: "本部直轄",
    type: "hq",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "org_tokyo",
    name: "東京支部",
    type: "branch",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "org_osaka",
    name: "大阪支部",
    type: "branch",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// テスト用ユーザーデータ（Auth連携用のUIDはダミー。実際はAuthのUIDに書き換える必要あり）
// TODO: Firebase ConsoleのAuth画面で作成したユーザーのUIDに `id` を変更してください
const TEST_USERS: User[] = [
  {
    id: "FgCQXHsSnqP1b2ChQZ8e3Hop8xV2", // 変更必須
    email: "hq@example.com",
    displayName: "本部 管理者",
    role: "hq_admin",
    organizationId: DEFAULT_BRANCH_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "dYHh8ntHwmYZuPWwWDma0iv8xhY2", // 変更必須
    email: "scrivener@example.com",
    displayName: "行政書士 太郎",
    role: "scrivener",
    organizationId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "NDR774TudjOC0L4JGNZIrbHoSP82", // 変更必須
    email: "osaka@example.com",
    displayName: "大阪支部 担当者",
    role: "branch_staff",
    organizationId: "org_osaka",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export async function seedRbacData(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Starting RBAC data seeding...");

    // 組織の登録（organizations コレクション）
    for (const org of TEST_ORGANIZATIONS) {
      await setDoc(doc(db, "organizations", org.id), org);
      console.log(`Seeded organization: ${org.name} (${org.type})`);
    }

    // ユーザーの登録
    for (const user of TEST_USERS) {
      await setDoc(doc(db, "users", user.id), user);
      console.log(`Seeded user: ${user.email} (${user.role})`);
    }

    console.log("RBAC data seeding completed successfully.");
    return { success: true };
  } catch (error) {
    console.error("RBAC data seeding failed:", error);
    return { success: false, error: String(error) };
  }
}
