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

---

## Phase 1 — CSS Keyframes Engine

### D5. Getting random values into the keyframes
**Date:** 2026-11-20
**Question:** How does each reaction get its random values (start x, sway width, size) into a CSS `@keyframes` animation that must animate layout properties?

| Option | Pros | Cons |
|---|---|---|
| **CSS custom properties** ✅ | One shared `@keyframes` rule; a unique path for every reaction; clean split between JS and CSS; maps onto GSAP variables in Phase 2 | `calc()` with `var()` is slightly harder to read |
| Several keyframe variants | Very simple CSS | Paths visibly repeat in a burst of 50; more variety means more CSS |
| Generate keyframes in JS | Unlimited variety | Stylesheet grows and needs cleanup; extra style recalculation clutters the profile |

**Choice:** CSS custom properties (`--x`, `--sway`, `--sway-period`, `--sway-delay`, `--size-start`, `--size-end`, `--life`), set from JS with `el.style.setProperty`.

### D6. Rise + sway structure
**Date:** 2026-11-20
**Question:** How does a reaction get both upward travel and side-to-side sway with CSS keyframes?

| Option | Pros | Cons |
|---|---|---|
| Nested wrapper elements | Each motion is a fully independent layer | 2 DOM nodes per reaction |
| **Single element, 2 animations** ✅ | Half the nodes; smooth sway via `ease-in-out alternate`; only `rise` fires `animationend`; maps to two GSAP tweens | The two animations must never animate the same property |
| Single element, one keyframe | One node, one rule | Zig-zag path unless there are many stops; rise and sway timing are locked together |

**Choice:** `animation: rise var(--life) ease-out forwards, sway var(--sway-period) ease-in-out var(--sway-delay) infinite alternate;`. `rise` owns `bottom`, `font-size` and `opacity`; `sway` owns only `left`. A negative `--sway-delay` starts each reaction at a random point in its sway cycle.

### D7. Cleanup strategy
**Date:** 2026-11-20
**Question:** How are finished reactions removed from the DOM so no zombie nodes are left behind?

| Option | Pros | Cons |
|---|---|---|
| `animationend` listener | Fires exactly when the animation ends | Node can linger if the animation never completes |
| `setTimeout(3000)` | Simplest | Drifts from the CSS duration; breaks once speed control arrives |
| **`animationend` + timeout fallback** ✅ | Most robust; no leaks | Slightly more code; needs a guard against removing twice |

**Choice:** `animationend` (filtered on `animationName === 'rise'`) is the main path. A fallback `setTimeout(LIFESPAN_MS + 500)` is the safety net. A `removed` flag plus `clearTimeout` makes sure removal happens once.

### D8. File organisation
**Date:** 2026-11-20
**Question:** How are the source files organised, given a GSAP engine and a mode toggle come in Phase 2?

| Option | Pros | Cons |
|---|---|---|
| **Engine modules** ✅ | Phase 2 just adds `engines/gsapEngine.js` with the same interface | More files for a small app |
| Single `main.js` + `style.css` | Fast; easy to read top to bottom | Phase 2 needs a real refactor |
| Class-based `ReactionEngine` | Central registry of live reactions | More abstraction than Phase 1 needs |

**Choice:**
```
src/main.js               UI wiring + dev helpers
src/reactions.js          emoji list, LIFESPAN_MS, random flight params (engine-agnostic)
src/engines/cssEngine.js  spawnReaction(stage, emoji)
src/styles/base.css       layout, stage, control bar, shared .reaction rules
src/styles/css-engine.css Phase 1 keyframes (imported by cssEngine.js)
```

### D9. Emoji selection
**Date:** 2026-11-20
**Question:** How does the user choose which emoji to send?

| Option | Pros | Cons |
|---|---|---|
| Random per click | Matches the brief's single button | User can't choose |
| **One button per emoji** ✅ | Feels like a real livestream; user picks | Slightly different from the brief's single "Send Reaction" button |
| Send button + selector | Gives the user control and keeps the brief's button | Most UI |

**Choice:** A row of emoji buttons generated from `EMOJIS`, labelled "Send Reaction".

### D10. Stage layout
**Date:** 2026-11-20

| Option | Pros | Cons |
|---|---|---|
| **Full viewport + bottom bar** ✅ | Simplest; "top of the viewport" means exactly what the brief says; a large area makes Paint Flashing easy to see | Less like a real stream |
| Mock video frame | Realistic demo | More layout work; reinterprets "viewport" |

**Choice:** A flex column: the stage (`flex: 1`) above a 72px control bar. Reactions spawn at `bottom: 0` of the stage, between 30% and 70% of its width, and fade out fully by 85% height.

### D11. Simulating 50+ concurrent reactions
**Date:** 2026-11-20
**Question:** How do we produce the same repeatable load for profiling without adding a UI button?

| Option | Pros | Cons |
|---|---|---|
| **`window.burst()` console helper** ✅ | No UI; same load every run; works in both phases; nothing to install | A little dev-only code |
| Paste-in console snippet | No app code | Re-pasted every session; depends on button selectors |
| URL query param | Can be bookmarked | May fire before recording starts |
| Playwright script | Fully automated | Heavy install for this task |

**Choice:** In dev builds only (`import.meta.env.DEV`): `burst(count = 50, overMs = 1000)` to spawn the load, and `reactionCount()` to confirm the DOM returns to 0 (no zombie nodes).

### D12. Profiling evidence format
**Date:** 2026-11-20
**Question:** Phase 1 evidence was recorded as two `.mov` files (~38 MB), but the brief asks for screenshots embedded in the README. How should evidence be stored?

| Option | Pros | Cons |
|---|---|---|
| **PNG screenshots + keep videos** ✅ | Meets the brief; README renders cleanly; videos still available | ~38 MB permanently added to repo history |
| PNG screenshots only | Small repo | Video evidence missing from the submission |
| Convert to GIF/MP4 | Animated evidence in the README | Needs ffmpeg; DevTools GIFs end up large or blurry |
| Upload via a GitHub PR or issue | Inline video, no repo bloat | Depends on GitHub attachments; upload size limits |

**Choice:** PNG stills embedded in the README; videos renamed (`phase1-paint-flashing.mov`, `phase1-performance.mov`) and linked as supporting evidence. Naming convention: `phaseN-<what>.png|.mov`.
