/** Tiny synthesized sound effects — no assets, WebAudio only. */

import { useSyncExternalStore } from "react";

const KEY = "hardtab:sfx";
const listeners = new Set<() => void>();
let enabled = typeof window === "undefined" ? true : localStorage.getItem(KEY) !== "off";
let ctx: AudioContext | null = null;

export function useSfxEnabled() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => enabled,
    () => true,
  );
}

export function setSfxEnabled(on: boolean) {
  enabled = on;
  localStorage.setItem(KEY, on ? "on" : "off");
  for (const l of listeners) l();
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  slideTo?: number,
) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Wrong claim: two falling square blips. */
export function sfxWrong() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 220, t, 0.09, "square", 0.08, 160);
  tone(ac, 160, t + 0.11, 0.16, "square", 0.08, 90);
}

/** Found it: a rising triad and a shimmer. */
export function sfxWin() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 523.25, t, 0.12, "triangle", 0.1);
  tone(ac, 659.25, t + 0.1, 0.12, "triangle", 0.1);
  tone(ac, 783.99, t + 0.2, 0.28, "triangle", 0.12);
  tone(ac, 1567.98, t + 0.32, 0.35, "sine", 0.05);
}

/** Surrender: a sad slide down. */
export function sfxSurrender() {
  const ac = audio();
  if (!ac) return;
  tone(ac, 330, ac.currentTime, 0.5, "sawtooth", 0.05, 110);
}

/** UI tick. */
export function sfxTick() {
  const ac = audio();
  if (!ac) return;
  tone(ac, 880, ac.currentTime, 0.03, "square", 0.03);
}
