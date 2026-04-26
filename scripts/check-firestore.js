const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('coe_applications').orderBy('updatedAt', 'desc').limit(5).get();
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`ForeignerID: ${data.foreignerId}`);
    console.log(`Status: ${data.status}`);
    console.log(`Has aiDiagnostics:`, !!data.aiDiagnostics);
    if (data.aiDiagnostics) {
      console.log(`Diagnostics count: ${data.aiDiagnostics.diagnostics?.length}`);
    }
    console.log('---');
  });
}

check().catch(console.error);
