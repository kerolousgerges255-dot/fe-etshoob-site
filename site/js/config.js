// 1) Firebase Console > Project settings > Your apps > Web app > انسخ القيم هنا
export const firebaseConfig = {
  apiKey: "AIzaSyDjZXOrjh_KI8VnfBM9cO1Wmtbc7k-Vf3s",
  authDomain: "feetshoub.firebaseapp.com",
  projectId: "feetshoub",
  appId: "1:490074731207:web:ca990a0c9ab617bbbec4e2"
};

// 2) بيانات الموقع (غيّرها براحتك)
export const SITE = {
  name: "في اتشوب",
  institute: "معهد الكتاب المقدس — كاتدرائية الشهيد العظيم مار جرجس، العاشر من رمضان",
  heroTitle: "ادرس الكتاب المقدس أونلاين في معهد في اتشوب",
  heroLead: "شوف المحاضرات، وحمّل ملف كل محاضرة، واقرأ التأملات، وتابع الإعلانات والواجب من مكان واحد.",
  verse: "سِرَاجٌ لِرِجْلِي كَلاَمُكَ وَنُورٌ لِسَبِيلِي.",
  verseRef: "مزمور ١١٩ : ١٠٥",
  // صور الهيرو (حتى 3). سيبها فاضية لو مفيش صور، وهيظهر اللوجو. مثال: ["images/hero-1.jpg", "images/hero-2.jpg"]
  heroImages: [],
  // روابط التواصل (اللي فاضي مش بيظهر)
  links: {
    facebook: "https://www.facebook.com/profile.php?id=61560367155159",
    whatsapp: "https://wa.me/201555981300",
    address: "كاتدرائية الشهيد العظيم مار جرجس - العاشر من رمضان - الشرقية"
  }
};

// 3) الأمان
export const SECURITY = {
  idleMinutes: 45,        // خروج تلقائي بعد خمول (0 = بدون)
  devtoolsGuard: true,    // تغطية الصفحة لما أدوات المطوّر تتفتح (على الكمبيوتر بس)
  blurOnHidden: true      // تغطية الصفحة لما التبويب يتخبّى
};

// 4) الفيديو المحمي (Bunny Stream + Worker). سيبه فاضي لحد ما تجهّز الـ Worker (شوف docs/SECURITY.md)
SITE.video = { worker: "" };           // مثال: "https://fe-etshoob-video.YOURNAME.workers.dev"

// التأملات: true = مفتوحة للزوار
SITE.publicMeditations = true;
