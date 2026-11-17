import { SKY, SPACE } from './sky.js'

// How full the context window is, in six steps: at rest under the Milky Way,
// then warp, faster at each level, up to red alert near the limit.
export const LEVELS = 6
const THRESHOLDS = [40, 60, 75, 85, 95] // percent at which levels 1..5 begin

export const levelOf = (percent: number): number =>
  THRESHOLDS.filter(limit => percent >= limit).length

// One streak's flight from the centre to the edge takes `seconds`; shorter is faster.
type Warp = { streaks: number; minSeconds: number; maxSeconds: number; length: number; core: boolean; alert: boolean }

const WARPS: Warp[] = [
  { streaks: 0, minSeconds: 0, maxSeconds: 0, length: 0, core: false, alert: false }, // level 0: at rest
  { streaks: 60, minSeconds: 3.2, maxSeconds: 4.6, length: 90, core: false, alert: false },
  { streaks: 100, minSeconds: 2.2, maxSeconds: 3.2, length: 150, core: true, alert: false },
  { streaks: 150, minSeconds: 1.4, maxSeconds: 2.1, length: 230, core: true, alert: false },
  { streaks: 220, minSeconds: 0.9, maxSeconds: 1.4, length: 330, core: true, alert: false },
  { streaks: 300, minSeconds: 0.55, maxSeconds: 0.9, length: 460, core: true, alert: true },
]

// A small seeded generator, so a level always draws the same sky.
const seeded = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

// The desktop app draws the backdrop under the whole window, sidebar included, so the
// window's centre sits left of the chat by half the sidebar (188 pt measured on the
// 5.11492.5 app). Warp radiates from the chat's centre instead; mobile has no sidebar.
export const DESKTOP_CENTRE_OFFSET = 94

// A streak points away from the centre: bright head at the origin, tail toward the centre.
// CSS scales it from a dot to full length while it flies out (keyframes `warp` in the sky).
// Units here are screen pixels: the warp layer is not scaled with the sky picture.
const streak = (angle: number, seconds: number, delay: number, length: number, width: number) =>
  `<g transform="rotate(${angle.toFixed(1)})">` +
  `<g class="wp" style="animation-duration:${seconds.toFixed(2)}s;animation-delay:-${delay.toFixed(2)}s">` +
  `<path d="M0 0 L-${length} -${width.toFixed(1)} L-${length} ${width.toFixed(1)}Z" fill="url(#streak)"/></g></g>`

export const scene = (level: number, centreOffset = 0): string => {
  const index = Math.max(0, Math.min(LEVELS - 1, level))
  if (index === 0) {
    return `${SKY}</svg>`
  }
  const warp = WARPS[index] ?? WARPS[1]!
  const random = seeded(7 + index * 101)
  const parts: string[] = []

  for (let i = 0; i < warp.streaks; i += 1) {
    const seconds = warp.minSeconds + random() * (warp.maxSeconds - warp.minSeconds)
    const length = Math.round(warp.length * (0.6 + random() * 0.8))
    parts.push(streak(random() * 360, seconds, random() * seconds, length, 0.8 + random() * 1.6))
  }

  // The glow ahead of the ship, and the red edge that pulses at red alert.
  const core = warp.core
    ? `<ellipse class="hum" cx="0" cy="0" rx="${120 + index * 40}" ry="${80 + index * 26}" fill="url(#core)"/>`
    : ''
  const alert = warp.alert ? '<rect class="pulse" width="100%" height="100%" fill="url(#alert)"/>' : ''
  // A layer whose origin is the window's centre, moved over to the chat's centre.
  const layer =
    `<svg x="50%" y="50%" overflow="visible"><g transform="translate(${centreOffset} 0)">` +
    `${core}${parts.join('')}</g></svg>`

  return `${SPACE}${layer}${alert}</svg>`
}
