import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.substring(0, eqIdx).trim();
  let val = trimmed.substring(eqIdx + 1).trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  env[key] = val.replace(/\\n/g, '\n');
}
initializeApp({
  credential: cert({
    projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
  }),
});
const db = getFirestore();

async function main() {
  // ① XIE YIBING の editing ドキュメントに foreignerId を設定
  console.log('1. renewal_draft_MNMVDX8F に foreignerId を設定中...');
  await db.collection('renewal_applications').doc('renewal_draft_MNMVDX8F').update({
    foreignerId: 'foreigner_MNMVEJVP',
    updatedAt: new Date().toISOString(),
  });
  console.log('   -> 完了: foreignerId = foreigner_MNMVEJVP');

  // ② foreignerIdがある空ドラフトを全削除
  const emptyDrafts = [
    'renewal_draft_MNMVIOTX',
    'renewal_draft_MNMVIOTZ',
    'renewal_draft_MNMV3LKD',
    'renewal_draft_MNMV3LKJ',
  ];
  console.log('\n2. 空ドラフトを削除中...');
  for (const id of emptyDrafts) {
    try {
      const doc = await db.collection('renewal_applications').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        if (!data.formData) {
          await db.collection('renewal_applications').doc(id).delete();
          console.log('   -> 削除完了:', id);
        } else {
          console.log('   -> スキップ（formDataあり）:', id);
        }
      } else {
        console.log('   -> 存在しない（スキップ）:', id);
      }
    } catch (e) {
      console.log('   -> エラー:', id, e.message);
    }
  }

  // ③ 最終確認
  console.log('\n=== 修正後の renewal_applications ===\n');
  const snap = await db.collection('renewal_applications').get();
  snap.docs.forEach(doc => {
    const d = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  status: ${d.status} | foreignerId: ${d.foreignerId ?? 'undefined'}`);
    console.log(`  formData: ${d.formData === null ? 'null' : d.formData ? 'あり' : '(undefined)'}`);
    const rootFiles = d.attachments?.foreignerInfo?.length ?? 0;
    const fdFiles = d.formData?.attachments?.foreignerInfo?.length ?? 0;
    console.log(`  ファイル数 root.foreignerInfo: ${rootFiles}件 / formData.foreignerInfo: ${fdFiles}件`);
    console.log('');
  });
}

main().catch(console.error);
