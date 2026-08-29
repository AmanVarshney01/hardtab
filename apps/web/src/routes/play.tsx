import { Button } from "@find-space/ui/components/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { CodeHunt, type CodeHuntApi, type SelectionInfo, type ViewportInfo } from "@/components/code-hunt";
import { Radar } from "@/components/radar";
import { ThemeSelect } from "@/components/theme-select";
import {
  LEVELS,
  PENALTY_MS,
  RANK_COPY,
  WIN_MESSAGES,
  WRONG_MESSAGES,
  formatDuration,
  formatDurationTenths,
  randomSeed,
  rankRun,
  saveBest,
} from "@/lib/game";
import { generateHaystack } from "@/lib/java-gen";
import { setSfxEnabled, sfxSurrender, sfxTick, sfxWin, sfxWrong, useSfxEnabled } from "@/lib/sfx";
import { useThemeId } from "@/lib/theme-store";

const searchSchema = z.object({
  lines: z.coerce.number().int().min(50).max(1_000_000).catch(100_000),
  seed: z.coerce.number().int().nonnegative().catch(() => randomSeed()),
  t: z.coerce.number().int().positive().optional().catch(undefined),
  w: z.coerce.number().int().nonnegative().optional().catch(undefined),
});

export const Route = createFileRoute("/play")({
  validateSearch: searchSchema,
  component: Play,
});

type Phase = "playing" | "won" | "surrendered";

const RADAR_BUCKETS = 240;

function Play() {
  const { lines, seed, t: sharedMs, w: sharedWrong } = Route.useSearch();
  const navigate = useNavigate();
  const themeId = useThemeId();
  const sfxOn = useSfxEnabled();
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

  // Radar / coverage.
  const scannedRef = useRef(new Uint8Array(RADAR_BUCKETS));
  const [scannedCount, setScannedCount] = useState(0);
  const [viewport, setViewport] = useState<[number, number]>([0, 0]);
  const apiRef = useRef<CodeHuntApi | null>(null);

  // Feedback pulses (incrementing keys re-trigger CSS animations).
  const [shakeKey, setShakeKey] = useState(0);
  const [flash, setFlash] = useState<{ key: number; kind: "wrong" | "win" } | null>(null);
  const [floaters, setFloaters] = useState<Array<{ key: number; text: string }>>([]);

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
    scannedRef.current = new Uint8Array(RADAR_BUCKETS);
    setScannedCount(0);
    setFlash(null);
    setFloaters([]);
  }, [haystack]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [phase]);

  const onViewport = useCallback(
    (vp: ViewportInfo) => {
      const total = haystack.lineCount;
      const a = (vp.fromLine - 1) / total;
      const b = vp.toLine / total;
      setViewport([a, b]);
      const buckets = scannedRef.current;
      const i0 = Math.floor(a * RADAR_BUCKETS);
      const i1 = Math.min(RADAR_BUCKETS - 1, Math.floor(b * RADAR_BUCKETS));
      let added = 0;
      for (let i = i0; i <= i1; i++) {
        if (!buckets[i]) {
          buckets[i] = 1;
          added++;
        }
      }
      if (added) setScannedCount((c) => c + added);
    },
    [haystack.lineCount],
  );

  const scannedPct = Math.round((scannedCount / RADAR_BUCKETS) * 100);
  const elapsed = phase === "playing" ? now - startedAt + penalty : (finalMs ?? 0);

  const pulse = (kind: "wrong" | "win", text?: string) => {
    setFlash({ key: Date.now(), kind });
    if (kind === "wrong") setShakeKey((k) => k + 1);
    if (text) {
      const key = Date.now();
      setFloaters((f) => [...f, { key, text }]);
      window.setTimeout(() => setFloaters((f) => f.filter((x) => x.key !== key)), 1000);
    }
  };

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
      sfxWin();
      pulse("win");
      toast.success(WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]);
    } else {
      setPenalty((p) => p + PENALTY_MS);
      setWrong((w) => w + 1);
      sfxWrong();
      pulse("wrong", `+${PENALTY_MS / 1000}s`);
      toast.error(WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)], {
        description: "Strike. +10s.",
      });
    }
  }, [phase, haystack.tabOffset, startedAt, penalty, cheated, lines]);

  const surrender = () => {
    if (phase !== "playing") return;
    setFinalMs(Date.now() - startedAt + penalty);
    setPhase("surrendered");
    sfxSurrender();
  };

  const revealWhitespace = () => {
    setShowWhitespace(true);
    setCheated(true);
    sfxTick();
    toast("Whitespace is now visible. This run will not count.", { description: "Coward." });
  };

  const playAgain = () => navigate({ to: "/play", search: { lines, seed: randomSeed() } });

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/play?lines=${lines}&seed=${seed}`);
    toast("Link copied. Same haystack, same tab.");
  };

  const shareUrl = () =>
    `${window.location.origin}/play?lines=${lines}&seed=${seed}&t=${finalMs ?? 0}&w=${wrong}`;
  const shareText = () =>
    `I found the tab in ${lines.toLocaleString()} lines of Java in ${formatDuration(finalMs ?? 0)}` +
    (wrong > 0 ? ` with ${wrong} wrong claim${wrong === 1 ? "" : "s"}` : "") +
    ". Same haystack, your turn:";

  const share = async () => {
    const url = shareUrl();
    const text = shareText();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "hardtab", text, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast("Result copied. Paste it somewhere people will judge you.");
  };

  const postUrl = () =>
    `https://x.com/intent/post?text=${encodeURIComponent(`${shareText()} ${shareUrl()}`)}`;

  const level = LEVELS.find((l) => l.lines === lines);
  const revealAt = phase === "playing" ? null : haystack.tabOffset;
  const selLen = sel.to - sel.from;
  const rank = phase === "playing" ? null : rankRun({ won: phase === "won", cheated, wrong, scannedPct });
  const strikeSlots = Math.max(3, wrong);

  return (
    <div className="grid h-svh min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] overflow-hidden bg-ink">
      {/* Full-screen flash on strike / win */}
      {flash && (
        <div
          key={flash.key}
          aria-hidden
          className={`hud-flash pointer-events-none fixed inset-0 z-50 ${flash.kind === "wrong" ? "bg-squiggle" : "bg-amber"}`}
        />
      )}

      {/* HUD */}
      <header
        key={shakeKey}
        className={`flex flex-wrap items-stretch justify-between gap-x-3 gap-y-2 border-b border-border px-3 py-2 sm:px-4 ${shakeKey > 0 ? "hud-shake" : ""}`}
      >
        {/* Objective */}
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="flex items-baseline gap-1.5 text-foreground hover:text-amber">
            <span className="font-mono text-xs text-amber" aria-hidden>
              \t
            </span>
            <span className="display text-lg">hardtab</span>
          </Link>
          <div className="hud-readout hidden min-w-0 flex-col justify-center px-3 py-1 sm:flex">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Objective</span>
            <span className="truncate font-mono text-xs text-foreground">
              <span className="hud-blink mr-1.5 inline-block h-1.5 w-1.5 bg-squiggle align-middle" aria-hidden />
              1 hard tab · {lines.toLocaleString()} lines{level ? ` · ${level.label}` : ""}
              {sharedMs !== undefined && (
                <span className="ml-2 text-amber">
                  · beat {formatDuration(sharedMs)}
                  {sharedWrong ? ` (+${sharedWrong})` : ""}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Readouts */}
        <div className="flex items-stretch gap-2">
          <div className="hud-readout relative flex flex-col justify-center px-3 py-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Time</span>
            <span
              className={`font-mono text-2xl leading-none tabular-nums ${phase === "won" ? "text-amber" : "text-foreground"}`}
              aria-live="off"
            >
              {formatDurationTenths(elapsed)}
            </span>
            {floaters.map((f) => (
              <span
                key={f.key}
                aria-hidden
                className="hud-float pointer-events-none absolute -top-1 right-2 font-mono text-sm font-bold text-squiggle"
              >
                {f.text}
              </span>
            ))}
          </div>
          <div className="hud-readout flex flex-col justify-center px-3 py-1" title={`${wrong} wrong claim${wrong === 1 ? "" : "s"} · +${(penalty / 1000).toFixed(0)}s`}>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Strikes</span>
            <span className="flex gap-1 font-mono text-lg leading-none" aria-label={`${wrong} strike${wrong === 1 ? "" : "s"}`}>
              {Array.from({ length: strikeSlots }, (_, i) => (
                <span key={i} className={i < wrong ? "text-squiggle" : "text-border"}>
                  ✗
                </span>
              ))}
            </span>
          </div>
          <div className="hud-readout flex flex-col justify-center px-3 py-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Scanned</span>
            <span className="font-mono text-lg leading-none tabular-nums text-foreground">
              {scannedPct}
              <span className="text-xs text-muted-foreground">%</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-wrap items-center justify-end gap-x-1.5 gap-y-1 sm:w-auto">
          <ThemeSelect className="mr-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSfxEnabled(!sfxOn)}
            aria-pressed={sfxOn}
            title={sfxOn ? "Sound on" : "Sound off"}
          >
            {sfxOn ? "SFX on" : "SFX off"}
          </Button>
          <Button variant="ghost" size="sm" onClick={revealWhitespace} disabled={phase !== "playing" || showWhitespace}>
            Show whitespace
          </Button>
          <Button variant="ghost" size="sm" onClick={surrender} disabled={phase !== "playing"}>
            Give up
          </Button>
          <Button size="default" onClick={claim} disabled={phase !== "playing"} className="font-bold uppercase tracking-wider">
            Claim <kbd className="ml-1 rounded-none border border-primary-foreground/30 px-1 text-[10px] font-normal">⏎</kbd>
          </Button>
        </div>
      </header>

      {/* Editor + radar */}
      <div className="relative grid min-h-0 grid-cols-[minmax(0,1fr)_auto]">
        <CodeHunt
          doc={haystack.text}
          revealAt={revealAt}
          showWhitespace={showWhitespace}
          themeId={themeId}
          onSelection={setSel}
          onViewport={onViewport}
          onClaim={claim}
          apiRef={apiRef}
        />
        <Radar
          scanned={scannedRef.current}
          viewport={viewport}
          target={phase === "playing" ? null : (haystack.tabLine - 1) / haystack.lineCount}
          onJump={(f) => apiRef.current?.scrollToLine(1 + f * (haystack.lineCount - 1))}
        />

        {phase !== "playing" && rank && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:justify-end sm:p-6">
            <section
              className="pointer-events-auto relative w-full max-w-md border border-amber bg-ink-2/95 p-5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] backdrop-blur"
              role="dialog"
              aria-label={phase === "won" ? "You found the tab" : "You gave up"}
            >
              <div
                aria-hidden
                className={`hud-stamp display absolute -top-5 right-4 border-4 px-3 text-6xl leading-none ${
                  rank === "F" ? "border-squiggle text-squiggle" : "border-amber text-amber"
                }`}
                style={{ transform: "rotate(-8deg)" }}
              >
                {rank}
              </div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-amber">
                {phase === "won" ? "Build passed · checkstyle" : "Build abandoned"}
              </p>
              <h2 className="display mt-2 pr-24 text-3xl">
                {phase === "won" ? "Found it." : `It was on line ${haystack.tabLine.toLocaleString()}.`}
              </h2>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Rank {rank} — {RANK_COPY[rank]}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
                <dt className="text-muted-foreground">Location</dt>
                <dd>
                  Ln {haystack.tabLine.toLocaleString()}, Col {haystack.tabCol + 1}
                </dd>
                <dt className="text-muted-foreground">Time</dt>
                <dd>
                  {formatDurationTenths(finalMs ?? 0)}
                  {wrong > 0 && <span className="text-squiggle"> (incl. +{wrong * (PENALTY_MS / 1000)}s)</span>}
                </dd>
                <dt className="text-muted-foreground">Strikes</dt>
                <dd>{wrong}</dd>
                <dt className="text-muted-foreground">Scanned</dt>
                <dd>{scannedPct}% of the file</dd>
                <dt className="text-muted-foreground">Verdict</dt>
                <dd>
                  {phase === "surrendered"
                    ? "It had been there since 2014."
                    : cheated
                      ? "You looked at the whitespace. Doesn't count."
                      : sharedMs !== undefined && (finalMs ?? 0) < sharedMs
                        ? `Beat the shared ${formatDuration(sharedMs)}. Send it back.`
                        : sharedMs !== undefined
                          ? `Slower than the shared ${formatDuration(sharedMs)}. Rough.`
                          : isBest
                            ? "New personal best."
                            : "Nobody will thank you."}
                </dd>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                {phase === "won" && !cheated && <Button onClick={share}>Share result</Button>}
                {phase === "won" && !cheated && (
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<a href={postUrl()} target="_blank" rel="noreferrer" />}
                  >
                    Post on X
                  </Button>
                )}
                <Button variant={phase === "won" && !cheated ? "ghost" : "default"} onClick={playAgain}>
                  New haystack
                </Button>
                <Button variant="ghost" onClick={copyLink}>
                  Copy link
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
            {selLen > 0 ? `${selLen} char${selLen === 1 ? "" : "s"} selected` : "nothing selected"}
          </span>
          <span className="hidden sm:inline">seed {seed}</span>
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
