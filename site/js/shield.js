// طبقات حماية المحتوى في المتصفح (منع النسخ + كشف أدوات المطوّر).
// مهم: ده بيصعّب جداً على غير المتمكّنين، لكن مفيش حماية 100% في أي موقع (شوف docs/SECURITY.md).
import { SECURITY } from "./config.js";

const isField = (t) => !!(t && t.closest && t.closest("input,textarea,select,[contenteditable=true]"));

export function protect(_user, { signOutFn } = {}) {
  document.body.classList.add("nocopy");

  const cover = document.createElement("div"); cover.className = "shield-cover"; cover.hidden = true; document.body.appendChild(cover);
  let devOpen = false;
  const hide = (msg) => { cover.textContent = msg; cover.hidden = false; };
  const show = () => { if (!devOpen) cover.hidden = true; };

  // منع تحديد/نسخ/قص/سحب/قائمة الفأرة اليمين (إلا جوه خانات الكتابة)
  const stop = (e) => { if (!isField(e.target)) e.preventDefault(); };
  ["contextmenu", "selectstart", "dragstart"].forEach((t) => document.addEventListener(t, stop));
  ["copy", "cut"].forEach((t) => document.addEventListener(t, (e) => { if (isField(e.target)) return; e.preventDefault(); e.clipboardData?.setData("text/plain", "المحتوى محمي"); }));

  // اختصارات: F12 وأدوات المطوّر (ويندوز/ماك/فايرفوكس) وعرض المصدر والحفظ والطباعة والنسخ
  document.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase(), c = e.ctrlKey || e.metaKey, inField = isField(e.target);
    if (k === "f12"
      || (c && e.shiftKey && ["i", "j", "c", "k", "e", "m", "s"].includes(k))
      || (c && e.altKey && ["i", "j", "c", "u"].includes(k))
      || (c && ["s", "p", "u"].includes(k))
      || (!inField && c && ["c", "x", "a"].includes(k))) e.preventDefault();
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "PrintScreen") { navigator.clipboard?.writeText("").catch(() => {}); hide("تصوير الشاشة غير مسموح."); setTimeout(show, 1500); }
  });
  window.addEventListener("beforeprint", () => hide("الطباعة غير مسموحة."));
  window.addEventListener("afterprint", show);

  if (SECURITY.blurOnHidden) document.addEventListener("visibilitychange", () => document.body.classList.toggle("shield-off", document.hidden));

  // كشف أدوات المطوّر: (1) فرق حجم النافذة على الكمبيوتر  (2) فخ debugger بيتأخر لو الأدوات مفتوحة
  if (SECURITY.devtoolsGuard) {
    const desktop = !matchMedia("(pointer: coarse)").matches;
    setInterval(() => {
      let open = desktop && (window.outerWidth - window.innerWidth > 240 || window.outerHeight - window.innerHeight > 300);
      const t = performance.now(); debugger; if (performance.now() - t > 120) open = true;
      if (open === devOpen) return;
      devOpen = open;
      if (open) { document.querySelector("main")?.replaceChildren(); hide("اقفل أدوات المطوّر علشان تكمل."); }  // بيمسح المحتوى نفسه مش بس بيغطيه
      else location.reload();
    }, 1000);
  }

  if (SECURITY.idleMinutes > 0) {
    let last = Date.now();
    ["mousemove", "keydown", "touchstart", "scroll", "click"].forEach((t) => addEventListener(t, () => (last = Date.now()), { passive: true }));
    setInterval(async () => {
      if (Date.now() - last > SECURITY.idleMinutes * 60000) { try { await signOutFn?.(); } finally { location.href = "login.html?idle=1"; } }
    }, 30000);
  }
}
