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

if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
    }),
  });
}

const db = getFirestore();

async function backfill() {
  const foreignersSnap = await db.collection('foreigners').get();
  let count = 0;

  for (const fDoc of foreignersSnap.docs) {
    const defaultVisa = fDoc.data().visaType;
    const defaultCompany = fDoc.data().company;

    // 最新の更新申請書を探す
    const renewalsSnap = await db.collection('renewal_applications')
      .where('foreignerId', '==', fDoc.id)
      .get();
    
    if (renewalsSnap.empty) continue;

    // 最も新しい（formDataがある）申請書を取得
    const validDocs = renewalsSnap.docs
      .map(d => ({id: d.id, ...d.data()}))
      .filter(d => Boolean(d.formData))
      .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (validDocs.length === 0) continue;

    const latest = validDocs[0];
    const newVisa = latest.formData?.foreignerInfo?.currentResidenceStatus || '';
    const newCompany = latest.formData?.employerInfo?.companyNameJa || '';

    // マスターに書き戻す
    if (!defaultVisa || !defaultCompany || defaultVisa !== newVisa || defaultCompany !== newCompany) {
      console.log(`Updating ${fDoc.id} (${fDoc.data().name})...`);
      console.log(`  visaType: ${defaultVisa} -> ${newVisa}`);
      console.log(`  company: ${defaultCompany} -> ${newCompany}`);
      await db.collection('foreigners').doc(fDoc.id).update({
        visaType: newVisa,
        company: newCompany,
        jobTitle: latest.formData?.employerInfo?.mainJobType || fDoc.data().jobTitle || ''
      });
      count++;
    }
  }

  console.log(`Done. Updated ${count} records.`);
}

backfill().catch(console.error);
