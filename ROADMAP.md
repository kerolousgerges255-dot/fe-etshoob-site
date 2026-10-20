# ROADMAP — Fe Etshoob Site (في اتشوب)

> **Read this whole file before doing anything.** One task at a time. Never start the next task until the owner has approved the current one **on the live site**.
> The owner is not a programmer and reviews everything visually on the live site. Reply to the owner in **Egyptian Arabic**, short and clear. Keep code and commits in English.

## Status board

| # | Task | Status | Checkpoint tag |
|---|---|---|---|
| 0 | Baseline snapshot of the current (working) site | ☐ | `checkpoint-00-baseline` |
| 1 | Checkpoint protocol (how we work) | ✅ adopted | — |
| 2 | Hero: logo on white circle (left) + text (right) + reveal effect | ✅ DONE — **frozen, do not touch** | (inside baseline) |
| 3 | Counters (courses / lectures / meditations) | ☐ | `checkpoint-03-counters` |
| 4 | Years → Terms → Lectures, with covers, locked for guests | ✅ DONE | `checkpoint-04-years-terms` |
| 5 | Meditations public for everyone | ☐ | `checkpoint-05-meditations-public` |
| 6 | "قالوا عن المعهد" testimonials carousel (every 15 s) | ☐ | `checkpoint-06-testimonials` |
| 7 | (Optional) About page: restore the last good version | ☐ waits for owner's pick | `checkpoint-07-about` |

---

## 1. Checkpoint protocol (applies to every task)

**Before starting a task**
1. `git status` must be clean. If not, stop and tell the owner what is uncommitted.
2. Confirm the previous checkpoint tag exists (`git tag --list "checkpoint-*"`).
3. Create a work branch: `git switch -c task-N-short-name`.

**While working**
4. Touch **only** the files listed in the task's *Scope*. Anything else = ask first.
5. Add scoped CSS (new class names) — **never** rewrite or reorder existing CSS, never change `:root` tokens, never restructure existing HTML. (A previous "About" redesign broke the whole site's front end this way.)
6. No new libraries, no abstractions nobody asked for, no "cleanup" refactors.

**Before saying "done" (all mandatory, show the output)**
7. `npm run check` · `npm test` · `python3 tests/e2e/run.py` — all green. Add/adjust tests for the new behaviour.
8. Look at screenshots (desktop 1280px and mobile 390px) from `tests/e2e/out/`. Describe what you see; do not claim what you did not see.
9. `git diff main --stat` and read the diff of every Arabic string. **Fail the task if you find stray foreign characters** (Chinese/Japanese glyphs, random English words inside Arabic text such as "Nation", reversed or mangled Arabic). These glitches happened before.
10. Prove the change really exists (the earlier "nothing changed" incident): `grep` a unique marker from your change in the built files.

**Going live and approval**
11. Commit `task N: <what>` → merge/push to `main` → wait for the GitHub Actions run (checks → deploy) to be green.
12. Confirm the deployed site serves the change (`curl -s <live-url> | grep <marker>`) and tell the owner to hard-refresh (Ctrl+F5).
13. If the task changed `firestore.rules`: **the owner must publish the rules in Firebase Console → Rules → Publish** (CI does not deploy them). Say it explicitly and wait for "done" before asking for approval.
14. Send the owner a short checklist: *"افتح اللينك، اتأكد من: 1) … 2) … 3) …"* (use the task's Acceptance list).
15. **STOP and wait.**
    - Owner says **"تمام" / "approved"** → `git tag checkpoint-0N-name && git push --tags`, tick the box in the status board, add a row to the log at the bottom, then ask which task is next.
    - Owner says **"ارجع" / "rollback"** or reports a problem → `git revert` the task's commits (or `git reset --hard <previous checkpoint>` on the branch) so the live site returns to the last checkpoint, then fix and repeat from step 7.

**Task 0 (do once, first):** run `npm run check && npm test`; if green, tag the current working state `checkpoint-00-baseline` and push the tag. This is the "everything was fine" restore point.

**Template to paste to Claude Code for each task**
```
Read ROADMAP.md fully. Work ONLY on Task N. Follow the checkpoint protocol exactly,
including the stop-and-wait for my approval on the live site. Do not touch anything in the "Frozen zone".
```

---

## 2. Frozen zone (do not modify unless a task explicitly says so)
- **Hero block** (Task 2 is finished and approved): logo in a white circle on the visual left, headline + verse on the right, reveal effect. Whatever is live at `checkpoint-00-baseline` is the source of truth for all its values (sizes, circle, font sizes). Do not "improve" it. History for reference only: logo asked at 25% width → decreased → +20% → "32% instead of 18%" → "+5% logo, not the circle".
- **`site/about.html`** and its styles (see Task 7).
- Global CSS tokens in `:root`, header, footer, login dialog, `shield.js` protections.
- `firestore.rules` — only the exact lines named by Task 4 / Task 5.

---

## 3. Reference data (the "values" from the first session)

### 3.1 Year / term model (already in the DB and `scripts/seed-content.mjs`)
- `courses` collection: a **year** = doc with `isParent: true`; a **term** = doc with `parentId: <year id>`.
- Years: `year1-ot` → "السنة الأولى - العهد القديم" (order 1, cover `images/covers/course-ot.jpg`) · second year → "السنة الثانية - العهد الجديد" (order 2, cover `images/covers/course-nt.jpg`). Each year has **3 terms** (`ot-term1..3`, and the NT equivalents).
- `lectures.courseId` points to a **term** (never to a year). `lectureCount` is kept on the **term** docs.
- Study system (from the About content): 2 years, 3 terms per year, Sundays 7 pm, in person only.
- Image names/prompts live **only** in `docs/IMAGE-PROMPTS.md`. **Never put image prompts in code, seed or tests** (the owner asked why this happened).

### 3.2 Counters expected today
| Counter (Arabic label) | Value now | Meaning |
|---|---|---|
| كورس | **٢** | the two years (Old Testament, New Testament) — years only, not terms |
| محاضرة | **٣** | lectures that exist today |
| تأمل | **٣** | meditations that exist today |

### 3.3 Testimonials — the 10 people (order matters)
1. الأنبا مقار — أسقف الشرقية ومدينة العاشر
2. القس جوارجيوس القمص فيلبس — مدير معهد في اتشوب
3. القس قزمان عياد — أحد مدرسي معهد في اتشوب
4. مينا جيد — أحد خريجي المعهد
5. شريف شوقي — أحد خريجي المعهد
6. رانيا إيراد — أحد خريجي المعهد
7. روماني عادل — أحد خريجي المعهد
8. كيرلس رؤوف — أحد خريجي المعهد
9. ماريان ملطي — أحد خريجي المعهد
10. ماركو منير — أحد خريجي المعهد

The raw opinions the owner pasted, and the text drafted from them (`fallbackTestimonials` in `site/js/home.js`), are in `chat.txt` around lines 2810–3000. The earlier invented "random Christian names" list (مريم يونان، يوسف بولس…) must **not** be used.

> ⚠️ **Publishing gate:** the owner asked for the opinions to be distributed randomly between the people (`chat.txt` ~line 2836). Putting words in the mouth of a bishop, a priest and named graduates that they did not say is risky. Before Task 6 goes public, the owner must confirm that each person approved their quote (or the quote is cut from what that person actually said). Build it, but do not ask for the final "go live" approval until the owner confirms this point.

---

## Task 3 — Counters (العدادات)
**Goal:** the three counters work again and show **٢ كورس / ٣ محاضرة / ٣ تأمل** — for guests **and** students.
**Scope:** `site/js/home.js`, `site/js/utils.js` (if a helper is needed), `scripts/seed-content.mjs` (only to fix `lectureCount`), `tests/`, `tests/e2e/`.
**Steps**
1. Find how the counters are computed today and why they show wrong values / zero.
2. courses = number of docs with `isParent === true` (years only). lectures = sum of `lectureCount` over **terms** (guests cannot read `lectures`, so use the public `courses` data). meditations = number of meditation docs (public after Task 5; until then use what guests can read, and never show a wrong 0).
3. Verify `lectureCount` on each term matches the real number of lectures; fix the data/seed if it does not.
4. If a read fails show `—`, never `0`.
**Acceptance (owner checks live)**
- Logged out: shows ٢ · ٣ · ٣. Logged in: same.
- Numbers count up once when the section scrolls into view; with "reduce motion" they appear instantly.
- Adding a lecture or meditation from the admin panel and refreshing increases the matching counter by 1.
**Tests:** unit test for the counting helper; e2e: guest + student both see the three expected values.

## Task 4 — Years → Terms → Lectures with covers (الكورسات بالكفرات)
**Goal:** the home page shows **only two cards**; terms and lectures live inside them.
**Scope:** `site/js/home.js`, `site/js/courses.js`, `site/index.html`/`courses.html` (only if needed), scoped CSS appended at the end of `style.css`, `scripts/seed-content.mjs`, `docs/IMAGE-PROMPTS.md`, `tests/`, and `firestore.rules` **only** to allow public read of `courses` (metadata: title, description, cover, counts). **`lectures` stays members-only.**
**Steps**
1. Home "الكورسات" section: exactly two year cards — "السنة الأولى - العهد القديم" and "السنة الثانية - العهد الجديد" — each with its cover. **The 6 terms must not appear on the home page** (the owner complained about this before).
2. Guest: cards are visible but **not active** (locked look, small tag "للدارسين"). Clicking opens the login dialog; it never navigates.
3. Student: clicking a year opens the year view with its **3 term cards** (each with its own cover); clicking a term lists its lectures (existing rows with PDF buttons). Back buttons: term → year → all years. Deep links work (`courses.html#...`).
4. Second year (New Testament) must exist with its 3 terms even if they have no lectures yet; empty term shows "لسه مفيش محاضرات". (It was missing in the previous session.)
5. Covers from `site/images/covers/`: 2 year covers + 6 term covers. If a file is missing, fall back to the existing CSS cover — never a broken image. List the exact file names you expect and which ones are missing so the owner can generate them.
6. Update `docs/IMAGE-PROMPTS.md` with prompts for the missing covers (NT year + 6 terms). Prompts only in that file.
7. Make sure the admin panel can still create years/terms/lectures correctly (term under a year; lecture under a term).
8. `seed-content.mjs` stays idempotent (re-running it never duplicates or wipes PDF links).
**Acceptance (owner checks live)**
- Logged out: two locked cards with covers; nothing about terms; click → login dialog.
- Logged in: open year 1 → 3 terms with covers → open a term → lectures with PDF download. Same for year 2.
- Mobile (390px): no horizontal scroll, covers not stretched.
**Rules reminder:** this task changes `firestore.rules` → owner must publish (protocol step 13). Update `tests/rules.test.mjs` (`courses` public read is now intentional; `lectures` must still require membership) and `scripts/check.mjs` so the "no open read" check keeps protecting everything else.

## Task 5 — Meditations public (التأملات للجميع)
**Goal:** anyone (guest or student) can see the meditations section on the home page, open the meditations page, and read a meditation.
**Scope:** `firestore.rules` (the `meditations` read line only), `site/js/config.js` (`SITE.publicMeditations = true`), `site/js/home.js`, `site/js/meditations.js`, `tests/`, `scripts/check.mjs`, `docs/SECURITY.md` (note).
**Steps**
1. Rule: `meditations` → `allow read: if true;` (writes stay admin-only). Keep every other collection's rules unchanged.
2. Config flag on; guest sees the section on home and can open `meditations.html` and the reader without login. No redirect to login.
3. Update `tests/rules.test.mjs` and `scripts/check.mjs`: allow `if true` **only** for `meditations` and `courses`; fail for anything else.
4. Anti-copy friction (select/copy/context-menu blocked) also applies on the meditations page for guests. Say clearly in the report that public text can always be fetched by a determined person; this is friction only.
**Acceptance (owner checks live):** in a private/incognito window — home shows the latest meditations, the meditations page opens, reading works, copying is blocked, lectures/announcements/homework still locked.
**Rules reminder:** owner must publish the rules (protocol step 13).

## Task 6 — "قالوا عن المعهد" testimonial cards (كروت بتتحرك كل 15 ثانية)
**Goal:** a section on the home page, after the meditations section, titled **"قالوا عن المعهد"**, with testimonial cards that move automatically **every 15 seconds toward the right**.
**Scope:** `site/index.html`, new `site/js/testimonials.js` (static data, no DB, no rules change), `site/js/home.js` (mount only), scoped CSS appended at the end of `style.css`, `tests/`, `tests/e2e/`.
**Steps**
1. Data = the 10 people in §3.3, in that order. Each card: quote, name, role. Same visual theme as the site (cards, oxblood/gold). No invented names.
2. Behaviour: auto-advance every **15 s** (one constant), loop forever, all 10 cards reachable (the previous version showed only the first card — that is the bug to avoid), previous/next buttons, dots, touch swipe, keyboard arrows.
3. Direction: cards travel **toward the right** (the new card enters from the left edge). Implement the direction as one CSS variable/constant so flipping it is a one-line change — an earlier message asked for right-to-left, so ask the owner to confirm the direction on the live site.
4. Pause on hover/focus/touch and when the tab is hidden; respect `prefers-reduced-motion` (no sliding; simple fade or instant).
5. Equal card height, no layout jump, readable on 390px, works for guests and students.
**Acceptance (owner checks live):** wait 15 s → next card; count 10 distinct people; buttons/swipe work; mobile OK; direction confirmed.
**Gate:** do not request final approval until the owner confirms the quotes are acceptable to publish under each name (§3.3 warning).
**Tests:** unit test that the data has 10 unique people with name+role+text; e2e: after advancing, the active card changes and all 10 are reachable.

## Task 7 — (Optional) About page: restore the last good version
**Context:** the About ("من نحن") page was fine earlier; later redesigns broke the site and `about.html` was reverted to a minimal banner page. The owner wants it back **as it was** when it was good.
**Do not start until the owner picks a version.**
1. `git log --oneline -- site/about.html site/css/style.css` and list the versions with dates.
2. For each candidate, build it in a temp worktree, take desktop + mobile screenshots, show them to the owner.
3. Owner picks one → restore **only `site/about.html` and the CSS rules that belong to it** (do not roll back anything else), keep the content exactly as the owner supplied it (mission, study system, attendance/grading, admission rules, faculty list — `chat.txt` lines ~3784–4000).
4. Standard protocol; the home page must be pixel-identical before/after (compare screenshots).

---

## Known pitfalls from the previous session (read twice)
- A redesign of one page rewrote the global CSS and **destroyed the home page**. → Only append scoped CSS.
- "Done" was reported while **nothing had changed** on the live site. → Prove the change exists in files and on the deployed URL; remind the owner to hard-refresh.
- Many `Error editing file` retries and **stray foreign characters** (e.g. "Nation", Chinese glyphs) ended up inside Arabic strings. → Re-read every changed Arabic string; add the stray-glyph check below.
- Arabic text pasted from a terminal can arrive **reversed**. Never copy Arabic out of a terminal capture; take it from the owner's original message or from the source files.
- Image prompts were pasted into code. → Prompts only in `docs/IMAGE-PROMPTS.md`.

### Suggested guard (add during Task 3, tiny change to `scripts/check.mjs`)
Fail the check if any file under `site/`, `scripts/` or `docs/` contains CJK characters (`\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff`) or a Latin word stuck inside an Arabic word (e.g. `Nation`). Add a unit test with a bad sample.

---

## Checkpoint log
| Tag | Task | Date | Approved by owner | Notes |
|---|---|---|---|---|
| `checkpoint-00-baseline` | Working site before the roadmap | | ☐ | |
