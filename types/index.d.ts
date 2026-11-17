// 0 (quiet sky) to 5 (meteor shower), from the context window's fill (levelOf in hooks/scene.ts)
export type CosmosLevel = number

declare module 'claude-code' {
  interface PluginState {
    'cosmos-drift': {
      level: CosmosLevel
      // a level fixed by /cosmos-level, or null to follow the context window
      forced: CosmosLevel | null
    }
  }
}
