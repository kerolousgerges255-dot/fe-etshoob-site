import { session, renderChrome, requireLogin, auth, db, collection, getDocs, query, orderBy, esc, downloadUrl, SITE, safeUrl, renderText, cover } from "./app.js";
const s = await session();
renderChrome("courses", s);

if (requireLogin(s)) {
  const list = document.getElementById("list"), q = document.getElementById("q");
  let courses = [], lectures = [], failed = false;

  try {
    courses = (await getDocs(query(collection(db, "courses"), orderBy("order")))).docs.map((d) => ({ id: d.id, ...d.data() }));
    lectures = (await getDocs(query(collection(db, "lectures"), orderBy("courseId")))).docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch { failed = true; list.innerHTML = `<p class="notice bad">تعذّر تحميل المحاضرات. حدّث الصفحة وجرّب تاني.</p>`; }

  // Group by year (isParent) and term (parentId)
  const years = courses.filter((c) => c.isParent);
  const terms = courses.filter((c) => !c.isParent);

  const row = (l, n) => `<div class="lec"><span class="num">${n.toLocaleString("ar-EG")}</span>
    <div><h3>${esc(l.title)}</h3><div class="chips">${l.instructor ? `<span class="chip2">${esc(l.instructor)}</span>` : ""}${l.lectureDate ? `<span class="chip2">${esc(l.lectureDate)}</span>` : ""}</div>${l.description ? `<p class="desc">${esc(l.description)}</p>` : ""}</div>
    <div class="acts">
      ${downloadUrl(l.pdfUrl || "") ? `<a class="btn sm" href="${esc(downloadUrl(l.pdfUrl))}" target="_blank" rel="noopener">تحميل PDF</a>` : `<span class="btn sm off" aria-disabled="true">الملف لسه ما اتضافش</span>`}
      ${l.videoId ? (SITE.video?.worker ? `<button class="btn ghost sm" data-play="${esc(l.videoId)}" data-title="${esc(l.title)}">شاهد الفيديو</button>` : `<span class="btn sm off" aria-disabled="true">الفيديو قريبااً</span>`) : ""}
    </div></div>`;

  const termRow = (t, n, lc) => `<div class="lec term-row" data-term="${esc(t.id)}"><span class="num">${n.toLocaleString("ar-EG")}</span>
    <div><h3>${esc(t.title)}</h3>${t.description ? `<p class="desc">${esc(t.description)}</p>` : ""}</div>
    <div class="acts">
      <span class="pill">${lc.toLocaleString("ar-EG")} محاضرات</span>
      <a class="btn sm" href="#term-${esc(t.id)}">افتح</a>
    </div></div>`;

  const termCard = (term, lectureCount) => {
    const emptyHtml = lectureCount === 0 ? `<p class="empty" style="margin-top:0.5rem">لسه مفيش محاضرات</p>` : "";
    return `<article class="card term-card" data-term="${esc(term.id)}">
      <div class="media">${cover(term)}</div>
      <div class="body">
        <h3>${esc(term.title)}</h3>
        <div class="row-end">
          <span class="pill">${lectureCount.toLocaleString("ar-EG")} محاضرات</span>
          <a class="btn sm" href="#term-${esc(term.id)}">افتح الترم</a>
        </div>
        ${emptyHtml}
      </div>
    </article>`;
  };

  const drawYears = () => {
    if (failed) return;
    let html = '<div class="year-grid">';
    for (const year of years) {
      const yearTerms = terms.filter((t) => t.parentId === year.id).sort((a, b) => a.order - b.order);
      const termCards = yearTerms.map((t, i) => {
        const lc = lectures.filter((l) => l.courseId === t.id).length;
        return termRow(t, i + 1, lc);
      }).join("");
      html += `<section class="year-section" id="${esc(year.id)}">
        <div class="year-header">
          <div class="media">${cover(year)}</div>
          <div class="year-info"><h2>${esc(year.title)}</h2>${year.description ? `<p>${esc(year.description)}</p>` : ""}</div>
        </div>
        <div class="terms-grid">${termCards}</div>
      </section>`;
    }
    html += '</div>';
    list.innerHTML = html;
  };

  const drawTerm = (termId) => {
    const term = terms.find((t) => t.id === termId);
    if (!term) return drawYears();
    const year = years.find((y) => y.id === term.parentId);
    const termLectures = lectures.filter((l) => l.courseId === termId).sort((a, b) => a.order - b.order);
    const backYear = year ? `<button class="btn ghost sm" data-back-year="${esc(year.id)}">رجوع للسنة</button>` : "";
    const backAll = `<button class="btn ghost sm" data-back-all>كل الكورسات</button>`;
    list.innerHTML = `
      <div class="term-view">
        <div class="term-header">
          <div class="back-row">${backYear}${backAll}</div>
          <h2>${esc(term.title)}</h2>
          ${term.description ? `<p>${esc(term.description)}</p>` : ""}
        </div>
        <div class="lectures-list">${termLectures.length ? termLectures.map((l, n) => row(l, n + 1)).join("") : '<p class="empty">لسه مفيش محاضرات للترم ده.</p>'}</div>
      </div>`;
  };

  // Search: filter lectures (not terms) — show individual matching lectures
  const draw = () => {
    if (failed) return;
    const t = q.value.trim().toLowerCase();
    if (!t) return drawYears();
    const matchedLectures = lectures.filter((l) => [l.title, l.description, l.instructor].join(" ").toLowerCase().includes(t)).sort((a, b) => a.order - b.order);
    if (!matchedLectures.length) {
      list.innerHTML = `<p class="empty">مفيش محاضرات توافق البحث ده.</p>`;
      return;
    }
    list.innerHTML = `<div class="lectures-list">${matchedLectures.map((l, n) => row(l, n + 1)).join("")}</div>`;
  };

  // Lecture Reader Modal
  const rd = document.getElementById("rdlg"), rbody = document.getElementById("rbody"), rtitle = document.getElementById("rtitle"), rmeta = document.getElementById("rmeta"), rcover = document.getElementById("rcover");
  const closeReader = () => { rbody.innerHTML = ""; };
  rd.addEventListener("click", (e) => { if (e.target === rd || e.target.hasAttribute("data-close")) rd.close(); });
  rd.addEventListener("close", closeReader);
  rd.addEventListener("close", () => history.replaceState(null, "", location.pathname));

  const openLecture = async (id, title) => {
    const l = lectures.find((x) => x.id === id); if (!l) return;
    rtitle.textContent = l.title;
    rmeta.textContent = [l.instructor, l.lectureDate].filter(Boolean).join("، ");
    rcover.innerHTML = safeUrl(l.cover) ? `<img src="${esc(safeUrl(l.cover))}" alt="">` : "";
    rbody.innerHTML = renderText(l.body || "محتوى المحاضرة هيتضاف من لوحة الإدارة.");
    const pdfBtn = document.getElementById("rpdf");
    if (downloadUrl(l.pdfUrl || "")) {
      pdfBtn.href = downloadUrl(l.pdfUrl);
      pdfBtn.hidden = false;
    } else {
      pdfBtn.hidden = true;
    }
    history.replaceState(null, "", "#lecture-" + id);
    rd.showModal();
    rd.querySelector(".reader-in").scrollTop = 0;
  };

  list.addEventListener("click", async (e) => {
    const termBtn = e.target.closest("[data-term]");
    if (termBtn) { drawTerm(termBtn.dataset.term); return; }
    const backYear = e.target.closest("[data-back-year]");
    if (backYear) { location.hash = "#" + backYear.dataset.backYear; drawYears(); return; }
    const backAll = e.target.closest("[data-back-all]");
    if (backAll) { history.back(); drawYears(); return; }
    const openLectureBtn = e.target.closest("[data-open-lecture]");
    if (openLectureBtn) {
      openLecture(openLectureBtn.dataset.openLecture, openLectureBtn.dataset.title);
      return;
    }
    const playBtn = e.target.closest("[data-play]");
    if (playBtn) {
      document.getElementById("vt").textContent = playBtn.dataset.title;
      const vbox = document.getElementById("vbox");
      vbox.innerHTML = `<p class="empty">جاري تجهيز الفيديو…</p>`;
      const vd = document.getElementById("vdlg");
      vd.showModal();
      try {
        if (!auth.currentUser) throw new Error("غير مصدق");
        // استخدام getIdTokenResult للحصول على JWT مختصر العمر
        const tokenResult = await auth.currentUser.getIdTokenResult();
        const r = await fetch(`${SITE.video.worker}/embed?video=${encodeURIComponent(playBtn.dataset.play)}`, {
          headers: { "Authorization": `Bearer ${tokenResult.token}` }
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const { url } = await r.json();
        vbox.innerHTML = `<iframe src="${esc(url)}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`;
      } catch (err) {
        const msg = err?.message?.includes("غير مصدق")
          ? "يجب تسجيل الدخول أولاً"
          : "تعذّر تشغيل الفيديو. حدّث الصفحة وجرّب تاني.";
        vbox.innerHTML = `<p class="empty">${msg}</p>`;
      }
    }
  });

  q.addEventListener("input", draw);
  drawYears();

  // Deep link handling
  if (location.hash) {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash.startsWith("term-")) {
      drawTerm(hash.replace("term-", ""));
    } else {
      // Try as year ID
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView();
    }
  }
}
