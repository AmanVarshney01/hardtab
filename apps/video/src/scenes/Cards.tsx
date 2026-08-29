import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { LED } from "../Chrome";
import { geist, mono } from "../fonts";
import { AMBER, INK, MUTE, PAPER, SQUIGGLE } from "../theme";

const rise = (frame: number, fps: number, delay: number) =>
  interpolate(frame, [delay, delay + 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

/** Opening title: the brand, then the dare. */
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = rise(frame, fps, 0);
  const b = rise(frame, fps, 0.35 * fps);
  const c = rise(frame, fps, 0.7 * fps);
  const d = rise(frame, fps, 1.1 * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: INK, justifyContent: "center", padding: "0 160px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: mono, fontSize: 26, letterSpacing: "0.28em", textTransform: "uppercase", color: AMBER, opacity: a, translate: `0px ${(1 - a) * 20}px` }}>
        <LED on /> checkstyle · MixedIndentation · 1 occurrence
      </div>
      <div style={{ fontFamily: geist, fontWeight: 700, fontSize: 168, lineHeight: 0.9, letterSpacing: "-0.045em", color: PAPER, marginTop: 40 }}>
        <div style={{ opacity: b, translate: `0px ${(1 - b) * 40}px` }}>One tab.</div>
        <div style={{ opacity: c, translate: `0px ${(1 - c) * 40}px` }}>100,000 lines of Java.</div>
        <div style={{ opacity: d, translate: `0px ${(1 - d) * 40}px`, color: AMBER }}>Find it.</div>
      </div>
    </AbsoluteFill>
  );
};

/** Closing card with the URL. */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = rise(frame, fps, 0);
  const b = rise(frame, fps, 0.3 * fps);
  const blink = Math.floor(frame / (0.5 * fps)) % 2 === 0;
  return (
    <AbsoluteFill style={{ backgroundColor: INK, justifyContent: "center", alignItems: "center", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, opacity: a, translate: `0px ${(1 - a) * 30}px` }}>
        <span style={{ fontFamily: mono, fontSize: 64, color: AMBER }}>\t</span>
        <span style={{ fontFamily: geist, fontWeight: 700, fontSize: 132, letterSpacing: "-0.045em", color: PAPER }}>hardtab</span>
      </div>
      <div style={{ fontFamily: mono, fontSize: 52, color: PAPER, opacity: b, translate: `0px ${(1 - b) * 30}px` }}>
        hardtab.amanv.dev
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: mono, fontSize: 24, letterSpacing: "0.25em", textTransform: "uppercase", color: MUTE, opacity: b, marginTop: 24 }}>
        <span style={{ display: "inline-block", width: 12, height: 12, background: SQUIGGLE, opacity: blink ? 1 : 0.25 }} />
        Spaces: 4 · UTF-8 · Java · 1 problem
      </div>
    </AbsoluteFill>
  );
};
