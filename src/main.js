// UI wiring: emoji buttons, engine toggle and speed slider. Clicks go to the active engine.
import './styles/base.css'
import { EMOJIS, pickRandom } from './reactions.js'
import * as cssEngine from './engines/cssEngine.js'
import * as gsapEngine from './engines/gsapEngine.js'

const ENGINES = { css: cssEngine, gsap: gsapEngine }

const stage = document.querySelector('#stage')
const buttonRow = document.querySelector('#emoji-buttons')
const modeInputs = document.querySelectorAll('input[name="mode"]')
const speedControl = document.querySelector('#speed-control')
const speedInput = document.querySelector('#speed')
const speedValue = document.querySelector('#speed-value')

let engine = ENGINES[document.querySelector('input[name="mode"]:checked').value]

const send = (emoji) => engine.spawnReaction(stage, emoji)

// --- Emoji buttons -----------------------------------------------------------
for (const { char, label } of EMOJIS) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'emoji-btn'
  btn.textContent = char
  btn.setAttribute('aria-label', `Send ${label} reaction`)
  btn.addEventListener('click', () => send(char))
  buttonRow.appendChild(btn)
}

// --- Engine toggle -----------------------------------------------------------
// New reactions use the selected engine; reactions already in flight finish with their own.
function applyMode(mode) {
  engine = ENGINES[mode]
  // CSS keyframes have no runtime speed control here, so the slider only shows in GSAP mode.
  speedControl.hidden = mode !== 'gsap'
}

for (const input of modeInputs) {
  input.addEventListener('change', () => applyMode(input.value))
}
applyMode(engine === gsapEngine ? 'gsap' : 'css')

// --- Speed slider (GSAP timeScale) -------------------------------------------
speedInput.addEventListener('input', () => {
  const speed = Number(speedInput.value)
  gsapEngine.setSpeed(speed)
  speedValue.textContent = `${speed.toFixed(1)}×`
})

// --- Dev-only profiling helpers (DevTools console). Removed from production builds.
if (import.meta.env.DEV) {
  /** Spawn `count` random reactions with the active engine, spread evenly over `overMs`. */
  window.burst = (count = 50, overMs = 1000) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => send(pickRandom(EMOJIS).char), (i * overMs) / count)
    }
    return `spawning ${count} reactions over ${overMs}ms`
  }

  /** How many reactions are in the DOM right now. Should drop to 0 after the burst ends (no zombie nodes). */
  window.reactionCount = () => stage.querySelectorAll('.reaction').length
}
