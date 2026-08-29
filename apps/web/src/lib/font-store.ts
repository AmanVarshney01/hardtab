import { useSyncExternalStore } from "react";

const KEY = "hardtab:font-size";
export const FONT_MIN = 11;
export const FONT_MAX = 22;
export const FONT_DEFAULT = 13;
const listeners = new Set<() => void>();

function read(): number {
  if (typeof window === "undefined") return FONT_DEFAULT;
  const n = Number(localStorage.getItem(KEY));
  return Number.isFinite(n) && n >= FONT_MIN && n <= FONT_MAX ? n : FONT_DEFAULT;
}

let size = read();

export function useFontSize() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => size,
    () => FONT_DEFAULT,
  );
}

export function setFontSize(n: number) {
  size = Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n)));
  localStorage.setItem(KEY, String(size));
  for (const l of listeners) l();
}
