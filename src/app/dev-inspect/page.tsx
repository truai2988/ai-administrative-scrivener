import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';

export default async function InspectDB() {
  const draftsRef = collection(db, 'renewal_drafts');
  const snap = await getDocs(draftsRef);
  let output = '';

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    output += `--- Document: ${docSnap.id} ---\n`;
    output += `Assignments: ${JSON.stringify(data.formData?.assignments, null, 2)}\n\n`;
    
    // If the document has assignments, we should clear it if it has empty strings
    // But for now, just log it. We want to see what is stored!
  }

  return (
    <pre style={{ padding: 20 }}>
      {output || 'No documents found.'}
    </pre>
  );
}
