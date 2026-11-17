import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { DEFAULT_SIDEBAR_WIDTH, LEVELS, MAX_SIDEBAR_WIDTH, levelOf, scene } from './scene.js'

// A clear night far from town: ink-blue sky, starlight accents.
const { theme, problems } = makeColors({
  label: 'Cosmos drift',
  only: 'dark',
  roles: { accent: '#8fa8ff', danger: '#ff6b81', success: '#6fe3a5', warning: '#f5c15a', pro: '#c792ff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#080b1a',
        'surface-1': '#0d1124',
        'surface-2': '#11162e',
        'surface-3': '#131933',
        'text-primary': '#eceffd',
        'text-secondary': '#c0c6e4',
        'text-muted': '#959dc4',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'milky-way', glass: { blur: 8, tint: '#080b1a', opacity: 0.45 } },
}

// The sky's level follows the context window; /cosmos-level can pin one.
const level = atom({ plugin: 'cosmos-drift', key: 'level' } as const, 0)
const forced = atom({ plugin: 'cosmos-drift', key: 'forced' } as const, null)
// The sidebar's width in pt, kept in $.store across sessions and mirrored here so a change redraws.
const sidebar = atom({ plugin: 'cosmos-drift', key: 'sidebar' } as const, DEFAULT_SIDEBAR_WIDTH)
const SIDEBAR_KEY = 'sidebarWidth'

// Reads the context window's fill and moves the sky only when its level changes.
const follow = async ($: EngineInterface) => {
  const { context } = await $.session.usage()
  const percent =
    context.percent ?? (context.tokens !== undefined && context.window > 0 ? (context.tokens / context.window) * 100 : 0)
  const next = levelOf(percent)
  if ((await read($, level)) !== next) {
    await update($, level, () => next)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }
    await $.command.register({
      name: 'cosmos-level',
      description: 'Preview the sky at a context level: 0 (at rest) to 5 (full warp, red alert), or auto',
    })
    const kept = Number(await $.store.get(SIDEBAR_KEY))
    if (Number.isFinite(kept) && kept >= 0 && kept <= MAX_SIDEBAR_WIDTH) {
      await update($, sidebar, () => kept)
    }
    await $.command.register({
      name: 'cosmos-center',
      description: 'Centre warp on the chat: give the sidebar width in pt (0 when it is closed), or nothing to see it',
    })
    await follow($)
    return next(e)
  })

  // Before each model request of a turn, and once the turn's last answer is in.
  on('turn.step', async function* ($, e, next) {
    await follow($)
    return yield* next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    await follow($)
    return done
  })

  on('command.run', { command: 'cosmos-level' }, async ($, e) => {
    const word = e.args.trim()
    if (word === '' || word === 'auto') {
      await update($, forced, () => null)
      return { text: `the sky follows the context window again (now level ${await read($, level)}).` }
    }
    const asked = Number(word)
    if (!Number.isInteger(asked) || asked < 0 || asked >= LEVELS) {
      return { text: `give a level from 0 to ${LEVELS - 1}, or auto.` }
    }
    await update($, forced, () => asked)
    return { text: `the sky shows level ${asked} until /cosmos-level auto.` }
  })

  on('command.run', { command: 'cosmos-center' }, async ($, e) => {
    const word = e.args.trim()
    if (word === '') {
      return { text: `warp is centred for a ${await read($, sidebar)} pt sidebar. /cosmos-center <width> changes it; 0 when the sidebar is closed.` }
    }
    const width = Number(word)
    if (!Number.isFinite(width) || width < 0 || width > MAX_SIDEBAR_WIDTH) {
      return { text: `give the sidebar width in pt, from 0 to ${MAX_SIDEBAR_WIDTH}.` }
    }
    const rounded = Math.round(width)
    await update($, sidebar, () => rounded)
    await $.store.set(SIDEBAR_KEY, rounded)
    return { text: `warp is now centred for a ${rounded} pt sidebar, kept for later sessions.` }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'milky-way') {
      return next(e)
    }
    const pinned = await read($, forced)
    const shown = pinned ?? (await read($, level))
    const { Svg } = $.ui.resolve(e)
    return (
      <Svg
        source={scene(shown, e.surface === 'desktop' ? (await read($, sidebar)) / 2 : 0)}
        alt={shown === 0 ? '斜めに横たわる天の川と、またたく星' : shown === 5 ? '全速のワープで星が放射状に流れ、画面の縁が赤く明滅する' : 'ワープで星が画面の中心から放射状に流れる'}
        isInteractive
      />
    )
  })
}
