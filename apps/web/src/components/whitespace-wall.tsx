import { useEffect, useRef, useState } from "react";

import { getTheme } from "@/lib/themes";
import { startWall, type WallHandle } from "@/lib/whitespace-wall";

interface WhitespaceWallProps {
  themeId: string;
  onHover: (hover: boolean) => void;
  onFound: () => void;
}

/**
 * Full-bleed WebGPU background. Pointer events are handled by the parent
 * (so text can sit on top without stealing the tab); use the returned
 * `bind` handlers on the hero container.
 */
export function useWhitespaceWall({ themeId, onHover, onFound }: WhitespaceWallProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<WallHandle | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const onHoverRef = useRef(onHover);
  const onFoundRef = useRef(onFound);
  onHoverRef.current = onHover;
  onFoundRef.current = onFound;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    const t = getTheme(themeId).ui;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    void startWall(canvas, { ink: t.ink, paper: t.paper, accent: t.accent }, {
      reducedMotion,
      onHover: (h) => onHoverRef.current(h),
    }).then((handle) => {
      if (disposed) {
        handle?.stop();
        return;
      }
      handleRef.current = handle;
      setSupported(handle !== null);
    });

    return () => {
      disposed = true;
      handleRef.current?.stop();
      handleRef.current = null;
    };
    // The wall is created once; theme changes flow through setColors below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = getTheme(themeId).ui;
    handleRef.current?.setColors({ ink: t.ink, paper: t.paper, accent: t.accent });
  }, [themeId]);

  const bind = {
    onPointerMove: (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      handleRef.current?.setPointer({ x: e.clientX - r.left, y: e.clientY - r.top });
    },
    onPointerLeave: () => handleRef.current?.setPointer(null),
    onClick: () => {
      if (handleRef.current?.click()) onFoundRef.current();
    },
  };

  return { canvasRef, supported, bind };
}
