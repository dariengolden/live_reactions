// Phase 2 engine: GSAP animating ONLY compositor-friendly properties
// (x, y, scale, opacity -> CSS transform + opacity). No layout properties change
// during flight, so the browser can skip Layout and Paint and just composite.
import { gsap } from 'gsap'
import '../styles/gsap-engine.css'
import { LIFESPAN_MS, createFlightParams } from '../reactions.js'

const LIFESPAN_S = LIFESPAN_MS / 1000
/** How far up the stage a reaction travels before it has fully faded (matches Phase 1's 85%). */
const RISE_FRACTION = 0.85

// ---------------------------------------------------------------------------
// Master timeline: the parent of every reaction's timeline.
// The speed slider sets master.timeScale(), which speeds up or slows down every
// in-flight reaction at once, and reactions spawned later inherit the same speed.
// ---------------------------------------------------------------------------
const master = gsap.timeline({ autoRemoveChildren: true })
// A timeline stops once its playhead reaches the end of its last child. An empty
// zero-duration "set" placed very far in the future keeps the master playing forever,
// so new reactions can always be added at its current time.
master.set({}, {}, 1e6)

/** Set the playback speed of all current and future reactions (1 = normal). */
export function setSpeed(value) {
  master.timeScale(value)
}

// ---------------------------------------------------------------------------
// Stage height, cached by a ResizeObserver so spawning never reads layout
// (reading clientHeight right after appending nodes can force a synchronous layout).
// ---------------------------------------------------------------------------
let stageHeight = 0
let observedStage = null

function trackStageHeight(stage) {
  if (observedStage === stage) return
  observedStage = stage
  stageHeight = stage.clientHeight // a single read, on the first spawn only
  new ResizeObserver(([entry]) => {
    stageHeight = entry.contentRect.height
  }).observe(stage)
}

/**
 * Spawn one floating reaction inside `stage`. Same interface as cssEngine.
 * @param {HTMLElement} stage  positioned container the reaction floats in
 * @param {string} emoji
 */
export function spawnReaction(stage, emoji) {
  trackStageHeight(stage)
  const p = createFlightParams()

  const el = document.createElement('span')
  el.className = 'reaction reaction--gsap'
  el.textContent = emoji
  el.setAttribute('aria-hidden', 'true')
  // Static layout, set once and never animated.
  el.style.left = `${p.startX}%`
  // Resolution independence: render the glyph at its LARGEST size and animate
  // scale from a fraction up to 1, so its raster is never enlarged (no blur).
  el.style.fontSize = `${p.sizeEnd}px`
  stage.appendChild(el)

  // Sway: fit a whole number of side-to-side passes into the lifespan, so the
  // sway ends exactly when the rise does and the timeline completes at 3s.
  const swayPasses = Math.max(2, Math.round(LIFESPAN_MS / p.swayPeriod))
  const swayDuration = LIFESPAN_S / swayPasses
  const swayDirection = Math.random() < 0.5 ? 1 : -1 // random start side

  const tl = gsap.timeline({
    onComplete: () => {
      tl.kill() // removes it from the master; no leaked tweens
      el.remove() // no zombie nodes
    },
  })

  // Rise + scale (Phase 1 "rise": bottom + font-size -> y + scale)
  tl.fromTo(
    el,
    { y: 0, scale: p.sizeStart / p.sizeEnd },
    { y: -stageHeight * RISE_FRACTION, scale: 1, duration: LIFESPAN_S, ease: 'power1.out' },
    0,
  )

  // Fade: in over the first 10%, hold, then out from 65% to 100% (same as Phase 1)
  tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: LIFESPAN_S * 0.1, ease: 'none' }, 0)
  tl.to(el, { opacity: 0, duration: LIFESPAN_S * 0.35, ease: 'power1.in' }, LIFESPAN_S * 0.65)

  // Sway (Phase 1 "sway": left -> x), finite yoyo so the timeline can complete
  tl.fromTo(
    el,
    { x: -swayDirection * p.swayAmplitude },
    {
      x: swayDirection * p.swayAmplitude,
      duration: swayDuration,
      ease: 'sine.inOut',
      repeat: swayPasses - 1,
      yoyo: true,
    },
    0,
  )

  // Start it at the master's current playhead so it plays immediately at the current speed.
  master.add(tl, master.time())
}
