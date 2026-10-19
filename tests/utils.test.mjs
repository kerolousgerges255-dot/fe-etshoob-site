import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, renderText, excerpt, safeUrl, viewUrl, downloadUrl, toEmail } from "../site/js/utils.js";

test("esc يهرّب كل الرموز الخطرة", () => {
  assert.equal(esc(`<img src=x onerror="a('b')">&`), "&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;");
  assert.equal(esc(null), ""); assert.equal(esc(undefined), ""); assert.equal(esc(5), "5");
});

test("renderText: تنسيق التأملات وبدون HTML خام", () => {
  const out = renderText("## عنوان\n\n> آية\n\nفقرة <script>alert(1)</script>");
  assert.match(out, /<h3>عنوان<\/h3>/); assert.match(out, /<blockquote>آية<\/blockquote>/);
  assert.ok(!out.includes("<script"), "الـ script لازم يتهرّب");
});

test("excerpt: يقص ويشيل علامات التنسيق", () => {
  assert.equal(excerpt("## عنوان\n\nنص قصير"), "عنوان نص قصير");
  const long = excerpt("ا".repeat(300), 50); assert.ok(long.endsWith("…") && long.length <= 51);
});

test("safeUrl: يقبل http/https والمسارات النسبية بس", () => {
  for (const ok of ["https://drive.google.com/x", "http://a.com", "images/a.jpg", "/images/a.jpg"]) assert.equal(safeUrl(ok), ok);
  for (const bad of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "data:text/html,<script>", "vbscript:x", "file:///etc/passwd", "", null, undefined]) assert.equal(safeUrl(bad), "", String(bad));
});

test("روابط Drive: عرض وتحميل، وأي رابط خطر بيتمسح", () => {
  const u = "https://drive.google.com/file/d/ABC_123-x/view?usp=sharing";
  assert.equal(viewUrl(u), "https://drive.google.com/file/d/ABC_123-x/view");
  assert.equal(downloadUrl(u), "https://drive.google.com/uc?export=download&id=ABC_123-x");
  assert.equal(downloadUrl("https://drive.google.com/open?id=Z9"), "https://drive.google.com/uc?export=download&id=Z9");
  assert.equal(viewUrl("javascript:alert(1)"), ""); assert.equal(downloadUrl("javascript:alert(1)"), "");
  assert.equal(viewUrl("https://example.com/a.pdf"), "https://example.com/a.pdf");
});

test("toEmail: اسم المستخدم لإيميل داخلي", () => { assert.equal(toEmail("  Nader "), "nader@etshoob.local"); });
