import { getAdminDb } from '../src/lib/firebase/admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function migrate() {
  console.log("Starting migration...");
  const db = getAdminDb();
  
  const foreignersRef = db.collection('foreigners');
  const foreignersSnapshot = await foreignersRef.get();
  let count = 0;

  const batch = db.batch();

  foreignersSnapshot.forEach(doc => {
    const data = doc.data();
    let updated = false;
    const updates: any = {};

    if (data.unionId === 'scrivener_direct' || data.unionId === 'direct' || data.unionId === 'unassigned') {
      updates.unionId = null; // Use null since ignoreUndefinedProperties might not delete it via batch if undefined
      updated = true;
    }
    if (data.enterpriseId === 'scrivener_direct' || data.enterpriseId === 'direct' || data.enterpriseId === 'unassigned') {
      updates.enterpriseId = null;
      updated = true;
    }

    if (updated) {
      batch.update(doc.ref, updates);
      count++;
    }
  });

  const usersRef = db.collection('users');
  const usersSnapshot = await usersRef.get();
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    let updated = false;
    const updates: any = {};

    if (data.organizationId === 'scrivener_direct' || data.organizationId === 'direct' || data.organizationId === 'unassigned') {
      updates.organizationId = null;
      updated = true;
    }

    if (updated) {
      batch.update(doc.ref, updates);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Migrated ${count} records.`);
  } else {
    console.log("No records to migrate.");
  }
}

migrate().catch(console.error);
