import { useEffect, useRef } from "react";

import { startHudFx, type HudFxHandle } from "@/lib/hud-fx";
import { getTheme, isDarkTheme } from "@/lib/themes";

/** Mounts the WebGPU screen-overlay and returns a ref to drive it. */
export function useHudFx(themeId: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HudFxHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    const t = getTheme(themeId);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    void startHudFx(canvas, { accent: t.ui.accent, squiggle: t.ui.squiggle, dark: isDarkTheme(t) }, reducedMotion).then(
      (h) => {
        if (disposed) {
          h?.stop();
          return;
        }
        fxRef.current = h;
      },
    );
    return () => {
      disposed = true;
      fxRef.current?.stop();
      fxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = getTheme(themeId);
    fxRef.current?.setColors({ accent: t.ui.accent, squiggle: t.ui.squiggle, dark: isDarkTheme(t) });
  }, [themeId]);

  return { canvasRef, fxRef };
}
