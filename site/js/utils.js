// دوال بسيطة بدون Firebase (علشان نقدر نختبرها لوحدها).
export const toEmail = (u) => `${u.trim().toLowerCase()}@etshoob.local`;

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const fmtDate = (ts) => (ts?.toDate ? ts.toDate().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "");

export const excerpt = (t, n = 130) => { const x = String(t || "").replace(/^(## |> )/gm, "").replace(/\s+/g, " ").trim(); return x.length > n ? x.slice(0, n).trimEnd() + "…" : x; };

// نص التأملات: سطر فاضي = فقرة | "## " عنوان فرعي | "> " آية أو اقتباس
export function renderText(t) {
  return esc(t).split(/\n{2,}/).map((p) => {
    if (p.startsWith("## ")) return `<h3>${p.slice(3)}</h3>`;
    if (p.startsWith("&gt; ")) return `<blockquote>${p.slice(5).replace(/\n/g, "<br>")}</blockquote>`;
    return `<p>${p.replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

// بيقبل روابط http/https أو مسارات نسبية بس. أي حاجة تانية (javascript: وغيره) بترجع فاضية.
export const safeUrl = (u) => {
  const s = String(u ?? "").trim();
  if (!s) return "";
  try { return /^https?:$/.test(new URL(s, "https://base.invalid").protocol) ? s : ""; } catch { return ""; }
};

const driveId = (u) => (String(u).match(/\/d\/([\w-]+)/) || String(u).match(/[?&]id=([\w-]+)/) || [])[1];
export const viewUrl = (u) => (driveId(u) ? `https://drive.google.com/file/d/${driveId(u)}/view` : safeUrl(u));
export const downloadUrl = (u) => (driveId(u) ? `https://drive.google.com/uc?export=download&id=${driveId(u)}` : safeUrl(u));
