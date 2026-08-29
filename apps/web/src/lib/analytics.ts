/**
 * Umami custom events. The tracker script is loaded from index.html; this
 * is a thin, null-safe wrapper so calls are harmless in dev or with DNT.
 */

type Value = string | number | boolean;

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, Value>) => Promise<unknown> | void;
      identify: (data: Record<string, Value>) => Promise<unknown> | void;
    };
  }
}

export type GameEvent =
  | "game_start"
  | "claim_wrong"
  | "game_win"
  | "give_up"
  | "whitespace_reveal"
  | "share"
  | "copy_link"
  | "play_again"
  | "help_open"
  | "help_close"
  | "settings_open"
  | "theme_change"
  | "vim_toggle"
  | "sound_toggle"
  | "font_size"
  | "level_select"
  | "practice_tab_found"
  | "open_codebase";

export function track(name: GameEvent, data?: Record<string, Value>) {
  try {
    window.umami?.track(name, data);
  } catch {
    // analytics must never break the game
  }
}
