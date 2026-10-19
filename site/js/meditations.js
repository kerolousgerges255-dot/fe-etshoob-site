import { session, renderChrome, requireLogin, SITE, safeUrl, db, collection, getDocs, query, orderBy, esc, fmtDate, excerpt, cover, renderText } from "./app.js";
const s = await session();
renderChrome("med", s);
async function main() {
const $ = (id) => document.getElementById(id), list = $("list"), q = $("q"), dlg = $("reader");
let size = 1.2;
try { size = parseFloat(localStorage.getItem("read-size")) || 1.2; } catch {}
const setSize = (v) => { size = Math.min(1.8, Math.max(1, v)); document.documentElement.style.setProperty("--read", size + "rem"); try { localStorage.setItem("read-size", size); } catch {} };
setSize(size);
$("sm").onclick = () => setSize(size - 0.1); $("lg").onclick = () => setSize(size + 0.1);
dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.hasAttribute("data-close")) dlg.close(); });
dlg.addEventListener("close", () => history.replaceState(null, "", location.pathname));

let items = [];
try { items = (await getDocs(query(collection(db, "meditations"), orderBy("createdAt", "desc")))).docs.map((d) => ({ id: d.id, ...d.data() })); }
catch { list.innerHTML = `<p class="notice bad">تعذّر تحميل التأملات. حدّث الصفحة وجرّب تاني.</p>`; }

const open = (id) => {
  const m = items.find((x) => x.id === id); if (!m) return;
  $("rt").textContent = m.title; $("rm").textContent = [m.author, fmtDate(m.createdAt)].filter(Boolean).join("، ");
  $("rb").innerHTML = (safeUrl(m.cover) ? `<img src="${esc(safeUrl(m.cover))}" alt="">` : "") + renderText(m.body || "");
  history.replaceState(null, "", "#" + id); dlg.showModal(); dlg.querySelector(".reader-in").scrollTop = 0;
};
const draw = () => {
  const t = q.value.trim().toLowerCase();
  const f = items.filter((x) => !t || [x.title, x.author, x.body].join(" ").toLowerCase().includes(t));
  list.innerHTML = f.length ? f.map((m, i) => `<article class="card"><div class="media">${cover(m, i)}</div><div class="body"><span class="meta">${esc([m.author, fmtDate(m.createdAt)].filter(Boolean).join("، "))}</span><h3>${esc(m.title)}</h3><p>${esc(excerpt(m.body))}</p><div class="row-end"><button class="btn ghost sm" data-open="${esc(m.id)}">اقرأ التأمل</button></div></div></article>`).join("")
    : `<p class="empty">${t ? "مفيش نتايج للبحث ده." : "لسه مفيش تأملات. هتظهر هنا أول ما الإدارة تنشرها."}</p>`;
};
list.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) open(b.dataset.open); });
q.addEventListener("input", draw); draw();
if (location.hash) open(decodeURIComponent(location.hash.slice(1)));
}
if (SITE.publicMeditations || requireLogin(s)) main();
