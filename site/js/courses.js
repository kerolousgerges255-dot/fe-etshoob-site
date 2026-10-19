import { session, renderChrome, requireLogin, auth, db, collection, getDocs, query, orderBy, esc, viewUrl, downloadUrl, SITE } from "./app.js";
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
    <div class="acts">${(viewUrl(l.pdfUrl || "") && downloadUrl(l.pdfUrl || ""))
      ? `<a class="btn sm" href="${esc(downloadUrl(l.pdfUrl))}" target="_blank" rel="noopener">تحميل PDF</a><a class="btn ghost sm" href="${esc(viewUrl(l.pdfUrl))}" target="_blank" rel="noopener">عرض</a>`
      : `<span class="btn sm off" aria-disabled="true">الملف لسه ما اتضافش</span>`}${l.videoId ? (SITE.video?.worker ? `<button class="btn ghost sm" data-play="${esc(l.videoId)}" data-title="${esc(l.title)}">شاهد الفيديو</button>` : `<span class="btn sm off" aria-disabled="true">الفيديو قريباً</span>`) : ""}</div></div>`;
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

  // مشغّل الفيديو المحمي
  const vd = document.getElementById("vdlg"), box = document.getElementById("vbox");
  const closeVideo = () => { box.innerHTML = ""; };
  vd.addEventListener("click", (e) => { if (e.target === vd || e.target.hasAttribute("data-close")) vd.close(); });
  vd.addEventListener("close", closeVideo);
  list.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-play]"); if (!b) return;
    document.getElementById("vt").textContent = b.dataset.title;
    box.innerHTML = `<p class="empty">جاري تجهيز الفيديو…</p>`; vd.showModal();
    try {
      const token = await auth.currentUser.getIdToken();
      const r = await fetch(`${SITE.video.worker}/embed?video=${encodeURIComponent(b.dataset.play)}`, { headers: { Authorization: "Bearer " + token } });
      if (!r.ok) throw new Error(r.status);
      const { url } = await r.json();
      box.innerHTML = `<iframe src="${esc(url)}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`;
    } catch { box.innerHTML = `<p class="empty">تعذّر تشغيل الفيديو. حدّث الصفحة وجرّب تاني.</p>`; }
  });
}
