import { Button } from "@find-space/ui/components/button";
import { useEffect } from "react";

interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
  /** Shown as the primary button label. */
  closeLabel?: string;
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-block min-w-[1.6em] rounded-none border border-border bg-ink px-1.5 py-0.5 text-center font-mono text-[11px] leading-none text-foreground shadow-[inset_0_-2px_0_var(--border)]">
      {children}
    </kbd>
  );
}

const TECHNIQUES: Array<{ title: string; body: React.ReactNode; tell: string }> = [
  {
    title: "Drag across the indentation",
    body: (
      <>
        Press the mouse at the start of a line and drag right through the leading whitespace. Each space grows the
        highlight by one column. A tab grows it by <strong className="text-foreground">four at once</strong>.
      </>
    ),
    tell: "the highlight jumps",
  },
  {
    title: "Walk it with the arrow keys",
    body: (
      <>
        Click at the start of a line, then tap <Key>→</Key>. Spaces move the caret one column each. A tab throws it
        four columns in a single press. Hold <Key>Shift</Key> to see it as a growing selection.
      </>
    ),
    tell: "the caret skips",
  },
  {
    title: "Watch the status bar",
    body: (
      <>
        The bottom-left readout shows characters and columns. Select what looks like four spaces: spaces say{" "}
        <span className="font-mono text-foreground">4 chars · 4 cols</span>, a tab says{" "}
        <span className="font-mono text-foreground">1 char · 4 cols</span>.
      </>
    ),
    tell: "the numbers disagree with your eyes",
  },
  {
    title: "Double-click the indent",
    body: (
      <>
        Double-clicking whitespace selects the <em>entire</em> indent — spaces and tab together, that is normal.
        Now read the status bar: it shows characters <em>and</em> columns. Pure spaces match (12 chars · 12 cols).
        An indent hiding a tab comes up three short (9 chars · 12 cols).
      </>
    ),
    tell: "chars ≠ cols",
  },
  {
    title: "Click inside the gap",
    body: (
      <>
        Try to put the caret in the middle of a suspicious indent. Between spaces it lands anywhere. Inside a tab
        there is nowhere to land — it snaps to one side.
      </>
    ),
    tell: "the caret refuses",
  },
  {
    title: "Cover ground",
    body: (
      <>
        The radar on the right paints every region you have had on screen. Use <Key>PgDn</Key>, drag the radar, or{" "}
        <Key>⌘</Key>/<Key>Ctrl</Key>+<Key>End</Key> to jump. The scanned meter tracks how much of the file you have
        actually seen.
      </>
    ),
    tell: "S rank needs under 25%",
  },
];

/** Rules and techniques. Press ? in the game to toggle it. */
export function HowToPlay({ open, onClose, closeLabel = "Got it" }: HowToPlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="howto-title"
        className="hud-panel w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hud-panel-body">
          <div className="hud-panel-inner max-h-[85svh] overflow-y-auto p-5 sm:p-6">
            <p className="font-mono text-[11px] uppercase tracking-widest text-amber">Briefing · MixedIndentation</p>
            <h2 id="howto-title" className="display mt-1 text-3xl">
              How to find a tab you can't see.
            </h2>
            <p className="mt-2 max-w-prose font-mono text-xs leading-relaxed text-muted-foreground">
              One indent in this file is a real tab character. It is drawn exactly as wide as the four spaces it
              replaced, so looking is useless. The only instrument you have is the cursor. Get it onto the tab — caret
              beside it or the tab selected — and hit <Key>⏎</Key> or <span className="text-foreground">Claim</span>.
            </p>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {TECHNIQUES.map((t) => (
                <li key={t.title} className="border-l-2 border-amber/70 pl-3">
                  <p className="text-sm font-semibold text-foreground">{t.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.body}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-amber">Tell: {t.tell}</p>
                </li>
              ))}
            </ul>

            <div className="mt-5 grid gap-x-6 gap-y-1 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground sm:grid-cols-2">
              <p>
                <span className="text-squiggle">Strike</span> — a wrong claim costs 10 s and lights a lamp.
              </p>
              <p>
                <span className="text-amber">Rank</span> — S: no strikes, under 25% scanned · A: no strikes · B: ≤2 ·
                C · F: gave up.
              </p>
              <p>
                <span className="text-foreground">Whitespace</span> — reveals every tab and space. Ends the run as a
                coward.
              </p>
              <p>
                <span className="text-foreground">Same seed, same tab</span> — the link you share is the exact
                haystack you played.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] text-muted-foreground">
                <Key>?</Key> opens this any time · <Key>Esc</Key> closes · timer pauses while it's open
              </p>
              <Button className="chamfer-sm" onClick={onClose}>
                {closeLabel}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
