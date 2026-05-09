import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// Try replacing actual newlines with actual newlines or escaped
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (privateKey) {
  // If it has literal slash-n, replace it
  privateKey = privateKey.replace(/\\n/g, '\n');
}

console.log('Project:', projectId);
console.log('Email:', clientEmail);
console.log('Key length:', privateKey?.length);

try {
  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
  
  const db = getFirestore(app);
  db.collection('document_templates').limit(1).get().then(() => {
    console.log('Firestore connected successfully!');
    process.exit(0);
  }).catch(err => {
    console.error('Firestore get error:', err);
    process.exit(1);
  });
} catch (e) {
  console.error('Init error:', e);
}
