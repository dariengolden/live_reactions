// Shared reaction data + randomness. Engine-agnostic so Phase 2 (GSAP) can reuse it.

export const EMOJIS = [
  { char: '❤️', label: 'Heart' },
  { char: '👍', label: 'Thumbs up' },
  { char: '🔥', label: 'Fire' },
  { char: '⭐', label: 'Star' },
]

/** Total flight time of one reaction, in ms (brief: 3-second lifespan). */
export const LIFESPAN_MS = 3000

export const random = (min, max) => Math.random() * (max - min) + min

export const pickRandom = (list) => list[Math.floor(Math.random() * list.length)]

/**
 * Per-reaction random flight parameters.
 * Units are plain numbers; each engine decides how to apply them.
 */
export function createFlightParams() {
  return {
    startX: random(30, 70),       // % of stage width — the spawn area
    swayAmplitude: random(15, 40), // px either side of startX
    swayPeriod: random(600, 1100), // ms for one side-to-side pass
    swayOffset: random(0, 1),      // 0–1 — start at a random point in the sway cycle
    sizeStart: random(22, 30),     // px
    sizeEnd: random(36, 48),       // px — "scale up slightly"
  }
}
