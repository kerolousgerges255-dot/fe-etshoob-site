// تشغيل:  npm run seed
// بينشئ كورسين: Year 1 و Year 2، كل واحد فيهم 3 فصول دراسية (semesters) وثلاث محاضرات في كل فصل
// آمن تشغّله أكتر من مرة: مش بيمسح روابط الـ PDF اللي ضفتها من لوحة الإدارة.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("../serviceAccount.json", import.meta.url)))) });
const db = getFirestore(), now = FieldValue.serverTimestamp();

// Year 1 Courses
const year1Courses = [
  {
    id: "old-testament-t1",
    title: "العهد القديم - الترم الأول",
    description: "بانوراما العهد القديم",
    cover: "images/covers/course-ot.jpg",
    order: 1,
    year: 1
  },
  {
    id: "new-testament-t1",
    title: "العهد الجديد - الترم الأول",
    description: "بانوراما العهد الجديد",
    cover: "images/covers/course-nt1.jpg",
    order: 2,
    year: 1
  }
];

// Year 2 Courses
const year2Courses = [
  {
    id: "old-testament-t2",
    title: "العهد القديم - الترم الثاني",
    description: "دراسات متعمقة في العهد القديم",
    cover: "images/covers/course-ot2.jpg",
    order: 3,
    year: 2
  },
  {
    id: "new-testament-t2",
    title: "العهد الجديد - الترم الثاني",
    description: "دراسات متعمقة في العهد الجديد",
    cover: "images/covers/course-nt2.jpg",
    order: 4,
    year: 2
  }
];

async function seedCourses() {
  // Seed Year 1 courses
  for (const course of year1Courses) {
    await db.doc(`courses/${course.id}`).set({ ...course, createdAt: now }, { merge: true });
  }

  // Seed Year 2 courses
  for (const course of year2Courses) {
    await db.doc(`courses/${course.id}`).set({ ...course, createdAt: now }, { merge: true });
  }

  // Lectures for each course - 3 semesters each, 3 lectures per semester
  const lectureData = [
    // Year 1 - Old Testament T1
    { courseId: "old-testament-t1", lectures: [
      { id: "ot1-s1-l1", semester: 1, order: 1, lectureNo: "المحاضرة الأولى", title: "بانوراما العهد القديم", instructor: "القس قزمان عياد", lectureDate: "27-9-2026", description: "المراحل الست للعهد القديم: الخليقة، الآباء، الخروج، القضاة، المملكة، الأمم، وكلمة المفتاح: انتظار المخلص.", cover: "images/covers/lec-1.jpg" },
      { id: "ot1-s1-l2", semester: 1, order: 2, lectureNo: "المحاضرة الثانية", title: "بانوراما التكوين وأيام الخليقة", instructor: "القس إسحق عطية", lectureDate: "4-10-2026", description: "أحداث وشخصيات سفر التكوين، أيام الخليقة والنظريات المطروحة عنها، وتاريخ البطاركة حتى يوسف.", cover: "images/covers/lec-2.jpg" },
      { id: "ot1-s1-l3", semester: 1, order: 3, lectureNo: "المحاضرة الثالثة", title: "بانوراما الخروج وخيمة الاجتماع", instructor: "القس أنطونيوس فوزي", lectureDate: "11-10-2026", description: "تقسيم سفر الخروج، رحلة الخروج من مصر إلى جبل حوريب، وخيمة الاجتماع.", cover: "images/covers/lec-3.jpg" },
      { id: "ot1-s2-l1", semester: 2, order: 4, lectureNo: "المحاضرة الرابعة", title: "سفر اللاويين والأعداد", instructor: "القس قزمان عياد", lectureDate: "18-10-2026", description: "الذبائح والطقوس، الشعب في البرية، والاستعداد لدخول الأرض.", cover: "images/covers/lec-4.jpg" },
      { id: "ot1-s2-l2", semester: 2, order: 5, lectureNo: "المحاضرة الخامسة", title: "سفر التثنية ويوشع", instructor: "القس إسحق عطية", lectureDate: "25-10-2026", description: "عهد جديد مع جيل جديد، دخول أرض الموعد.", cover: "images/covers/lec-5.jpg" },
      { id: "ot1-s2-l3", semester: 2, order: 6, lectureNo: "المحاضرة السادسة", title: "القضاة وروث", instructor: "القس أنطونيوس فوزي", lectureDate: "1-11-2026", description: "دورة الخطية والتوبة، ورحمة الله في قصة روث.", cover: "images/covers/lec-6.jpg" },
      { id: "ot1-s3-l1", semester: 3, order: 7, lectureNo: "المحاضرة السابعة", title: "صموئيل والملوك", instructor: "القس قزمان عياد", lectureDate: "8-11-2026", description: "انتقال من القضاة للمملكة، داود وسليمان.", cover: "images/covers/lec-7.jpg" },
      { id: "ot1-s3-l2", semester: 3, order: 8, lectureNo: "المحاضرة الثامنة", title: "الأنبياء الكبار", instructor: "القس إسحق عطية", lectureDate: "15-11-2026", description: "إشعيا، إرمياء، حزقيال، دانيال.", cover: "images/covers/lec-8.jpg" },
      { id: "ot1-s3-l3", semester: 3, order: 9, lectureNo: "المحاضرة التاسعة", title: "الأنبياء الصغار", instructor: "القس أنطونيوس فوزي", lectureDate: "22-11-2026", description: "الأسفار الاثنى عشر، الرجاء في المسيح الآتي.", cover: "images/covers/lec-9.jpg" }
    ]},

    // Year 1 - New Testament T1
    { courseId: "new-testament-t1", lectures: [
      { id: "nt1-s1-l1", semester: 1, order: 1, lectureNo: "المحاضرة الأولى", title: "بانوراما العهد الجديد", instructor: "القس قزمان عياد", lectureDate: "27-9-2026", description: "العالم بين العهدين، الهيكل، والكتبة.", cover: "images/covers/nt-lec-1.jpg" },
      { id: "nt1-s1-l2", semester: 1, order: 2, lectureNo: "المحاضرة الثانية", title: "الأناجيل الإزائية", instructor: "القس إسحق عطية", lectureDate: "4-10-2026", description: "متى، مرقس، لوقا - التشابه والاختلاف.", cover: "images/covers/nt-lec-2.jpg" },
      { id: "nt1-s1-l3", semester: 1, order: 3, lectureNo: "المحاضرة الثالثة", title: "إنجيل يوحنا", instructor: "القس أنطونيوس فوزي", lectureDate: "11-10-2026", description: "الإله المتجسد، الآيات السبع، والخطابات الوداعية.", cover: "images/covers/nt-lec-3.jpg" },
      { id: "nt1-s2-l1", semester: 2, order: 4, lectureNo: "المحاضرة الرابعة", title: "سفر الأعمال", instructor: "القس قزمان عياد", lectureDate: "18-10-2026", description: "ولادة الكنيسة، الروح القدس، والتبشير لليهود فالأمم.", cover: "images/covers/nt-lec-4.jpg" },
      { id: "nt1-s2-l2", semester: 2, order: 5, lectureNo: "المحاضرة الخامسة", title: "رسائل بولس المبكرة", instructor: "القس إسحق عطية", lectureDate: "25-10-2026", description: "تسالونيكي، غلاطية، كورنثوس، رومية.", cover: "images/covers/nt-lec-5.jpg" },
      { id: "nt1-s2-l3", semester: 2, order: 6, lectureNo: "المحاضرة السادسة", title: "رسائل السجن والرعوية", instructor: "القس أنطونيوس فوزي", lectureDate: "1-11-2026", description: "أفسس، فيلبي، كولوسي، تيموثاوس، تيطس.", cover: "images/covers/nt-lec-6.jpg" },
      { id: "nt1-s3-l1", semester: 3, order: 7, lectureNo: "المحاضرة السابعة", title: "الرسائل العامة", instructor: "القس قزمان عياد", lectureDate: "8-11-2026", description: "يعقوب، بطرس، يوحنا، يهوذا، عبرانيين.", cover: "images/covers/nt-lec-7.jpg" },
      { id: "nt1-s3-l2", semester: 3, order: 8, lectureNo: "المحاضرة الثامنة", title: "الرؤيا", instructor: "القس إسحق عطية", lectureDate: "15-11-2026", description: "الكنيسة المضطهدة، النصرة، والسماء الجديدة.", cover: "images/covers/nt-lec-8.jpg" },
      { id: "nt1-s3-l3", semester: 3, order: 9, lectureNo: "المحاضرة التاسعة", title: "تلخيص العهد الجديد", instructor: "القس أنطونيوس فوزي", lectureDate: "22-11-2026", description: "المسيح مركز التاريخ، الكنيسة، والأبدية.", cover: "images/covers/nt-lec-9.jpg" }
    ]},

    // Year 2 - Old Testament T2
    { courseId: "old-testament-t2", lectures: [
      { id: "ot2-s1-l1", semester: 1, order: 1, lectureNo: "المحاضرة الأولى", title: "الشعر والحكمة", instructor: "القس قزمان عياد", lectureDate: "27-9-2026", description: "المزامير، الأمثال، أيوب، الجامعة، نشيد الأناشيد.", cover: "images/covers/ot2-lec-1.jpg" },
      { id: "ot2-s1-l2", semester: 1, order: 2, lectureNo: "المحاضرة الثانية", title: "التوراة بالتفصيل", instructor: "القس إسحق عطية", lectureDate: "4-10-2026", description: "دراسة تحليلية لأسفار موسى الخمسة.", cover: "images/covers/ot2-lec-2.jpg" },
      { id: "ot2-s1-l3", semester: 1, order: 3, lectureNo: "المحاضرة الثالثة", title: "الأسفار التاريخية", instructor: "القس أنطونيوس فوزي", lectureDate: "11-10-2026", description: "يشوع، قضاة، صموئيل، ملوك، أخبار الأيام.", cover: "images/covers/ot2-lec-3.jpg" },
      { id: "ot2-s2-l1", semester: 2, order: 4, lectureNo: "المحاضرة الرابعة", title: "الأنبياء بالتفصيل", instructor: "القس قزمان عياد", lectureDate: "18-10-2026", description: "دراسة معمقة للأنبياء الكبار والصغار.", cover: "images/covers/ot2-lec-4.jpg" },
      { id: "ot2-s2-l2", semester: 2, order: 5, lectureNo: "المحاضرة الخامسة", title: "اللاهوت العهد القديم", instructor: "القس إسحق عطية", lectureDate: "25-10-2026", description: "مواضيع لاهوتية: العهد، الملك، الهيكل، الروح.", cover: "images/covers/ot2-lec-5.jpg" },
      { id: "ot2-s2-l3", semester: 2, order: 6, lectureNo: "المحاضرة السادسة", title: "الفسيفساء والسبعينية", instructor: "القس أنطونيوس فوزي", lectureDate: "1-11-2026", description: "ترجمات العهد القديم وتأثيرها.", cover: "images/covers/ot2-lec-6.jpg" },
      { id: "ot2-s3-l1", semester: 3, order: 7, lectureNo: "المحاضرة السابعة", title: "العهد القديم في العهد الجديد", instructor: "القس قزمان عياد", lectureDate: "8-11-2026", description: "اقتباسات، إشارات، وتحقيق النبوات.", cover: "images/covers/ot2-lec-7.jpg" },
      { id: "ot2-s3-l2", semester: 3, order: 8, lectureNo: "المحاضرة الثامنة", title: "العبادة والطقوس", instructor: "القس إسحق عطية", lectureDate: "15-11-2026", description: "الهيكل، الذبائح، الأعياد، الكهنوت.", cover: "images/covers/ot2-lec-8.jpg" },
      { id: "ot2-s3-l3", semester: 3, order: 9, lectureNo: "المحاضرة التاسعة", title: "تطبيق العهد القديم اليوم", instructor: "القس أنطونيوس فوزي", lectureDate: "22-11-2026", description: "قراءة العهد القديم بعين مسيحية.", cover: "images/covers/ot2-lec-9.jpg" }
    ]},

    // Year 2 - New Testament T2
    { courseId: "new-testament-t2", lectures: [
      { id: "nt2-s1-l1", semester: 1, order: 1, lectureNo: "المحاضرة الأولى", title: "يسوع التاريخي", instructor: "القس قزمان عياد", lectureDate: "27-9-2026", description: "مصادر، منهجيات، والسياق اليهودي.", cover: "images/covers/nt2-lec-1.jpg" },
      { id: "nt2-s1-l2", semester: 1, order: 2, lectureNo: "المحاضرة الثانية", title: "لاهوت بولس", instructor: "القس إسحق عطية", lectureDate: "4-10-2026", description: "البر بالإيمان، النعمة، الروح، والكنيسة.", cover: "images/covers/nt2-lec-2.jpg" },
      { id: "nt2-s1-l3", semester: 1, order: 3, lectureNo: "المحاضرة الثالثة", Title: "الكريستولوجيا", instructor: "القس أنطونيوس فوزي", lectureDate: "11-10-2026", description: "طبيعة المسيح، الأقانيم، والتجسد.", cover: "images/covers/nt2-lec-3.jpg" },
      { id: "nt2-s2-l1", semester: 2, order: 4, lectureNo: "المحاضرة الرابعة", title: "الكنيسة والأسرار", instructor: "القس قزمان عياد", lectureDate: "18-10-2026", description: "المعمودية، القربان، الكهنوت، والحياة المشتركة.", cover: "images/covers/nt2-lec-4.jpg" },
      { id: "nt2-s2-l2", semester: 2, order: 5, lectureNo: "المحاضرة الخامسة", title: "الأخلاق المسيحية", instructor: "القس إسحق عطية", lectureDate: "25-10-2026", description: "الوصايا، المحبة، العدالة، والحياة الأبدية.", cover: "images/covers/nt2-lec-5.jpg" },
      { id: "nt2-s2-l3", semester: 2, order: 6, lectureNo: "المحاضرة السادسة", title: "الإسخاتولوجيا", instructor: "القس أنطونيوس فوزي", lectureDate: "1-11-2026", description: "المجيء الثاني، الدينونة، الملكوت، والسماء الجديدة.", cover: "images/covers/nt2-lec-6.jpg" },
      { id: "nt2-s3-l1", semester: 3, order: 7, lectureNo: "المحاضرة السابعة", title: "تاريخ الكنيسة المبكر", instructor: "القس قزمان عياد", lectureDate: "8-11-2026", description: "الآباء الرسل، المجامع، والهرطقات.", cover: "images/covers/nt2-lec-7.jpg" },
      { id: "nt2-s3-l2", semester: 3, order: 8, lectureNo: "المحاضرة الثامنة", title: "التراث القبطي", instructor: "القس إسحق عطية", lectureDate: "15-11-2026", description: "القديسين، الأديرة، والليتورجيا.", cover: "images/covers/nt2-lec-8.jpg" },
      { id: "nt2-s3-l3", semester: 3, order: 9, lectureNo: "المحاضرة التاسعة", title: "العيش بالإيمان اليوم", instructor: "القس أنطونيوس فوزي", lectureDate: "22-11-2026", description: "تطبيق الإنجيل في العالم المعاصر.", cover: "images/covers/nt2-lec-9.jpg" }
    ]}
  ];

  for (const { courseId, lectures } of lectureData) {
    for (const { id, ...l } of lectures) {
      await db.doc(`lectures/${id}`).set({ courseId, ...l, createdAt: now }, { merge: true });
    }
    const n = (await db.collection("lectures").where("courseId", "==", courseId).get()).size;
    await db.doc(`courses/${courseId}`).set({ lectureCount: n }, { merge: true });
  }

  console.log("تمام: 4 كورسات (سنتين، كل سنة ترمين) + 36 محاضرة (3 فصول لكل كورس، 3 محاضرات لكل فصل). ضيف روابط الـ PDF من الإدارة > المحاضرات > تعديل.");
}

seedCourses().catch(console.error);