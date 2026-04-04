/**
 * deleteDrafts
 * 「準備中」ステータスの外国人名簿を削除するスクリプト
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 最初に環境変数を読み込む
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

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
  console.log('  Deleting foreigners with status = 準備中');
  console.log(`  Project: ${projectId}`);
  console.log('==============================================\n');

  const snapshot = await db.collection("foreigners").where("status", "==", "準備中").get();
  
  if (snapshot.empty) {
    console.log('対象となるデータはありませんでした。');
    process.exit(0);
  }

  console.log(`${snapshot.size} 件のデータを削除します...`);

  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`削除中: ID=${doc.id}, Name=${data.name}`);
    await doc.ref.delete();
    
    // 関連する application もあれば削除する
    if (data.current_application_id) {
       console.log(` -> 関連する申請書も削除: ${data.current_application_id}`);
       await db.collection("renewal_applications").doc(data.current_application_id).delete();
    }
    
    count++;
  }

  console.log(`\n✅ 完了: ${count} 件のデータを削除しました。`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ エラー:', err);
  process.exit(1);
});
