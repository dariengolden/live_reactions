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

---

## Phase 2 — GSAP Engine

### D13. Adding GSAP
**Date:** 2026-11-22

| Option | Pros | Cons |
|---|---|---|
| **npm install gsap** ✅ | Version pinned in the lockfile; bundled by Vite; works offline; consistent with D1 | One install step |
| CDN `<script>` tag | Nothing to install | Global variable; needs internet; mixes two loading styles |

**Choice:** `npm i gsap`, then `import { gsap } from 'gsap'`.

### D14. Mode toggle
**Date:** 2026-11-22

| Option | Pros | Cons |
|---|---|---|
| **Segmented control in the bar** ✅ | Instant A/B comparison in one session; visible to reviewers | Both engines briefly on screen just after switching |
| URL param (`?mode=gsap`) | Each profile run is guaranteed single-engine | Reload to switch |
| Toggle + URL param | Both benefits | More code |

**Choice:** A `CSS | GSAP` toggle built from native radio buttons. New reactions use the selected engine; reactions already in flight finish with their own. Both engines export the same `spawnReaction(stage, emoji)`, so `main.js` just swaps which module it calls. **GSAP is selected by default.** For clean profiling, wait for the stage to empty before switching.

### D15. Speed control (timeScale)
**Date:** 2026-11-22

| Option | Pros | Cons |
|---|---|---|
| **Master timeline** ✅ | One call updates every in-flight reaction; new reactions inherit the speed; scoped to reactions only | Each reaction must be added at the master's current time, and the master must never finish |
| `gsap.globalTimeline` | One line | Affects every GSAP animation on the page |
| Track a `Set` of timelines | Explicit registry | Most bookkeeping; a loop on every slider event |

**Choice:** `master = gsap.timeline({ autoRemoveChildren: true })`. Each reaction is added with `master.add(tl, master.time())`, and the slider calls `master.timeScale(v)`. An empty `master.set({}, {}, 1e6)` keeps the master playing indefinitely, so it never "completes" and stops accepting new reactions.

### D16. Resolution independence
**Date:** 2026-11-22
**Context:** A composited layer is rasterised once at a fixed size. Scaling it up with `transform` stretches those pixels, which can look blurry.

| Option | Pros | Cons |
|---|---|---|
| **Emoji at max size, scale down** ✅ | Raster is never enlarged, so it stays crisp; smallest change | Emoji glyphs can't be tinted freely |
| Inline SVG icons, scale down | True vectors; tintable at runtime | Need 4 SVGs; changes the look |
| Emoji, scale up as in Phase 1 | Simplest | Blurry near the top of the flight |

**Choice:** `font-size` is set once to `sizeEnd`, and `scale` animates from `sizeStart / sizeEnd` (about 0.5–0.8) up to `1`.

### D17. GSAP motion structure
**Date:** 2026-11-22

| Option | Pros | Cons |
|---|---|---|
| **Timeline per reaction** ✅ | Mirrors D6's rise + sway; one object to kill; nests under the master | Sway must use a finite repeat count |
| Single tween with keyframes | One tween | Zig-zag paths; timing locked together |
| Separate tweens, no timeline | Simplest code | Two objects to track and kill |

**Choice:** Each reaction's timeline contains:
- a rise tween (`y`, `scale`) over 3s with `power1.out`
- fade-in and fade-out tweens on `opacity` (0–10% and 65–100% of the flight, the same as Phase 1)
- a sway tween on `x` with `sine.inOut`, `yoyo`

The sway period is adjusted so a whole number of passes fits exactly into 3s. That way the timeline ends precisely when the rise ends.

### D18. GSAP cleanup
**Date:** 2026-11-22
**Context:** At 0.1× speed a flight lasts 30s, so a fixed timeout would remove reactions mid-flight.

| Option | Pros | Cons |
|---|---|---|
| **`onComplete`: remove + kill** ✅ | Follows the timeline's own clock, so it works at any speed; no leaked tweens | None in practice, since the master always plays |
| `onComplete` + time-scaled fallback | Extra safety, like D7 | Complex; easy to get wrong |

**Choice:** The reaction timeline's `onComplete` calls `tl.kill()` and `el.remove()`.

### D19. Speed slider in CSS mode
**Date:** 2026-11-22

| Option | Pros | Cons |
|---|---|---|
| **Disable in CSS mode** ✅ | Honest about what static CSS can't easily do; a talking point for the reflection | Less feature parity |
| Also drive CSS via `playbackRate` | Richer comparison | Scope creep; breaks the D7 fallback timing |
| Hide in CSS mode | Cleanest UI | Less discoverable |

**Choice:** ~~In CSS mode the slider is disabled and shows "GSAP only".~~
**Revised (2026-11-22):** **Hide it in CSS mode**, after seeing the UI. Hiding is fine because the slider sits next to the toggle, so it appears the moment GSAP is selected (see D21).

### D20. Stage height for `y` distance
**Date:** 2026-11-22

| Option | Pros | Cons |
|---|---|---|
| **Cache with `ResizeObserver`** ✅ | Spawning never reads layout, so a burst can't trigger forced synchronous layouts | A few more lines; in-flight reactions keep their old distance after a resize |
| Read `clientHeight` on every spawn | Simplest | Can force a synchronous layout during bursts |
| `vh` / `yPercent` units | No measuring | Tied to the viewport, not the stage |

**Choice:** `stageHeight` is read once on the first spawn, then kept up to date by a `ResizeObserver`.

### D21. Control bar layout
**Date:** 2026-11-22
**Question:** Where do the toggle, slider and emoji buttons go so that hiding the slider doesn't shift anything?

**Choice (your design):** The CSS/GSAP toggle is left-aligned with the speed slider right next to it. The emoji buttons stay centred.

**How it's built:** a 3-column CSS grid, `1fr auto 1fr` (`[toggle + slider | emoji buttons | empty]`). The two equal `1fr` side columns keep the middle column centred, whatever the left column contains. So hiding the slider in CSS mode never moves the emoji buttons. Below 640px wide, the bar stacks into one centred column.

| Alternative considered | Why not |
|---|---|
| Flexbox with `justify-content: space-between` | The emoji buttons would only be centred if the left and right groups had equal widths, so they'd shift when the slider hides |
| Absolutely positioning the emoji buttons | Works, but takes them out of the flow, so they can overlap the left group on narrow screens |

---

## Appendix — Full-length profiling observations
**Date:** 2026-11-22
**Context:** The original long versions of the README observation answers, saved before they were shortened in the README.

### Phase 1: CSS Keyframes
* **Observations:**
  * The animations are smooth when triggered one at a time. With 50 floating reactions on screen at once, the frame rate drops noticeably. With CPU throttling added, frame rate drops horribly. Flame chart reports block widths climb at the start and are longest in the middle, where early flights are still ongoing and last ones are just beginning flight. Layout cost grows in proportion to number of animations of the screen.
  * What regions of the screen flashed green during high-concurrency spawning, and why?
    Floating emojis and the paths they travelled flashed green. Each reaction had a green box over its current position. Below it was a trail of empty green boxes over spots the emoji had already left. These empty boxes are paint invalidation regions. When an element moves, the browser has to repaint both its new rectangle and the old rectangle it was in, so the old spot can be filled back in with the background. The overlay fades a little after each repaint, so these old rectangle regions build up into the trails in the screenshot. The clearest example is the row of empty boxes at the spawn point, where emojis started and then floated away. All of this happens because the keyframes animate `bottom`, `left` and `font-size`. These are layout properties, so the browser recalculates layout and repaints every frame instead of just moving an already-painted layer. Near the spawn area, where reactions were overlapped, meaning those areas were repainted more than once per frame. The FPS meter showed about 100 fps, but its frame bars were yellow and orange, and my observation very clearly showed a drop in frames. This is because all 50 elements are laid out and repainted again on every frame.
  * What did the main thread activity (Layout, Recalculate Style, Paint) look like in the flame chart?
    The main thread activity displayed tasks as longer especially in the middle of the high-concurrency spawning. In the busiest part of the burst the main thread was saturated and the overview above the screenshots show red, indicating that the tasks were long (>50ms). It's clear that rendering the layout block took the longest. Every frame, the browser has to re-lay out each reaction whose `bottom`, `left` or `font-size` changed, so layout cost grows with the number of reactions in flight. Animating `font-size` makes it worse, because each emoji's text must be measured again at its new size.

### Phase 2: GSAP & Composited Rendering
* **Observations:**
  * How did the flame chart and frame rate change compared to Phase 1?
    The animations stay smooth even with 50 reactions on screen at once. With the same CPU throttling as Phase 1, the frame rate holds up and the drop I saw before is gone. The flame chart looks completely different. In Phase 1 the blocks were longest in the middle of the burst, when early flights were still going and the last ones were just starting. In Phase 2 the heavy work only happens while reactions are being spawned. After that the main thread settles into a thin, regular pattern, even though all 50 reactions are still flying. There were no red long tasks in the overview, and the Frames lane was almost all green, with one partially presented frame during spawning. Each new reaction is added to the DOM, so the browser has to style and lay out that one new element. After that, moving it costs almost nothing on the main thread. In Phase 1, by contrast, layout cost grew with the number of reactions in flight.
    The Bottom-up tab still shows Rendering at the top (749.9 ms), then Scripting (550.0 ms) and Painting (207.2 ms). When I expanded Rendering, most of it was **[Recalculate Style, with Layout close to zero after spawning ended]**. GSAP writes `transform` and `opacity` as inline styles on every tick, so the browser still recalculates style for each element. What it no longer has to do is re-lay out the page every frame, and that was the expensive part in Phase 1. Most of the Painting time was **[Pre-paint / Layerize / Commit rather than Paint]**, which means the browser was compositing layers rather than repainting pixels. The trade-off is Scripting. CSS keyframes ran without any JavaScript, but GSAP runs a JS tick every frame to calculate the new values. That cost is cheaper than layout and paint, but it is still main-thread work that Phase 1 didn't have.
  * What happened to the green paint invalidation areas once animations moved to composited transforms (`x`, `y`)?
    The green trails disappeared. In Phase 1 every reaction left a trail of empty green boxes behind it, because the browser had to repaint both the new rectangle and the old one each frame. In Phase 2 each emoji flashed green once when it was spawned, and then nothing flashed while it floated up. This is because GSAP only animates `x`, `y`, `scale` and `opacity`, which become CSS `transform` and `opacity`. The browser paints each emoji once into its own layer, and after that the compositor just moves, scales and fades that layer on the GPU. Turning on Layer borders showed **[each reaction promoted to its own layer]**. I also render the emoji at its largest `font-size` and scale it up from a fraction of that size to `1`, so the layer is never stretched past the size it was painted at and doesn't go blurry.
