import { getAdminAuth, getAdminDb } from "./src/lib/firebase/admin";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const auth = getAdminAuth();
  const db = getAdminDb();
  
  try {
    const userRecord = await auth.getUserByEmail("osaka@example.com");
    console.log(`[Auth] osaka@example.com UID: ${userRecord.uid}`);
    
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    if (userDoc.exists) {
      console.log(`[Firestore] Document EXISTS for UID ${userRecord.uid}`);
      console.log(userDoc.data());
    } else {
      console.log(`[Firestore] Document does NOT exist for UID ${userRecord.uid}!`);
      
      // Let's check if there is another document for osaka@example.com
      const byEmail = await db.collection("users").where("email", "==", "osaka@example.com").get();
      if (!byEmail.empty) {
        console.log(`BUT found documents with email osaka@example.com under different IDs:`);
        byEmail.forEach(d => console.log(d.id, d.data()));
      }
    }
  } catch (err) {
    console.log(`Auth user not found or error: `, err);
  }
}

main().catch(console.error);
