import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

async function clearForeignerDraftStatus() {
  const col = db.collection('foreigners');
  const snap = await col.get();
  
  const batch = db.batch();
  let count = 0;
  
  snap.forEach(doc => {
    const data = doc.data();
    if (data.current_application_id || data.current_status || data.status === '編集中' || data.approvalStatus) {
      batch.update(doc.ref, {
        current_application_id: FieldValue.delete(),
        current_status: FieldValue.delete(),
        status: '準備中', // Reset to default ForeignerStatus
        approvalStatus: FieldValue.delete()
      });
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`Reset status fields for ${count} foreigners.`);
  } else {
    console.log('No foreigners needed resetting.');
  }
}

clearForeignerDraftStatus().catch(console.error);
