import { Button } from "@find-space/ui/components/button";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ThemeSelect } from "@/components/theme-select";

import { LEVELS, formatDuration, loadBest, randomSeed } from "@/lib/game";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [lines, setLines] = useState<number>(100_000);
  const [seed] = useState(randomSeed);
  const best = loadBest();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">
          Build failed · checkstyle · MixedIndentation
        </p>
        <ThemeSelect />
      </div>

      <h1 className="display mt-6 max-w-4xl text-[clamp(2.6rem,8vw,6.5rem)]">
        Somewhere in <span className="tabular-nums">100,000</span> lines of Java, someone used a{" "}
        <span className="squiggle">tab</span>.
      </h1>
      <p className="display mt-4 text-[clamp(1.6rem,4vw,3rem)] text-muted-foreground">Find it.</p>

      <pre className="mt-10 overflow-x-auto border-l-2 border-squiggle bg-ink-2 px-4 py-3 font-mono text-xs leading-relaxed text-muted-foreground">
        {`[ERROR] src/main/java/com/**/*.java: Tab character found where spaces expected (1 occurrence)
[ERROR] Assignee:  you
[ERROR] Priority:  P0 — blocks release
[ERROR] Hint:      Spaces select one column at a time. A tab jumps four.`}
      </pre>

      <fieldset className="mt-10">
        <legend className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Codebase size</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEVELS.map((level) => {
            const selected = level.lines === lines;
            const b = best[String(level.lines)];
            return (
              <button
                key={level.lines}
                type="button"
                onClick={() => setLines(level.lines)}
                aria-pressed={selected}
                className={[
                  "flex flex-col items-start border p-3 text-left transition-colors outline-none focus-visible:ring-1 focus-visible:ring-amber",
                  selected
                    ? "border-amber bg-ink-2 text-foreground"
                    : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span className="font-mono text-lg tabular-nums">{level.lines.toLocaleString()}</span>
                <span className="mt-1 text-sm">{level.label}</span>
                <span className="text-xs text-muted-foreground">{level.blurb}</span>
                <span className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {b === undefined ? "best —" : `best ${formatDuration(b)}`}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button size="lg" nativeButton={false} render={<Link to="/play" search={{ lines, seed }} />}>
          Open the codebase →
        </Button>
        <p className="font-mono text-xs text-muted-foreground">
          Drag-select whitespace. Watch the selection. Press ⏎ to claim. Wrong claims cost 10s.
        </p>
      </div>

      <p className="mt-16 max-w-prose text-sm text-muted-foreground">
        Every haystack is generated in your browser from a seed, so the link you're sent has the same tab in the
        same place. Ctrl+F only searches what's on screen. Nobody is stopping you from opening devtools, but we
        both know what that says about you.
      </p>
    </main>
  );
}
