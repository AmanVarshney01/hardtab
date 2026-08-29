import { Button } from "@find-space/ui/components/button";
import { useEffect, useRef, useState } from "react";

import { ThemeSelect } from "@/components/theme-select";
import { FONT_DEFAULT, FONT_MAX, FONT_MIN, setFontSize, useFontSize } from "@/lib/font-store";
import { setSfxEnabled, useSfxEnabled } from "@/lib/sfx";
import { setVimEnabled, useVimEnabled } from "@/lib/vim-store";

/** One button, one small panel: theme, sound, vim. Preferences, not gameplay. */
export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sfxOn = useSfxEnabled();
  const vimOn = useVimEnabled();
  const fontSize = useFontSize();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="xs" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog">
        <span className="font-mono" aria-hidden>
          ⚙
        </span>{" "}
        Settings
      </Button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-64" role="dialog" aria-label="Settings">
          <div className="hud-panel">
            <div className="hud-panel-body">
              <div className="hud-panel-inner flex flex-col gap-3 p-3 font-mono text-xs">
                <label className="flex flex-col gap-1">
                  <span className="hud-label">Theme</span>
                  <ThemeSelect className="w-full [&_select]:w-full [&_select]:max-w-none [&>span]:hidden" />
                </label>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="text-foreground">Code size</span>
                    <span className="text-[10px] text-muted-foreground">
                      {fontSize}px{fontSize === FONT_DEFAULT ? " · default" : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => setFontSize(fontSize - 1)}
                      disabled={fontSize <= FONT_MIN}
                      aria-label="Smaller code"
                    >
                      A−
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => setFontSize(fontSize + 1)}
                      disabled={fontSize >= FONT_MAX}
                      aria-label="Larger code"
                    >
                      A+
                    </Button>
                  </span>
                </div>
                <Row label="Sound" hint="strike blip, win chime" on={sfxOn} onChange={setSfxEnabled} />
                <Row label="Vim keys" hint="hjkl, counts, visual; / and : disabled" on={vimOn} onChange={setVimEnabled} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex items-center justify-between gap-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-amber"
    >
      <span className="flex flex-col">
        <span className="text-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      </span>
      <span className={`led ${on ? "is-lit" : ""}`} style={on ? { filter: "hue-rotate(-70deg)" } : undefined} aria-hidden />
    </button>
  );
}
