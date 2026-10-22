"""اختبار الموقع في متصفح حقيقي (Chromium) على نسخة تجريبية بديلة لـ Firebase.
التشغيل:   pip install playwright && playwright install chromium && python3 tests/e2e/run.py
بيطلّع لقطات شاشة في tests/e2e/out/ ونتيجة PASS/FAIL لكل فحص."""
import os, re, shutil, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TMP = "/tmp/fe-etshoob-e2e"; OUT = os.path.join(ROOT, "tests", "e2e", "out"); PORT = 8769
shutil.rmtree(TMP, ignore_errors=True); shutil.copytree(os.path.join(ROOT, "site"), TMP); os.makedirs(OUT, exist_ok=True)
shutil.copy(os.path.join(ROOT, "tests", "e2e", "mock-firebase.js"), os.path.join(TMP, "js", "mock-firebase.js"))
for f in os.listdir(os.path.join(TMP, "js")):          # حوّل كل imports بتاعة firebase لبديل الذاكرة
    if f.endswith(".js") and f != "mock-firebase.js":
        p = os.path.join(TMP, "js", f); s = open(p, encoding="utf-8").read()
        s = re.sub(r'from "https://www\.gstatic\.com/firebasejs/[^"]+"', 'from "./mock-firebase.js"', s); open(p, "w", encoding="utf-8").write(s)
cfg = os.path.join(TMP, "js", "config.js"); s = open(cfg, encoding="utf-8").read().replace("PASTE_API_KEY", "test-key"); open(cfg, "w", encoding="utf-8").write(s)

srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", TMP], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}/"; R = []
def ok(name, cond, info=None):
    R.append(bool(cond)); print(("PASS " if cond else "FAIL ") + name + ("" if cond or not info else "  -> " + str(info)))

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        def page(w=1280, h=860):
            x = b.new_page(viewport={"width": w, "height": h}); errs = []
            x.on("pageerror", lambda e: errs.append(str(e))); x.errs = errs
            return x

        # ---- ما يشوفه أي حد بـ View Source
        for name in ["index.html", "courses.html", "meditations.html"]:
            raw = urllib.request.urlopen(B + name).read().decode()
            ok(f"view-source {name}: لا فيه محاضرات ولا تأملات ولا إعلانات", not any(t in raw for t in ["بانوراما العهد القديم", "النور الذي يضيء", "بدء محاضرات"]))

        # ---- زائر
        x = page(); x.goto(B + "index.html?guest=1"); x.wait_for_timeout(1200); t = x.inner_text("body")
        ok("زائر: مفيش محتوى محمي", not any(s in t for s in ["بدء محاضرات", "النور الذي", "واجب المحاضرة"]))
        ok("زائر: مفيش آية اليوم ولا حماية شغالة", x.locator(".votd").count() == 0 and x.locator(".shield-cover").count() == 0)
        ok("زائر: زرار دخول موجود", x.locator("[data-login]").count() >= 1); ok("زائر: مفيش أخطاء JS", not x.errs, x.errs)
        x.screenshot(path=f"{OUT}/guest.png", full_page=True); x.close()
        x = page(); hops = []; x.on("framenavigated", lambda f: hops.append(f.url))   # (الـ mock بيشيل ?guest في التحويل، فبنسجّل التحويل نفسه)
        x.goto(B + "courses.html?guest=1"); x.wait_for_timeout(1500)
        ok("زائر على المحاضرات: بيتحوّل لصفحة الدخول", any("login.html?next=courses.html" in u for u in hops), hops); x.close()

        # ---- دارس
        x = page(); x.goto(B + "index.html"); x.wait_for_timeout(1800)
        ok("دارس: شايف الكورسات والإعلانات والتأملات وآية اليوم", all(x.locator(s).count() >= 1 for s in ["#courses .card", ".note", "#meds .card", ".votd"]))
        ok("دارس: رابط الواجب https عادي", x.locator(".hw-band a[href^='https://forms.gle']").count() == 1)
        x.screenshot(path=f"{OUT}/student.png"); ok("دارس: مفيش أخطاء JS", not x.errs, x.errs)
        sel = (x.locator(".votd p").click(click_count=3), x.evaluate("getSelection().toString()"))[1]; ok("منع التحديد", sel == "")
        ok("منع النسخ", x.evaluate("(()=>{const e=new Event('copy',{cancelable:true,bubbles:true});document.querySelector('.votd p').dispatchEvent(e);return e.defaultPrevented})()"))
        ok("منع الزر اليمين", x.evaluate("(()=>{const e=new MouseEvent('contextmenu',{cancelable:true,bubbles:true});document.body.dispatchEvent(e);return e.defaultPrevented})()"))
        combos = [{"key": "F12"}, {"key": "i", "ctrlKey": True, "shiftKey": True}, {"key": "j", "ctrlKey": True, "shiftKey": True}, {"key": "u", "ctrlKey": True}, {"key": "s", "ctrlKey": True}, {"key": "p", "ctrlKey": True}, {"key": "i", "metaKey": True, "altKey": True}]
        ok("اختصارات الـ inspect/المصدر/الحفظ/الطباعة ممنوعة", all(x.evaluate("(cs)=>cs.map(c=>{const e=new KeyboardEvent('keydown',{...c,cancelable:true,bubbles:true});document.dispatchEvent(e);return e.defaultPrevented})", combos)))
        x.goto(B + "index.html"); x.wait_for_timeout(1500)
        cdp = x.context.new_cdp_session(x); cdp.on("Debugger.paused", lambda e: (time.sleep(0.4), cdp.send("Debugger.resume"))); cdp.send("Debugger.enable"); x.wait_for_timeout(3500)
        ok("أدوات المطوّر اتكشفت: الغطا ظهر والمحتوى اتمسح من الـ DOM", x.evaluate("!document.querySelector('.shield-cover').hidden") and x.evaluate("document.querySelector('main').children.length") == 0)
        x.close()

        # ---- تواصل معنا
        x = page(); x.goto(B + "index.html?guest=1"); x.wait_for_timeout(1500)
        ok("زائر: زر تواصل معنا موجود في الفوتر", x.locator("#open-contact").count() == 1)
        x.click("#open-contact"); x.wait_for_timeout(400)
        ok("زائر: نافذة تواصل معنا اتفتحت", x.locator("#contact-dlg[open]").count() == 1)
        x.evaluate("document.querySelector('#contact-dlg').close()"); x.wait_for_timeout(300)
        ok("زائر: النافذة اتقفلت بالزرار", x.locator("#contact-dlg[open]").count() == 0)
        x.screenshot(path=f"{OUT}/contact-guest.png"); x.close()

        x = page(); x.goto(B + "index.html"); x.wait_for_timeout(1500)
        ok("دارس: زر تواصل معنا موجود", x.locator("#open-contact").count() == 1)
        x.click("#open-contact"); x.wait_for_timeout(400)
        ok("دارس: النافذة اتفتحت", x.locator("#contact-dlg[open]").count() == 1)
        x.click("[data-csend]"); x.wait_for_timeout(400)
        ok("دارس: بدون رسالة — يظهر تنبيه خطأ", x.locator("[data-cmsg] .notice.bad").count() == 1)
        x.fill("#cn", "متحدث منا"); x.fill("#cb", "عايز أسجل في الكورس الثاني، هل لسه التسجيل مفتوح؟")
        x.click("[data-csend]"); x.wait_for_timeout(600)
        ok("دارس: بعد الإرسال — رسالة نجاح + الحقول اتنظفت", x.locator("[data-cmsg] .notice:not(.bad)").count() == 1 and x.evaluate("document.querySelector('#cn').value === ''") and x.evaluate("document.querySelector('#cb').value === ''"))
        x.evaluate("document.querySelector('#contact-dlg').close()"); x.screenshot(path=f"{OUT}/contact-student.png"); x.close()

        # ---- روابط خطرة من قاعدة البيانات (XSS)
        x = page(); x.goto(B + "index.html?hwjs=1&badcover=1"); x.wait_for_timeout(1500)
        ok("رابط الواجب javascript: بيتتجاهل (الواجب يظهر مقفول)", x.locator("a[href^='javascript']").count() == 0 and "مقفول" in x.inner_text(".hw-band"))
        ok("غلاف javascript: مبيتحطّش كصورة", x.locator("img[src^='javascript']").count() == 0); x.close()
        x = page(); x.goto(B + "courses.html"); x.wait_for_timeout(1500)
        ok("المحاضرات ظاهرة للدارس", "بانوراما العهد القديم" in x.inner_text("body"))
        ok("PDF عادي فيه تحميل، وPDF خطر مفيهوش أي رابط javascript:", x.locator("a[href*='drive.google.com/uc']").count() >= 1 and x.locator("a[href^='javascript']").count() == 0)
        x.screenshot(path=f"{OUT}/lectures.png"); ok("المحاضرات: مفيش أخطاء JS", not x.errs, x.errs); x.close()

        # ---- التأملات
        x = page(); x.goto(B + "meditations.html#m1"); x.wait_for_timeout(1500)
        ok("نافذة قراءة التأمل بتفتح من الرابط", x.locator("dialog.reader[open]").count() == 1 and "كلمتك سراج" in x.inner_text("#rb"))
        x.screenshot(path=f"{OUT}/reader.png"); ok("التأملات: مفيش أخطاء JS", not x.errs, x.errs); x.close()

        # ---- لوحة الإدارة
        x = page(); x.goto(B + "admin.html?role=admin"); x.wait_for_timeout(1500)
        ok("الإدارة: التبويبات والنموذج بيظهروا", x.locator("#tabs button").count() == 6 and x.locator("#panel .panel").count() >= 1)
        x.fill("#f-title", "اختبار"); x.click("#save"); x.wait_for_timeout(300)
        x.locator("#tabs button", has_text="الواجب").click(); x.wait_for_timeout(300); x.fill("#u", "javascript:alert(1)"); x.click("#save"); x.wait_for_timeout(300)
        ok("الإدارة: رفض رابط javascript: في الواجب", "https://" in (x.locator(".toast").last.inner_text() if x.locator(".toast").count() else ""))
        x.screenshot(path=f"{OUT}/admin.png"); ok("الإدارة: مفيش أخطاء JS", not x.errs, x.errs); x.close()

        # ---- موبايل
        x = page(390, 844); x.goto(B + "index.html"); x.wait_for_timeout(1500)
        ok("موبايل: مفيش سكرول أفقي", x.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"))
        x.screenshot(path=f"{OUT}/mobile.png"); x.close(); b.close()
finally:
    srv.terminate()
print("\n%d/%d passed" % (sum(R), len(R))); sys.exit(0 if all(R) else 1)
