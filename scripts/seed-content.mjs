// تشغيل:  npm run seed
// بينشئ: سنتين (years) + ٦ ترمات (terms) + ١٨ محاضرة (٣ لكل ترم)
// آمن تشغّله أكتر من مرة: مش بيمسح روابط الـ PDF اللي ضفتها من لوحة الإدارة.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("../serviceAccount.json", import.meta.url)))) });
const db = getFirestore(), now = FieldValue.serverTimestamp();

// السنوات (isParent: true) — دي بتتحسب عشان العداد (العداد بيعرض عدد السنين بس)
const years = [
  { id: "year1-ot", title: "السنة الأولى - العهد القديم", description: "بانوراما العهد القديم", cover: "images/covers/course-ot.jpg", order: 1, isParent: true },
  { id: "year2-nt", title: "السنة الثانية - العهد الجديد", description: "بانوراما العهد الجديد", cover: "images/covers/course-nt.jpg", order: 2, isParent: true }
];

// الترمات (بدون isParent) — كل ترم في سنه
const terms = [
  // السنة الأولى - العهد القديم
  { id: "ot-term1", title: "العهد القديم - الترم الأول", description: "المراحل الست للعهد القديم", cover: "images/covers/course-ot.jpg", order: 1, parentId: "year1-ot" },
  { id: "ot-term2", title: "العهد القديم - الترم الثاني", description: "أسفار موسى الخمسة والتاريخ", cover: "images/covers/course-ot.jpg", order: 2, parentId: "year1-ot" },
  { id: "ot-term3", title: "العهد القديم - الترم الثالث", description: "الأنبياء والحكمة", cover: "images/covers/course-ot.jpg", order: 3, parentId: "year1-ot" },
  // السنة الثانية - العهد الجديد
  { id: "nt-term1", title: "العهد الجديد - الترم الأول", description: "البانوراما الإنجيلية", cover: "images/covers/course-nt.jpg", order: 4, parentId: "year2-nt" },
  { id: "nt-term2", title: "العهد الجديد - الترم الثاني", description: "رسائل بولس والأعمال", cover: "images/covers/course-nt.jpg", order: 5, parentId: "year2-nt" },
  { id: "nt-term3", title: "العهد الجديد - الترم الثالث", description: "الرسائل العامة والرؤيا", cover: "images/covers/course-nt.jpg", order: 6, parentId: "year2-nt" }
];

async function seedCourses() {
  // Seed years (isParent: true)
  for (const y of years) {
    await db.doc(`courses/${y.id}`).set({ ...y, createdAt: now }, { merge: true });
  }

  // Seed terms (بدون isParent)
  for (const t of terms) {
    await db.doc(`courses/${t.id}`).set({ ...t, lectureCount: 0, createdAt: now }, { merge: true });
  }

  // المحاضرات — ٣ لكل ترم = ١٨ محاضرة إجمالاُ
  const lectureData = [
    // الترم الأول - العهد القديم
    { courseId: "ot-term1", lectures: [
      { id: "ot1-l1", order: 1, lectureNo: "المحاضرة الأولى", title: "بانوراما العهد القديم", instructor: "القس قزمان عياد", lectureDate: "27-9-2026", description: "المراحل الست للعهد القديم: الخليقة، الآباء، الخروج، القضاة، المملكة، الأمم، وكلمة المفتاح: انتظار المخلص." },
      { id: "ot1-l2", order: 2, lectureNo: "المحاضرة الثانية", title: "سفر التكوين وأيام الخليقة", instructor: "القس إسحق عطية", lectureDate: "4-10-2026", description: "أحداث وشخصيات سفر التكوين، أيام الخليقة والنظريات المطروحة عنها، وتاريخ البطاركة حتى يوسف." },
      { id: "ot1-l3", order: 3, lectureNo: "المحاضرة الثالثة", title: "الخروج وخيمة الاجتماع", instructor: "القس أنطونيوس فوزي", lectureDate: "11-10-2026", description: "تقسيم سفر الخروج، رحلة الخروج من مصر إلى جبل حوريب، وخيمة الاجتماع." }
    ]},
    // الترم الثاني - العهد القديم
    { courseId: "ot-term2", lectures: [
      { id: "ot2-l1", order: 1, lectureNo: "المحاضرة الرابعة", title: "سفر اللاويين والأعداد", instructor: "القس قزمان عيad", lectureDate: "18-10-2026", description: "الذبائح والطقوس، الشعب في البرية، والاستعداد لدخول الأرض." },
      { id: "ot2-l2", order: 2, lectureNo: "المحاضرة الخامسة", title: "سفر التثنية ويوشع", instructor: "القس إسحق عطية", lectureDate: "25-10-2026", description: "عهد جديد مع جيل جديد، دخول أرض الموعد." },
      { id: "ot2-l3", order: 3, lectureNo: "المحاضرة السادسة", title: "القضاة وروث", instructor: "القس أنطونيوس فوزي", lectureDate: "1-11-2026", description: "دورة الخطية والتوبة، ورحمة الله في قصة روث." }
    ]},
    // الترم الثالث - العهد القديم
    { courseId: "ot-term3", lectures: [
      { id: "ot3-l1", order: 1, lectureNo: "المحاضرة السابعة", title: "صموئيل والملوك", instructor: "القس قزمان عيad", lectureDate: "8-11-2026", description: "انتقال من القضاة للمملكة، داود وسليمان." },
      { id: "ot3-l2", order: 2, lectureNo: "المحاضرة الثامنة", title: "الأنبياء الكبار", instructor: "القس إسحق عطية", lectureDate: "15-11-2026", description: "إشعيا، إرمياء، حزقيال، دانيال." },
      { id: "ot3-l3", order: 3, lectureNo: "المحاضرة التاسعة", title: "الأنبياء الصغار", instructor: "القس أنطونيوس فوزي", lectureDate: "22-11-2026", description: "الأسفار الاثنى عشر، الرجاء في المسيح الآتي." }
    ]},
    // الترم الأول - العهد الجديد
    { courseId: "nt-term1", lectures: [
      { id: "nt1-l1", order: 1, lectureNo: "المحاضرة الأولى", title: "بانوراما العهد الجديد", instructor: "القس قزمان عيad", lectureDate: "27-9-2026", description: "العالم بين العهدين، الهيكل، والكتبة." },
      { id: "nt1-l2", order: 2, lectureNo: "المحاضرة الثانية", title: "الأناجيل الإزائية", instructor: "القس إسحق عطية", lectureDate: "4-10-2026", description: "متى، مرقس، لوقا - التشابه والاختلاف." },
      { id: "nt1-l3", order: 3, lectureNo: "المحاضرة الثالثة", title: "إنجيل يوحنا", instructor: "القس أنطونيوس فوزي", lectureDate: "11-10-2026", description: "الإله المتجسد، الآيات السبع، والخطابات الوداعية." }
    ]},
    // الترم الثاني - العهد الجديد
    { courseId: "nt-term2", lectures: [
      { id: "nt2-l1", order: 1, lectureNo: "المحاضرة الرابعة", title: "سفر الأعمال", instructor: "القس قزمان عيad", lectureDate: "18-10-2026", description: "ولادة الكنيسة، الروح القدس، والتبشير لليهود فالأمم." },
      { id: "nt2-l2", order: 2, lectureNo: "المحاضرة الخامسة", title: "رسائل بولس المبكرة", instructor: "القس إسحق عطية", lectureDate: "25-10-2026", description: "تسالونيكي، غلاطية، كورنثوس، رومية." },
      { id: "nt2-l3", order: 3, lectureNo: "المحاضرة السادسة", title: "رسائل السجن والرعوية", instructor: "القس أنطونيوس فوزي", lectureDate: "1-11-2026", description: "أفسس، فيلبي، كولوسي، تيموثاوس، تيطس." }
    ]},
    // الترم الثالث - العهد الجديد
    { courseId: "nt-term3", lectures: [
      { id: "nt3-l1", order: 1, lectureNo: "المحاضرة السابعة", title: "الرسائل العامة", instructor: "القس قزمان عيad", lectureDate: "8-11-2026", description: "يعقوب، بطرس، يوحنا، يهوذا، عبرانيين." },
      { id: "nt3-l2", order: 2, lectureNo: "المحاضرة الثامنة", title: "الرؤيا", instructor: "القس إسحق عطية", lectureDate: "15-11-2026", description: "الكنيسة المضطهدة، النصرة، والسماء الجديدة." },
      { id: "nt3-l3", order: 3, lectureNo: "المحاضرة التاسعة", title: "تلخيص العهد الجديد", instructor: "القس أنطونيوس فوزي", lectureDate: "22-11-2026", description: "المسيح مركز التاريخ، الكنيسة، والأبدية." }
    ]}
  ];

  for (const { courseId, lectures } of lectureData) {
    for (const { id, ...l } of lectures) {
      await db.doc(`lectures/${id}`).set({ courseId, ...l, createdAt: now }, { merge: true });
    }
    const n = (await db.collection("lectures").where("courseId", "==", courseId).get()).size;
    await db.doc(`courses/${courseId}`).set({ lectureCount: n }, { merge: true });
  }

  console.log("تمام: سنتان (years) + ٦ ترمات (terms) + ١٨ محاضرة. ضيف روابط الـ PDF من الإدارة > المحاضرات > تعديل.");
}

seedCourses().catch(console.error);
