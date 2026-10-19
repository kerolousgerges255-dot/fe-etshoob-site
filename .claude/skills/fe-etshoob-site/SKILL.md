---
name: fe-etshoob-site
description: Use when changing, debugging, securing, testing or deploying the Fe Etshoob (في اتشوب) Bible-institute website in this repo — student logins, protected lectures/PDFs, meditations, announcements, homework link, verse of the day, admin panel, Firebase rules, GitHub Pages deploy. Read first before editing any file in site/, firestore.rules or scripts/.
---

# في اتشوب — Project skill

## Who you work for
The owner is **not a programmer**. Reply in **Egyptian Arabic**, short, with copy-paste-ready steps. Never ask them to edit code by hand: do the edit yourself, test it, and hand back the updated project. Explain risks plainly and say when something is untested.

## Architecture (no build step)
- **Front end**: plain HTML/CSS/JS ES modules in `site/` (RTL Arabic). Hosted on **GitHub Pages** via `.github/workflows/pages.yml` (publishes `site/` only).
- **Back end**: **Firebase** — Auth (email/password; usernames map to `<username>@etshoob.local`) + Firestore. No Cloud Functions, no Storage (needs paid plan).
- **PDFs** live on Google Drive; only the link is stored in Firestore. Videos = a later, paid phase (dormant `videoId` hook in `courses.js`; see `docs/SECURITY.md`).
- **Scripts** (Node, need `serviceAccount.json`, never committed): `scripts/create-users.mjs` (`npm run users`), `scripts/seed-content.mjs` (`npm run seed`).

## File map
| Area | Files |
|---|---|
| Pages | `site/{index,login,courses,meditations,admin}.html` (thin shells, content is rendered by JS) |
| Shared | `site/js/utils.js` (دوال نقية: esc, safeUrl, renderText, روابط Drive — بدون Firebase، متغطّاة باختبارات) · `site/js/app.js` (Firebase init, session, login dialog, header/footer, single-session lock) · `site/js/config.js` (Firebase keys, site text, `SECURITY`, `SITE.publicMeditations`, `SITE.video`) |
| Pages JS | `home.js` `courses.js` `meditations.js` `login.js` `admin.js` |
| Protection | `site/js/shield.js` (anti-copy, DevTools detection/wipe, idle logout) |
| Verses | `site/js/verses.js` (verse bank; `verseOfTheDay()` is deterministic per day) |
| Look | `site/css/style.css` (all tokens in `:root`; brand = oxblood `#7a1f17`/`#4a130e`, copper, gold `#d3a53b`; fonts Cairo + Amiri) |
| Rules | `firestore.rules` |
| Quality gate | `scripts/check.mjs` (`npm run check`) · `tests/*.test.mjs` (`npm test`) · `tests/e2e/` (browser, mock Firebase) · `.github/workflows/pages.yml` (checks → deploy) · `scripts/backup.mjs` (`npm run backup`) |

## Data model (Firestore)
`users/{uid}` {name, username, role: admin|student, active, createdAt} · `sessions/{uid}` {deviceId, at} · `announcements` {title, body, pinned, createdAt} · `meditations` {title, author, cover, body, createdAt} (body syntax: blank line = paragraph, `## ` heading, `> ` verse) · `courses` {title, description, cover, order, lectureCount} · `lectures` {courseId, title, lectureNo, instructor, lectureDate, description, pdfUrl, order} · `homework/current` {title, url, active}.
`courses.lectureCount` is maintained by `admin.js` (increment on add/delete/move) and by `seed-content.mjs`.

## Invariants — never break these
1. **Everything is members-only** (`isMember()` = signed in + `users/{uid}.active == true`). Guests see only the landing page. Writes are admin-only. Default-deny at the bottom of `firestore.rules`.
2. **No secrets in the repo**: `serviceAccount.json`, `credentials.csv` stay git-ignored. The Firebase web config is public by design; protect it with API-key HTTP-referrer restriction (see `docs/SECURITY.md`).
3. **After any change to `firestore.rules` tell the owner to republish it in Firebase Console → Rules.** The site does not deploy rules.
4. Page HTML must contain **no protected text** (content is fetched after login). Don't inline lecture/meditation text in HTML.
5. Keep `site/js/admin.js` initialisation **at the end of the file** (top-level `const`s are used by hoisted functions — moving it up caused a real TDZ crash).
6. `.btn{display:inline-flex}` would override `hidden`; `[hidden]{display:none!important}` is in the CSS — keep it.
7. **Every URL from the database goes through `safeUrl()`** (http/https or relative only) before it reaches `href`/`src`; every dynamic string goes through `esc()`. No inline event handlers (`onclick=`, `onerror=`) anywhere — `scripts/check.mjs` fails the build on them.
8. Admin scripts use the **modular** firebase-admin API (`firebase-admin/app|auth|firestore`); the old `admin.auth()` namespace is gone in v14.
9. Admin page is excluded from `shield.js` (admins must copy/paste). While developing locally set `SECURITY.devtoolsGuard=false`, and restore `true` before handing back.

## Standard workflows
- **Change text/colors/verse/links**: `site/js/config.js`, `site/js/verses.js`, CSS variables in `:root`.
- **New field on an entity**: add to the `SECTIONS` config in `admin.js`, render in the page JS, update the data model above, and check `firestore.rules` still covers it.
- **New page**: copy an existing shell, add `renderChrome("key", s)` + `requireLogin(s)`, add nav entry in `renderChrome`, add `noindex` meta if private.
- **Add users**: edit `scripts/users.json`, run `npm run users` (random passwords → `credentials.csv`, tell the owner to delete it after sending).

## Verify before delivering (no Firebase needed)
Run all three; fix until green, then rezip:
1. `npm run check` — syntax, secrets, rules sanity, local file references, inline handlers, config warnings.
2. `npm test` — unit tests (helpers, verse bank, rules text).
3. `python3 tests/e2e/run.py` — real Chromium against a mock Firebase (`pip install playwright && playwright install chromium`). Covers: guest sees nothing protected, student sees content, copy/contextmenu/shortcuts blocked, DevTools detection wipes the DOM, `javascript:` links ignored, admin panel renders and rejects bad URLs, mobile has no horizontal scroll. Screenshots land in `tests/e2e/out/` (git-ignored) — look at them.
4. Firestore rules cannot be run offline here: say so, and ask the owner to try **Rules Playground** after publishing.
5. New behaviour = add a test (unit if it is a pure function, otherwise a check in `tests/e2e/run.py`).
6. Rezip the whole repo for the owner (exclude `node_modules`, `serviceAccount.json`, `credentials.csv`, `backups/`).

## Deploy flow
Push to `main` → GitHub Actions runs **checks** (`check.mjs` + tests); only if green does **deploy** publish `site/`. Pull requests run checks only. Dependabot proposes weekly updates. Backups: `npm run backup` (read-only export to git-ignored `backups/`).

## Related skills in `.claude/skills/`
`javascript-pro` (modern JS), `secure-code-guardian` + `security-reviewer` + `senior-security` (review/threat model), `code-reviewer`, `test-master` + `playwright-expert` (tests), `debugging-wizard`, `fullstack-guardian`, `senior-backend` (API/auth/data design) · `senior-devops`, `devops-engineer` and `ci-cd-pipeline-builder` (workflows, deploy gates) · `senior-security` (threat modelling, secret scan) · `env-secrets-manager` (secret hygiene/rotation). They are generic (Node/Python/AWS/K8s); apply only what fits Firebase + GitHub Pages and skip cloud-heavy parts.
