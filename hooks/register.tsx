import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { SCENE } from './scene.js'

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
  backdrop: { scene: 'milky-way', glass: { blur: 14, tint: '#080b1a', opacity: 0.55 } },
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
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'milky-way') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    return <Svg source={SCENE} alt="斜めに横たわる天の川と、ときどき流れる流れ星" isInteractive />
  })
}
