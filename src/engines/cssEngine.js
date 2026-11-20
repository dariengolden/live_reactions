// Phase 1 engine: DOM element + CSS @keyframes animating LAYOUT properties
// (bottom, left, font-size). This is intentionally the "slow" path for profiling.
import '../styles/css-engine.css'
import { LIFESPAN_MS, createFlightParams } from '../reactions.js'

/** Extra time before the fallback cleanup fires, in case animationend never arrives. */
const CLEANUP_GRACE_MS = 500

/**
 * Spawn one floating reaction inside `stage`.
 * @param {HTMLElement} stage  positioned container the reaction floats in
 * @param {string} emoji
 */
export function spawnReaction(stage, emoji) {
  const p = createFlightParams()
  const el = document.createElement('span')
  el.className = 'reaction reaction--css'
  el.textContent = emoji
  el.setAttribute('aria-hidden', 'true')

  // Random values reach the shared @keyframes through CSS custom properties.
  el.style.setProperty('--life', `${LIFESPAN_MS}ms`)
  el.style.setProperty('--x', `${p.startX}%`)
  el.style.setProperty('--sway', `${p.swayAmplitude}px`)
  el.style.setProperty('--sway-period', `${p.swayPeriod}ms`)
  el.style.setProperty('--sway-delay', `${-p.swayOffset * p.swayPeriod}ms`)
  el.style.setProperty('--size-start', `${p.sizeStart}px`)
  el.style.setProperty('--size-end', `${p.sizeEnd}px`)

  // Cleanup: animationend is the main path; the timeout is a safety net
  // (e.g. a background tab where the animation never finishes).
  let removed = false
  const cleanup = () => {
    if (removed) return
    removed = true
    clearTimeout(fallback)
    el.remove()
  }
  const fallback = setTimeout(cleanup, LIFESPAN_MS + CLEANUP_GRACE_MS)

  el.addEventListener('animationend', (e) => {
    // Only `rise` ends; `sway` loops forever. The name check keeps this safe if that changes.
    if (e.animationName === 'rise') cleanup()
  })

  stage.appendChild(el)
}
