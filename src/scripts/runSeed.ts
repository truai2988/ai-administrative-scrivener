/**
 * runSeed - dotenvで環境変数を先に読み込んでから動的インポートする方式
 * TSX の hoisting 問題を回避するため、全ての firebase 処理を動的インポートの後で実行
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 最初に環境変数を読み込む
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const DEFAULT_BRANCH_ID = 'hq_direct';

const TEST_BRANCHES = [
  { id: DEFAULT_BRANCH_ID, name: '本部直轄', createdAt: new Date().toISOString() },
  { id: 'branch_tokyo',    name: '東京支部', createdAt: new Date().toISOString() },
  { id: 'branch_osaka',    name: '大阪支部', createdAt: new Date().toISOString() },
];

const TEST_USERS = [
  {
    id: "FgCQXHsSnqP1b2ChQZ8e3Hop8xV2",
    email: "hq@example.com",
    displayName: "東京本部",
    role: "hq_admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "dYHh8ntHwmYZuPWwWDma0iv8xhY2",
    email: "scrivener@example.com",
    displayName: "管理行政書士",
    role: "scrivener",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "NDR774TudjOC0L4JGNZIrbHoSP82",
    email: "osaka@example.com",
    displayName: "大阪支部 担当者",
    role: "branch_staff",
    branchId: "branch_osaka",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function main() {
  // 動的インポートで Firebase を遅延ロード（dotenv.config() の後に評価される）
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const { initializeFirestore, doc, setDoc } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.projectId) {
    console.error('❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID が未設定です。.env.local を確認してください。');
    process.exit(1);
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = initializeFirestore(app, { experimentalForceLongPolling: true });

  console.log('==============================================');
  console.log('  Seeding RBAC users and branches to Firestore');
  console.log(`  Project: ${firebaseConfig.projectId}`);
  console.log('==============================================\n');

  for (const branch of TEST_BRANCHES) {
    await setDoc(doc(db, "branches", branch.id), branch);
    console.log(`✓ 支部: ${branch.name}`);
  }

  for (const user of TEST_USERS) {
    await setDoc(doc(db, "users", user.id), user);
    console.log(`✓ ユーザー: ${user.email} (${user.role})`);
  }

  console.log('\n✅ 完了: ユーザーと支部のデータが Firestore に投入されました。');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ エラー:', err);
  process.exit(1);
});
