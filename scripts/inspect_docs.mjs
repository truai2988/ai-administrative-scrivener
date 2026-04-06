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
  // ① editing ドキュメントの全内容を確認
  console.log('\n=== renewal_draft_MNMVDX8F の全内容 ===\n');
  const editDoc = await db.collection('renewal_applications').doc('renewal_draft_MNMVDX8F').get();
  if (editDoc.exists) {
    const d = editDoc.data();
    console.log('status:', d.status);
    console.log('foreignerId:', d.foreignerId);
    console.log('createdAt:', d.createdAt);
    console.log('updatedAt:', d.updatedAt);
    if (d.formData) {
      const fi = d.formData.foreignerInfo;
      if (fi) {
        console.log('formData.foreignerInfo.nameEn:', fi.nameEn);
        console.log('formData.foreignerInfo.nameKanji:', fi.nameKanji);
        console.log('formData.foreignerInfo.residenceCardNumber:', fi.residenceCardNumber);
        console.log('formData.foreignerInfo.nationality:', fi.nationality);
      }
    }
    if (d.attachments?.foreignerInfo) {
      console.log('\nattachments(root).foreignerInfo:');
      d.attachments.foreignerInfo.forEach(f => {
        console.log(`  - ${f.name} (${f.mimeType}) uploadedAt: ${f.uploadedAt}`);
      });
    }
    if (d.formData?.attachments?.foreignerInfo) {
      console.log('\nformData.attachments.foreignerInfo:');
      d.formData.attachments.foreignerInfo.forEach(f => {
        console.log(`  - ${f.name} (${f.mimeType}) uploadedAt: ${f.uploadedAt}`);
      });
    }
  } else {
    console.log('ドキュメントが存在しません');
  }

  // ② foreignerドキュメントの確認
  console.log('\n=== foreigners コレクション全件 ===\n');
  const foreignerSnap = await db.collection('foreigners').get();
  foreignerSnap.docs.forEach(doc => {
    const d = doc.data();
    console.log(`▼ ${doc.id}`);
    console.log('  nameEn:', d.nameEn, '/ nameKanji:', d.nameKanji ?? d.name);
    console.log('  residenceCardNumber:', d.residenceCardNumber);
    console.log('  branchId:', d.branchId);
  });

  // ③ 空ドラフト一覧
  console.log('\n=== foreignerIdあり の空ドラフト一覧 ===\n');
  const allSnap = await db.collection('renewal_applications').get();
  allSnap.docs.forEach(doc => {
    const d = doc.data();
    if (!d.formData) {
      console.log(`▼ ${doc.id} | foreignerId: ${d.foreignerId ?? 'undefined'} | status: ${d.status}`);
    }
  });
}

main().catch(console.error);
