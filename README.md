# cosmos-drift

A Claude Code mod that turns the Claude desktop app's Code tab (and the mobile app) into a night sky: ink-blue surfaces with starlight accents, and an animated SVG backdrop of the Milky Way and about 170 twinkling stars. The sky follows the context window: shooting stars come more often as it fills, and near the limit they become a meteor shower from one radiant while the horizon reddens, a hint to start a fresh session. The terminal and editors draw no themes, so the mod does nothing there.

| Context used | Level | Sky |
| --- | --- | --- |
| under 40% | 0 | 3 shooting stars, each every 19-37 s |
| 40-59% | 1 | 5 |
| 60-74% | 2 | 8 |
| 75-84% | 3 | 12, a faint glow at the horizon |
| 85-94% | 4 | meteor shower, 20 streaks |
| 95% and over | 5 | meteor shower, 30 streaks, red horizon |

The level is read from `$.session.usage()` before each model request (`turn.step`) and when a turn completes. `/cosmos-level 0`-`5` pins a level to preview it; `/cosmos-level auto` lets the sky follow the window again.

## Install (this Mac)

```bash
claude plugin marketplace add ~/plugins/cosmos-drift --scope user
claude plugin install cosmos-drift@cosmos-drift --scope user
```

A new session picks it up; an open one loads it with `/reload-plugins`.

## Files

- `hooks/register.tsx`: sets the look, follows the context window, answers `/cosmos-level`, and draws the `milky-way` scene for the `Backdrop` site.
- `hooks/scene.ts`: adds the level's shooting stars and horizon glow to the sky (at most about 108,000 characters; the scene limit is 131,072).
- `hooks/sky.ts`: the generated sky without shooting stars. `tools/make_cosmos.py` regenerates it (seeded, so the same sky each time): `python3 tools/make_cosmos.py`.
- `types/index.d.ts`: the mod's state (`level`, `forced`).
- `cosmos.test.tsx`: `claude plugin test .` checks the levels, the limit, `/cosmos-level` and a turn moving the sky on.
- `hooks/make-colors.js`: the palette helper from Claude Code's plugin-authoring skill, copied unchanged.

## Notes

- One theme stands per session; another theme mod set later replaces this one.
- With the OS "Reduce motion" setting on, the stars stop and the shooting stars are hidden.
- Dark only: the look forces dark mode while it is on.
