import { useSyncExternalStore } from "react";

const KEY = "hardtab:vim";
const listeners = new Set<() => void>();
let enabled = typeof window !== "undefined" && localStorage.getItem(KEY) === "on";

export function useVimEnabled() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => enabled,
    () => false,
  );
}

export function setVimEnabled(on: boolean) {
  enabled = on;
  localStorage.setItem(KEY, on ? "on" : "off");
  for (const l of listeners) l();
}
