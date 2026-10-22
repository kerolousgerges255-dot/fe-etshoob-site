import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut as signOutSec } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { session, renderChrome, requireLogin, db, auth, firebaseConfig, toEmail, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, serverTimestamp, increment, safeUrl, esc, fmtDate, toast } from "./app.js";

// ── CSRF Protection ──────────────────────────────────────────────────────────
// 生成一次CSRF token，每次写操作附带验证
const csrfToken = (() => {
  let token = sessionStorage.getItem("csrf-token");
  if (!token) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    sessionStorage.setItem("csrfToken", token);
  }
  return token;
})();

// 在写入操作中添加CSRF token和时间戳
async function csrfProtectedWrite(fn, ...args) {
  const [ref, data] = args;
  if (data && typeof data === "object") {
    data._csrfToken = csrfToken;
    data._csrfTime = Date.now();
  }
  try {
    const result = await fn(...args);
    toast("تمت العملية بنجاح");
    return result;
  } catch (e) {
    if (e.code === "permission-denied") {
      toast("خطأ: صلاحية غير كافية أو token غير صالح", true);
    } else {
      toast(`فشل: ${e.message || e.code}`, true);
    }
    throw e;
  }
}

const s = await session();
renderChrome("admin", s);
const $ = (id) => document.getElementById(id);
const panel = $("panel");

const SECTIONS = {
  announcements: { label: "الإعلانات", orderBy: ["createdAt", "desc"], fields: [
    { k: "title", l: "العنوان", t: "text", req: 1 }, { k: "body", l: "النص", t: "textarea" }, { k: "pinned", l: "تثبيت في أول القائمة", t: "check" }] },
  meditations: { label: "التأملات", orderBy: ["createdAt", "desc"], fields: [
    { k: "title", l: "عنوان التأمل", t: "text", req: 1 }, { k: "author", l: "الكاتب", t: "text" }, { k: "cover", l: "رابط صورة (اختياري)", t: "url" },
    { k: "body", l: "النص", t: "textarea", tall: 1, hint: "سطر فاضي = فقرة جديدة. ابدأ السطر بـ ‎## لعنوان فرعي، وبـ ‎> للآية أو الاقتباس." }] },
  courses: { label: "الكورسات", orderBy: ["order", "asc"], fields: [
    { k: "title", l: "اسم الكورس", t: "text", req: 1 }, { k: "description", l: "وصف قصير", t: "text" }, { k: "cover", l: "رابط صورة الغلاف (اختياري)", t: "url" }, { k: "order", l: "الترتيب (رقم)", t: "number" },
    { k: "isParent", l: "كورس رئيسي (يظهر في الصفحة الرئيسية)", t: "check" }, { k: "parentId", l: "الكورس الرئيسي", t: "parent", hint: "اختر السنة الرئيسية التي يتبعها هذا الترم" }] },
  lectures: { label: "المحاضرات", orderBy: ["order", "asc"], fields: [
    { k: "courseId", l: "الكورس", t: "course", req: 1 }, { k: "title", l: "عنوان المحاضرة", t: "text", req: 1 }, { k: "lectureNo", l: "رقم المحاضرة (مثال: المحاضرة الأولى)", t: "text" },
    { k: "instructor", l: "المحاضر (مثال: القس إسحق عطية)", t: "text" }, { k: "lectureDate", l: "تاريخ المحاضرة (اختياري)", t: "text" }, { k: "description", l: "وصف قصير", t: "text" },
    { k: "pdfUrl", l: "رابط PDF (Google Drive)", t: "url", hint: "ارفع الملف على Drive > Share > Anyone with the link > انسخ الرابط." },
    { k: "order", l: "الترتيب (رقم)", t: "number" }] }
};
const TABS = [...Object.keys(SECTIONS).slice(0, 2), "homework", "courses", "lectures", "students", "contact"];
const LABELS = { homework: "الواجب", students: "الدارسين", contact: "الرسائل", ...Object.fromEntries(Object.entries(SECTIONS).map(([k, v]) => [k, v.label])) };

function open(t) {
  document.querySelectorAll("#tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.t === t));
  panel.innerHTML = "";
  (t === "homework" ? homework : t === "students" ? students : t === "contact" ? contact : (box) => crud(box, t))(panel);
}

const val = (f) => { const e = $("f-" + f.k); return f.t === "check" ? e.checked : f.t === "number" ? Number(e.value || 0) : e.value.trim(); };
const fieldHtml = (f, d, opts) => {
  const v = d[f.k] ?? "", id = `f-${f.k}`, h = f.hint ? `<div class="meta">${f.hint}</div>` : "";
  if (f.t === "check") return `<label class="chk"><input type="checkbox" id="${id}" ${v ? "checked" : ""}>${f.l}</label>`;
  if (f.t === "textarea") return `<label for="${id}">${f.l}</label><textarea id="${id}" ${f.tall ? 'style="min-height:300px"' : ""}>${esc(v)}</textarea>${h}`;
  if (f.t === "course") return `<label for="${id}">${f.l}</label><select id="${id}">${opts.map((o) => `<option value="${esc(o.id)}" ${o.id === v ? "selected" : ""}>${esc(o.title)}</option>`).join("")}</select>`;
  if (f.t === "parent") return `<label for="${id}">${f.l}</label><select id="${id}"><option value="">— لا —</option>${opts.filter(o=>o.isParent).map((o) => `<option value="${esc(o.id)}" ${o.id === v ? "selected" : ""}>${esc(o.title)}</option>`).join("")}</select>`;
  return `<label for="${id}">${f.l}</label><input id="${id}" type="${f.t === "number" ? "number" : f.t === "url" ? "url" : "text"}" value="${esc(v)}" ${f.t === "url" ? 'dir="ltr"' : ""}>${h}`;
};

async function crud(box, key) {
  const cfg = SECTIONS[key];
  const courses = cfg.fields.some((f) => f.t === "course" || f.t === "parent") ? (await getDocs(query(collection(db, "courses"), orderBy("order")))).docs.map((d) => ({ id: d.id, ...d.data() })) : [];
  if (key === "lectures" && !courses.length) { box.innerHTML = `<p class="notice">ضيف كورس الأول من تبويب "الكورسات".</p>`; return; }
  let editing = null;
  box.innerHTML = `<div class="panel"><h2 id="ft"></h2><div id="form"></div><p><button class="btn" id="save">حفظ</button> <button class="btn alt" id="cancel" hidden>إلغاء التعديل</button></p></div><div class="panel"><h2>${cfg.label} الحالية</h2><div id="items"></div></div>`;
  const form = () => { $("ft").textContent = editing ? "تعديل" : "إضافة جديد"; $("cancel").hidden = !editing; $("form").innerHTML = cfg.fields.map((f) => fieldHtml(f, editing?.data || {}, courses)).join(""); };
  let rows = [];
  async function load() {
    rows = (await getDocs(query(collection(db, key), orderBy(...cfg.orderBy)))).docs.map((d) => ({ id: d.id, data: d.data() }));
    $("items").innerHTML = rows.length ? rows.map((r) => `<div class="item"><div><strong>${esc(r.data.title)}</strong> ${r.data.pinned ? '<span class="pill">مثبّت</span>' : ""}<div class="meta">${key === "lectures" ? esc(courses.find((c) => c.id === r.data.courseId)?.title || "") : fmtDate(r.data.createdAt)}</div></div><div class="acts"><button class="btn small alt" data-e="${esc(r.id)}">تعديل</button><button class="btn small danger" data-d="${esc(r.id)}">حذف</button></div></div>`).join("") : `<p class="empty">لسه مفيش حاجة.</p>`;
  }
  $("save").onclick = async () => {
    const v = {}; for (const f of cfg.fields) { v[f.k] = val(f); if (f.req && !v[f.k]) return toast(`املا خانة: ${f.l}`, true); if (f.t === "url" && v[f.k] && !safeUrl(v[f.k])) return toast(`الرابط في "${f.l}" لازم يبدأ بـ https://`, true); }
    if (key === "courses") {
      if (!v.isParent && !v.parentId) return toast("لو ده كورس فرعي، لازم تختار الكورس الرئيسي", true);
      if (v.isParent) v.parentId = "";
    }
    try {
      const bump = (cid, n) => updateDoc(doc(db, "courses", cid), { lectureCount: increment(n) });
      if (editing) {
        await csrfProtectedWrite(updateDoc, doc(db, key, editing.id), v);
        if (key === "lectures" && editing.data.courseId !== v.courseId) { await bump(editing.data.courseId, -1); await bump(v.courseId, 1); }
      } else {
        await csrfProtectedWrite(addDoc, collection(db, key), { ...v, createdAt: serverTimestamp() });
        if (key === "lectures") await bump(v.courseId, 1);
      }
      editing = null; form(); await load();
    } catch { /* handled in csrfProtectedWrite */ }
  };
  $("cancel").onclick = () => { editing = null; form(); };
  $("items").onclick = async (e) => {
    const id = e.target.dataset.e || e.target.dataset.d; if (!id) return;
    if (e.target.dataset.e) { editing = rows.find((r) => r.id === id); form(); scrollTo({ top: 0, behavior: "smooth" }); }
    else if (confirm("متأكد إنك عايز تحذف؟")) {
      try {
        const gone = rows.find((r) => r.id === id);
        await csrfProtectedWrite(deleteDoc, doc(db, key, id));
        if (key === "lectures" && gone) await updateDoc(doc(db, "courses", gone.data.courseId), { lectureCount: increment(-1) });
        await load();
      } catch { /* handled */ }
    }
  };
  form(); await load();
}

async function homework(box) {
  const ref = doc(db, "homework", "current"), d = (await getDoc(ref)).data() || {};
  const status = (x) => (x.active && x.url ? "الواجب مفتوح ✔" : "الواجب مقفول");
  const dlVal = d.deadline ? new Date(d.deadline).toISOString().slice(0,16) : "";
  box.innerHTML = `<div class="panel"><h2>رابط الواجب</h2><p class="notice" id="st">${status(d)}</p>
    <label for="t">عنوان الواجب</label><input id="t" value="${esc(d.title || "")}" placeholder="مثال: واجب المحاضرة الخامسة">
    <label for="u">رابط Google Form</label><input id="u" dir="ltr" type="url" value="${esc(d.url || "")}">
    <label class="chk"><input type="checkbox" id="a" ${d.active ? "checked" : ""}>الواجب مفتوح (يظهر الزرار للدارسين)</label>
    <label for="dl">ميعاد انتهاء الواجب (اختياري)</label>
    <input id="dl" type="datetime-local" value="${esc(dlVal)}" dir="ltr">
    <p class="meta">لو حطت مياعيد، هيبقى فيه عداد يرجع للدارسين. لو مفيش، هيتقفل يدويًا بس.</p>
    <p><button class="btn" id="save">حفظ</button> <button class="btn alt" id="close">قفل الواجب</button> <button class="btn danger" id="clear">مسح الرابط</button></p>
    <p class="meta">لما تقفل الفورم في جوجل، اضغط "قفل الواجب" علشان الزرار يبقى Not Active عند الدارسين.</p></div>`;
  const put = async (v, m) => { try { await setDoc(ref, { ...v, updatedAt: serverTimestamp() }, { merge: true }); $("st").textContent = status(v.url !== undefined ? v : { ...v, url: $("u").value }); toast(m); } catch { toast("فشل الحفظ", true); } };
  $("save").onclick = () => {
    const u = $("u").value.trim();
    if (u && !safeUrl(u)) return toast("الرابط لازم يبدأ بـ https://", true);
    const dl = $("dl").value ? new Date($("dl").value).toISOString() : "";
    put({ title: $("t").value.trim(), url: u, active: $("a").checked, deadline: dl }, "اتحفظ");
  };
  $("close").onclick = () => { $("a").checked = false; put({ active: false }, "الواجب اتقفل"); };
  $("clear").onclick = () => { $("u").value = ""; $("a").checked = false; put({ url: "", active: false }, "الرابط اتمسح"); };
}

async function contact(box) {
  box.innerHTML = `<div class="panel"><h2>رسائل التواصل</h2><div id="items"></div></div>`;
  async function load() {
    const snaps = (await getDocs(query(collection(db, "contact"), orderBy("createdAt", "desc"), limit(100)))).docs;
    if (!snaps.length) { $("items").innerHTML = `<p class="empty">لسه مفيش رسائل.</p>`; return; }
    $("items").innerHTML = snaps.map((d) => {
      const r = d.data();
      return `<div class="item" style="text-align:right"><div><strong>${esc(r.name || "زيّار")}</strong><div class="meta">${esc(fmtDate(r.createdAt))}</div></div><p style="margin:.4rem 0;line-height:1.8">${esc(r.body)}</p></div>`;
    }).join("");
  }
  await load();
}

async function students(box) {
  box.innerHTML = `<div class="panel"><h2>إضافة دارس</h2><div class="grid2"><div><label for="n">الاسم</label><input id="n"></div><div><label for="un">اسم المستخدم (إنجليزي بدون مسافات)</label><input id="un" dir="ltr" autocapitalize="none"></div><div><label for="pw">كلمة المرور (6 حروف على الأقل)</label><input id="pw" dir="ltr"></div><div><label for="rl">الصلاحية</label><select id="rl"><option value="student">دارس</option><option value="admin">إدارة</option></select></div></div>
    <p><button class="btn" id="add">إضافة</button> <button class="btn alt" id="gen">توليد كلمة مرور</button></p><pre id="cred" dir="ltr" style="white-space:pre-wrap"></pre></div>
    <div class="panel"><h2>الدارسين</h2><div id="items"></div></div>`;

  // Info panel explaining the sync
  const info = document.createElement("div");
  info.className = "panel";
  info.innerHTML = `<h3>⚠️ ملاحظة هامة: التزامن مع Firebase Auth</h3>
  <p>العمليات هنا بتأثر على <strong>Firestore بس</strong> (البروفايل، الدور، الحالة).</p>
  <p>للعمليات دي لازم <strong>Firebase Admin SDK</strong> (Node.js في السكريبتات):</p>
  <ul>
    <li>🔐 <strong>تغيير الباسوورد</strong> → <code>node scripts/reset-password.mjs email@domain.com "NewPass123"</code></li>
    <li>🗑️ <strong>حذف من Auth</strong> → <code>node scripts/delete-user.mjs email@domain.com</code></li>
    <li>🚫 <strong>إيقاف/تفعيل في Auth</strong> → <code>node scripts/toggle-user.mjs email@domain.com disable|enable</code></li>
    <li>📋 <strong>عرض كل اليوزرز</strong> → <code>node scripts/export-users-local.mjs</code></li>
  </ul>
  <p>السكريبتات دي في فولدر <code>scripts/</code> وتشغل محلياً على جهازك.</p>`;
  box.prepend(info);

  const gen = () => { const c = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"; return Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => c[b % c.length]).join(""); };
  $("gen").onclick = () => ($("pw").value = gen());
  async function load() {
    const rows = (await getDocs(collection(db, "users"))).docs.map((d) => ({ id: d.id, ...d.data() }));
    $("items").innerHTML = rows.map((r) => { const me = r.id === auth.currentUser.uid; return `<div class="item"><div><strong>${esc(r.name)}</strong> <span class="pill">${r.role === "admin" ? "إدارة" : "دارس"}</span> ${r.active ? "" : '<span class="pill off">موقوف</span>'}<div class="meta" dir="ltr">${esc(r.username)}</div></div><div class="acts">${me ? '<span class="meta">حسابك</span>' : `<button class="btn small alt" data-a="${esc(r.id)}" data-v="${r.active ? 0 : 1}">${r.active ? "إيقاف" : "تفعيل"}</button><button class="btn small alt" data-r="${esc(r.id)}" data-v="${r.role === "admin" ? "student" : "admin"}">${r.role === "admin" ? "خليه دارس" : "خليه إدارة"}</button><button class="btn small danger" data-x="${esc(r.id)}">حذف من Firestore</button>`}</div></div>`; }).join("");
  }
  $("items").onclick = async (e) => {
    const t = e.target.dataset;
    try {
      if (t.a) await csrfProtectedWrite(updateDoc, doc(db, "users", t.a), { active: t.v === "1" });
      else if (t.r) await csrfProtectedWrite(updateDoc, doc(db, "users", t.r), { role: t.v });
      else if (t.x && confirm("هيتشال وصول الدارس ده من Firestore. للحذف من Auth استعمل CLI. متأكد؟")) await csrfProtectedWrite(deleteDoc, doc(db, "users", t.x));
      else return;
      await load();
    } catch { toast("فشلت العملية", true); }
  };

  $("add").onclick = async () => {
    const name = $("n").value.trim(), un = $("un").value.trim().toLowerCase(), pw = $("pw").value, role = $("rl").value;
    if (!name || !/^[a-z0-9._-]{3,30}$/.test(un) || pw.length < 6) return toast("راجع الاسم واسم المستخدم (حروف إنجليزي/أرقام) وكلمة المرور (6+)", true);
    const sec = initializeApp(firebaseConfig, "sec-" + Date.now());
    try {
      const cred = await createUserWithEmailAndPassword(getAuth(sec), toEmail(un), pw);
      await setDoc(doc(db, "users", cred.user.uid), { name, username: un, role, active: true, createdAt: serverTimestamp() });
      await signOutSec(getAuth(sec));
      $("cred").textContent = `الموقع: ${location.origin}${location.pathname.replace("admin.html", "login.html")}\nUsername: ${un}\nPassword: ${pw}`;
      ["n", "un", "pw"].forEach((i) => ($(i).value = "")); toast("اتضاف الدارس"); await load();
    } catch (e) { toast(e.code === "auth/email-already-in-use" ? "اسم المستخدم ده موجود قبل كده" : "فشل إنشاء الحساب", true); }
    finally { deleteApp(sec); }
  };
  await load();
}

// التشغيل الأولي (آخر الملف عشان كل الدوال والثوابت تكون اتعرّفت)
if (requireLogin(s)) {
  if (s.profile.role !== "admin") panel.innerHTML = `<p class="notice bad">الصفحة دي للإدارة بس.</p>`;
  else {
    $("tabs").innerHTML = TABS.map((t) => `<button role="tab" data-t="${t}">${LABELS[t]}</button>`).join("");
    $("tabs").onclick = (e) => e.target.dataset.t && open(e.target.dataset.t);
    open(TABS[0]);
  }
}
