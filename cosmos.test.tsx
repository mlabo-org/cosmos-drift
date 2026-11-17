import { expect, test } from 'claude-code/testing'

import { LEVELS, levelOf, scene } from './hooks/scene.js'

const BACKDROP = {
  plugin: 'cosmos-drift',
  component: 'Backdrop',
  requestId: 'backdrop',
  props: { scene: 'milky-way', plugin: 'cosmos-drift', glass: { blur: 8, tint: '#080b1a', opacity: 0.45 } },
} as const

const count = (svg: string, cls: string) => svg.split(`class="${cls}"`).length - 1

// The mean flight time of a level's warp streaks, in seconds.
const meanFlight = (svg: string) => {
  const times = [...svg.matchAll(/class="wp" style="animation-duration:([0-9.]+)s/g)].map(m => Number(m[1]))
  return times.reduce((a, b) => a + b, 0) / times.length
}

// The engine's half: the theme is drawn, a command registers, and usage reads `percent`.
const engine = (on: any, usage: { percent: number }) => {
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'backdrop' } }))
  on('command.register', () => ({ value: { command: 'cosmos-level' } }))
  on('session.usage', () => ({
    value: { startedAt: 0, context: { tokens: usage.percent * 10_000, window: 1_000_000, percent: usage.percent }, rateLimits: [] },
  }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
}

const drawn = async ($: any, surface: 'desktop' | 'mobile') => {
  const ui = await $.ui.mount({ ...BACKDROP, surface })
  const svg = await ui.find({ type: 'Svg' })
  await ui.unmount()
  return String(svg?.props?.source ?? svg?.source ?? '')
}

test('every level stays under the Svg limit, and warp gets denser and faster', () => {
  let streaks = -1
  let flight = Infinity
  for (let level = 0; level < LEVELS; level += 1) {
    const svg = scene(level)
    expect(svg.length < 131_072).toBe(true)
    expect(count(svg, 'wp') > streaks).toBe(true)
    streaks = count(svg, 'wp')
    if (level > 0) {
      expect(meanFlight(svg) < flight).toBe(true)
      flight = meanFlight(svg)
    }
  }
  expect([0, 39, 40, 74, 85, 94, 95, 100].map(levelOf)).toEqual([0, 0, 1, 2, 4, 4, 5, 5])
})

test('a quiet window rests under the Milky Way, on desktop and mobile', async ($, on) => {
  engine(on, { percent: 12 })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  for (const surface of ['desktop', 'mobile'] as const) {
    const svg = await drawn($, surface)
    expect(count(svg, 'wp')).toBe(0)
    expect(count(svg, 'core')).toBe(1)
    expect(count(svg, 'pulse')).toBe(0)
  }
})

test('a nearly full window goes to full warp with red alert', async ($, on) => {
  engine(on, { percent: 96 })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const svg = await drawn($, 'desktop')
  expect(count(svg, 'wp')).toBe(300)
  expect(count(svg, 'pulse')).toBe(1)
  expect(count(svg, 'core')).toBe(0)
})

test('/cosmos-level pins a level and auto lets it follow again', async ($, on) => {
  engine(on, { percent: 5 })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.command.run({ command: 'cosmos-level', args: '4' })
  expect(count(await drawn($, 'desktop'), 'wp')).toBe(220)
  await $.command.run({ command: 'cosmos-level', args: 'auto' })
  expect(count(await drawn($, 'desktop'), 'wp')).toBe(0)
})

test('the ship speeds up as the window fills during a turn', async ($, on) => {
  const usage = { percent: 10 }
  engine(on, usage)
  on('turn.complete', () => ({ text: '' }))
  on('turn.step', async function* (_: unknown, e: { turnId: string; index: number }) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn' }
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(count(await drawn($, 'desktop'), 'wp')).toBe(0)

  usage.percent = 88
  const stream = $.turn.step({ turnId: 't1', index: 0, model: 'claude-opus-5-5' } as any)
  for await (const _ of stream) {
    // drain the step
  }
  expect(count(await drawn($, 'desktop'), 'wp')).toBe(220)

  usage.percent = 97
  await $.turn.complete({ turnId: 't1', reason: 'end_turn', answer: '', text: '' } as any)
  expect(count(await drawn($, 'desktop'), 'wp')).toBe(300)
})
