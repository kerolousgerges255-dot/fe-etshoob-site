import { session, renderChrome, loginBox, bindLogin } from "./app.js";
const s = await session();
renderChrome("login", s);
const raw = new URLSearchParams(location.search).get("next") || "";
const next = /^[a-z]+\.html$/.test(raw) ? raw + location.hash : "courses.html";
if (s.user) location.replace(next);
const gate = document.getElementById("gate");
gate.innerHTML = loginBox();
bindLogin(gate, () => (location.href = next));

const notes = [];
try { if (sessionStorage.getItem("kicked")) { notes.push("الحساب اتفتح من جهاز تاني، فتم تسجيل الخروج من هنا."); sessionStorage.removeItem("kicked"); } } catch {}
if (new URLSearchParams(location.search).get("idle")) notes.push("اتسجّل خروجك تلقائي بعد فترة من عدم الاستخدام.");
if (notes.length) gate.querySelector("[data-msg]").innerHTML = notes.map((n) => `<p class="notice">${n}</p>`).join("");
