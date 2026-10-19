import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const raw = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
const code = raw.split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");   // من غير التعليقات

test("قواعد Firestore: أي حاجة مش مذكورة مقفولة", () => {
  assert.match(code, /match \/\{document=\*\*\}\s*\{\s*allow read, write:\s*if false;/);
});
test("قواعد Firestore: مفيش قراءة مفتوحة للكل", () => { assert.ok(!/if true/.test(code), "فيه 'if true' في قاعدة"); });
test("قواعد Firestore: كل المحتوى للدارسين المفعّلين، والكتابة للإدارة", () => {
  for (const c of ["announcements", "meditations", "courses", "lectures", "homework"]) {
    const m = code.match(new RegExp(`match /${c}/\\{id\\}\\s*\\{([^}]*)\\}`)); assert.ok(m, `مفيش قاعدة لـ ${c}`);
    assert.match(m[1], /allow read:\s*if isMember\(\)/, `${c}: القراءة`); assert.match(m[1], /allow write:\s*if isAdmin\(\)/, `${c}: الكتابة`);
  }
});
test("قواعد Firestore: الحسابات والجلسات", () => {
  assert.match(code, /match \/users\/\{uid\}[\s\S]*?allow write:\s*if isAdmin\(\)/);
  assert.match(code, /match \/sessions\/\{uid\}[\s\S]*?isMember\(\) && request\.auth\.uid == uid/);
  assert.match(code, /function isMember\(\)[^}]*active == true/);
});
