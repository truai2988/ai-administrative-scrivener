import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { User, Branch, DEFAULT_BRANCH_ID } from "../types/database";

/**
 * RBAC検証用の初期データ（ユーザーと支部）をFirestoreに投入するスクリプト
 * 注意: Firebase Authのユーザー登録は事前に行われている必要があります（スクリプト内のメールアドレスと一致させること）
 */

// テスト用支部データ
const TEST_BRANCHES: Branch[] = [
  {
    id: DEFAULT_BRANCH_ID,
    name: "本部直轄",
    createdAt: new Date().toISOString(),
  },
  {
    id: "branch_tokyo",
    name: "東京支部",
    createdAt: new Date().toISOString(),
  },
  {
    id: "branch_osaka",
    name: "大阪支部",
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "dYHh8ntHwmYZuPWwWDma0iv8xhY2", // 変更必須
    email: "scrivener@example.com",
    displayName: "行政書士 太郎",
    role: "scrivener",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "NDR774TudjOC0L4JGNZIrbHoSP82", // 変更必須
    email: "osaka@example.com",
    displayName: "大阪支部 担当者",
    role: "branch_staff",
    branchId: "branch_osaka",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export async function seedRbacData(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Starting RBAC data seeding...");

    // 支部の登録
    for (const branch of TEST_BRANCHES) {
      await setDoc(doc(db, "branches", branch.id), branch);
      console.log(`Seeded branch: ${branch.name}`);
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
