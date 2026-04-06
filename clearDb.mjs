import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});

const db = getFirestore();

async function clearData() {
  const col = db.collection('renewal_applications');
  const snap = await col.get();
  
  if (snap.empty) {
    console.log('No documents found in renewal_applications.');
    return;
  }
  
  const batch = db.batch();
  let count = 0;
  
  snap.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });
  
  await batch.commit();
  console.log(`Successfully deleted ${count} documents from renewal_applications.`);
}

clearData().catch(console.error);
