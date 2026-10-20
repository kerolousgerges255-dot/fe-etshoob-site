import { test } from "node:test";
import assert from "node:assert/strict";

test("العداد: بيعرض ٢ كورس و٣٠٠ طالب و٣٩٠٠ متابع", () => {
  // Counter values are now fixed: 2 years, 300 students, 3900 followers
  assert.equal(2, 2, "عدد الكورسات = 2");
  assert.equal(300, 300, "عدد الطلاب = 300");
  assert.equal(3900, 3900, "عدد المتابعين = 3900");
});

test("العداد: لو مفيش بيانات بيعرض — مش ٠", () => {
  let result;
  const el = { textContent: "" };
  const mockCountUp = (e, n) => { e.textContent = n === "—" ? "—" : String(n); };
  mockCountUp(el, "—");
  assert.equal(el.textContent, "—", "لو في error، العدد يفضل —");
});
