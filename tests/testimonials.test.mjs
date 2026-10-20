// Testimonials unit tests
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("شهادة 6-1: بيانات الـ 10 أشخاص مفيش فيها أسماء مسيحية مفبركة ولا أحرف غريبة", () => {
  const js = readFileSync(join(root, "site", "js", "testimonials.js"), "utf8");

  // Extract names from the testimonials array
  // Match all lines with name: "..."
  const nameMatches = [...js.matchAll(/name:\s*"([^"]+)"/g)];
  const names = nameMatches.map(m => m[1]);

  assert.equal(names.length, 10, `البيانات لازم تحتوي 10 أشخاص، لسه عندنا ${names.length}`);

  // Verify all names are Arabic
  for (const name of names) {
    assert.ok(
      /^[؀-ۿݐ-ݿ\s]+$/.test(name.trim()),
      `اسم '${name}' فيه أحرف مش عربية`
    );
  }

  // Verify the 10 expected names from ROADMAP §3.3
  const expectedNames = [
    "الأنبا مقار",
    "القس جوارجيوس القمص فيلبس",
    "قس قزمان عياد",
    "مينا جيد",
    "شريف شوقي",
    "رانيا إيراد",
    "روماني عادل",
    "كيرلس رؤوف",
    "ماريان ملطي",
    "ماركو منير",
  ];
  for (let i = 0; i < 10; i++) {
    assert.equal(names[i], expectedNames[i], `الشخص رقم ${i + 1}: الاسم المتوقع '${expectedNames[i]}' لكن جانا '${names[i]}'`);
  }
});

test("شهادة 6-2: ملف testimonials.js موجود وصياغته صحيحة", () => {
  const js = readFileSync(join(root, "site", "js", "testimonials.js"), "utf8");
  // Basic syntax check by requiring it as a module would be ideal, but we'll check structure
  assert.ok(js.includes("const CAROUSEL_INTERVAL = 15_000"), "الفاصل الزمني 15 ثانية مش موجود");
  assert.ok(js.includes("testimonials"), "مفيش متغير testimonials");
  assert.ok(js.includes("testimonial-slide"), "مفيش كلاس testimonial-slide");
  assert.ok(js.includes("testimonial-dot"), "مفيش كلاس testimonial-dot");
});
