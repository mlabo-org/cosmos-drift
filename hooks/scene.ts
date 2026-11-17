import { SKY } from './sky.js'

// How full the context window is, in six steps: the sky gets busier as it fills.
export const LEVELS = 6
const THRESHOLDS = [40, 60, 75, 85, 95] // percent at which levels 1..5 begin

export const levelOf = (percent: number): number =>
  THRESHOLDS.filter(limit => percent >= limit).length

type Step = { meteors: number; minSeconds: number; maxSeconds: number; dawn: number; shower: boolean }

// Level 0 is the quiet sky; 4 and 5 are a meteor shower from one radiant.
const STEPS: Step[] = [
  { meteors: 3, minSeconds: 19, maxSeconds: 37, dawn: 0, shower: false },
  { meteors: 5, minSeconds: 14, maxSeconds: 30, dawn: 0, shower: false },
  { meteors: 8, minSeconds: 10, maxSeconds: 24, dawn: 0, shower: false },
  { meteors: 12, minSeconds: 8, maxSeconds: 18, dawn: 0.15, shower: false },
  { meteors: 20, minSeconds: 5, maxSeconds: 11, dawn: 0.4, shower: true },
  { meteors: 30, minSeconds: 3.5, maxSeconds: 8, dawn: 0.7, shower: true },
]

// A small seeded generator, so a level always draws the same sky.
const seeded = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

// A streak: a blurred halo under a bright tapered tail, head at the origin.
// Widths are in the 1600x1000 sky, which a window draws a little smaller,
// and the app's frosted glass softens them further, so they are drawn bold.
const meteor = (x: number, y: number, angle: number, seconds: number, delay: number, cls: string, length: number, width: number) =>
  `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${angle.toFixed(0)})">` +
  `<g class="${cls}" style="animation-duration:${seconds.toFixed(1)}s;animation-delay:-${delay.toFixed(1)}s">` +
  `<path d="M0 0 L-${length} -${width * 2.5} L-${length} ${width * 2.5}Z" fill="url(#tail)" opacity=".55" filter="url(#trail)"/>` +
  `<path d="M${width} 0 L-${length} -${width} L-${length} ${width}Z" fill="url(#tail)"/>` +
  `<circle r="${(width * 1.6).toFixed(1)}" fill="#fff" filter="url(#glow)"/></g></g>`

const RADIANT = { x: 1330, y: 110 }

export const scene = (level: number): string => {
  const step = STEPS[Math.max(0, Math.min(LEVELS - 1, level))] ?? STEPS[0]!
  const random = seeded(7 + level * 101)
  const parts: string[] = []

  for (let i = 0; i < step.meteors; i += 1) {
    const seconds = step.minSeconds + random() * (step.maxSeconds - step.minSeconds)
    const delay = random() * seconds

    if (step.shower) {
      // Streaks start near the radiant and fly away from it, as a real shower does.
      const angle = 100 + random() * 95
      const distance = 40 + random() * 320
      const radians = (angle * Math.PI) / 180
      const x = RADIANT.x + Math.cos(radians) * distance
      const y = RADIANT.y + Math.sin(radians) * distance
      parts.push(meteor(x, y, angle, seconds, delay, 'sh', 220 + Math.round(random() * 120), 3.4))
    } else {
      const leftward = random() < 0.6
      const angle = leftward ? 140 + random() * 25 : 18 + random() * 25
      const x = leftward ? 700 + random() * 800 : 120 + random() * 700
      const y = 60 + random() * 380
      parts.push(meteor(x, y, angle, seconds, delay, 'ss', 300, 2.8))
    }
  }

  const dawn =
    // The level sets the group's opacity; the rect's own animation only breathes inside it.
    step.dawn > 0 ? `<g opacity="${step.dawn}"><rect class="dawn" width="1600" height="1000" fill="url(#dawn)"/></g>` : ''

  return `${SKY}${dawn}${parts.join('')}</svg>`
}
