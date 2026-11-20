// UI wiring: builds the emoji buttons and sends clicks to the active engine.
import './styles/base.css'
import { EMOJIS, pickRandom } from './reactions.js'
import { spawnReaction } from './engines/cssEngine.js'

const stage = document.querySelector('#stage')
const buttonRow = document.querySelector('#emoji-buttons')

for (const { char, label } of EMOJIS) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'emoji-btn'
  btn.textContent = char
  btn.setAttribute('aria-label', `Send ${label} reaction`)
  btn.addEventListener('click', () => spawnReaction(stage, char))
  buttonRow.appendChild(btn)
}

// Dev-only profiling helpers, typed into the DevTools console. Removed from production builds.
if (import.meta.env.DEV) {
  /** Spawn `count` random reactions spread evenly over `overMs`. */
  window.burst = (count = 50, overMs = 1000) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => spawnReaction(stage, pickRandom(EMOJIS).char), (i * overMs) / count)
    }
    return `spawning ${count} reactions over ${overMs}ms`
  }

  /** How many reactions are in the DOM right now. Should drop to 0 after the burst ends (no zombie nodes). */
  window.reactionCount = () => stage.querySelectorAll('.reaction').length
}
