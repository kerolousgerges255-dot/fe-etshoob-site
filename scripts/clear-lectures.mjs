// يمسح كل المحاضرات من قاعدة البيانات.
// تشغيل:  node scripts/clear-lectures.mjs

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("../serviceAccount.json", import.meta.url)))) });
const db = getFirestore();

const snapshots = await db.collection("lectures").get();
if (snapshots.empty) { console.log("مفيش محاضرات أصلاً."); process.exit(0); }

let deleted = 0;
for (const doc of snapshots.docs) {
  await db.doc(`lectures/${doc.id}`).delete();
  deleted++;
}

console.log(`تم حذف ${deleted} محاضرة.`);
