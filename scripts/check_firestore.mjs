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
  console.log('\n========== renewal_applications コレクション ==========\n');
  const renewalSnap = await db.collection('renewal_applications').get();
  
  if (renewalSnap.empty) {
    console.log('● ドキュメントなし');
  } else {
    renewalSnap.docs.forEach(doc => {
      const data = doc.data();
      const fmtVal = (v) => v === null ? 'null' : v === undefined ? '(undefined)' : 'あり';
      console.log(`▼ ID: ${doc.id}`);
      console.log(`  status     : ${data.status}`);
      console.log(`  foreignerId: ${data.foreignerId ?? '(なし)'}`);
      console.log(`  createdAt  : ${data.createdAt}`);
      console.log(`  updatedAt  : ${data.updatedAt}`);
      console.log(`  formData   : ${fmtVal(data.formData)}`);
      if (data.formData) {
        const att = data.formData.attachments;
        if (att && Object.keys(att).length > 0) {
          Object.entries(att).forEach(([key, val]) => {
            const arr = Array.isArray(val) ? val : [];
            console.log(`  formData.attachments.${key}: ${arr.length}件 -- ${JSON.stringify(arr).substring(0, 100)}`);
          });
        } else {
          console.log(`  formData.attachments: (なし/空)`);
        }
      }
      const rootAtt = data.attachments;
      if (rootAtt && Object.keys(rootAtt).length > 0) {
        Object.entries(rootAtt).forEach(([key, val]) => {
          const arr = Array.isArray(val) ? val : [];
          console.log(`  attachments(root).${key}: ${arr.length}件 -- ${JSON.stringify(arr).substring(0, 100)}`);
        });
      } else {
        console.log(`  attachments(root): (なし/空)`);
      }
      console.log('');
    });
  }

  console.log('\n========== foreigners コレクション ==========\n');
  const foreignerSnap = await db.collection('foreigners').get();
  
  if (foreignerSnap.empty) {
    console.log('● ドキュメントなし');
  } else {
    foreignerSnap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`▼ ID: ${doc.id}`);
      console.log(`  name               : ${data.name ?? data.nameKanji ?? '(名前なし)'}`);
      console.log(`  residenceCardNumber: ${data.residenceCardNumber ?? '(なし)'}`);
      console.log(`  branchId           : ${data.branchId ?? '(なし)'}`);
      console.log(`  company            : ${data.company ?? '(なし)'}`);
      console.log(`  visaType           : ${data.visaType ?? '(なし)'}`);
      console.log('');
    });
  }
}

main().catch(console.error);
