// Record a demo video of the site using Playwright
// Run: node scripts/record-demo.mjs

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(root, "site");
const tmpDir = "/tmp/fe-etshoob-demo";
const videoDir = join(root, "demo-video");

// Start local server
const server = spawnSync("python3", ["-m", "http.server", "8769", "-d", siteDir], {
  cwd: root,
  detached: true,
  stdio: "ignore"
});

import { sync_playwright } from "playwright";

async function main() {
  const playwright = await sync_playwright();
  const browser = await playwright.chromium.launch();

  // Create context with video recording
  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 860 } }
  });

  const page = await context.newPage();

  // Block external fonts to speed up
  await page.route("**/*.{woff,woff2,ttf}", r => r.abort());

  const base = "http://localhost:8769";

  try {
    console.log("🎬 Starting demo recording...");

    // 1. Landing page (guest)
    console.log("  📍 Landing page (guest view)");
    await page.goto(base + "/index.html?guest=1", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(videoDir, "01-landing-guest.png"), fullPage: true });

    // 2. Login page
    console.log("  📍 Login page");
    await page.goto(base + "/login.html", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(videoDir, "02-login.png"), fullPage: true });

    // 3. Home page as student
    console.log("  📍 Home page (student view)");
    await page.goto(base + "/index.html", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(videoDir, "03-home-student.png"), fullPage: true });

    // Scroll down to show content
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(videoDir, "04-home-scroll.png"), fullPage: true });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(1000);

    // 4. Courses page
    console.log("  📍 Courses page");
    await page.goto(base + "/courses.html", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(videoDir, "05-courses.png"), fullPage: true });

    // Click first course to expand
    await page.evaluate(() => {
      const course = document.querySelector(".course");
      if (course) course.scrollIntoView({ behavior: "smooth" });
    });
    await page.waitForTimeout(1500);

    // 5. Meditations page
    console.log("  📍 Meditations page");
    await page.goto(base + "/meditations.html", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(videoDir, "06-meditations.png"), fullPage: true });

    // Open a meditation
    await page.goto(base + "/meditations.html#m1", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(videoDir, "07-meditation-reader.png"), fullPage: true });

    // 6. Mobile view
    console.log("  📍 Mobile view");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/index.html", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(videoDir, "08-mobile.png"), fullPage: true });

    // Scroll on mobile
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(videoDir, "09-mobile-scroll.png"), fullPage: true });

    // 7. Admin panel
    console.log("  📍 Admin panel");
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto(base + "/admin.html?role=admin", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(videoDir, "10-admin.png"), fullPage: true });

    // Click through tabs
    for (const tab of ["الإعلانات", "التأملات", "الكورسات", "المحاضرات", "الدارسين"]) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(800);
      await page.screenshot({ path: join(videoDir, `11-admin-${tab}.png`), fullPage: true });
    }

    console.log("✅ Demo recording complete!");

  } finally {
    await context.close();
    await browser.close();
    await playwright.stop();
    server.kill();
    console.log(`📹 Video saved to: ${videoDir}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});