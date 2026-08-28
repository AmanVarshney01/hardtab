import { effect, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";

import wallShader from "@/shaders/whitespace-wall.wgsl";

export interface WallColors {
  ink: string;
  paper: string;
  accent: string;
}

export interface WallHandle {
  setColors(colors: WallColors): void;
  /** Pointer position in CSS pixels relative to the canvas, or null when outside. */
  setPointer(p: { x: number; y: number } | null): void;
  /** Returns true if the click landed on the tab. */
  click(): boolean;
  stop(): void;
}

const CELL_W = 9;
const CELL_H = 21;
const PERIOD = 40;
const SCROLL_PX_PER_S = 14;

function hexToVec4(hex: string): [number, number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [0, 0, 0, 1];
  const n = parseInt(m[1] as string, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

/**
 * Starts the whitespace wall on `canvas`. Resolves to a handle, or null when
 * WebGPU is unavailable so the caller can fall back to something static.
 */
export async function startWall(
  canvas: HTMLCanvasElement,
  colors: WallColors,
  opts: { reducedMotion: boolean; onHover: (hover: boolean) => void },
): Promise<WallHandle | null> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return null;

  let gpu: Awaited<ReturnType<typeof init>>;
  try {
    gpu = await init();
  } catch {
    return null;
  }

  const canvasSurface = surface(gpu, canvas, { dpr: [1, 2] });
  const t0 = performance.now();
  const tabRow = Math.floor(Math.random() * PERIOD);
  let dpr = 1;
  let tabCol = 24;
  let pointer: { x: number; y: number } | null = null;
  let hover = false;
  let found = false;

  const wall = effect(gpu, wallShader, {
    label: "whitespace-wall",
    set: {
      params: {
        ink: hexToVec4(colors.ink),
        paper: hexToVec4(colors.paper),
        accent: hexToVec4(colors.accent),
        size: [1, 1],
        cell: [CELL_W, CELL_H],
        mouse: [-1, -1],
        tab: [tabCol, tabRow],
        time: 0,
        motion: opts.reducedMotion ? 0 : 1,
        hover: 0,
        found: 0,
        period: PERIOD,
        dpr: 1,
      },
    },
  });

  const unsubscribe = canvasSurface.onResize(({ width, height }) => {
    dpr = Math.max(1, width / Math.max(1, canvas.clientWidth));
    const cols = Math.floor(width / (CELL_W * dpr));
    // Keep the tab in the right-hand two thirds, on a 4-column boundary.
    tabCol = Math.max(8, Math.floor((cols * 0.62) / 4) * 4);
    wall.set({
      params: {
        size: [width, height],
        cell: [CELL_W * dpr, CELL_H * dpr],
        tab: [tabCol, tabRow],
        dpr,
      },
    });
  });

  const elapsed = () => (performance.now() - t0) / 1000;

  const computeHover = () => {
    if (!pointer) return false;
    const scroll = opts.reducedMotion ? 0 : elapsed() * SCROLL_PX_PER_S * dpr;
    const col = Math.floor((pointer.x * dpr) / (CELL_W * dpr));
    const row = Math.floor((pointer.y * dpr + scroll) / (CELL_H * dpr));
    const prow = ((row % PERIOD) + PERIOD) % PERIOD;
    return prow === tabRow && col >= tabCol && col < tabCol + 4;
  };

  const loop: FrameLoopHandle = frameLoop(gpu, (frame) => {
    const h = computeHover();
    if (h !== hover) {
      hover = h;
      opts.onHover(h);
    }
    wall.set({
      params: {
        time: elapsed(),
        mouse: pointer ? [pointer.x * dpr, pointer.y * dpr] : [-1, -1],
        hover: hover ? 1 : 0,
        found: found ? 1 : 0,
      },
    });
    frame.pass(canvasSurface, wall);
  });

  const handle: WallHandle & { debug?: () => { tabCol: number; tabRow: number; dpr: number; scroll: number } } = {
    setColors(c) {
      wall.set({
        params: { ink: hexToVec4(c.ink), paper: hexToVec4(c.paper), accent: hexToVec4(c.accent) },
      });
    },
    setPointer(p) {
      pointer = p;
    },
    click() {
      if (computeHover()) {
        found = true;
        return true;
      }
      return false;
    },
    stop() {
      loop.stop();
      unsubscribe();
      gpu.dispose();
    },
  };
  if (import.meta.env.DEV) {
    handle.debug = () => ({
      tabCol,
      tabRow,
      dpr,
      scroll: opts.reducedMotion ? 0 : elapsed() * SCROLL_PX_PER_S * dpr,
    });
    (window as unknown as { __wall?: unknown }).__wall = handle;
  }
  return handle;
}
