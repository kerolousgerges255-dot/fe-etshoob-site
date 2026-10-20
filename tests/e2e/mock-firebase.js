// بديل Firebase في الذاكرة، لاختبار الموقع في المتصفح من غير اتصال بأي حاجة.
// بيتحط مكان روابط gstatic تلقائي بواسطة run.py (مش جزء من الموقع الحقيقي).
const ts = (d) => ({ toDate: () => new Date(d) });
const P = new URLSearchParams(location.search);
const store = {
  "users/u1": { name: "كيرلس جرجس", username: "kero.g", role: P.get("role") || "student", active: true },
  announcements: [{ id: "a1", title: "بدء محاضرات الترم الأول", body: "المحاضرات كل يوم أحد الساعة السابعة مساءً.", pinned: true, createdAt: ts("2026-10-10") }],
  meditations: [
    { id: "m1", title: "النور الذي يضيء الطريق", author: "نادر", body: "## كلمتك سراج\n\nفي الصباح الباكر نبدأ يومنا بنور الكلمة.\n\n> سِرَاجٌ لِرِجْلِي كَلاَمُكَ وَنُورٌ لِسَبِيلِي.\n\nوالسراج لا يكشف الطريق كله دفعة واحدة.", createdAt: ts("2026-10-14"), cover: "images/covers/med-1.jpg" },
    { id: "m2", title: "ذوقوا وانظروا ما أطيب الرب", author: "نادر", body: "## حلاوة الكلمة\n\nالكلمة مش بس نقراها، لأ، بنعيشها.\n\n> ذُوقُوا وَانْظُرُوا مَا أَطْيَبَ الرَّبَّ!\n\nكل ما نقرب أكتر، بنلاقي حلاوة أكتر.", createdAt: ts("2026-10-15"), cover: "images/covers/med-2.jpg" },
    { id: "m3", title: "الرب راعي فلا يعوزني شيء", author: "نادر", body: "## راعي النفوس\n\nفي كل شدة وفي كل فرح، الرب موجود.\n\n> الرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ.\n\nثقة تامة في رعايته.", createdAt: ts("2026-10-16"), cover: "images/covers/med-3.jpg" }
  ],
  courses: [{ id: "c1", title: "العهد القديم - الترم الأول", description: "بانوراما العهد القديم.", order: 1, lectureCount: 3, cover: "images/covers/course-ot.jpg", year: 1 }, { id: "c2", title: "العهد الجديد - الترم الأول", description: "بانوراما العهد الجديد.", order: 2, lectureCount: 3, cover: "images/covers/course-nt1.jpg", year: 1 }],
  lectures: [
    { id: "l1", courseId: "c1", semester: 1, order: 1, title: "بانوراما العهد القديم", instructor: "القس قزمان عياد", lectureDate: "27-9-2026", description: "المراحل الست للعهد القديم: الخليقة، الآباء، الخروج، القضاة، المملكة، الأمم، وكلمة المفتاح: انتظار المخلص.", pdfUrl: "https://drive.google.com/file/d/abc123/view", cover: "images/covers/lec-1.jpg" },
    { id: "l2", courseId: "c1", semester: 1, order: 2, title: "بانوراما التكوين وأيام الخليقة", instructor: "القس إسحق عطية", lectureDate: "4-10-2026", description: "أحداث وشخصيات سفر التكوين، أيام الخليقة والنظريات المطروحة عنها، وتاريخ البطاركة حتى يوسف.", pdfUrl: "https://drive.google.com/file/d/abc456/view", cover: "images/covers/lec-2.jpg" },
    { id: "l3", courseId: "c1", semester: 1, order: 3, title: "بانوراما الخروج وخيمة الاجتماع", instructor: "القس أنطونيوس فوزي", lectureDate: "11-10-2026", description: "تقسيم سفر الخروج، رحلة الخروج من مصر إلى جبل حوريب، وخيمة الاجتماع.", pdfUrl: "https://drive.google.com/file/d/abc789/view", cover: "images/covers/lec-3.jpg" }
  ],
  homework: { current: { title: "واجب المحاضرة الثانية", url: P.get("hwjs") ? "javascript:alert(1)" : "https://forms.gle/x", active: true } },
  users: [{ id: "u1", name: "كيرلس جرجس", username: "kero.g", role: "admin", active: true }, { id: "u2", name: "دارس تاني", username: "student2", role: "student", active: true }]
};
export const initializeApp = () => ({}); export const deleteApp = () => {};
export const getAuth = () => ({ currentUser: P.get("guest") ? null : { uid: "u1" } });
export const onAuthStateChanged = (auth, cb) => { queueMicrotask(() => cb(P.get("guest") ? null : { uid: "u1" })); return () => {}; };
export const signInWithEmailAndPassword = async () => ({ user: { uid: "u1" } });
export const createUserWithEmailAndPassword = async () => ({ user: { uid: "new" } });
export const signOut = async () => {};
export const getFirestore = () => ({});
export const collection = (_, name) => ({ name });
export const query = (c) => c; export const orderBy = () => 0; export const limit = () => 0;
export const doc = (_, c, id) => ({ c, id });
export const getDoc = async (r) => {
  const v = r.c === "users" ? store["users/u1"] : r.c === "homework" ? store.homework.current : null;
  return { exists: () => !!v, data: () => v, id: r.id };
};
export const getDocs = async (c) => ({ docs: (store[c.name] || []).map((x) => ({ id: x.id, data: () => x })), size: (store[c.name] || []).length });
export const setDoc = async () => {}; export const addDoc = async () => ({}); export const updateDoc = async () => {}; export const deleteDoc = async () => {};
export const serverTimestamp = () => 0; export const increment = (n) => n; export const onSnapshot = () => () => {};
