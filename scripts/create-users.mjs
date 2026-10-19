// تشغيل:  node scripts/create-users.mjs          (ينشئ الجدد ويتخطى الموجود)
//         node scripts/create-users.mjs --reset  (يعيّن كلمات مرور جديدة للكل)
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const sa = JSON.parse(readFileSync(new URL("../serviceAccount.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const auth = getAuth(), db = getFirestore();
const users = JSON.parse(readFileSync(new URL("./users.json", import.meta.url)));
const reset = process.argv.includes("--reset");
const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const gen = () => Array.from(randomBytes(10), (b) => chars[b % chars.length]).join("");

const out = [["name", "username", "password", "role"]];
for (const u of users) {
  const email = `${u.username.toLowerCase()}@etshoob.local`;
  let rec, password = u.password || gen(), note = password;
  try {
    rec = await auth.getUserByEmail(email);
    if (reset || u.password) await auth.updateUser(rec.uid, { password });
    else note = "(موجود - لم تتغير)";
  } catch {
    rec = await auth.createUser({ email, password, displayName: u.name });
  }
  await db.doc(`users/${rec.uid}`).set(
    { name: u.name, username: u.username.toLowerCase(), role: u.role, active: true, createdAt: FieldValue.serverTimestamp() }, { merge: true });
  out.push([u.name, u.username, note, u.role]);
}
writeFileSync(new URL("../credentials.csv", import.meta.url), out.map((r) => r.join(",")).join("\n"));
console.table(out.slice(1).map(([name, username, password, role]) => ({ name, username, password, role })));
console.log("اتحفظت في credentials.csv — ابعتها للناس واحذف الملف (مش هيترفع على GitHub).");
