import { Button } from "@find-space/ui/components/button";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { HowToPlay } from "@/components/how-to-play";
import { track } from "@/lib/analytics";
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
  const [helpOpen, setHelpOpen] = useState(false);
  const themeId = useThemeId();
  const best = loadBest();

  const wall = useWhitespaceWall({
    themeId,
    onHover: setHover,
    onFound: () => {
      if (practiceFound) return;
      setPracticeFound(true);
      track("practice_tab_found");
      toast.success("Practice tab found.", { description: "That one didn't count. The real ones don't glow." });
    },
  });

  return (
    <main
      {...wall.bind}
      className={`relative grid min-h-svh grid-rows-[auto_1fr_auto] overflow-x-hidden bg-ink ${hover ? "cursor-pointer" : "cursor-default"}`}
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
      <header className="pointer-events-none relative z-10 flex items-center justify-between px-4 py-3 sm:px-8">
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-sm text-amber" aria-hidden>
            \t
          </span>
          <span className="display text-2xl leading-none">hardtab</span>
        </span>
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="chamfer-sm"
            onClick={() => {
              setHelpOpen(true);
              track("help_open", { source: "landing" });
            }}
          >
            <span className="font-mono">?</span> How to play
          </Button>
          <ThemeSelect />
        </div>
      </header>

      {/* Hero */}
      <section className="pointer-events-none relative z-10 flex flex-col justify-center px-4 py-8 sm:px-8 sm:py-10">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-amber sm:text-xs">
          <span className="led is-lit hud-blink" style={{ width: 8, height: 8 }} aria-hidden />
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
          Spaces select one column at a time. A tab jumps four. Hit <span className="text-foreground">Claim</span> (or ⏎)
          when you have it. Wrong claims cost ten seconds.
        </p>

        <div className="pointer-events-auto mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
          <fieldset className="min-w-0">
            <legend className="hud-label">Codebase</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>button]:min-w-0">
              {LEVELS.map((level) => {
                const selected = level.lines === lines;
                const b = best[String(level.lines)];
                return (
                  <button
                    key={level.lines}
                    type="button"
                    onClick={() => {
                      setLines(level.lines);
                      track("level_select", { lines: level.lines });
                    }}
                    aria-pressed={selected}
                    title={`${level.label} — ${level.blurb}`}
                    className={`hud-panel text-left outline-none transition-transform focus-visible:ring-1 focus-visible:ring-amber active:translate-y-px ${
                      selected ? "is-win" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    <span className="hud-panel-body block">
                      <span className="hud-panel-inner flex flex-col px-3 py-2 sm:min-w-[8.5rem]">
                        <span className="flex items-center justify-between gap-3">
                          <span className="hud-digits text-xl text-foreground">{level.lines.toLocaleString()}</span>
                          <span className={`led ${selected ? "is-lit" : ""}`} style={selected ? { filter: "hue-rotate(-70deg)" } : undefined} aria-hidden />
                        </span>
                        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {level.label}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {b === undefined ? "best —" : `best ${formatDuration(b)}`}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Link
            to="/play"
            search={{ lines, seed }}
            className="claim is-ready block w-full outline-none focus-visible:ring-1 focus-visible:ring-amber sm:inline-block sm:w-auto"
            onClick={() => track("open_codebase", { lines })}
          >
            <span className="claim-body flex h-12 items-center justify-center gap-3 px-4 text-sm sm:h-14 sm:px-7 sm:text-base">
              Open the codebase <span aria-hidden>→</span>
            </span>
          </Link>
        </div>

        <p className="mt-12 max-w-prose text-sm text-muted-foreground">
          Every codebase is generated in your browser from a seed, so the link you're sent has the same tab in the
          same place. Ctrl+F only searches what's on screen. Nobody is stopping you from opening devtools, but we
          both know what that says about you.
        </p>
        <p className="pointer-events-auto mt-4 max-w-prose font-mono text-xs text-muted-foreground">
          Scaffolded with{" "}
          <a
            href="https://better-t-stack.dev"
            target="_blank"
            rel="noreferrer"
            className="text-amber underline-offset-4 hover:underline"
            onClick={() => track("bts_click")}
          >
            Better-T-Stack
          </a>{" "}
          — one command, whole project.
        </p>
      </section>

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Status bar */}
      <footer className="hud-bottom pointer-events-none relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-1 font-mono text-[11px] text-muted-foreground">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`led ${practiceFound || hover ? "is-lit" : ""}`} style={practiceFound ? { filter: "hue-rotate(-70deg)" } : undefined} aria-hidden />
          <span className="hidden sm:inline">whitespace: rendered</span>
          <span className={`truncate ${practiceFound ? "text-amber" : hover ? "text-foreground" : ""}`}>
            {practiceFound
              ? "practice tab: found (didn't count)"
              : hover
                ? "practice tab: under cursor"
                : "practice tab: somewhere on this page"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://better-t-stack.dev"
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto hidden text-muted-foreground hover:text-amber sm:inline"
            onClick={() => track("bts_click")}
          >
            built with better-t-stack.dev
          </a>
          <span>Spaces: 4</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="hidden sm:inline">Java</span>
          <span className="text-squiggle">⚠ 1 problem</span>
        </div>
      </footer>
    </main>
  );
}
