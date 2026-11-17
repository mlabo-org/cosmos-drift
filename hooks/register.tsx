import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { LEVELS, levelOf, scene } from './scene.js'

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
      description: 'Preview the night sky at a context level: 0 (quiet) to 5 (meteor shower), or auto',
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

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'milky-way') {
      return next(e)
    }
    const pinned = await read($, forced)
    const shown = pinned ?? (await read($, level))
    const { Svg } = $.ui.resolve(e)
    return (
      <Svg
        source={scene(shown)}
        alt={shown >= 4 ? '天の川に流星群が降り、空の端が赤らむ夜空' : '斜めに横たわる天の川と、ときどき流れる流れ星'}
        isInteractive
      />
    )
  })
}
