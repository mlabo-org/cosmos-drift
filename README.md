# cosmos-drift

A Claude Code mod that turns the Claude desktop app's Code tab (and the mobile app) into a night sky: ink-blue surfaces with starlight accents, and an animated SVG backdrop of the Milky Way, about 170 twinkling stars and a shooting star every dozen seconds or so. The terminal and editors draw no themes, so the mod does nothing there.

## Install (this Mac)

```bash
claude plugin marketplace add ~/plugins/cosmos-drift --scope user
claude plugin install cosmos-drift@cosmos-drift --scope user
```

A new session picks it up; an open one loads it with `/reload-plugins`.

## Files

- `hooks/register.tsx`: sets the look at `session.start` and draws the `milky-way` scene for the `Backdrop` site.
- `hooks/scene.ts`: the generated SVG (about 101,000 characters; the scene limit is 131,072).
- `tools/make_cosmos.py`: regenerates `hooks/scene.ts` (seeded, so the same sky each time). `python3 tools/make_cosmos.py [preview.svg]`.
- `hooks/make-colors.js`: the palette helper from Claude Code's plugin-authoring skill, copied unchanged.

## Notes

- One theme stands per session; another theme mod set later replaces this one.
- With the OS "Reduce motion" setting on, the stars stop and the shooting stars are hidden.
- Dark only: the look forces dark mode while it is on.
