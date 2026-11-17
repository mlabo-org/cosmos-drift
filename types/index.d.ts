// 0 (at rest) to 5 (full warp, red alert), from the context window's fill (levelOf in hooks/scene.ts)
export type CosmosLevel = number

declare module 'claude-code' {
  interface PluginState {
    'cosmos-drift': {
      level: CosmosLevel
      // a level fixed by /cosmos-level, or null to follow the context window
      forced: CosmosLevel | null
      // the desktop sidebar's width in pt, set by /cosmos-center; warp moves right by half of it
      sidebar: number
    }
  }
}
