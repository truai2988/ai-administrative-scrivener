import { db } from './src/lib/firebase/client';
import { collection, getDocs, query, limit } from 'firebase/firestore';

async function main() {
  console.log("Fetching latest renewal applications...");
  const colRef = collection(db, 'renewal_applications');
  // Just get the 5 most recently created/updated docs
  const q = query(colRef, limit(5));
  const snap = await getDocs(q);
  
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`\n--- DOC ID: ${doc.id} ---`);
    console.log(`Status: ${data.status}`);
    console.log(`Assignments:`, JSON.stringify(data.formData?.assignments, null, 2));
  });
  console.log("Done.");
}

main().catch(console.error);
