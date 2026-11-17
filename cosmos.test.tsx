import { expect, test } from 'claude-code/testing'

import { LEVELS, levelOf, scene } from './hooks/scene.js'

const BACKDROP = {
  plugin: 'cosmos-drift',
  component: 'Backdrop',
  requestId: 'backdrop',
  props: { scene: 'milky-way', plugin: 'cosmos-drift', glass: { blur: 14, tint: '#080b1a', opacity: 0.55 } },
} as const

const count = (svg: string, cls: string) => svg.split(`class="${cls}"`).length - 1

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

test('every level stays under the Svg limit and grows busier', () => {
  let previous = -1
  for (let level = 0; level < LEVELS; level += 1) {
    const svg = scene(level)
    expect(svg.length < 131_072).toBe(true)
    const meteors = count(svg, 'ss') + count(svg, 'sh')
    expect(meteors > previous).toBe(true)
    previous = meteors
  }
  expect([0, 39, 40, 74, 85, 94, 95, 100].map(levelOf)).toEqual([0, 0, 1, 2, 4, 4, 5, 5])
})

test('a quiet window draws the quiet sky, on desktop and mobile', async ($, on) => {
  engine(on, { percent: 12 })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  for (const surface of ['desktop', 'mobile'] as const) {
    const svg = await drawn($, surface)
    expect(count(svg, 'ss')).toBe(3)
    expect(count(svg, 'sh')).toBe(0)
    expect(svg.includes('class="dawn"')).toBe(false)
  }
})

test('a nearly full window draws the meteor shower and the red horizon', async ($, on) => {
  engine(on, { percent: 96 })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const svg = await drawn($, 'desktop')
  expect(count(svg, 'sh')).toBe(30)
  expect(svg.includes('class="dawn"')).toBe(true)
})

test('/cosmos-level pins a level and auto lets it follow again', async ($, on) => {
  engine(on, { percent: 5 })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.command.run({ command: 'cosmos-level', args: '4' })
  expect(count(await drawn($, 'desktop'), 'sh')).toBe(20)
  await $.command.run({ command: 'cosmos-level', args: 'auto' })
  expect(count(await drawn($, 'desktop'), 'ss')).toBe(3)
})

test('the sky moves on as the window fills during a turn', async ($, on) => {
  const usage = { percent: 10 }
  engine(on, usage)
  on('turn.complete', () => ({ text: '' }))
  on('turn.step', async function* (_: unknown, e: { turnId: string; index: number }) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn' }
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(count(await drawn($, 'desktop'), 'sh')).toBe(0)

  usage.percent = 88
  const stream = $.turn.step({ turnId: 't1', index: 0, model: 'claude-opus-5-5' } as any)
  for await (const _ of stream) {
    // drain the step
  }
  expect(count(await drawn($, 'desktop'), 'sh')).toBe(20)

  usage.percent = 97
  await $.turn.complete({ turnId: 't1', reason: 'end_turn', answer: '', text: '' } as any)
  expect(count(await drawn($, 'desktop'), 'sh')).toBe(30)
})
