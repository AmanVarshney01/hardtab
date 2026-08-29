import { Button } from "@find-space/ui/components/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { CodeHunt, type CodeHuntApi, type SelectionInfo, type ViewportInfo } from "@/components/code-hunt";
import { HowToPlay } from "@/components/how-to-play";
import { useHudFx } from "@/components/hud-fx";
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
  const fx = useHudFx(themeId);
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

  // Help: auto-open on the very first game; pauses the clock while open.
  const [helpOpen, setHelpOpen] = useState(() => localStorage.getItem("hardtab:help-seen") !== "yes");
  const pausedAtRef = useRef<number | null>(null);
  const openHelp = useCallback(() => {
    if (pausedAtRef.current === null) pausedAtRef.current = Date.now();
    setHelpOpen(true);
  }, []);
  const closeHelp = useCallback(() => {
    localStorage.setItem("hardtab:help-seen", "yes");
    setHelpOpen(false);
    if (pausedAtRef.current !== null) {
      const paused = Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
      setStartedAt((s) => s + paused);
    }
  }, []);
  useEffect(() => {
    // First-visit auto-open started the pause before the clock existed.
    if (helpOpen && pausedAtRef.current === null) pausedAtRef.current = Date.now();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (helpOpen) closeHelp();
        else openHelp();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, openHelp, closeHelp]);
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
    setFloaters([]);
  }, [haystack]);

  useEffect(() => {
    if (phase !== "playing" || helpOpen) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [phase, helpOpen]);

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

  const onSelection = useCallback(
    (info: SelectionInfo) => {
      setSel(info);
      fx.fxRef.current?.setCaret(apiRef.current?.coordsAt(info.to) ?? null);
    },
    [fx.fxRef],
  );

  const scannedPct = Math.round((scannedCount / RADAR_BUCKETS) * 100);
  const elapsed = phase === "playing" ? now - startedAt + penalty : (finalMs ?? 0);

  const pulse = (kind: "wrong" | "win", text?: string) => {
    const caretAt = apiRef.current?.coordsAt(selRef.current.to) ?? null;
    if (kind === "wrong") {
      setShakeKey((k) => k + 1);
      fx.fxRef.current?.strike(caretAt);
    } else {
      // The reveal scrolls the tab into view; bloom from wherever it lands.
      window.setTimeout(() => fx.fxRef.current?.win(apiRef.current?.coordsAt(haystack.tabOffset) ?? null), 80);
    }
    if (text) {
      const key = Date.now();
      setFloaters((f) => [...f, { key, text }]);
      window.setTimeout(() => setFloaters((f) => f.filter((x) => x.key !== key)), 1000);
    }
  };

  const claim = useCallback(() => {
    if (phase !== "playing" || pausedAtRef.current !== null) return;
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
  const segments = 16;
  const litSegments = Math.round((scannedPct / 100) * segments);
  const ready = phase === "playing" && selLen > 0 && selLen <= 16;

  return (
    <div className="grid h-svh min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] overflow-hidden bg-ink">
      {/* WebGPU screen overlay: scanlines, sweep, strike shockwave, win bloom */}
      <canvas ref={fx.canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-40 h-full w-full" />

      {/* HUD */}
      <header
        key={shakeKey}
        className={`relative z-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-2 pt-2 pb-2 sm:items-stretch sm:px-4 ${shakeKey > 0 ? "hud-shake" : ""}`}
      >
        {/* Brand + objective */}
        <div className="order-1 flex min-w-0 items-center gap-3">
          <Link to="/" className="flex items-baseline gap-1.5 text-foreground hover:text-amber">
            <span className="font-mono text-xs text-amber" aria-hidden>
              \t
            </span>
            <span className="display text-lg">hardtab</span>
          </Link>
          <Panel className="hidden lg:block">
            <span className="hud-label">Objective</span>
            <span className="flex items-center gap-2 truncate font-mono text-xs text-foreground">
              <span className="led is-lit hud-blink" style={{ width: 8, height: 8 }} aria-hidden />
              1 hard tab · {lines.toLocaleString()} lines{level ? ` · ${level.label}` : ""}
              {sharedMs !== undefined && (
                <span className="text-amber">
                  · beat {formatDuration(sharedMs)}
                  {sharedWrong ? ` (+${sharedWrong})` : ""}
                </span>
              )}
            </span>
          </Panel>
        </div>

        {/* Primary action */}
        <div className="order-2 sm:order-3">
          <button
            type="button"
            onClick={claim}
            disabled={phase !== "playing"}
            className={`claim ${ready ? "is-ready" : ""}`}
            aria-keyshortcuts="Enter"
          >
            <span className="claim-body flex h-11 items-center gap-2 px-5 text-sm">
              Claim
              <kbd className="hidden rounded-none border border-black/25 px-1 text-[10px] font-normal tracking-normal sm:inline">⏎</kbd>
            </span>
          </button>
        </div>

        {/* Readouts */}
        <div className="order-3 flex w-full items-stretch gap-2 sm:order-2 sm:w-auto">
          <Panel className={`flex-1 sm:flex-none ${phase === "won" ? "is-win" : ""}`}>
            <span className="hud-label">Time</span>
            <span className={`hud-digits relative block text-xl leading-none sm:text-2xl ${phase === "won" ? "text-amber" : "text-foreground"}`} aria-live="off">
              {formatDurationTenths(elapsed)}
              {floaters.map((f) => (
                <span key={f.key} aria-hidden className="hud-float pointer-events-none absolute -top-3 right-0 text-sm text-squiggle">
                  {f.text}
                </span>
              ))}
            </span>
          </Panel>
          <Panel className={`flex-1 sm:flex-none ${wrong > 0 && phase === "playing" ? "is-hot" : ""}`} title={`${wrong} wrong claim${wrong === 1 ? "" : "s"} · +${(penalty / 1000).toFixed(0)}s`}>
            <span className="hud-label">Strikes</span>
            <span className="flex h-6 items-center gap-1.5" role="img" aria-label={`${wrong} strike${wrong === 1 ? "" : "s"}`}>
              {Array.from({ length: strikeSlots }, (_, i) => (
                <span key={i} className={`led ${i < wrong ? "is-lit" : ""}`} />
              ))}
            </span>
          </Panel>
          <Panel className="flex-1 sm:w-40 sm:flex-none">
            <span className="hud-label">
              Scanned <span className="ml-1 text-foreground">{scannedPct}%</span>
            </span>
            <span className="meter mt-1" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={scannedPct}>
              {Array.from({ length: segments }, (_, i) => (
                <span key={i} className={`meter-seg ${i < litSegments ? "is-on" : ""}`} />
              ))}
            </span>
          </Panel>
        </div>

      </header>

      {/* Editor + radar */}
      <div className="relative grid min-h-0 grid-cols-[minmax(0,1fr)_auto]">
        <CodeHunt
          doc={haystack.text}
          revealAt={revealAt}
          showWhitespace={showWhitespace}
          themeId={themeId}
          onSelection={onSelection}
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
              className="hud-panel pointer-events-auto relative w-full max-w-md"
              role="dialog"
              aria-label={phase === "won" ? "You found the tab" : "You gave up"}
            >
              <div
                aria-hidden
                className={`hud-stamp display absolute -top-5 right-4 z-10 border-4 px-3 text-6xl leading-none ${
                  rank === "F" ? "border-squiggle text-squiggle" : "border-amber text-amber"
                }`}
                style={{ transform: "rotate(-8deg)" }}
              >
                {rank}
              </div>
              <div className="hud-panel-body">
              <div className="hud-panel-inner p-5">
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
                {phase === "won" && !cheated && (
                  <Button className="chamfer-sm" onClick={share}>
                    Share result
                  </Button>
                )}
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
              </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <HowToPlay open={helpOpen} onClose={closeHelp} closeLabel={phase === "playing" ? "Start hunting" : "Got it"} />

      {/* Status bar */}
      <footer className="hud-bottom relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-1 font-mono text-[11px] text-muted-foreground sm:px-3">
        <div className="order-1 flex items-center gap-3 sm:gap-4">
          <span>
            Ln {sel.line.toLocaleString()}, Col {sel.col}
          </span>
          <span className={selLen > 0 ? "text-foreground" : ""}>
            {selLen > 0 ? `${selLen} char${selLen === 1 ? "" : "s"} selected` : "nothing selected"}
          </span>
          <span className="hidden sm:inline">seed {seed}</span>
        </div>
        <div className="order-3 flex w-full flex-nowrap items-center justify-between gap-x-1 sm:order-2 sm:w-auto sm:justify-end">
          <ThemeSelect />
        <div className="flex items-center gap-0.5">
          <Button variant="outline" size="xs" onClick={openHelp} aria-keyshortcuts="?" title="How to play (?)">
            <span className="font-mono">?</span>
            <span className="hidden sm:inline">Help</span>
          </Button>
          <Button variant="ghost" size="xs" onClick={() => setSfxEnabled(!sfxOn)} aria-pressed={sfxOn} title={sfxOn ? "Sound on" : "Sound off"}>
            <span className="sm:hidden">{sfxOn ? "SFX" : "SFX off"}</span>
            <span className="hidden sm:inline">{sfxOn ? "Sound: on" : "Sound: off"}</span>
          </Button>
          <Button variant="ghost" size="xs" onClick={revealWhitespace} disabled={phase !== "playing" || showWhitespace}>
            <span className="sm:hidden">Reveal</span>
            <span className="hidden sm:inline">Whitespace</span>
          </Button>
          <Button variant="ghost" size="xs" onClick={surrender} disabled={phase !== "playing"}>
            <span className="sm:hidden">Quit</span>
            <span className="hidden sm:inline">Give up</span>
          </Button>
        </div>
        </div>
        <div className="order-2 flex items-center gap-4 sm:order-3">
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

function Panel({ className = "", title, children }: { className?: string; title?: string; children: React.ReactNode }) {
  return (
    <div className={`hud-panel ${className}`} title={title}>
      <div className="hud-panel-body h-full">
        <div className="hud-panel-inner flex h-full min-w-0 flex-col justify-center px-3 py-1.5">{children}</div>
      </div>
    </div>
  );
}
