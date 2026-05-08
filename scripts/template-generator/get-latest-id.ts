import { getAdminDb } from '../../src/lib/firebase/admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const db = getAdminDb();
  const snap = await db.collection('document_templates')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snap.empty) {
    console.log('NO_TEMPLATES');
    return;
  }

  const doc = snap.docs[0];
  console.log(`LATEST_ID:${doc.id}`);
}

main().catch(console.error);
