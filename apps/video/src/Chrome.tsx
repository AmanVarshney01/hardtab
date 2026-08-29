import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { geist, mono } from "./fonts";
import { AMBER, BORDER, INK, INK2, MUTE, PAPER, SQUIGGLE } from "./theme";

const CHAMFER = "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";

/** CRT scanlines + vignette over everything. */
export const ScreenOverlay: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.13) 2px 3px)",
        mixBlendMode: "multiply",
      }}
    />
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
      }}
    />
  </AbsoluteFill>
);

/** Chamfered HUD panel. */
export const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; hot?: boolean }> = ({
  children,
  style,
  hot,
}) => (
  <div style={{ filter: `drop-shadow(0 0 10px ${hot ? SQUIGGLE : AMBER}55) drop-shadow(0 4px 0 rgba(0,0,0,.5))`, ...style }}>
    <div
      style={{
        clipPath: CHAMFER,
        padding: 2,
        background: `linear-gradient(160deg, ${hot ? SQUIGGLE : AMBER} 0%, ${BORDER} 45%, ${BORDER} 100%)`,
      }}
    >
      <div
        style={{
          clipPath: CHAMFER,
          background: `linear-gradient(180deg, rgba(255,255,255,0.05), transparent 35%), linear-gradient(180deg, #2b3142, ${INK2} 55%, #1f2432)`,
          padding: "18px 26px",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

/** Lower-third caption that slides in, holds, and slides out. */
export const Caption: React.FC<{ eyebrow?: string; text: string; hot?: boolean }> = ({ eyebrow, text, hot }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inT = interpolate(frame, [0, 0.45 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const outT = interpolate(frame, [durationInFrames - 0.35 * fps, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.7, 0, 0.84, 0),
  });
  const t = Math.min(inT, outT);
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        bottom: 96,
        opacity: t,
        translate: `${(1 - t) * -40}px 0px`,
      }}
    >
      <Panel hot={hot}>
        {eyebrow ? (
          <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: "0.28em", textTransform: "uppercase", color: hot ? SQUIGGLE : AMBER }}>
            {eyebrow}
          </div>
        ) : null}
        <div style={{ fontFamily: geist, fontWeight: 700, fontSize: 46, letterSpacing: "-0.02em", color: PAPER, marginTop: eyebrow ? 6 : 0 }}>
          {text}
        </div>
      </Panel>
    </div>
  );
};

/** Brand corner tag. */
export const Tag: React.FC = () => (
  <div style={{ position: "absolute", right: 80, top: 72, display: "flex", alignItems: "baseline", gap: 12 }}>
    <span style={{ fontFamily: mono, fontSize: 26, color: AMBER }}>\t</span>
    <span style={{ fontFamily: geist, fontWeight: 700, fontSize: 38, letterSpacing: "-0.03em", color: PAPER }}>hardtab</span>
  </div>
);

export const LED: React.FC<{ on: boolean; size?: number }> = ({ on, size = 14 }) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: 9999,
      background: on
        ? `radial-gradient(circle at 35% 35%, #fff 0%, ${SQUIGGLE} 35%, #7a1c1f 100%)`
        : `radial-gradient(circle at 35% 35%, #4a5063, ${INK} 70%)`,
      boxShadow: on ? `0 0 10px ${SQUIGGLE}, 0 0 22px ${SQUIGGLE}88` : "inset 0 1px 2px rgba(0,0,0,.7)",
    }}
  />
);

export { AMBER, INK, INK2, MUTE, PAPER, SQUIGGLE, BORDER };
