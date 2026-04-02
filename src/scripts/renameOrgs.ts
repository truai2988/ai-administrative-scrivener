import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Admin SDK environment variables not set.');
    process.exit(1);
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  const db = getFirestore();

  console.log('Renaming orgs...');

  try {
    const hqRef = db.collection('organizations').doc('hq_direct');
    await hqRef.update({ name: '東京本部' });
    console.log('Updated hq_direct to 東京本部');

    const tokyoRef = db.collection('organizations').doc('org_tokyo');
    await tokyoRef.update({ name: '東京直轄' });
    console.log('Updated org_tokyo to 東京直轄');

    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
}

main().catch(console.error);
