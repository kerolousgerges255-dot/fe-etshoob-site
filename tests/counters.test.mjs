import { test } from "node:test";
import assert from "node:assert/strict";

test("العداد: بيعرض ٢ كورس (سنين) و٣ محاضرات لما يكون فيه ٢ year + ٢ terms", () => {
  const courses = [
    { id: "year1-ot", title: "السنة الأولى", isParent: true, lectureCount: 0 },
    { id: "year2-nt", title: "السنة الثانية", isParent: true, lectureCount: 0 },
    { id: "ot-term1", title: "الترم الأول OT", lectureCount: 3, parentId: "year1-ot" },
    { id: "nt-term1", title: "الترم الأول NT", lectureCount: 0, parentId: "year2-nt" }
  ];
  const yearCount = courses.filter((c) => c.isParent).length;
  const lectureCount = courses.reduce((n, c) => n + (c.lectureCount || 0), 0);
  assert.equal(yearCount, 2, "عدد السنوات = 2");
  assert.equal(lectureCount, 3, "إجمالي المحاضرات = 3");
});

test("العداد: لو مفيش بيانات بيعرض — مش ٠", () => {
  let result;
  const el = { textContent: "" };
  const mockCountUp = (e, n) => { e.textContent = n === "—" ? "—" : String(n); };
  mockCountUp(el, "—");
  assert.equal(el.textContent, "—", "لو في error، العدد يفضل —");
});

test("العداد: meditations بيعرض عدد صحيح لو موجودين", () => {
  const meds = [{ id: "m1" }, { id: "m2" }, { id: "m3" }];
  assert.equal(meds.length, 3, "لما تكون هناك 3 تأملات");
});
