import { Button } from "@find-space/ui/components/button";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ThemeSelect } from "@/components/theme-select";
import { useWhitespaceWall } from "@/components/whitespace-wall";
import { LEVELS, formatDuration, loadBest, randomSeed } from "@/lib/game";
import { useThemeId } from "@/lib/theme-store";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [lines, setLines] = useState<number>(100_000);
  const [seed] = useState(randomSeed);
  const [hover, setHover] = useState(false);
  const [practiceFound, setPracticeFound] = useState(false);
  const themeId = useThemeId();
  const best = loadBest();

  const wall = useWhitespaceWall({
    themeId,
    onHover: setHover,
    onFound: () => {
      if (practiceFound) return;
      setPracticeFound(true);
      toast.success("Practice tab found.", { description: "That one didn't count. The real ones don't glow." });
    },
  });

  return (
    <main
      {...wall.bind}
      className={`relative grid min-h-svh grid-rows-[auto_1fr_auto] overflow-hidden bg-ink ${hover ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* The whitespace wall */}
      <canvas
        ref={wall.canvasRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 h-full w-full ${wall.supported === false ? "hidden" : ""}`}
      />
      {wall.supported === false && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--paper) 30%, transparent) 1px, transparent 1.2px)",
            backgroundSize: "9px 21px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
      )}

      {/* Top bar */}
      <header className="pointer-events-none relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-sm text-amber" aria-hidden>\t</span>
          <span className="display text-2xl leading-none">hardtab</span>
        </span>
        <div className="pointer-events-auto">
          <ThemeSelect />
        </div>
      </header>

      {/* Hero */}
      <section className="pointer-events-none relative z-10 flex flex-col justify-center px-5 py-10 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber sm:text-xs">
          <span className="mr-2 inline-block h-2 w-2 bg-squiggle align-middle" aria-hidden />
          checkstyle · MixedIndentation · 1 occurrence · P0
        </p>

        <h1 className="display mt-5 text-[clamp(3.25rem,min(11.5vw,15svh),11rem)] leading-[0.84]">
          One tab.
          <br />
          100,000 lines
          <br />
          of Java.
          <br />
          <span className="text-amber">Find it.</span>
        </h1>

        <p className="mt-6 max-w-md font-mono text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Spaces select one column at a time. A tab jumps four. Press ⏎ to claim. Wrong claims cost ten seconds.
        </p>

        <div className="pointer-events-auto mt-8 flex flex-wrap items-end gap-x-8 gap-y-5">
          <fieldset>
            <legend className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Codebase</legend>
            <div className="mt-2 flex flex-wrap gap-1">
              {LEVELS.map((level) => {
                const selected = level.lines === lines;
                const b = best[String(level.lines)];
                return (
                  <button
                    key={level.lines}
                    type="button"
                    onClick={() => setLines(level.lines)}
                    aria-pressed={selected}
                    title={`${level.label} — ${level.blurb}`}
                    className={[
                      "flex flex-col items-start border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-amber",
                      selected
                        ? "border-amber bg-ink-2 text-foreground"
                        : "border-border bg-ink/70 text-muted-foreground backdrop-blur-sm hover:border-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    <span className="font-mono text-base tabular-nums leading-none">{level.lines.toLocaleString()}</span>
                    <span className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {b === undefined ? level.label.toLowerCase() : `best ${formatDuration(b)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Button size="lg" nativeButton={false} render={<Link to="/play" search={{ lines, seed }} />}>
            Open the codebase →
          </Button>
        </div>
      </section>

      {/* Status bar */}
      <footer className="pointer-events-none relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-ink-2/90 px-3 py-1 font-mono text-[11px] text-muted-foreground backdrop-blur">
        <div className="flex items-center gap-4">
          <span>whitespace: rendered</span>
          <span className={practiceFound ? "text-amber" : hover ? "text-foreground" : ""}>
            {practiceFound ? "practice tab: found (didn't count)" : hover ? "practice tab: under cursor" : "practice tab: somewhere on this page"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Spaces: 4</span>
          <span>UTF-8</span>
          <span>Java</span>
          <span className="text-squiggle">⚠ 1 problem</span>
        </div>
      </footer>
    </main>
  );
}
