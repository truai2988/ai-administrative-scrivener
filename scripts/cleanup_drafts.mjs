import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// .env.local を手動パース
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
  console.log('\n全 renewal_applications を取得中...\n');
  const snap = await db.collection('renewal_applications').get();
  
  // foreignerId ごとにグルーピング
  const byForeigner = {};
  snap.docs.forEach(doc => {
    const data = doc.data();
    const fid = data.foreignerId ?? '(no-foreignerId)';
    if (!byForeigner[fid]) byForeigner[fid] = [];
    byForeigner[fid].push({ id: doc.id, ...data });
  });

  for (const [fid, docs] of Object.entries(byForeigner)) {
    console.log(`\n=== foreignerId: ${fid} (${docs.length}件) ===`);
    
    // formData あり/なしで分類
    const withData = docs.filter(d => d.formData !== null && d.formData !== undefined);
    const empty    = docs.filter(d => d.formData === null || d.formData === undefined);
    
    console.log(`  formDataあり: ${withData.length}件`);
    withData.forEach(d => console.log(`    → ${d.id} (${d.status}) updatedAt: ${d.updatedAt}`));
    
    console.log(`  formDataなし(draft): ${empty.length}件`);
    empty.forEach(d => console.log(`    → ${d.id} (${d.status}) updatedAt: ${d.updatedAt}`));

    // 削除対象: formData が null かつ editing/formDataありが存在する場合
    if (withData.length > 0 && empty.length > 0) {
      console.log(`\n  ⚠️  空ドラフト ${empty.length}件 を削除します...`);
      for (const d of empty) {
        await db.collection('renewal_applications').doc(d.id).delete();
        console.log(`  ✅ 削除完了: ${d.id}`);
      }
    }
    
    // formDataあり かつ複数ある場合は最新を保持して他を削除
    if (withData.length > 1) {
      withData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const toDelete = withData.slice(1);
      console.log(`\n  ⚠️  重複formData ${toDelete.length}件（古い方）を削除します...`);
      for (const d of toDelete) {
        await db.collection('renewal_applications').doc(d.id).delete();
        console.log(`  ✅ 削除完了: ${d.id}`);
      }
    }
  }
  
  console.log('\n=== 完了後の状態 ===\n');
  const afterSnap = await db.collection('renewal_applications').get();
  afterSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`▼ ${doc.id}`);
    console.log(`  status: ${data.status}, foreignerId: ${data.foreignerId}`);
    console.log(`  formData: ${data.formData === null ? 'null' : data.formData ? 'あり' : '(undefined)'}`);
    if (data.attachments) {
      Object.entries(data.attachments).forEach(([k, v]) => {
        console.log(`  attachments(root).${k}: ${Array.isArray(v) ? v.length : 0}件`);
      });
    }
    if (data.formData?.attachments) {
      Object.entries(data.formData.attachments).forEach(([k, v]) => {
        console.log(`  formData.attachments.${k}: ${Array.isArray(v) ? v.length : 0}件`);
      });
    }
  });
}

main().catch(console.error);
