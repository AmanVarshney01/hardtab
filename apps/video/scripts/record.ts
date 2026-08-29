/**
 * Records the real site with Playwright: landing wall, briefing, scrolling,
 * a mouse drag across the tab's indent, arrow-key walking, a strike, the win,
 * and two theme switches. Writes public/capture.webm and public/marks.json
 * (named timestamps, seconds from recording start) for the Remotion cut.
 */
import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";

import { generateHaystack } from "../../web/src/lib/java-gen";

const SITE = process.env.SITE ?? "https://hardtab.amanv.dev";
const W = 1920;
const H = 1080;
const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.resolve(HERE, "../public");
const TMP = path.resolve(HERE, "../.capture");

const CURSOR_SCRIPT = `
(() => {
  const c = document.createElement('div');
  c.id = '__cursor';
  c.innerHTML = '<svg width="28" height="36" viewBox="0 0 28 36"><path d="M3 2 L3 27 L9.5 21 L14 33 L19 31 L14.5 19.5 L23 19 Z" fill="#e9e4d8" stroke="#1c2030" stroke-width="2" stroke-linejoin="round"/></svg>';
  Object.assign(c.style, { position: 'fixed', left: '0px', top: '0px', zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(-3px,-2px)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.6))', display: 'none' });
  const ring = document.createElement('div');
  Object.assign(ring.style, { position: 'fixed', left: '0', top: '0', width: '28px', height: '28px', marginLeft: '-14px', marginTop: '-14px', borderRadius: '9999px', border: '3px solid #f2b544', zIndex: '2147483646', pointerEvents: 'none', opacity: '0', transition: 'transform .35s ease-out, opacity .35s ease-out' });
  document.addEventListener('DOMContentLoaded', () => { document.body.append(c, ring); });
  window.addEventListener('pointermove', (e) => { c.style.display = 'block'; c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px'; }, true);
  window.addEventListener('pointerdown', (e) => { ring.style.transition = 'none'; ring.style.opacity = '1'; ring.style.transform = 'scale(.4)'; requestAnimationFrame(() => { ring.style.transition = 'transform .35s ease-out, opacity .35s ease-out'; ring.style.opacity = '0'; ring.style.transform = 'scale(1.6)'; }); }, true);
})();
`;

type Mark = { name: string; t: number };

async function launch(): Promise<{ browser: Browser; headless: boolean }> {
  const args = ["--enable-unsafe-webgpu", "--use-angle=metal", "--ignore-gpu-blocklist"];
  for (const headless of [true, false]) {
    const browser = await chromium.launch({ channel: "chromium", headless, args });
    const page = await browser.newPage();
    // WebGPU is only exposed in secure contexts; probe on the real origin.
    await page.goto(`${SITE}/favicon.svg`);
    const ok = await page.evaluate(async () => {
      const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
      if (!gpu) return false;
      return (await gpu.requestAdapter()) !== null;
    });
    await page.close();
    if (ok) return { browser, headless };
    await browser.close();
  }
  throw new Error("No WebGPU adapter in headless or headed Chromium");
}

async function cmView(page: Page) {
  // Returns an evaluate-able handle finder; the view lives on the content tile.
  await page.waitForSelector(".cm-content");
  await page.evaluate(() => {
    const t = (document.querySelector(".cm-content") as unknown as { cmTile: Record<string, unknown> }).cmTile;
    for (const k of Object.keys(t)) {
      const v = t[k] as { state?: unknown; dispatch?: unknown };
      if (v && typeof v === "object" && v.state && v.dispatch) {
        (window as unknown as { __view: unknown }).__view = v;
        return;
      }
    }
    throw new Error("no view");
  });
}

async function glide(page: Page, from: [number, number], to: [number, number], ms: number) {
  const steps = Math.max(8, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
    await page.mouse.move(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e);
    await page.waitForTimeout(ms / steps);
  }
}

async function main() {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
  await mkdir(OUT, { recursive: true });

  const { browser, headless } = await launch();
  console.log(`chromium ${headless ? "headless" : "headed"} with WebGPU`);
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: { dir: TMP, size: { width: W, height: H } },
    colorScheme: "dark",
  });
  await context.addInitScript(CURSOR_SCRIPT);
  const page = await context.newPage();
  const t0 = Date.now();
  const marks: Mark[] = [];
  const mark = (name: string) => {
    marks.push({ name, t: (Date.now() - t0) / 1000 });
    console.log(`${((Date.now() - t0) / 1000).toFixed(2).padStart(6)}s  ${name}`);
  };

  // 1. Landing: let the wall breathe, then glide across it.
  await page.goto(`${SITE}/`, { waitUntil: "networkidle" });
  await page.mouse.move(W * 0.55, H * 0.15);
  mark("landing");
  await page.waitForTimeout(2200);
  await glide(page, [W * 0.55, H * 0.15], [W * 0.78, H * 0.42], 1400);
  await glide(page, [W * 0.78, H * 0.42], [W * 0.62, H * 0.6], 900);

  // 2. Pick 5,000 lines and open the codebase.
  const card = page.locator('button[aria-pressed]').filter({ hasText: "5,000" });
  const cb = (await card.boundingBox())!;
  await glide(page, [W * 0.62, H * 0.6], [cb.x + cb.width / 2, cb.y + cb.height / 2], 700);
  await card.click();
  mark("pick-5000");
  await page.waitForTimeout(500);
  const cta = page.locator('a:has-text("Open the codebase")');
  const cbb = (await cta.boundingBox())!;
  await glide(page, [cb.x + cb.width / 2, cb.y + cb.height / 2], [cbb.x + cbb.width / 2, cbb.y + cbb.height / 2], 700);
  await cta.click();
  mark("open-codebase");

  // 3. Briefing auto-opens on a fresh profile. Let it read, then start.
  await page.waitForSelector("#howto-title");
  await page.waitForTimeout(2600);
  const start = page.locator('button:has-text("Start hunting")');
  const sb = (await start.boundingBox())!;
  await glide(page, [cbb.x + cbb.width / 2, cbb.y + cbb.height / 2], [sb.x + sb.width / 2, sb.y + sb.height / 2], 600);
  await start.click();
  mark("start-hunting");

  // Work out where the tab is for this seed.
  const url = new URL(page.url());
  const lines = Number(url.searchParams.get("lines"));
  const seed = Number(url.searchParams.get("seed"));
  const hay = generateHaystack(lines, seed);
  console.log(`lines=${lines} seed=${seed} tab at Ln ${hay.tabLine}, Col ${hay.tabCol + 1}`);
  await cmView(page);

  // 4. Scroll around like a person.
  await page.mouse.move(W * 0.4, H * 0.5);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(260);
  }
  mark("scrolling");
  await page.waitForTimeout(600);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 1400);
    await page.waitForTimeout(220);
  }
  await page.waitForTimeout(700);

  // 5. Bring the tab's line into view (quietly), then drag across its indent.
  await page.evaluate(
    ({ line, targetY }) => {
      const view = (window as unknown as {
        __view: {
          state: { doc: { line(n: number): { from: number } } };
          dispatch(t: unknown): void;
          coordsAtPos(p: number): { top: number; bottom: number } | null;
          scrollDOM: HTMLElement;
        };
      }).__view;
      const pos = view.state.doc.line(line).from;
      view.dispatch({ effects: [], selection: { anchor: pos }, scrollIntoView: true });
      const c = view.coordsAtPos(pos);
      if (c) view.scrollDOM.scrollTop += (c.top + c.bottom) / 2 - targetY;
    },
    { line: hay.tabLine, targetY: H * 0.46 },
  );
  await page.waitForTimeout(700);
  const coords = await page.evaluate((line) => {
    const view = (window as unknown as { __view: { state: { doc: { line(n: number): { from: number; text: string } } }; coordsAtPos(p: number): { left: number; top: number; bottom: number } | null } }).__view;
    const l = view.state.doc.line(line);
    const indent = l.text.match(/^\s*/)![0].length;
    const a = view.coordsAtPos(l.from)!;
    const b = view.coordsAtPos(l.from + indent)!;
    return { x0: a.left, x1: b.left, y: (a.top + a.bottom) / 2, indent };
  }, hay.tabLine);
  await glide(page, [W * 0.4, H * 0.5], [coords.x0 - 6, coords.y + 40], 700);
  await glide(page, [coords.x0 - 6, coords.y + 40], [coords.x0 + 1, coords.y], 350);
  await page.mouse.down();
  mark("drag-start");
  await glide(page, [coords.x0 + 1, coords.y], [coords.x1 + 4, coords.y], 2200);
  await page.waitForTimeout(500);
  await page.mouse.up();
  mark("drag-end");
  await page.waitForTimeout(900);

  // 6. Walk it with the arrow keys.
  await page.mouse.click(coords.x0 + 1, coords.y);
  await page.keyboard.press("Home");
  await page.waitForTimeout(500);
  mark("arrows-start");
  for (let i = 0; i < coords.indent; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(210);
  }
  mark("arrows-end");
  await page.waitForTimeout(700);

  // 7. A wrong claim first (caret at end of indent is past the tab), then the real one.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter");
  mark("strike");
  await page.waitForTimeout(1600);
  await page.evaluate((off) => {
    const view = (window as unknown as { __view: { dispatch(t: unknown): void } }).__view;
    view.dispatch({ selection: { anchor: off, head: off + 1 } });
  }, hay.tabOffset);
  await page.waitForTimeout(700);
  await page.keyboard.press("Enter");
  mark("win");
  await page.waitForTimeout(3000);

  // 8. Themes.
  const settings = page.locator('button:has-text("Settings")');
  const sbb = (await settings.boundingBox())!;
  await glide(page, [coords.x1, coords.y], [sbb.x + sbb.width / 2, sbb.y + sbb.height / 2], 800);
  await settings.click();
  await page.waitForTimeout(500);
  const select = page.locator('[role=dialog][aria-label=Settings] select');
  await select.selectOption("hotdog");
  mark("theme-hotdog");
  await page.waitForTimeout(1600);
  await select.selectOption("phosphor");
  mark("theme-phosphor");
  await page.waitForTimeout(1600);
  await select.selectOption("eclipse");
  mark("theme-eclipse");
  await page.waitForTimeout(1400);
  await select.selectOption("ink");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  mark("end");

  await context.close();
  await browser.close();

  const files = (await readdir(TMP)).filter((f) => f.endsWith(".webm"));
  if (files.length !== 1) throw new Error(`expected one recording, got ${files.length}`);
  await rename(path.join(TMP, files[0]!), path.join(OUT, "capture.webm"));
  await writeFile(path.join(OUT, "marks.json"), JSON.stringify({ site: SITE, lines, seed, tabLine: hay.tabLine, marks }, null, 2));
  await rm(TMP, { recursive: true, force: true });
  console.log("wrote public/capture.webm and public/marks.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
