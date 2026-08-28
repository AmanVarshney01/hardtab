# find-space

Somewhere in 100,000 lines of enterprise Java, someone used a tab. Find it.

A joke game in the tradition of *find the needle in the haystack* and *find the missing semicolon*. The tab
always sits on a tab stop, so it renders pixel-identical to the four spaces around it. The only tells are
interaction: drag-select across spaces grows one column at a time, across the tab it jumps four; the caret
skips it in one keystroke; the status bar says `(1 selected)` for something four columns wide.

- Haystacks are generated in the browser from a seed (`/play?lines=100000&seed=42`), so a shared link is the same puzzle.
- CodeMirror 6 renders only the viewport, so browser Ctrl+F only searches what is on screen.
- Wrong claims cost 10 seconds. "Show whitespace" reveals everything and voids the run.
- Twelve themes, including Eclipse 2009, Notepad, Phosphor and Hotdog Stand.

## Develop

```sh
bun install
bun run dev:web        # http://localhost:3001
bun run check-types
```

## Deploy

Deploys to Cloudflare Workers (static assets) via Alchemy.

```sh
bun run deploy
bun run destroy
```

## Layout

- `apps/web/src/lib/java-gen.ts` — seeded enterprise-Java generator; plants exactly one tab.
- `apps/web/src/components/code-hunt.tsx` — read-only CodeMirror view with caret + selection, claim on Enter.
- `apps/web/src/lib/themes.ts` — editor + chrome themes.
- `apps/web/src/routes/index.tsx`, `play.tsx` — start screen and the game.
