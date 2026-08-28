import { Button } from "@find-space/ui/components/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { CodeHunt, type SelectionInfo } from "@/components/code-hunt";
import { ThemeSelect } from "@/components/theme-select";
import {
  LEVELS,
  PENALTY_MS,
  WIN_MESSAGES,
  WRONG_MESSAGES,
  formatDuration,
  randomSeed,
  saveBest,
} from "@/lib/game";
import { generateHaystack } from "@/lib/java-gen";
import { useThemeId } from "@/lib/theme-store";

const searchSchema = z.object({
  lines: z.coerce.number().int().min(50).max(1_000_000).catch(100_000),
  seed: z.coerce.number().int().nonnegative().catch(() => randomSeed()),
});

export const Route = createFileRoute("/play")({
  validateSearch: searchSchema,
  component: Play,
});

type Phase = "playing" | "won" | "surrendered";

function Play() {
  const { lines, seed } = Route.useSearch();
  const navigate = useNavigate();
  const themeId = useThemeId();
  const haystack = useMemo(() => generateHaystack(lines, seed), [lines, seed]);

  const [phase, setPhase] = useState<Phase>("playing");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [penalty, setPenalty] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [cheated, setCheated] = useState(false);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [finalMs, setFinalMs] = useState<number | null>(null);
  const [isBest, setIsBest] = useState(false);
  const [sel, setSel] = useState<SelectionInfo>({ from: 0, to: 0, line: 1, col: 1 });
  const selRef = useRef(sel);
  selRef.current = sel;

  // Reset everything on a new haystack.
  useEffect(() => {
    setPhase("playing");
    setStartedAt(Date.now());
    setPenalty(0);
    setWrong(0);
    setCheated(false);
    setShowWhitespace(false);
    setFinalMs(null);
    setIsBest(false);
  }, [haystack]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [phase]);

  const elapsed = phase === "playing" ? now - startedAt + penalty : (finalMs ?? 0);

  const claim = useCallback(() => {
    if (phase !== "playing") return;
    const { from, to } = selRef.current;
    const t = haystack.tabOffset;
    const caretAdjacent = from === to && (from === t || from === t + 1);
    const covers = from <= t && to >= t + 1 && to - from <= 16;
    if (caretAdjacent || covers) {
      const ms = Date.now() - startedAt + penalty;
      setFinalMs(ms);
      setPhase("won");
      if (!cheated) setIsBest(saveBest(lines, ms));
      toast.success(WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]);
    } else {
      setPenalty((p) => p + PENALTY_MS);
      setWrong((w) => w + 1);
      toast.error(WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)], {
        description: `+${PENALTY_MS / 1000}s`,
      });
    }
  }, [phase, haystack.tabOffset, startedAt, penalty, cheated, lines]);

  const surrender = () => {
    if (phase !== "playing") return;
    setFinalMs(Date.now() - startedAt + penalty);
    setPhase("surrendered");
  };

  const revealWhitespace = () => {
    setShowWhitespace(true);
    setCheated(true);
    toast("Whitespace is now visible. This run will not count.", { description: "Coward." });
  };

  const playAgain = () => navigate({ to: "/play", search: { lines, seed: randomSeed() } });

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast("Link copied. Same haystack, same tab.");
  };

  const level = LEVELS.find((l) => l.lines === lines);
  const revealAt = phase === "playing" ? null : haystack.tabOffset;
  const selLen = sel.to - sel.from;

  return (
    <div className="grid h-svh min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] overflow-hidden bg-ink">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/" className="display text-lg text-foreground hover:text-amber">
            find-space
          </Link>
          <span className="hidden truncate font-mono text-xs text-muted-foreground sm:inline">
            {level ? `${level.label} · ` : ""}
            {lines.toLocaleString()} lines · seed {seed}
          </span>
        </div>
        <div
          className="font-mono text-2xl tabular-nums text-foreground"
          aria-live="off"
          title={wrong > 0 ? `${wrong} wrong claim${wrong === 1 ? "" : "s"} · +${(penalty / 1000).toFixed(0)}s` : undefined}
        >
          {formatDuration(elapsed)}
          {wrong > 0 && <span className="ml-2 text-sm text-squiggle">+{wrong * (PENALTY_MS / 1000)}s</span>}
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <ThemeSelect className="mr-2" />
          <Button variant="ghost" size="sm" onClick={revealWhitespace} disabled={phase !== "playing" || showWhitespace}>
            Show whitespace
          </Button>
          <Button variant="ghost" size="sm" onClick={surrender} disabled={phase !== "playing"}>
            Give up
          </Button>
          <Button size="sm" onClick={claim} disabled={phase !== "playing"}>
            Claim selection <kbd className="ml-1 rounded-none border border-primary-foreground/30 px-1 text-[10px]">⏎</kbd>
          </Button>
        </div>
      </header>

      {/* Editor */}
      <div className="relative min-h-0">
        <CodeHunt
          doc={haystack.text}
          revealAt={revealAt}
          showWhitespace={showWhitespace}
          themeId={themeId}
          onSelection={setSel}
          onClaim={claim}
        />

        {phase !== "playing" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:justify-end sm:p-6">
            <section
              className="pointer-events-auto w-full max-w-md border border-amber bg-ink-2/95 p-5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] backdrop-blur"
              role="dialog"
              aria-label={phase === "won" ? "You found the tab" : "You gave up"}
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-amber">
                {phase === "won" ? "Build passed · checkstyle" : "Build abandoned"}
              </p>
              <h2 className="display mt-2 text-3xl">
                {phase === "won" ? "Found it." : `It was on line ${haystack.tabLine.toLocaleString()}.`}
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
                <dt className="text-muted-foreground">Location</dt>
                <dd>
                  Ln {haystack.tabLine.toLocaleString()}, Col {haystack.tabCol + 1}
                </dd>
                <dt className="text-muted-foreground">Time</dt>
                <dd>
                  {formatDuration(finalMs ?? 0)}
                  {wrong > 0 && <span className="text-squiggle"> (incl. +{wrong * (PENALTY_MS / 1000)}s)</span>}
                </dd>
                <dt className="text-muted-foreground">Wrong claims</dt>
                <dd>{wrong}</dd>
                <dt className="text-muted-foreground">Verdict</dt>
                <dd>
                  {phase === "surrendered"
                    ? "It had been there since 2014."
                    : cheated
                      ? "You looked at the whitespace. Doesn't count."
                      : isBest
                        ? "New personal best."
                        : "Nobody will thank you."}
                </dd>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={playAgain}>New haystack</Button>
                <Button variant="outline" onClick={copyLink}>
                  Copy link to this one
                </Button>
                <Button variant="ghost" nativeButton={false} render={<Link to="/" />}>
                  Home
                </Button>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Status bar */}
      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-ink-2 px-3 py-1 font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Ln {sel.line.toLocaleString()}, Col {sel.col}
          </span>
          <span className={selLen > 0 ? "text-foreground" : ""}>
            {selLen > 0 ? `(${selLen} selected)` : "(nothing selected)"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className={phase === "playing" ? "" : "text-amber"}>
            {phase === "playing" ? "Spaces: 4" : "Tab Size: 4"}
          </span>
          <span>UTF-8</span>
          <span>Java</span>
          <span className={phase === "won" ? "text-emerald-400" : "text-squiggle"}>
            {phase === "won" ? "✓ 0 problems" : "⚠ 1 problem"}
          </span>
        </div>
      </footer>
    </div>
  );
}
