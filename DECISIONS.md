# Architecture Decision Log

Every architecture question raised while building this project, the options considered, and the choice made.

---

## Phase 0 — Project Setup

### D1. Project environment
**Date:** 2026-11-20
**Question:** Which environment should the Reaction Engine use?

| Option | Pros | Cons |
|---|---|---|
| **Vite + vanilla JS** ✅ | Dev server with hot reload; `npm i gsap` for Phase 2; ES modules; no framework noise in the flame chart | Needs Node/npm and an install step |
| Plain HTML/CSS/JS, no build | Nothing to install; cleanest flame chart | GSAP via CDN; needs a static server for ES modules; no hot reload |
| Vite + React | Familiar component model | React reconciliation clutters the flame chart; creating and removing 50+ DOM nodes fights React's model |
| Vite + TypeScript | Type safety | Extra setup for a small DOM script in a 60–90 min task |

**Choice:** Vite + vanilla JS.
**Rationale:** Light tooling that keeps the profiler output clean. Build the CSS keyframes version first and swap in GSAP only in Phase 2.

### D2. How Phase 1 and Phase 2 coexist
**Date:** 2026-11-20
**Question:** How should the CSS keyframes and GSAP versions live in the codebase so both stay working and easy to test?

| Option | Pros | Cons |
|---|---|---|
| **One page + mode toggle** ✅ | Compare both on the same stage; shared spawner/UI; easy A/B profiling | The two engines must stay cleanly separated |
| Two separate pages | Fully isolated; each profile is clean | Duplicated UI; reviewer has to switch URLs |
| Git branches/tags only | History shows how the project evolved | Breaks the "both phases easily testable" requirement |

**Choice:** One page with a mode toggle.
**Rationale:** Makes side-by-side profiling easy. The toggle is added in Phase 2; Phase 1 ships only the CSS engine.

### D3. Where the decision log lives
**Date:** 2026-11-20
**Question:** Where should decisions be recorded, given the README must follow the submission template?

| Option | Pros | Cons |
|---|---|---|
| Section at the end of README | Everything in one file | README gets long; risks drifting from the template |
| **DECISIONS.md linked from README** ✅ | README stays on-template | A second file that reviewers might skip |

**Choice:** `DECISIONS.md`, linked from the top of the README.

### D4. Git / GitHub workflow
**Date:** 2026-11-20
**Question:** Which version-control workflow should we use?

| Option | Pros | Cons |
|---|---|---|
| **Branch per phase + PR** ✅ | Clear history (setup → phase-1 → phase-2 → docs); PRs tell the story to reviewers | A bit more ceremony for a solo project |
| Commit straight to main | Fastest | Flat history; phase boundaries are hard to see |
| Main + tags per phase | Simple linear history with checkout points | No PR trail |

**Choice:** A branch for each phase, merged through a pull request: `setup` → `phase-1-css` → `phase-2-gsap` → `docs`.
