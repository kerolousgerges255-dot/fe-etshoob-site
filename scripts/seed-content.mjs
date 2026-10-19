// تشغيل:  npm run seed
// بينشئ كورس "العهد القديم - الترم الأول" وثلاث محاضرات (بدون روابط PDF).
// آمن تشغّله أكتر من مرة: مش بيمسح روابط الـ PDF اللي ضفتها من لوحة الإدارة.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("../serviceAccount.json", import.meta.url)))) });
const db = getFirestore(), now = FieldValue.serverTimestamp();

await db.doc("courses/old-testament-t1").set({ title: "العهد القديم - الترم الأول", description: "بانوراما العهد القديم", order: 1, createdAt: now }, { merge: true });

const lectures = [
  { id: "ot1-l1", order: 1, lectureNo: "المحاضرة الأولى", title: "بانوراما العهد القديم", instructor: "القس قزمان عياد", lectureDate: "27-9-2026",
    description: "المراحل الست للعهد القديم: الخليقة، الآباء، الخروج، القضاة، المملكة، الأمم، وكلمة المفتاح: انتظار المخلص." },
  { id: "ot1-l2", order: 2, lectureNo: "المحاضرة الثانية", title: "بانوراما التكوين وأيام الخليقة", instructor: "القس إسحق عطية", lectureDate: "4-10-2026",
    description: "أحداث وشخصيات سفر التكوين، أيام الخليقة والنظريات المطروحة عنها، وتاريخ البطاركة حتى يوسف." },
  { id: "ot1-l3", order: 3, lectureNo: "المحاضرة الثالثة", title: "بانوراما الخروج وخيمة الاجتماع", instructor: "القس أنطونيوس فوزي", lectureDate: "11-10-2026",
    description: "تقسيم سفر الخروج، رحلة الخروج من مصر إلى جبل حوريب، وخيمة الاجتماع." }
];
for (const { id, ...l } of lectures) await db.doc(`lectures/${id}`).set({ courseId: "old-testament-t1", ...l, createdAt: now }, { merge: true });
const n = (await db.collection("lectures").where("courseId", "==", "old-testament-t1").get()).size;
await db.doc("courses/old-testament-t1").set({ lectureCount: n }, { merge: true });
console.log("تمام: كورس + 3 محاضرات. ضيف روابط الـ PDF من الإدارة > المحاضرات > تعديل.");
