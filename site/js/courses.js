import { session, renderChrome, requireLogin, auth, db, collection, getDocs, query, orderBy, esc, viewUrl, downloadUrl, SITE, safeUrl, renderText } from "./app.js";
const s = await session();
renderChrome("courses", s);
if (requireLogin(s)) {
  const list = document.getElementById("list"), q = document.getElementById("q");
  let courses = [], lectures = [], failed = false;
  try {
    courses = (await getDocs(query(collection(db, "courses"), orderBy("order")))).docs.map((d) => ({ id: d.id, ...d.data() }));
    lectures = (await getDocs(query(collection(db, "lectures"), orderBy("order")))).docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch { failed = true; list.innerHTML = `<p class="notice bad">تعذّر تحميل المحاضرات. حدّث الصفحة وجرّب تاني.</p>`; }

  const row = (l, n) => `<div class="lec"><span class="num">${n.toLocaleString("ar-EG")}</span>
    <div><h3>${esc(l.title)}</h3><div class="chips">${l.instructor ? `<span class="chip2">${esc(l.instructor)}</span>` : ""}${l.lectureDate ? `<span class="chip2">${esc(l.lectureDate)}</span>` : ""}</div>${l.description ? `<p class="desc">${esc(l.description)}</p>` : ""}</div>
    <div class="acts">
      <button class="btn ghost sm" data-open-lecture="${esc(l.id)}" data-title="${esc(l.title)}">افتح المحاضرة</button>
      ${downloadUrl(l.pdfUrl || "") ? `<a class="btn sm" href="${esc(downloadUrl(l.pdfUrl))}" target="_blank" rel="noopener">تحميل PDF</a>` : `<span class="btn sm off" aria-disabled="true">الملف لسه ما اتضافش</span>`}
      ${l.videoId ? (SITE.video?.worker ? `<button class="btn ghost sm" data-play="${esc(l.videoId)}" data-title="${esc(l.title)}">شاهد الفيديو</button>` : `<span class="btn sm off" aria-disabled="true">الفيديو قريباً</span>`) : ""}
    </div></div>`;

  const draw = () => {
    if (failed) return;
    const t = q.value.trim().toLowerCase();
    const html = courses.map((c) => {
      const all = lectures.filter((l) => l.courseId === c.id);
      const ls = all.filter((l) => !t || [l.title, l.description, l.instructor].join(" ").toLowerCase().includes(t));
      return ls.length ? `<section class="course" id="${esc(c.id)}"><div class="course-h"><h2>${esc(c.title)}</h2>${c.description ? `<p>${esc(c.description)}</p>` : ""}</div>${ls.map((l) => row(l, all.indexOf(l) + 1)).join("")}</section>` : "";
    }).join("");
    list.innerHTML = html || `<p class="empty">${t ? "مفيش محاضرة بالاسم ده." : "لسه مفيش محاضرات. هتظهر هنا أول ما الإدارة تضيفها."}</p>`;
  };
  q.addEventListener("input", draw); draw();
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();

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
    const openBtn = e.target.closest("[data-open-lecture]");
    if (openBtn) {
      openLecture(openBtn.dataset.openLecture, openBtn.dataset.title);
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
        const token = await auth.currentUser.getIdToken();
        const r = await fetch(`${SITE.video.worker}/embed?video=${encodeURIComponent(playBtn.dataset.play)}`, { headers: { Authorization: "Bearer " + token } });
        if (!r.ok) throw new Error(r.status);
        const { url } = await r.json();
        vbox.innerHTML = `<iframe src="${esc(url)}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`;
      } catch { vbox.innerHTML = `<p class="empty">تعذّر تشغيل الفيديو. حدّث الصفحة وجرّب تاني.</p>`; }
    }
  });
}
