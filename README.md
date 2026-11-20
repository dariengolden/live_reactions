# Livestream Reaction Engine — Submission

> Architecture decisions made while building this project are logged in [DECISIONS.md](./DECISIONS.md).

## 1. Setup & Running Instructions

Requirements: Node.js and npm, plus Google Chrome for profiling.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173) in Chrome.

**Profiling helpers** (dev server only; type these into the DevTools console):

| Command | What it does |
|---|---|
| `burst()` | Spawns 50 random reactions spread over 1 second |
| `burst(100, 500)` | Spawns 100 reactions over 0.5 seconds |
| `reactionCount()` | Reactions currently in the DOM. Returns `0` once all have finished (no zombie nodes) |

## 2. Phase 1: CSS Keyframes Analysis

* **Paint Flashing Screenshot:** _TODO_
* **Performance Profile Screenshot:** _TODO_
* **Observations:**
  * What regions of the screen flashed green during high-concurrency spawning, and why?
    _TODO_
  * What did the main thread activity (Layout, Recalculate Style, Paint) look like in the flame chart?
    _TODO_

## 3. Phase 2: GSAP & Composited Rendering Analysis

* **Performance Profile Screenshot:** _TODO_
* **Observations:**
  * How did the flame chart and frame rate change compared to Phase 1?
    _TODO_
  * What happened to the green paint invalidation areas once animations moved to composited transforms (`x`, `y`)?
    _TODO_

## 4. Architectural Reflection

* **Runtime Control & Developer Experience:** How does adjusting playback speed or randomizing flight paths mid-flight compare between static CSS rules and programmatic timelines?
  _TODO_
* **Pipeline Considerations:** If our application needed to dynamically tint, re-theme, or alter these reaction assets at runtime based on active user preferences, what architectural considerations dictate choosing programmatic vector manipulation over pre-rendered raster image sequences?
  _TODO_
