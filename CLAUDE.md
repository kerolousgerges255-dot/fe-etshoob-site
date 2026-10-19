# في اتشوب — Claude instructions

Read `.claude/skills/fe-etshoob-site/SKILL.md` before touching anything. It holds the architecture, data model, invariants and the verification checklist.

- The owner is not a programmer: answer in Egyptian Arabic, give copy-paste steps, make the edits yourself.
- Everything on the site is members-only; never expose protected text in HTML, never commit secrets.
- After editing `firestore.rules`, remind the owner to republish it in Firebase.
- Extra expertise lives in `.claude/skills/` (backend, devops, CI/CD, security, secrets). Use them for design and review; prefer the project skill for anything project-specific.
