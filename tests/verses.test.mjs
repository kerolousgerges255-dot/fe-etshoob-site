import { test } from "node:test";
import assert from "node:assert/strict";
import { VERSES, verseOfTheDay } from "../site/js/verses.js";

const dayNo = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

test("بنك الآيات سليم", () => {
  assert.ok(VERSES.length >= 30);
  for (const v of VERSES) { assert.ok(v.t && v.t.length > 10, v.r); assert.ok(v.r, v.t); }
  assert.equal(new Set(VERSES.map((v) => v.r)).size, VERSES.length, "فيه مرجع مكرر");
  assert.ok(!VERSES.some((v) => v.r.includes("١١٩ : ١٠٥")), "الآية الرئيسية مش المفروض تتكرر");
});

test("نفس الآية لكل الدارسين في اليوم الواحد", () => {
  const a = verseOfTheDay(new Date(2026, 9, 18, 0, 5)), b = verseOfTheDay(new Date(2026, 9, 18, 23, 55));
  assert.equal(a.r, b.r);
});

test("مفيش تكرار جوه الدورة الواحدة، وبتتغيّر كل يوم", () => {
  const n = VERSES.length; let d = new Date(2026, 9, 18);
  while (dayNo(d) % n !== 0) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);   // بداية دورة
  const seen = [];
  for (let i = 0; i < n; i++) seen.push(verseOfTheDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)).r);
  assert.equal(new Set(seen).size, n, "لقينا تكرار جوه دورة");
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1]);
});
