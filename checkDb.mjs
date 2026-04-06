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

async function run() {
  const col = db.collection('renewal_applications');
  const snap = await col.orderBy('updatedAt', 'desc').limit(10).get();
  console.log(`Found ${snap.size} recent applications`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`\nDoc ID: ${doc.id}`);
    console.log(`foreignerId: ${data.foreignerId}`);
    console.log(`updatedAt: ${data.updatedAt}`);
    console.log(`status: ${data.status}`);
    console.log(`has formData: ${!!data.formData}`);
    if (data.formData) {
       console.log(`formData keys: ${Object.keys(data.formData).join(', ')}`);
       console.log(`attachments:`, JSON.stringify(data.formData.attachments, null, 2));
    }
  });
}
run().catch(console.error);
