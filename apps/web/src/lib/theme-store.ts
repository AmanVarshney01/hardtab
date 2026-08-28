import { useSyncExternalStore } from "react";

import { DEFAULT_THEME_ID, THEMES } from "./themes";

const KEY = "find-space:theme";
const listeners = new Set<() => void>();

function read(): string {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  const stored = localStorage.getItem(KEY);
  return stored && THEMES.some((t) => t.id === stored) ? stored : DEFAULT_THEME_ID;
}

let current = read();

export function setThemeId(id: string) {
  if (!THEMES.some((t) => t.id === id)) return;
  current = id;
  localStorage.setItem(KEY, id);
  for (const l of listeners) l();
}

export function useThemeId() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => DEFAULT_THEME_ID,
  );
}
