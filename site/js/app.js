import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, limit, serverTimestamp, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, SITE } from "./config.js";
import { protect } from "./shield.js";
import { toEmail, esc, fmtDate, excerpt, renderText, safeUrl, viewUrl, downloadUrl } from "./utils.js";

export const configured = !firebaseConfig.apiKey.startsWith("PASTE");
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, limit, serverTimestamp, increment, onSnapshot, signOut, SITE, firebaseConfig };

export { toEmail, esc, fmtDate, excerpt, renderText, safeUrl, viewUrl, downloadUrl };

export function toast(msg, bad = false) {
  const t = document.createElement("div");
  t.className = "toast" + (bad ? " bad" : "");
  t.textContent = msg;
  t.setAttribute("role", "status");
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

const CROSS = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M26 4H38L36 12V28H52L60 26V38L52 36H36V52L38 60H26L28 52V36H12L4 38V26L12 28H28V12Z" fill="currentColor"/></svg>`;
export const cover = (item, i = 0) => (safeUrl(item.cover) ? `<img src="${esc(safeUrl(item.cover))}" alt="" loading="lazy">` : `<span class="cv cv${i % 3}">${CROSS}</span>`);

export function countUp(el, n, suffix = "") {
  const fmt = (v) => v.toLocaleString("ar-EG") + suffix;
  if (!n || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { el.textContent = fmt(n || 0); return; }
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return; io.disconnect();
    const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 1200); el.textContent = fmt(Math.round(n * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  io.observe(el);
}

const deviceId = (() => { try { let d = localStorage.getItem("dev-id"); if (!d) { d = crypto.randomUUID(); localStorage.setItem("dev-id", d); } return d; } catch { return "no-storage"; } })();

// يرجّع المستخدم + بروفايله. لو الحساب مش متفعّل بيعمل خروج.
export function session() {
  return new Promise((resolve) => {
    const off = onAuthStateChanged(auth, async (user) => {
      off();
      if (!user) return resolve({ user: null, profile: null });
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const profile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        if (!profile || profile.active !== true) { await signOut(auth); return resolve({ user: null, profile: null }); }
        // جلسة واحدة بس لكل حساب: لو الحساب اتفتح من جهاز تاني، الجهاز ده يخرج
        const sref = doc(db, "sessions", user.uid), sd = await getDoc(sref);
        if (sd.exists() && sd.data().deviceId !== deviceId) { await signOut(auth); try { sessionStorage.setItem("kicked", "1"); } catch {} return resolve({ user: null, profile: null }); }
        if (!sd.exists()) await setDoc(sref, { deviceId, at: serverTimestamp() });
        resolve({ user, profile });
      } catch { resolve({ user: null, profile: null }); }
    });
  });
}

export async function login(username, password) {
  const cred = await signInWithEmailAndPassword(auth, toEmail(username), password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists() || snap.data().active !== true) { await signOut(auth); throw { code: "app/inactive" }; }
  await setDoc(doc(db, "sessions", cred.user.uid), { deviceId, at: serverTimestamp() });
}

const ICONS = {
  facebook: '<path d="M13 22v-8h3l.5-3.5H13V8.3c0-1 .3-1.7 1.8-1.7h1.9V3.4c-.3 0-1.4-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.8h-3V14h3v8z"/>',
  whatsapp: '<path d="M12 2a10 10 0 0 0-8.600 15.100L2 22l5-1.300A10 10 0 1 0 12 2zm5.200 14.100c-.2.600-1.300 1.200-1.800 1.200-.5.100-1 .2-3.300-.7-2.800-1.100-4.600-4-4.700-4.200-.1-.2-1.100-1.500-1.100-2.800s.7-2 .9-2.300c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 2c.1.200.1.300 0 .5l-.3.400-.4.500c-.1.100-.3.300-.1.600.2.300.8 1.300 1.700 2.100 1.200 1 2.100 1.300 2.400 1.500.3.100.5.100.6-.1l.9-1.100c.2-.3.400-.2.700-.1l1.900.9c.3.100.5.200.5.300.1.200.1.800-.1 1.400z"/>',
  telegram: '<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zM4.957 7.397c.226-3.453 3.047-3.76 5.04-4.725 2.204-1.095 3.307-1.16 4.044-.178.737.983.64 2.783.357 4.643-.29 1.888-1.41 4.748-2.162 6.338-.947 2.067-1.65 2.727-2.357 2.767-.707.04-1.07-.453-1.82-.947l-2.5-1.577zm2.2-1.577c.57 1.45 1.52 3.64 2.24 5.07.77 1.5 1.57 2.3 2.14 2.24.56-.06 1.34-.72 1.94-2.2.6-1.47 1.5-4.05 1.7-5.4.2-1.35-.17-2.17-.74-2.27-.57-.1-1.44.27-2.28.87-.84.6-1.82 1.53-2.17 2.17-.34.64-.44 1.08-.83 2.02z"/>'
};
const loginHtml = (tag = "h2") => `<img src="images/logo.png" alt=""><${tag}>أهلاً بك مرة أخرى!</${tag}><p class="meta">اكتب اسم المستخدم وكلمة المرور اللي اتسلّمتلك.</p><div data-msg role="alert"></div><label>اسم المستخدم</label><input data-u autocomplete="username" dir="ltr" autocapitalize="none" spellcheck="false"><label>كلمة المرور</label><input data-p type="password" autocomplete="current-password" dir="ltr"><button class="btn block" data-go>تسجيل الدخول</button>`;

export function renderChrome(active, s) {
  const L = SITE.links || {};
  const links = [["home", "index.html", "الرئيسية"], ["courses", "courses.html", "المحاضرات"], ["med", "meditations.html", "التأملات"], ["about", "about.html", "من نحن"]];
  if (s.profile?.role === "admin") links.push(["admin", "admin.html", "الإدارة"]);
  document.getElementById("site-header").innerHTML = `
    <div class="annbar" id="annbar" hidden></div>
    <div class="top"><div class="wrap in">
      <a class="brand" href="index.html"><img src="images/logo.png" alt=""><span class="bn">${esc(SITE.name)}<small>معهد الكتاب المقدس</small></span></a>
      <nav aria-label="القائمة الرئيسية">${links.map(([k, h, l]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav>
      <div class="acct">${s.user ? `<span class="who">${esc(s.profile.name)}</span><button id="logout" class="btn ghost sm">خروج</button>` : `<button class="btn gold sm" data-login>دخول الدارسين</button>`}</div>
    </div></div>`;
  const social = ["facebook"].filter((k) => L[k]).map((k) => `<a href="${esc(safeUrl(L[k]))}" target="_blank" rel="noopener noreferrer" aria-label="${k}"><svg viewBox="0 0 24 24" fill="currentColor">${ICONS[k]}</svg></a>`);
  if (L.whatsapp) social.push(`<a href="${esc(safeUrl(L.whatsapp))}" target="_blank" rel="noopener noreferrer" aria-label="whatsapp"><svg viewBox="0 0 24 24" fill="currentColor">${ICONS.whatsapp}</svg></a>`);
  // تليجرام: يحمّل من Firestore للدارسين فقط (مش ظاهر في Source Code)
  let telegramLink = "";
  if (s.user && L.telegram) {
    telegramLink = `<a href="${esc(safeUrl(L.telegram))}" target="_blank" rel="noopener noreferrer" aria-label="telegram" style="color:var(--gold);text-decoration:none;display:inline-flex;align-items:center;gap:.4rem;margin-block-start:.8rem"><svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;flex:none">${ICONS.telegram}</svg>جروب التليجرام للدارسين</a>`;
  }
  document.getElementById("site-footer").innerHTML = `
    <div class="fband" aria-hidden="true"></div>
    <div class="wrap fgrid">
      <div><span class="plate"><img src="images/logo.png" alt=""></span><p>${esc(SITE.tagline || SITE.heroLead)}</p>${social.length ? `<div class="social">${social.join("")}</div>` : ""}${telegramLink}</div>
      <div><h4>روابط سريعة</h4><ul>${links.map(([, h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></div>
      <div><h4>المعهد</h4><span class="plate"><img src="images/cathedral.png" alt=""></span><p>${esc(SITE.institute)}</p>${SITE.instituteInfo ? `<p style="white-space:pre-line">${esc(SITE.instituteInfo)}</p>` : ""}${L.address ? `<p>${esc(L.address)}</p>` : ""}</div>
    </div>
    <div class="copy">© ${new Date().getFullYear()} ${esc(SITE.name)} — معهد الكتاب المقدس</div>`;
  document.getElementById("logout")?.addEventListener("click", async () => { await signOut(auth); location.href = "index.html"; });
  if (s.user) {
    onSnapshot(doc(db, "sessions", s.user.uid), (snap) => {
      if (snap.exists() && snap.data().deviceId !== deviceId) signOut(auth).then(() => { alert("الحساب اتفتح من جهاز تاني، فتم تسجيل الخروج من هنا."); location.href = "login.html"; });
    });
    if (active !== "admin") protect({ name: s.profile.name, username: s.profile.username }, { signOutFn: () => signOut(auth) });
  }
  if (!s.user && active !== "login") {
    const d = document.createElement("dialog");
    d.id = "login-dlg"; d.className = "dlg";
    d.innerHTML = `<div class="dlg-in"><button class="x" aria-label="إغلاق" data-close>×</button>${loginHtml()}</div>`;
    document.body.appendChild(d);
    d.addEventListener("click", (e) => { if (e.target === d || e.target.hasAttribute("data-close")) d.close(); });
    bindLogin(d, () => location.reload());
  }
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-login]")) return;
    const d = document.getElementById("login-dlg");
    if (d) { d.showModal(); d.querySelector("[data-u]").focus(); } else location.href = "login.html";
  });
  if (!configured) document.querySelector("main").insertAdjacentHTML("afterbegin", `<div class="wrap page-body"><p class="notice bad">بيانات Firebase لسه ما اتحطتش في <code>site/js/config.js</code></p></div>`);
}

export const loginBox = () => loginHtml("h2");

export function bindLogin(root, onDone) {
  const q = (x) => root.querySelector(x), u = q("[data-u]"), p = q("[data-p]"), go = q("[data-go]"), msg = q("[data-msg]");
  const submit = async () => {
    msg.innerHTML = "";
    if (!u.value.trim() || !p.value) { msg.innerHTML = `<p class="notice bad">اكتب اسم المستخدم وكلمة المرور.</p>`; return; }
    go.disabled = true;
    try { await login(u.value, p.value); onDone(); }
    catch (e) {
      const bad = ["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password", "auth/invalid-email"].includes(e.code);
      msg.innerHTML = `<p class="notice bad">${e.code === "app/inactive" ? "الحساب ده مش مفعّل. كلّم الإدارة." : bad ? "اسم المستخدم أو كلمة المرور غلط." : e.code === "auth/too-many-requests" ? "محاولات كتير. استنى شوية وجرّب تاني." : "حصلت مشكلة. جرّب تاني."}</p>`;
    } finally { go.disabled = false; }
  };
  go.onclick = submit;
  [u, p].forEach((i) => i.addEventListener("keydown", (e) => e.key === "Enter" && submit()));
}

export function requireLogin(s) {
  if (!s.user) { location.replace(`login.html?next=${location.pathname.split("/").pop() || "index.html"}${location.hash}`); return false; }
  return true;
}
