import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VO_DIR = join(__dirname, "voiceover");
mkdirSync(VO_DIR, { recursive: true });

const scenes = [
  { id: "intro", text: "معهد في اتشوب لدراسة الكتاب المقدس" },
  { id: "g1", text: "مرحباُ بكم في موقع معهد في اتشوب — معهد أكاديمي لدراسة الكتاب المقدس باللغة العربية." },
  { id: "g2", text: "إحصائيات المعهد: كورسين دراسيين، وأكثر من ثلاثمائة دارس، وخمسة آلاف ومتابع." },
  { id: "g3", text: "آية اليوم تتجدد تلقائياُ كل يوم لتزكية الروح." },
  { id: "g4", text: "الكورسات مقسمة إلى سنتين دراسيتين: السنة الأولى العهد القديم والسنة الثانية العهد الجديد." },
  { id: "g5", text: "التأملات الروحية متاحة للجميع — اقرأها وحملها مجاناُ." },
  { id: "g6", text: "قالوا عن المعهد: آراء حقيقية من أساقفتنا وأساتذتنا وخريجينا." },
  { id: "g7", text: "لتسجيل الدخول والبدء في الدراسة، اضغط على زر دخول الدارسين." },
  { id: "s1", text: "بعد تسجيل الدخول بأمان، تدخل إلى لوحة الطالب." },
  { id: "s2", text: "هنا ترى الواجب النشط مع ميعاد التسليم والإعلانات المهمة المثبتة." },
  { id: "s3", text: "صفحة المحاضرات تعرض لك السنتين والترمات الستة مع صور غلاف كل ترم." },
  { id: "s4", text: "بالضغط على أي ترم تفتح قائمة المحاضرات مرتبة حسب رقم المحاضرة." },
  { id: "s5", text: "كل محاضرة فيها ملخص نصي وزر تحميل ملف بي دي إف من جوجل درايف." },
  { id: "s6", text: "حقل البحث يفلتر المحاضرات بالعنوان أو اسم المحاضر لحظياُ." },
  { id: "s7", text: "صفحة التأملات تدعم قارئ مريح مع إمكانية تكبير وتصغير الخط." },
  { id: "s8", text: "نحمي المحتوى بنظام يمنع النسخ والزر الأيمن للحفاظ على حقوق النشر." },
  { id: "s9", text: "وعند الانتهاء يمكنك تسجيل الخروج بضغطة واحدة." },
  { id: "a1", text: "الوصول للوحة الإدارة يتم بحساب أدمن منفصل مع صلاحيات كاملة." },
  { id: "a2", text: "لوحة التحكم تتيح إدارة جميع أقسام المعهد من مكان واحد." },
  { id: "a3", text: "إدارة الإعلانات: إضافة وتعديل وتثبيت أهم الأخبار للدارسين." },
  { id: "a4", text: "إدارة الواجبات: تفعيل رابط النموذج وتحديد موعد التسليم." },
  { id: "a5", text: "نشر التأملات بتنسيق مميز يدعم العناوين والاختصارات." },
  { id: "a6", text: "إضافة وتعديل الكورسات والمحاضرات مع ربط ملفات جوجل درايف." },
  { id: "a7", text: "إدارة حسابات الدارسين مع الحفاظ الكامل على خصوصيتهم." },
  { id: "outro", text: "معهد في اتشوب — ابدأ رحلتك في دراسة كلمة الله اليوم." },
];

console.log("🎙️ Generating Arabic voiceover...");
console.log(`   Output dir: ${VO_DIR}\n`);

let success = 0, failed = 0;
for (const scene of scenes) {
  const outPath = join(VO_DIR, `${scene.id}.mp3`);
  const cmd = `python -m edge_tts --voice ar-EG-SalmaNeural --rate -5% --text "${scene.text}" --write-media "${outPath}"`;
  try {
    execSync(cmd, { stdio: "inherit", shell: true });
    success++;
    console.log(`  ✓ ${scene.id}.mp3`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${scene.id}: ${e.message.split("\n")[0]}`);
  }
}
console.log(`\n✅ Done: ${success} generated, ${failed} failed`);
if (failed > 0) process.exit(1);
