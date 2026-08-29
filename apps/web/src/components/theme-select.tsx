import { track } from "@/lib/analytics";
import { setThemeId, useThemeId } from "@/lib/theme-store";
import { THEMES } from "@/lib/themes";

export function ThemeSelect({ className = "" }: { className?: string }) {
  const id = useThemeId();
  return (
    <label className={`inline-flex items-center gap-2 font-mono text-[11px] text-muted-foreground ${className}`}>
      <span className="hidden sm:inline">Theme</span>
      <select
        value={id}
        onChange={(e) => {
          setThemeId(e.target.value);
          track("theme_change", { theme: e.target.value });
        }}
        aria-label="Editor theme"
        className="h-7 max-w-[7rem] cursor-pointer sm:max-w-[11rem] border border-border bg-ink-2 px-2 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-amber"
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} — {t.tagline}
          </option>
        ))}
      </select>
    </label>
  );
}
