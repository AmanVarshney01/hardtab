import { useRef } from "react";

interface RadarProps {
  /** One byte per bucket: 1 if that slice of the file has been on screen. */
  scanned: Uint8Array;
  /** Fraction of the file currently visible, [from, to]. */
  viewport: [number, number];
  /** Fraction where the tab is; shown only after the run ends. */
  target: number | null;
  onJump: (fraction: number) => void;
}

/**
 * A vertical strip representing the whole file. Regions you've had on screen
 * are painted; the current viewport glows. It never hints where the tab is —
 * it only shows where you've been.
 */
export function Radar({ scanned, viewport, target, onJump }: RadarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const n = scanned.length;

  // Collapse scanned buckets into runs so we render a few divs, not hundreds.
  const runs: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    if (!scanned[i]) continue;
    const last = runs[runs.length - 1];
    if (last && last[1] === i) last[1] = i + 1;
    else runs.push([i, i + 1]);
  }

  const jump = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onJump(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="File radar: scanned regions and current position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(viewport[0] * 100)}
      tabIndex={0}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        jump(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons & 1) jump(e);
      }}
      className="relative h-full w-7 cursor-crosshair select-none border-l border-border bg-ink-2 outline-none focus-visible:ring-1 focus-visible:ring-amber"
    >
      {/* Ticks every 10% */}
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute left-0 h-px w-1.5 bg-border"
          style={{ top: `${(i + 1) * 10}%` }}
        />
      ))}
      {runs.map(([a, b]) => (
        <div
          key={a}
          aria-hidden
          className="absolute inset-x-1.5 bg-paper/25"
          style={{ top: `${(a / n) * 100}%`, height: `${Math.max(0.35, ((b - a) / n) * 100)}%` }}
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-x-0.5 border border-amber bg-amber/25 shadow-[0_0_10px_var(--amber)]"
        style={{
          top: `${viewport[0] * 100}%`,
          height: `${Math.max(0.6, (viewport[1] - viewport[0]) * 100)}%`,
        }}
      />
      {target !== null && (
        <div
          aria-hidden
          className="absolute -left-1 h-0.5 w-9 bg-squiggle shadow-[0_0_12px_var(--squiggle)]"
          style={{ top: `calc(${target * 100}% - 1px)` }}
        />
      )}
    </div>
  );
}
