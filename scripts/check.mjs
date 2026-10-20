// فحص سلامة المشروع قبل النشر:  npm run check   (بيتشغّل تلقائي على GitHub قبل أي نشر)
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [], warnings = [];
const walk = (d, skip = ["node_modules", ".git", ".claude", "backups"]) => readdirSync(d).flatMap((n) => skip.includes(n) ? [] : (statSync(join(d, n)).isDirectory() ? walk(join(d, n), skip) : [join(d, n)]));
const rel = (p) => p.replace(root, "");
const files = walk(root);

// 1) صياغة كل ملفات الجافاسكريبت
for (const f of files.filter((x) => /\.(m?js)$/.test(x))) { const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" }); if (r.status !== 0) errors.push(`خطأ صياغة في ${rel(f)}\n${r.stderr}`); }

// 2) ملفات سرية متتبّعة في git (بتشتغل على GitHub، وعلى جهازك لو فيه git)
const git = spawnSync("git", ["ls-files"], { cwd: root, encoding: "utf8" });
if (git.status === 0) for (const t of git.stdout.split("\n")) if (/(^|\/)(serviceAccount.*\.json|credentials\.csv|\.env(\..*)?|backup-.*\.json)$/.test(t)) errors.push(`ملف سري/خاص متتبّع في git: ${t}`);

// 3) أسرار جوه النصوص
const textFiles = files.filter((x) => /\.(m?js|html|css|json|md|yml|yaml|rules|txt)$/.test(x) && !/package-lock\.json$/.test(x) && !/\\?serviceAccount\.json$/.test(x));
const SECRET = /-----BEGIN (RSA |EC )?PRIVATE KEY-----|"private_key"\s*:|ghp_[A-Za-z0-9]{30,}|xox[bp]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}/;
for (const f of textFiles) if (SECRET.test(readFileSync(f, "utf8"))) errors.push(`شكله سر/مفتاح خاص في ${rel(f)}`);

// 4) قواعد Firestore
const rules = readFileSync(join(root, "firestore.rules"), "utf8")
  .replace(/\r\n/g, "\n")
  .split("\n")
  .map((l) => l.replace(/\/\/.*$/, ""))
  .join("\n");
// courses قراءة عامة مقصودة (Task 4)، ماعداها ممنوع
if (/match \/courses\/\{id\}\s*\{[^}]*allow read:\s*if true;/.test(rules)) {
  // OK
} else if (/if true/.test(rules)) {
  errors.push("firestore.rules فيها قراءة/كتابة مفتوحة للكل (if true) — ماعدا courses metadata");
}
if (!/match \/\{document=\*\*\}\s*\{\s*allow read, write:\s*if false;/.test(rules)) errors.push("firestore.rules مفيهاش قفل افتراضي للباقي");

// 5) صفحات الموقع: كل ملف CSS/JS/صورة مذكور موجود، ومفيش أوامر inline
for (const f of files.filter((x) => x.startsWith(join(root, "site")) && x.endsWith(".html"))) {
  const h = readFileSync(f, "utf8");
  for (const m of h.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)) { const u = m[1]; if (/^(https?:|mailto:|data:)/.test(u)) continue; if (!existsSync(join(dirname(f), u))) errors.push(`${rel(f)}: الملف ده مش موجود: ${u}`); }
  if (/\son[a-z]+\s*=/i.test(h)) errors.push(`${rel(f)}: فيه معالج حدث inline (onclick/onerror…)`);
}
for (const f of files.filter((x) => x.startsWith(join(root, "site/js")) && x.endsWith(".js"))) if (/\son(click|error|load|mouse\w+|key\w+)\s*=\s*["'`]/i.test(readFileSync(f, "utf8"))) errors.push(`${rel(f)}: فيه معالج حدث inline جوه قالب HTML`);

// 6) إعدادات أمان (تحذير مش خطأ، علشان لو حبيت تغيّرها قصداً)
const cfg = readFileSync(join(root, "site/js/config.js"), "utf8");
if (!/devtoolsGuard:\s*true/.test(cfg)) warnings.push("SECURITY.devtoolsGuard مش true (كشف أدوات المطوّر مقفول). ارجّعه true قبل النشر.");
if (/publicMeditations\s*=\s*true/.test(cfg)) warnings.push("SITE.publicMeditations = true: التأملات مفتوحة للزوار (اتأكد إن القاعدة كمان اتغيّرت قصداً).");
if (/PASTE_API_KEY|YOUR_PROJECT/.test(cfg)) warnings.push("بيانات Firebase لسه placeholder في config.js.");

warnings.forEach((w) => console.log("⚠️  " + w));
if (errors.length) { errors.forEach((e) => console.error("❌ " + e)); console.error(`\nفشل الفحص: ${errors.length} مشكلة`); process.exit(1); }
console.log(`✅ الفحص تمام (${files.length} ملف، ${warnings.length} تحذير)`);
