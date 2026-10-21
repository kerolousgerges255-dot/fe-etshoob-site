// video/record.mjs — Recording engine for Fe Etshoob demo video
// Follows ui-demo skill & VIDEO-ROADMAP.md Task 4
// Usage:
//   node video/record.mjs --rehearse    # Phase 2: verify selectors and take screenshots
//   node video/record.mjs --record      # Phase 3: record real WebM videos per role

import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_DIR = join(__dirname, "raw");
const SCENES_DIR = join(__dirname, "scenes");
mkdirSync(RAW_DIR, { recursive: true });
mkdirSync(SCENES_DIR, { recursive: true });

const BASE_URL = process.env.DEMO_BASE_URL || "https://kerolousgerges255-dot.github.io/fe-etshoob-site";
const DEMO_STUDENT = process.env.DEMO_STUDENT_USER || "demo.student";
const DEMO_STUDENT_PASS = process.env.DEMO_STUDENT_PASS || "BGBbwPJQWD";
const DEMO_ADMIN = process.env.DEMO_ADMIN_USER || "demo.admin";
const DEMO_ADMIN_PASS = process.env.DEMO_ADMIN_PASS || "DPThw89SRE";

const IS_REHEARSAL = process.argv.includes("--rehearse");
const WIDTH = 1920;
const HEIGHT = 1080;

// ── Overlays: Cursor & Captions ──────────────────────────────────────────
async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById("demo-cursor")) return;
    const cursor = document.createElement("div");
    cursor.id = "demo-cursor";
    cursor.innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#d3a53b" stroke="#4a130e" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>`;
    cursor.style.cssText = `
      position: fixed; z-index: 9999999; pointer-events: none;
      width: 34px; height: 34px;
      transition: left 0.12s ease-out, top 0.12s ease-out;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));
    `;
    cursor.style.left = "960px";
    cursor.style.top = "540px";
    document.body.appendChild(cursor);
    document.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
  });
}

async function injectCaptionBar(page) {
  await page.evaluate(() => {
    if (document.getElementById("demo-caption-bar")) return;
    const bar = document.createElement("div");
    bar.id = "demo-caption-bar";
    bar.style.cssText = `
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
      z-index: 9999998; text-align: center; padding: 14px 36px; border-radius: 40px;
      background: rgba(74, 19, 14, 0.94); border: 2px solid #d3a53b;
      color: #fff; font-family: "Cairo", sans-serif;
      font-size: 22px; font-weight: 700; line-height: 1.4;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55);
      transition: opacity 0.35s ease, transform 0.35s ease;
      pointer-events: none; direction: rtl; max-width: 85vw;
    `;
    bar.textContent = "";
    bar.style.opacity = "0";
    document.body.appendChild(bar);
  });
}

async function showCaption(page, text, logArray = null, sceneId = null) {
  if (logArray && sceneId) {
    logArray.push({ sceneId, text, at: Date.now() });
  }
  await page.evaluate((t) => {
    const bar = document.getElementById("demo-caption-bar");
    if (!bar) return;
    if (t) {
      bar.textContent = t;
      bar.style.opacity = "1";
      bar.style.transform = "translateX(-50%) translateY(0)";
    } else {
      bar.style.opacity = "0";
      bar.style.transform = "translateX(-50%) translateY(12px)";
    }
  }, text);
  if (text) await page.waitForTimeout(700);
}

// ── Movement & Interaction Helpers ──────────────────────────────────────
async function preparePage(page) {
  await injectCursor(page);
  await injectCaptionBar(page);
}

async function moveAndClick(page, selector, label = "", opts = {}) {
  const { postClickDelay = 1200, steps = 15 } = opts;
  const el = typeof selector === "string" ? page.locator(selector).first() : selector;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    console.warn(`  ⚠️ moveAndClick: "${label || selector}" is not visible`);
    return false;
  }
  try {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await el.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
      await page.waitForTimeout(350);
    }
    await el.click();
  } catch (err) {
    console.warn(`  ⚠️ moveAndClick failed on "${label}": ${err.message}`);
    return false;
  }
  await page.waitForTimeout(postClickDelay);
  return true;
}

async function typeSlowly(page, selector, text, label = "", charDelay = 75) {
  const el = typeof selector === "string" ? page.locator(selector).first() : selector;
  const ok = await moveAndClick(page, el, label, { postClickDelay: 400 });
  if (!ok) return false;
  await el.fill("");
  await el.pressSequentially(text, { delay: charDelay });
  await page.waitForTimeout(700);
  return true;
}

async function smoothScroll(page, targetY, delay = 2000) {
  await page.evaluate((y) => {
    window.scrollTo({ top: y, behavior: "smooth" });
  }, targetY);
  await page.waitForTimeout(delay);
}

// ── Role 1: Guest Recording (~60s) ──────────────────────────────────────
async function runGuest(browser) {
  console.log("\n🎬 [Part A] Recording Guest Experience...");
  const scenes = [];
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    locale: "ar-EG",
    recordVideo: IS_REHEARSAL ? undefined : { dir: RAW_DIR, size: { width: WIDTH, height: HEIGHT } }
  });

  const page = await context.newPage();

  try {
    // Scene G1: Hero & Logo reveal
    await page.goto(BASE_URL + "/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await preparePage(page);

    await showCaption(page, "معهد في اتشوب — دراسة أكاديمية للكتاب المقدس", scenes, "g1_hero");
    await page.mouse.move(960, 320, { steps: 12 });
    await page.waitForTimeout(2200);

    // Scene G2: Counters & Verse of the Day
    await showCaption(page, "العدادات التفاعلية: ٢ كورس، +٣٠٠ طالب، +٣٩٠٠ متابع", scenes, "g2_counters");
    await smoothScroll(page, 520, 2500);

    await showCaption(page, "آية اليوم — تتجدد تلقائياً كل يوم لجميع الزوار", scenes, "g3_verse");
    await smoothScroll(page, 780, 2200);

    // Scene G3: Courses Section (Locked for guests)
    await showCaption(page, "الكورسات الرئيسية: السنة الأولى والعهد الجديد (متاحة للدارسين فقط)", scenes, "g4_courses_locked");
    await smoothScroll(page, 1300, 2500);

    // Scene G4: Public Meditations
    await showCaption(page, "التأملات الروحية — متاحة للجميع للقراءة والتحميل", scenes, "g5_meditations");
    await smoothScroll(page, 1950, 2500);

    // Scene G5: Testimonials Carousel
    await showCaption(page, "قالوا عن المعهد — شهادات حقيقية من الآباء والخريجين", scenes, "g6_testimonials");
    await smoothScroll(page, 2600, 3500);

    // Scene G6: About Us Page
    await showCaption(page, "صفحة من نحن — الرؤية، نظام الدراسة، وأعضاء هيئة التدريس", scenes, "g6b_about");
    await page.goto(BASE_URL + "/about.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await preparePage(page);
    await smoothScroll(page, 800, 3000);
    await smoothScroll(page, 1600, 2500);
    await smoothScroll(page, 2400, 2500);
    await smoothScroll(page, 0, 1500);

    // Scene G7: Login Dialog
    await smoothScroll(page, 0, 1200);
    await showCaption(page, "تسجيل دخول الدارسين للوصول للمحاضرات", scenes, "g7_login_dialog");
    await moveAndClick(page, "button[data-login], .btn[data-login]", "زر دخول الدارسين");
    await page.waitForTimeout(2000);

    // Close modal
    await moveAndClick(page, "#login-dlg button[data-close], #login-dlg .x", "إغلاق نافذة الدخول");
    await page.waitForTimeout(1000);
    await showCaption(page, "", scenes, "g_end");

    if (IS_REHEARSAL) {
      await page.screenshot({ path: join(SCENES_DIR, "rehearsal-guest.png"), fullPage: false });
    }
  } finally {
    await context.close();
    if (!IS_REHEARSAL) {
      const v = page.video();
      if (v) {
        const vPath = await v.path();
        const target = join(RAW_DIR, "guest.webm");
        copyFileSync(vPath, target);
        console.log("  ✓ Guest video saved to:", target);
      }
      writeFileSync(join(SCENES_DIR, "scenes-guest.json"), JSON.stringify(scenes, null, 2));
    }
  }
}

// ── Role 2: Student Recording (~90s) ────────────────────────────────────
async function runStudent(browser) {
  console.log("\n🎬 [Part B] Recording Student Experience...");
  const scenes = [];
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    locale: "ar-EG",
    recordVideo: IS_REHEARSAL ? undefined : { dir: RAW_DIR, size: { width: WIDTH, height: HEIGHT } }
  });

  const page = await context.newPage();

  try {
    // Scene S1: Login
    await page.goto(BASE_URL + "/login.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await preparePage(page);

    await showCaption(page, "تسجيل الدخول بحساب دارس مفعّل", scenes, "s1_login");
    await typeSlowly(page, "[data-u]", DEMO_STUDENT, "اسم المستخدم");
    await typeSlowly(page, "[data-p]", DEMO_STUDENT_PASS, "كلمة المرور");
    await moveAndClick(page, "[data-go]", "زر تسجيل الدخول", { postClickDelay: 3000 });

    // Scene S2: Student Home (Homework active + announcements)
    // Login redirects to courses.html, go back to home to show homework band
    await page.goto(BASE_URL + "/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await preparePage(page);

    await showCaption(page, "لوحة الطالب — متابعة الواجب النشط والإعلانات الهامة", scenes, "s2_home");
    await page.waitForTimeout(1500);

    // Scene S2b: Focus on Homework Band (active with countdown)
    await showCaption(page, "الواجب النشط — عداد وقت متبقٍ ورابط مباشر للنموذج", scenes, "s2b_homework");
    await smoothScroll(page, 350, 2000);
    await page.waitForTimeout(1500);
    // Highlight the homework button with cursor hover
    const hwBtn = page.locator(".hw-band .btn.gold");
    const hwVisible = await hwBtn.isVisible().catch(() => false);
    if (hwVisible) {
      await hwBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const hwBox = await hwBtn.boundingBox();
      if (hwBox) {
        await page.mouse.move(hwBox.x + hwBox.width / 2, hwBox.y + hwBox.height / 2, { steps: 8 });
        await page.waitForTimeout(800);
      }
    }

    // Back to top for announcements
    await smoothScroll(page, 0, 1200);
    await smoothScroll(page, 450, 2200);

    // Scene S3: Courses Page
    await showCaption(page, "صفحة المحاضرات — استعراض السنتين والترمات الستة", scenes, "s3_courses");
    await page.goto(BASE_URL + "/courses.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await preparePage(page);

    // Open Year 1 terms
    await showCaption(page, "الدخول للترم الأول وتصفح المحاضرات", scenes, "s4_open_term");
    await moveAndClick(page, "[data-term], .term-row, a[href*='term']", "فتح الترم");
    await page.waitForTimeout(2500);

    // Open a lecture reader
    await showCaption(page, "قراءة تفاصيل المحاضرة مع زر تحميل ملف الـ PDF", scenes, "s5_lecture_reader");
    await smoothScroll(page, 300, 1500);

    // Scene S4: Search in Lectures
    await page.goto(BASE_URL + "/courses.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await preparePage(page);

    await showCaption(page, "البحث الفوري في المحاضرات بالاسم أو المحاضر", scenes, "s6_search_lectures");
    await typeSlowly(page, "#q", "الخليقة", "مربع بحث المحاضرات");
    await page.waitForTimeout(2500);
    await page.locator("#q").fill("");
    await page.waitForTimeout(1000);

    // Scene S5: Meditations Page & Reader Controls
    await showCaption(page, "قارئ التأملات المريح مع تكبير وتصغير الخط", scenes, "s7_meditations");
    await page.goto(BASE_URL + "/meditations.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    await preparePage(page);

    // Open first meditation
    await moveAndClick(page, "[data-open], .card button", "اقرأ التأمل", { postClickDelay: 2000 });
    // Adjust font size
    await moveAndClick(page, "#lg", "تكبير الخط", { postClickDelay: 800 });
    await moveAndClick(page, "#lg", "تكبير الخط مرة ثانية", { postClickDelay: 1200 });
    await moveAndClick(page, "#reader button.x, [data-close]", "إغلاق القارئ", { postClickDelay: 1000 });

    // Scene S6: Anti-Copy Protection Demo
    await showCaption(page, "حماية المحتوى — منع النسخ والزر الأيمن للحفاظ على حقوق النشر", scenes, "s8_protection");
    await page.mouse.click(500, 400, { button: "right" });
    await page.waitForTimeout(1500);

    // Scene S7: Logout
    await showCaption(page, "تسجيل الخروج بأمان عند الانتهاء", scenes, "s9_logout");
    await moveAndClick(page, "#logout", "زر تسجيل الخروج", { postClickDelay: 2000 });
    await showCaption(page, "", scenes, "s_end");

    if (IS_REHEARSAL) {
      await page.screenshot({ path: join(SCENES_DIR, "rehearsal-student.png"), fullPage: false });
    }
  } finally {
    await context.close();
    if (!IS_REHEARSAL) {
      const v = page.video();
      if (v) {
        const vPath = await v.path();
        const target = join(RAW_DIR, "student.webm");
        copyFileSync(vPath, target);
        console.log("  ✓ Student video saved to:", target);
      }
      writeFileSync(join(SCENES_DIR, "scenes-student.json"), JSON.stringify(scenes, null, 2));
    }
  }
}

// ── Role 3: Admin Recording (~90s) ──────────────────────────────────────
async function runAdmin(browser) {
  console.log("\n🎬 [Part C] Recording Admin Experience...");
  const scenes = [];
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    locale: "ar-EG",
    recordVideo: IS_REHEARSAL ? undefined : { dir: RAW_DIR, size: { width: WIDTH, height: HEIGHT } }
  });

  const page = await context.newPage();

  try {
    // Scene A1: Admin Login
    await page.goto(BASE_URL + "/login.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await preparePage(page);

    await showCaption(page, "تسجيل الدخول للوحة التحكم الإدارية", scenes, "a1_login");
    await typeSlowly(page, "[data-u]", DEMO_ADMIN, "اسم الأدمن");
    await typeSlowly(page, "[data-p]", DEMO_ADMIN_PASS, "كلمة مرور الأدمن");
    await moveAndClick(page, "[data-go]", "زر الدخول", { postClickDelay: 3000 });

    // Scene A2: Navigate to Admin Panel
    await page.goto(BASE_URL + "/admin.html?role=admin", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await preparePage(page);

    // Inject blur to hide sensitive student/user info for privacy
    await page.evaluate(() => {
      const style = document.createElement("style");
      style.textContent = `
        #items .item .meta, #items .item strong { filter: blur(4px); transition: filter 0.3s; }
      `;
      document.head.appendChild(style);
    });

    await showCaption(page, "لوحة التحكم الشاملة لإدارة جميع أقسام المعهد", scenes, "a2_overview");
    await page.waitForTimeout(2000);

    // Scene A3: Announcements tab
    await showCaption(page, "إدارة الإعلانات — إضافة وتعديل وتثبيت الإعلانات للدارسين", scenes, "a3_announcements");
    await moveAndClick(page, "button:has-text('الإعلانات')", "تبويب الإعلانات", { postClickDelay: 2000 });
    await smoothScroll(page, 300, 1500);

    // Scene A4: Homework tab
    await showCaption(page, "إدارة الواجب — تفعيل الرابط وتحديد مواعيد التسليم", scenes, "a4_homework");
    await moveAndClick(page, "button:has-text('الواجب')", "تبويب الواجب", { postClickDelay: 2000 });
    await smoothScroll(page, 200, 1500);

    // Scene A5: Meditations tab
    await showCaption(page, "إدارة التأملات — نشر كلمات روحية بتنسيق مميز", scenes, "a5_meditations");
    await moveAndClick(page, "button:has-text('التأملات')", "تبويب التأملات", { postClickDelay: 2000 });
    await smoothScroll(page, 300, 1500);

    // Scene A6: Courses & Lectures tab
    await showCaption(page, "إدارة الكورسات والمحاضرات وربط ملفات Google Drive", scenes, "a6_courses");
    await moveAndClick(page, "button:has-text('الكورسات')", "تبويب الكورسات", { postClickDelay: 2000 });
    await moveAndClick(page, "button:has-text('المحاضرات')", "تبويب المحاضرات", { postClickDelay: 2000 });
    await smoothScroll(page, 300, 1500);

    // Scene A7: Students management (privacy blur applied)
    await showCaption(page, "إدارة حسابات الدارسين وتفعيل العضويات (مع الحفاظ الكامل على الخصوصية)", scenes, "a7_students");
    await moveAndClick(page, "button:has-text('الدارسين')", "تبويب الدارسين", { postClickDelay: 2500 });
    await smoothScroll(page, 300, 2000);

    await showCaption(page, "", scenes, "a_end");

    if (IS_REHEARSAL) {
      await page.screenshot({ path: join(SCENES_DIR, "rehearsal-admin.png"), fullPage: false });
    }
  } finally {
    await context.close();
    if (!IS_REHEARSAL) {
      const v = page.video();
      if (v) {
        const vPath = await v.path();
        const target = join(RAW_DIR, "admin.webm");
        copyFileSync(vPath, target);
        console.log("  ✓ Admin video saved to:", target);
      }
      writeFileSync(join(SCENES_DIR, "scenes-admin.json"), JSON.stringify(scenes, null, 2));
    }
  }
}

// ── Main Orchestrator ───────────────────────────────────────────────────
async function main() {
  console.log("=================================================");
  console.log(IS_REHEARSAL ? "🔍 STARTING REHEARSAL (No video recorded)" : "🎥 STARTING LIVE DEMO RECORDING (WebM outputs)");
  console.log("Target:", BASE_URL);
  console.log("Resolution:", `${WIDTH}x${HEIGHT}`);
  console.log("=================================================");

  const browser = await chromium.launch({ headless: true });

  try {
    await runGuest(browser);
    await runStudent(browser);
    await runAdmin(browser);

    console.log("\n=================================================");
    if (IS_REHEARSAL) {
      console.log("✅ REHEARSAL COMPLETED SUCCESSFULLY!");
      console.log("Screenshots saved in:", SCENES_DIR);
    } else {
      console.log("✅ ALL 3 ROLES RECORDED SUCCESSFULLY!");
      console.log("Raw videos saved in:", RAW_DIR);
    }
    console.log("=================================================");
  } catch (err) {
    console.error("\n❌ RECORDING FAILED:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
