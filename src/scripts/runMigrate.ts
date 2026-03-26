/**
 * runMigrate - 既存Foreignerデータに branchId: 'hq_direct' を付与
 * 動的インポートでdotenv読み込み後にFirebaseを初期化（ESM hoisting問題を回避）
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const DEFAULT_BRANCH_ID = 'hq_direct';
const BATCH_SIZE = 500;

async function main() {
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const { initializeFirestore, collection, getDocs, doc, writeBatch } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.projectId) {
    console.error('❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID が未設定です。');
    process.exit(1);
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = initializeFirestore(app, { experimentalForceLongPolling: true });

  console.log('==============================================');
  console.log('  Migrating Foreigners to hq_direct');
  console.log(`  Project: ${firebaseConfig.projectId}`);
  console.log('==============================================\n');

  const snapshot = await getDocs(collection(db, 'foreigners'));
  let migratedCount = 0;
  let batch = writeBatch(db);
  let currentBatchSize = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    if (!data.branchId) {
      batch.update(doc(db, 'foreigners', document.id), {
        branchId: DEFAULT_BRANCH_ID,
        updatedAt: new Date().toISOString(),
      });
      migratedCount++;
      currentBatchSize++;

      if (currentBatchSize >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  ${currentBatchSize} 件をコミット`);
        batch = writeBatch(db);
        currentBatchSize = 0;
      }
    }
  }

  if (currentBatchSize > 0) {
    await batch.commit();
  }

  console.log(`\n✅ 完了: ${migratedCount} 件のデータに branchId: '${DEFAULT_BRANCH_ID}' を付与しました。`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ エラー:', err);
  process.exit(1);
});
