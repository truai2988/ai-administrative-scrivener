'use client';

import { db } from '@/lib/firebase/client';
import { collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';
import { useState } from 'react';

export default function MigrationPage2() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const runMigration = async () => {
    setRunning(true);
    setLogs(['Migration started...']);

    try {
      const draftsRef = collection(db, 'renewal_drafts');
      const snap = await getDocs(draftsRef);

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.formData?.assignments) {
          const assigns = data.formData.assignments;
          let needsUpdate = false;
          const updates: Record<string, unknown> = {};

          if (assigns.foreigner === '') {
            updates['formData.assignments.foreigner'] = deleteField();
            needsUpdate = true;
          }
          if (assigns.employer === '') {
            updates['formData.assignments.employer'] = deleteField();
            needsUpdate = true;
          }
          if (assigns.simultaneous === '') {
            updates['formData.assignments.simultaneous'] = deleteField();
            needsUpdate = true;
          }

          if (needsUpdate) {
            await updateDoc(doc(db, 'renewal_drafts', docSnap.id), updates);
            setLogs((prev) => [...prev, `Updated ${docSnap.id}: cleared empty assignment strings.`]);
          } else {
             setLogs((prev) => [...prev, `Skipped ${docSnap.id}: no empty strings.`]);
          }
        }
      }
      setLogs((prev) => [...prev, 'Migration complete.']);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setLogs((prev) => [...prev, `Error: ${e.message}`]);
      } else {
        setLogs((prev) => [...prev, `Unknown Error`]);
      }
    }

    setRunning(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Migration 2: Clear Empty String Assignments</h1>
      <button onClick={runMigration} disabled={running} style={{ padding: '10px', background: 'blue', color: 'white', borderRadius: '4px' }}>
        {running ? 'Running...' : 'Run Migration 2'}
      </button>

      <pre style={{ marginTop: '20px', background: '#f4f4f4', padding: '10px' }}>
        {logs.join('\n')}
      </pre>
    </div>
  );
}
