/**
 * runSeed - dotenvで環境変数を先に読み込んでから動的インポートする方式
 * TSX の hoisting 問題を回避するため、全ての firebase 処理を動的インポートの後で実行
 *
 * 移行済み: Firebase Client SDK -> Firebase Admin SDK (セキュリティルール回避のため)
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 最初に環境変数を読み込む
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const DEFAULT_BRANCH_ID = 'hq_direct';

const TEST_ORGANIZATIONS = [
  { id: DEFAULT_BRANCH_ID, name: '東京本部', type: 'hq', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'org_tokyo', name: '東京直轄', type: 'branch', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'org_osaka', name: '大阪支部', type: 'branch', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const TEST_USERS = [
  {
    id: "FgCQXHsSnqP1b2ChQZ8e3Hop8xV2",
    email: "hq@example.com",
    displayName: "東京本部",
    role: "hq_admin",
    organizationId: DEFAULT_BRANCH_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "dYHh8ntHwmYZuPWwWDma0iv8xhY2",
    email: "scrivener@example.com",
    displayName: "管理行政書士",
    role: "scrivener",
    organizationId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "NDR774TudjOC0L4JGNZIrbHoSP82",
    email: "osaka@example.com",
    displayName: "大阪支部 担当者",
    role: "branch_staff",
    organizationId: "org_osaka",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function main() {
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Admin SDKの環境変数が未設定です。.env.local を確認してください。');
    process.exit(1);
  }

  // 秘密鍵の改行エスケープを戻す
  privateKey = privateKey.replace(/\\n/g, '\n');

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  const db = getFirestore();

  console.log('==============================================');
  console.log('  Seeding RBAC users and organizations via Admin SDK');
  console.log(`  Project: ${projectId}`);
  console.log('==============================================\n');

  for (const org of TEST_ORGANIZATIONS) {
    await db.collection("organizations").doc(org.id).set(org);
    console.log(`✓ 組織: ${org.name} (${org.type})`);
  }

  for (const user of TEST_USERS) {
    await db.collection("users").doc(user.id).set(user);
    console.log(`✓ ユーザー: ${user.email} (${user.role})`);
  }

  console.log('\n✅ 完了: ユーザーと組織のデータが Admin SDK 経由で投入されました。');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ エラー:', err);
  process.exit(1);
});
