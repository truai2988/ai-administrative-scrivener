import { getAdminDb } from "./src/lib/firebase/admin";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const db = getAdminDb();
  const users = await db.collection("users").get();
  console.log(`Users count: ${users.size}`);
  users.forEach(u => console.log(u.data()));

  const orgs = await db.collection("organizations").get();
  console.log(`Orgs count: ${orgs.size}`);
  orgs.forEach(o => console.log(o.data()));
}

main().catch(console.error);
