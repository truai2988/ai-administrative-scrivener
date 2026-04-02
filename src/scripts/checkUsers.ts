import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    process.exit(1);
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  const db = getFirestore();

  const orgsSnapshot = await db.collection('organizations').get();
  const orgsMap = new Map();
  orgsSnapshot.forEach(doc => {
    orgsMap.set(doc.id, doc.data().name);
  });

  const usersSnapshot = await db.collection('users').get();
  const users: Array<{ email: string; role: string; displayName: string; org: string }> = [];
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    users.push({
      email: data.email,
      role: data.role,
      displayName: data.displayName,
      org: data.organizationId ? orgsMap.get(data.organizationId) : 'なし'
    });
  });

  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error);
