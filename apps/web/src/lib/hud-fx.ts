import { effect, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";

import fxShader from "@/shaders/hud-fx.wgsl";

export interface FxColors {
  accent: string;
  squiggle: string;
  dark: boolean;
}

export interface HudFxHandle {
  setColors(c: FxColors): void;
  /** CSS-pixel client coordinates. */
  setCaret(p: { x: number; y: number } | null): void;
  strike(at: { x: number; y: number } | null): void;
  win(at: { x: number; y: number } | null): void;
  stop(): void;
}

function hexToVec4(hex: string): [number, number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [1, 1, 1, 1];
  const n = parseInt(m[1] as string, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

export async function startHudFx(
  canvas: HTMLCanvasElement,
  colors: FxColors,
  reducedMotion: boolean,
): Promise<HudFxHandle | null> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return null;
  let gpu: Awaited<ReturnType<typeof init>>;
  try {
    gpu = await init();
  } catch {
    return null;
  }

  const canvasSurface = surface(gpu, canvas, { dpr: [1, 2], alphaMode: "premultiplied", clearColor: [0, 0, 0, 0] });
  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;
  let dpr = 1;
  let caret: { x: number; y: number } | null = null;

  const fx = effect(gpu, fxShader, {
    label: "hud-fx",
    set: {
      p: {
        accent: hexToVec4(colors.accent),
        squiggle: hexToVec4(colors.squiggle),
        size: [1, 1],
        strike: [0, 0],
        win: [0, 0],
        caret: [0, -1],
        time: 0,
        strikeAt: -1,
        winAt: -1,
        dpr: 1,
        motion: reducedMotion ? 0 : 1,
        dark: colors.dark ? 1 : 0,
      },
    },
  });

  const unsubscribe = canvasSurface.onResize(({ width, height }) => {
    dpr = Math.max(1, width / Math.max(1, canvas.clientWidth));
    fx.set({ p: { size: [width, height], dpr } });
  });

  const center = () => [canvas.width / 2, canvas.height / 2] as [number, number];
  const toDevice = (pt: { x: number; y: number } | null): [number, number] =>
    pt ? [pt.x * dpr, pt.y * dpr] : center();

  const loop: FrameLoopHandle = frameLoop(gpu, (frame) => {
    fx.set({ p: { time: now(), caret: caret ? [caret.x * dpr, caret.y * dpr] : [0, -1] } });
    frame.pass(canvasSurface, fx);
  });

  return {
    setColors(c) {
      fx.set({ p: { accent: hexToVec4(c.accent), squiggle: hexToVec4(c.squiggle), dark: c.dark ? 1 : 0 } });
    },
    setCaret(pt) {
      caret = pt;
    },
    strike(at) {
      fx.set({ p: { strike: toDevice(at), strikeAt: now() } });
    },
    win(at) {
      fx.set({ p: { win: toDevice(at), winAt: now() } });
    },
    stop() {
      loop.stop();
      unsubscribe();
      gpu.dispose();
    },
  };
}
