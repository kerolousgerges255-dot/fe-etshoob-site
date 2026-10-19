# موقع "في اتشوب"

موقع للدارسين: دخول بيوزر وباسورد، محاضرات PDF محمية، تأملات عامة، إعلانات، وزرار واجب بيتفتح ويتقفل من لوحة الإدارة.

## الفكرة
- **Front-end**: HTML/CSS/JS عادي (من غير build) في فولدر `site/` — بيترفع على **GitHub Pages**.
- **Back-end**: **Firebase** (Authentication + Firestore) — مجاني، وهو اللي بيحمي المحاضرات فعلاً (مش مجرد إخفاء في الصفحة).
- **ملفات الـ PDF**: بتترفع على Google Drive وبتلصق رابطها في لوحة الإدارة. الرابط نفسه مخزّن في Firestore ومش بيتقرا غير لمن يكون الدارس مسجّل دخول.
  > ملاحظة أمان: لو حد من الدارسين بعت رابط Drive لحد تاني، الرابط هيفتح. الحماية دي ضد الزوار العاديين، مش ضد التسريب المقصود.

## خطوات التشغيل

### 1) مشروع Firebase
1. من https://console.firebase.google.com اعمل مشروع جديد.
2. **Build → Authentication → Get started → Email/Password → Enable**.
3. **Build → Firestore Database → Create database** (Production mode).
4. **Project settings → Your apps → Web (`</>`)** → سجّل التطبيق وانسخ `firebaseConfig`، وحطه في `site/js/config.js`.
5. **Authentication → Settings → Authorized domains** → ضيف `USERNAME.github.io` (اسم حسابك على GitHub).

### 2) قواعد الحماية
افتح **Firestore → Rules**، امسح الموجود والصق محتوى `firestore.rules` واضغط Publish.
(أو بالـ CLI: `npm i -g firebase-tools && firebase login && firebase use --add && firebase deploy --only firestore:rules`)

### 3) إنشاء المستخدمين (Nader, Fr Gowargious, Abanoub Wagih)
1. **Project settings → Service accounts → Generate new private key** → سمّي الملف `serviceAccount.json` وحطه في فولدر المشروع (متتحطش على GitHub — موجود في `.gitignore`).
2. عدّل `scripts/users.json` لو عايز تغيّر الصلاحيات (`admin` = إدارة، `student` = دارس).
3. شغّل:
   ```bash
   npm install
   npm run users
   ```
   هيطلعلك جدول بأسماء المستخدمين وكلمات المرور العشوائية، ومتخزنة في `credentials.csv`. ابعتها للناس واحذف الملف.

### إضافة محتوى العهد القديم - الترم الأول
```bash
npm run seed
```
بيضيف الكورس وثلاث محاضرات (القس قزمان عياد / القس إسحق عطية / القس أنطونيوس فوزي). بعدها ارفع ملفات الـ PDF على Drive، وألصق رابط كل واحد من **الإدارة ← المحاضرات ← تعديل**. لحد ما تضيف الرابط بيظهر للدارس "الملف لسه ما اتضافش".
> ملفات الـ PDF **متتحطش في الريبو**، لأن GitHub Pages عام وأي حد هيوصلها.

اسماء المستخدمين: `nader` / `fr.gowargious` / `abanoub.wagih`.
بعد كده الإدارة تضيف باقي الدارسين من **الإدارة → الدارسين** (من الموقع نفسه، من غير سكريبت).
لإعادة تعيين كلمات المرور: `npm run users -- --reset` أو من Firebase Console → Authentication.

### 4) الرفع على GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/fe-etshoob-site.git
git push -u origin main
```
بعدها: **Settings → Pages → Source: GitHub Actions**. الـ workflow جاهز في `.github/workflows/pages.yml` وأي push بينشر الموقع تلقائي.
الرابط هيبقى: `https://USERNAME.github.io/fe-etshoob-site/`

## الاستخدام اليومي (من صفحة "الإدارة")
| التبويب | بتعمل إيه |
|---|---|
| الإعلانات | إضافة/تعديل/حذف، وتثبيت إعلان مهم في الأول |
| الواجب | حط رابط Google Form وفعّله. لما تقفل الفورم اضغط **قفل الواجب** فالزرار يتحول لـ "الواجب مقفول" |
| التأملات | اكتب أو عدّل تأمل (عام للكل). `## ` عنوان فرعي، `> ` آية |
| الكورسات / المحاضرات | أنشئ كورس، وضيف محاضرات برابط PDF من Drive |
| الدارسين | إضافة دارس، توليد باسورد، إيقاف/تفعيل، تغيير الصلاحية |

## هيكل المشروع
```
site/            ← الموقع (ده اللي بيتنشر)
  index.html  login.html  courses.html  meditations.html  admin.html
  js/ css/ images/
firestore.rules  ← قواعد الحماية
scripts/         ← إنشاء المستخدمين
docs/IMAGE-PROMPTS.md  ← برومبتات الصور (اختيارية)
```

## الجودة والنشر الآمن
- كل push على GitHub بيشغّل **فحص واختبارات** تلقائي قبل النشر. لو فشلوا، الموقع مش بيتنشر وتشوف السبب في تبويب Actions.
- نسخة احتياطية من كل البيانات: `npm run backup` (بتتحفظ في `backups/` ومش بتترفع على GitHub).
- فحص يدوي لأي تعديل: `npm run check` و`npm test`.
- تقرير المراجعة الأمنية: `docs/SECURITY-REVIEW.md`.

## الأمان
اقرا `docs/SECURITY.md` قبل النشر. **القواعد الجديدة لازم تتنشر في Firebase.** كل المحتوى بقى للدارسين المسجّلين بس، ومنع النسخ، وكشف أدوات المطوّر، وجلسة واحدة لكل حساب.

## الآيات
- **الآية الرئيسية** في أول الصفحة: غيّرها من `site/js/config.js` (`verse` و`verseRef`).
- **آية اليوم** بتظهر للدارسين المسجّلين بس. الآيات في `site/js/verses.js` (36 آية، زوّد أو عدّل براحتك). الآية بتتغير كل يوم، ونفسها لكل الدارسين في اليوم الواحد، ومش بتتكرر قبل ما كل الآيات تخلص.
- الآيات اتكتبت من الذاكرة بترجمة فانديك. راجعها على نسختك قبل النشر.

## صور الهيرو والأغلفة (اختياري)
- صور الهيرو: حط حتى 3 صور في `site/images/` وضيف أسماءها في `heroImages` جوه `config.js`. لو سيبتها فاضية بيظهر اللوجو.
- غلاف الكورس والتأمل: من الإدارة، في خانة "رابط صورة". من غير صورة بيظهر غلاف زخرفي جاهز.
- روابط التواصل (فيسبوك، يوتيوب، واتساب، تليفون) من `links` جوه `config.js`.

## قيود لازم تعرفها
- زرار الواجب بيتقفل **يدوي** (الموقع مش بيعرف إن الفورم اتقفل في جوجل).
- حذف دارس من اللوحة بيشيل وصوله للموقع، لكن حسابه يفضل موجود في Firebase Authentication (ممكن تمسحه من الكونسول).
- مش بنستخدم Firebase Storage عشان بيحتاج خطة مدفوعة؛ علشان كده الـ PDF على Drive.
