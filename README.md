# cosmos-drift

A Claude Code mod that turns the Claude desktop app's Code tab (and the mobile app) into space: ink-blue surfaces with starlight accents, and an animated SVG backdrop that follows the context window. With room to spare the ship rests under the Milky Way; as the window fills it goes to warp, stars streaming out from the centre of the screen faster and denser at each level, until red alert pulses at the edges near the limit, a hint to start a fresh session. The terminal and editors draw no themes, so the mod does nothing there.

| Context used | Level | Sky |
| --- | --- | --- |
| under 40% | 0 | at rest: the Milky Way and twinkling stars |
| 40-59% | 1 | warp: 60 streaks, 3.2-4.6 s each from centre to edge |
| 60-74% | 2 | 100 streaks, 2.2-3.2 s, a glow ahead |
| 75-84% | 3 | 150 streaks, 1.4-2.1 s |
| 85-94% | 4 | 220 streaks, 0.9-1.4 s |
| 95% and over | 5 | full warp: 300 streaks, 0.55-0.9 s, red alert at the edges |

The level is read from `$.session.usage()` before each model request (`turn.step`) and when a turn completes. `/cosmos-level 0`-`5` pins a level to preview it; `/cosmos-level auto` lets the sky follow the window again.

## Requirements

- The Claude desktop app, whose Code tab draws the sky (the mobile app draws it too). Made and checked with Claude Code 2.1.325 in desktop app 5.11492.5; older builds may lack scene backdrops. The terminal and editors run the mod but draw no themes.
- Nothing else: no build step, no network, no other program.

## Install

At the prompt of a Claude Code session:

```
/plugin install cosmos-drift --marketplace mlabo-org/cosmos-drift
```

Answer `y` to add the marketplace, then pick a scope. From a shell instead:

```bash
claude plugin install cosmos-drift --marketplace mlabo-org/cosmos-drift
```

A new session picks it up; an open one loads it with `/reload-plugins`. Check it with `/cosmos-level 5` (full warp), then `/cosmos-level auto`.

## Files

- `hooks/register.tsx`: sets the look, follows the context window, answers `/cosmos-level`, and draws the `milky-way` scene for the `Backdrop` site.
- `hooks/scene.ts`: builds a level's scene: the Milky Way at rest, or deep space with the warp streaks, glow and red alert (at most about 90,000 characters; the scene limit is 131,072).
- `hooks/sky.ts`: the two generated skies, `SKY` (Milky Way) and `SPACE` (stars only, for warp). `tools/make_cosmos.py` regenerates them (seeded, so the same sky each time): `python3 tools/make_cosmos.py`.
- `types/index.d.ts`: the mod's state (`level`, `forced`).
- `cosmos.test.tsx`: `claude plugin test .` checks the levels, the limit, warp getting faster, `/cosmos-level` and a turn speeding the ship up.
- `hooks/make-colors.js` and `hooks/make-colors.d.ts`: the palette helper Claude Code's built-in plugin-authoring skill hands out for theme mods, copied unchanged. It is Anthropic's, not part of this project, and not covered by its license.

## Notes

- One theme stands per session; another theme mod set later replaces this one.
- With the OS "Reduce motion" setting on, the stars stop and the warp streaks are hidden.
- Dark only: the look forces dark mode while it is on.
- Only one theme mod at a time: remove another theme mod before adding this one, since a mod removed later clears the theme.

## License

MIT, for everything here except `hooks/make-colors.js` and `hooks/make-colors.d.ts` (see Files).
