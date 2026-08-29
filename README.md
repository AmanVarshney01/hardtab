<p align="center">
  <a href="https://hardtab.amanv.dev">
    <img src="https://hardtab.amanv.dev/og.png" alt="hardtab — One tab. 100,000 lines of Java. Find it." width="720" />
  </a>
</p>

<h1 align="center"><code>\t</code> hardtab</h1>

<p align="center">
  Somewhere in 100,000 lines of enterprise Java, someone used a hard tab.<br />
  It renders exactly like the four spaces around it. Find it.
</p>

<p align="center">
  <a href="https://hardtab.amanv.dev"><strong>▶ Play at hardtab.amanv.dev</strong></a>
</p>

---

## What this is

A joke game in the tradition of *find the needle in the haystack* and *find the missing semicolon*, aimed at the oldest wound in programming. In 1977 `make` started requiring a literal tab at the start of recipe lines — "the rest, sadly, is history" — and everyone since has spent time hunting an invisible character that looks like four spaces.

hardtab gives you a 100,000-line codebase with one of those in it.

**The tab is drawn at a tab stop, so it is pixel-identical to spaces. Looking is useless. Your cursor is the only instrument.**

## How to play

| Technique | The tell |
|---|---|
| **Arrow keys** — click a line start, tap `→` through the indent | spaces move the caret one column per press; the tab throws it **four** |
| **Click inside the gap** | between spaces the caret lands where you clicked; inside a tab it snaps to the far left or right |
| **Drag across the indent** | the highlight grows one column at a time, then jumps |
| **Watch the status bar** | it counts characters *and* columns: `4 chars · 4 cols` vs `1 char · 4 cols` |
| **Double-click the indent** | selects the whole run — pure spaces match (`12 chars · 12 cols`), a hidden tab comes up short (`9 chars · 12 cols`) |
| **Cover ground** | the radar paints every region you've seen; scanned % feeds your rank |

Put the caret beside the tab (or select it) and hit **Claim** / `⏎`.

- **Strike** — a wrong claim costs 10 s and lights a lamp.
- **Rank** — S: no strikes, under 25% scanned · A: no strikes · B: ≤ 2 · C · F: gave up or cheated.
- **Whitespace** reveals everything and ends the run as a coward.
- **Same seed, same tab** — `/play?lines=100000&seed=42` is the exact same codebase for everyone. Share a win and the link carries your time to beat.

Sizes: 500 (Intern) · 5,000 (Mid-level) · 20,000 (Senior) · 100,000 (Staff). The URL accepts up to 1,000,000 if you hate yourself.

### What doesn't work, on purpose

- **Ctrl+F** only searches what's on screen — the editor renders the viewport, not the file.
- **Vim mode** is real (`hjkl`, counts, visual, `gg`/`G`), but `/`, `?`, `:`, `*`, `#`, `n`, `N` are no-ops. `⏎` claims.
- Yes, the seed is in the URL and the generator is in the bundle. Open DevTools and the console has something to say to you.

## Features

- **Game HUD** — chamfered instrument panels, LED strike lamps, segmented scan meter, a radar strip that replaces the scrollbar, rank stamps.
- **WebGPU** ([vgpu](https://vgpu.sh)) — the landing page's whitespace wall (with a practice tab hidden in it) and the in-game strike shockwave / win bloom.
- **Twelve themes** for editor *and* chrome: Ink, One Dark, Dracula, Monokai, Gruvbox, Nord, Solarized Light, GitHub Light, **Eclipse 2009**, **Notepad**, **Phosphor**, **Hotdog Stand**.
- **Settings** — sound (synthesized, no assets), Vim keys, code size.
- **Share** — Web Share / clipboard / X, with per-link OG cards rendered on a Cloudflare Worker.
- Mobile layout works; the game is honestly a desktop game.

## How the Java is generated

No AI, no templates on disk — `apps/web/src/lib/java-gen.ts` is a seeded Mad Libs machine:

1. `mulberry32(seed)` — a 10-line PRNG, so a seed is a complete codebase.
2. Word banks multiplied together: `Abstract` × `Settlement` × `FactoryBean` gives 5,500 class names that all sound like something you've been asked to refactor. Same for packages, fields, exceptions, annotations, and comments (`// Ask Dave before changing this`).
3. A class recipe that mirrors real enterprise Java: package, sorted imports, Javadoc, annotations, `serialVersionUID`, `LOGGER`, fields, constructor, a wall of getters/setters, then methods whose bodies come from a tiny recursive grammar (`if` / `for` / `try` / leaf statements, depth ≤ 3).
4. Indentation is tracked as an integer per line. At the end one indent group on one line becomes `\t` — always on a tab stop, so it renders identically.

100,000 lines in ~80 ms.

## Stack

- [better-t-stack](https://better-t-stack.dev) scaffold · Bun · Vite · React 19 · TanStack Router · Tailwind v4
- [CodeMirror 6](https://codemirror.net) (no `@codemirror/search`, on purpose) · [`@replit/codemirror-vim`](https://github.com/replit/codemirror-vim)
- [vgpu](https://vgpu.sh) for WebGPU effects
- Cloudflare Workers via [Alchemy](https://alchemy.run) · [takumi](https://takumi.kane.tw) (wasm) for OG images · HTMLRewriter for per-URL meta
- [Geist](https://vercel.com/font) + Geist Mono · [Umami](https://umami.is) analytics · [Remotion](https://remotion.dev) for the launch video

## Develop

```sh
bun install
bun run dev:web          # http://localhost:3001
bun run check-types
```

Deploy (Cloudflare, needs a wrangler login):

```sh
cd packages/infra && bunx alchemy deploy --yes
```

Launch video (records the live site with Playwright, cuts it in Remotion):

```sh
cd apps/video
bun run record           # -> public/capture.webm + marks.json
bun run render           # -> out/hardtab-4k.mp4
```

## Layout

```
apps/web/
  src/lib/java-gen.ts          seeded enterprise-Java generator; plants the tab
  src/components/code-hunt.tsx read-only CodeMirror view, claim on Enter, Vim mode
  src/shaders/                 WGSL for the landing wall and the HUD overlay
  src/lib/themes.ts            editor + chrome themes
  src/routes/index.tsx         landing · src/routes/play.tsx  the game
  worker/index.ts              OG cards + meta rewriting on Cloudflare
apps/video/                    Playwright capture + Remotion composition
packages/infra/alchemy.run.ts  deployment
```

## License

MIT
