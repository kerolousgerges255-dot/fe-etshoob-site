// نسخة احتياطية من كل بيانات الموقع في ملف واحد:  npm run backup
// بتتحفظ في فولدر backups/ (مش بيترفع على GitHub). للقراءة بس، مش بتغيّر أي حاجة في Firebase.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("../serviceAccount.json", import.meta.url)))) });
const db = getFirestore();
const COLLECTIONS = ["users", "courses", "lectures", "announcements", "meditations", "homework"];

const out = { exportedAt: new Date().toISOString(), collections: {} };
for (const name of COLLECTIONS) {
  const snap = await db.collection(name).get();
  out.collections[name] = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
  console.log(`${name}: ${snap.size}`);
}
const dir = new URL("../backups/", import.meta.url);
mkdirSync(dir, { recursive: true });
const file = new URL(`backup-${out.exportedAt.slice(0, 10)}.json`, dir);
writeFileSync(file, JSON.stringify(out, null, 2));
console.log("اتحفظت النسخة في:", file.pathname);
