import { getAdminDb } from '../../src/lib/firebase/admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const db = getAdminDb();
  const snap = await db.collection('document_templates')
    .orderBy('createdAt', 'desc')
    .get();

  if (snap.empty) {
    console.log('NO_TEMPLATES');
    return;
  }

  snap.docs.forEach(doc => {
    console.log(doc.id, '=>', doc.data().formName);
  });
}

main().catch(console.error);
