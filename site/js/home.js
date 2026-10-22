import { verseOfTheDay } from "./verses.js";
import { safeUrl, session, renderChrome, db, doc, getDoc, collection, getDocs, query, orderBy, limit, esc, fmtDate, excerpt, cover, countUp, SITE } from "./app.js";
const s = await session();
renderChrome("home", s);
const $ = (id) => document.getElementById(id);

$("h-title").textContent = SITE.heroTitle;
$("h-lead").textContent = SITE.heroLead;
$("h-acts").innerHTML = s.user
  ? `<a class="btn gold" href="courses.html">ابدأ الآن</a><a class="btn ghost" href="meditations.html">اقرأ التأملات</a>`
  : `<button class="btn gold" data-login>دخول الدارسين</button>`;
$("vchip").innerHTML = `${esc(SITE.verse)}<small>${esc(SITE.verseRef)}</small>`;
$("h-art").innerHTML = `<div class="hero-in-logo-wrap"><div class="hero-logo" aria-hidden="true"><img src="images/logo.png" alt="شعار معهد في اتشوب" class="hero-logo-img"></div></div>`;

const get = (col, ...q) => getDocs(query(collection(db, col), ...q)).then((r) => r.docs.map((d) => ({ id: d.id, ...d.data() })));

if (!s.user) {
  // الزائر: صفحة تعريفية بس، من غير أي محتوى
  $("hero").classList.add("short");
  // Counters for guests: fixed values
  countUp($("s1"), 2);
  countUp($("s2"), 300, "+");
  countUp($("s3"), 3900, "+");
  const v = verseOfTheDay();
  $("votd").innerHTML = `<div class="votd"><span class="votd-l">آية اليوم</span><p>${esc(v.t)}</p><span class="meta">${esc(v.r)}</span></div>`;

  // Fetch courses and meditations in PARALLEL for guests (faster load)
  const [coursesResult, medsResult] = await Promise.allSettled([
    get("courses", orderBy("order")),
    SITE.publicMeditations ? get("meditations", orderBy("createdAt", "desc")) : Promise.resolve(null)
  ]);
  const courses = coursesResult.status === "fulfilled" ? coursesResult.value : null;
  const meds = medsResult.status === "fulfilled" ? medsResult.value : null;

  // عدد محاضرات السنة = مجموع lectureCount على ترماتها (الضيوف ما يقدرش يقرأ lectures)
  const yearLecCount = (yearId) => (courses ? courses.filter((c) => !c.isParent && c.parentId === yearId).reduce((sum, t) => sum + (t.lectureCount || 0), 0) : 0);
  const yearCourses = courses ? courses.filter((c) => c.isParent) : [];
  if (yearCourses.length) {
    $("courses-sec").hidden = false;
    $("courses").innerHTML = yearCourses.map((c, i) => `<article class="card"><div class="media">${cover(c, i)}</div><div class="body"><h3>${esc(c.title)}</h3><p>${esc(c.description || "")}</p><div class="row-end"><span class="pill">${yearLecCount(c.id).toLocaleString("ar-EG")} محاضرات</span><span class="btn sm off" aria-disabled="true">متاح للدارسين</span></div></div></article>`).join("")
  } else {
    $("courses-sec").hidden = true;
    $("feat").hidden = false;
    const feats = [["المحاضرات", "ملفات كل محاضرة والفيديوهات بتفتح بعد تسجيل الدخول."], ["التأملات", "كلمات قصيرة بتنزل باستمرار للدارسين."], ["الواجب والإعلانات", "رابط الواجب والإعلانات المهمة في مكان واحد."]];
    $("featgrid").innerHTML = feats.map(([t, d], i) => `<article class="card"><div class="media">${cover({}, i)}<span class="tag">للدارسين</span></div><div class="body"><h3>${t}</h3><p>${d}</p></div></article>`).join("");
  }
  $("hw").hidden = true;
  $("ann-sec").hidden = true;
  if (SITE.publicMeditations) {
    $("meds").innerHTML = meds && meds.length ? meds.slice(0, 3).map((m, i) => `<article class="card"><div class="media">${cover(m, i + 1)}</div><div class="body"><span class="meta">${esc([m.author, fmtDate(m.createdAt)].filter(Boolean).join("، "))}</span><h3>${esc(m.title)}</h3><p>${esc(excerpt(m.body))}</p><div class="row-end"><a class="btn ghost sm" href="meditations.html#${esc(m.id)}">اقرأ التأمل</a></div></div></article>`).join("") : `<p class="empty">لسه مفيش تأملات.</p>`;
  } else $("meds-sec").hidden = true;
  $("cta").innerHTML = `<div class="cta"><h2>جاهز تبدأ؟</h2><p>سجل دخولك الآن.</p><button class="btn" data-login>دخول الدارسين</button></div>`;
} else {
  const [ann, meds, courses] = await Promise.allSettled([
    get("announcements", orderBy("createdAt", "desc"), limit(20)),
    get("meditations", orderBy("createdAt", "desc")),
    get("courses", orderBy("order"))
  ]).then((r) => r.map((x) => (x.status === "fulfilled" ? x.value : null)));

  countUp($("s1"), courses ? courses.filter((c) => c.isParent).length : 0);
  countUp($("s2"), 300, "+");
  countUp($("s3"), 3900, "+");

  const v = verseOfTheDay();
  $("votd").innerHTML = `<div class="votd"><span class="votd-l">آية اليوم</span><p>${esc(v.t)}</p><span class="meta">${esc(v.r)}</span></div>`;

  try {
    const h = (await getDoc(doc(db, "homework", "current"))).data();
    const open = !!(h && h.active && safeUrl(h.url));
    const dl = h?.deadline ? new Date(h.deadline).getTime() : null;
    const updateCountdown = () => {
      if (!dl) return { html: "", active: false };
      const now = Date.now();
      const diff = dl - now;
      if (diff <= 0) return { html: `<span class="chip off">انتهى</span>`, active: false };
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const s = [];
      if (days) s.push(`${days.toLocaleString("ar-EG")} يوم`);
      if (hours) s.push(`${hours.toLocaleString("ar-EG")} ساعة`);
      if (mins || !s.length) s.push(`${mins.toLocaleString("ar-EG")} دقيقة`);
      if (secs > 0 || !s.length) s.push(`${secs.toLocaleString("ar-EG")} ثانية`);
      return { html: `<span class="chip deadline">باقي ${s.join(" و")}</span>`, active: true };
    };
    const countdown = updateCountdown();
    const isAlive = open && (!dl || dl > Date.now());
    const badge = countdown.html || (open ? `<span class="chip on">مفتوح</span>` : `<span class="chip off">مقفول</span>`);
    $("hw").innerHTML = `<div class="hw-band${isAlive ? "" : " shut"}"><div class="hw-info"><h3>${esc(h?.title || "واجب المحاضرة")}</h3><p>${isAlive ? "الواجب مفتوح دلوقتي، ادخل وابدأ." : "مفيش واجب مفتوح دلوقتي."}</p></div><div class="hw-actions">${countdown.active ? `<span class="chip deadline">${countdown.html}</span>` : ""}${isAlive ? `<a class="btn gold" href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener">ابدأ الواجب</a>` : `<span class="btn off" aria-disabled="true">الواجب مقفول</span>`}</div></div>`;
    // تحديث العداد كل ثانية لو فيه deadline والواجب مفتوح
    let hwTimer = null;
    if (open && dl && countdown.active) {
      hwTimer = setInterval(() => {
        const c = updateCountdown();
        const badge = document.querySelector(".hw-band .chip");
        if (badge) badge.outerHTML = c.html;
        if (!c.active) {
          const band = document.querySelector(".hw-band");
          if (band) band.classList.add("shut");
          const link = document.querySelector(".hw-band a.btn.gold");
          if (link) link.outerHTML = `<span class="btn off" aria-disabled="true">الواجب مقفول</span>`;
          clearInterval(hwTimer);
        }
      }, 1000);
    }
  } catch { $("hw").innerHTML = `<p class="notice bad">تعذّر تحميل الواجب.</p>`; }

  const yearCourses = courses ? courses.filter((c) => c.isParent) : [];
  const termCourses = courses ? courses.filter((c) => !c.isParent) : [];
  const calcYearLectures = (yearId) => termCourses.filter((t) => t.parentId === yearId).reduce((sum, t) => sum + (t.lectureCount || 0), 0);
  $("courses").innerHTML = !courses ? `<p class="notice bad">تعذّر تحميل الكورسات. حدّث الصفحة وجرّب تاني.</p>`
    : yearCourses.length ? yearCourses.map((c, i) => `<article class="card"><div class="media">${cover(c, i)}</div><div class="body"><h3>${esc(c.title)}</h3><p>${esc(c.description || "")}</p><div class="row-end"><span class="pill">${calcYearLectures(c.id).toLocaleString("ar-EG")} محاضرات</span><a class="btn sm" href="courses.html#${esc(c.id)}">افتح الكورس</a></div></div></article>`).join("")
    : `<p class="empty">الكورسات هتظهر هنا أول ما الإدارة تضيفها.</p>`;

  if (ann && ann.length) {
    const items = [...ann].sort((x, y) => (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0));
    $("ann-sec").hidden = false;
    $("ann").innerHTML = items.map((x) => `<article class="note${x.pinned ? " pin" : ""}"><span class="meta">${x.pinned ? "مثبّت، " : ""}${fmtDate(x.createdAt)}</span><h3>${esc(x.title)}</h3>${x.body ? `<p>${esc(x.body).replace(/\n/g, "<br>")}</p>` : ""}</article>`).join("");
    const top = items.find((x) => x.pinned);
    if (top) { $("annbar").hidden = false; $("annbar").textContent = top.title; }
  }

  $("meds").innerHTML = !meds ? `<p class="notice bad">تعذّر تحميل التأملات.</p>`
    : meds.length ? meds.slice(0, 3).map((m, i) => `<article class="card"><div class="media">${cover(m, i + 1)}</div><div class="body"><span class="meta">${esc([m.author, fmtDate(m.createdAt)].filter(Boolean).join("، "))}</span><h3>${esc(m.title)}</h3><p>${esc(excerpt(m.body))}</p><div class="row-end"><a class="btn ghost sm" href="meditations.html#${esc(m.id)}">اقرأ التأمل</a></div></div></article>`).join("")
    : `<p class="empty">لسه مفيش تأملات.</p>`;
}
