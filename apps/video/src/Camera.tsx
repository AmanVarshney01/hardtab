import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { CAPTURE } from "./marks";

export interface Shot {
  /** Seconds into the capture where this shot starts. */
  src: number;
  /** Zoom at the start and end of the shot. */
  scale: [number, number];
  /** Focus point in source pixels (1920x1080) at start and end. */
  focus: [[number, number], [number, number]];
  easing?: (t: number) => number;
}

/**
 * Plays a slice of the capture with a camera move: the focus point is kept
 * at the centre of the frame while scale interpolates across the shot.
 */
export const Camera: React.FC<Shot> = ({ src, scale, focus, easing }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const ease = easing ?? Easing.bezier(0.45, 0, 0.2, 1);
  const t = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const s = scale[0] + (scale[1] - scale[0]) * t;
  // Focus points are authored in 1920x1080 space; scale to the composition.
  const k = width / 1920;
  const fx = (focus[0][0] + (focus[1][0] - focus[0][0]) * t) * k;
  const fy = (focus[0][1] + (focus[1][1] - focus[0][1]) * t) * k;
  // Translate so that (fx, fy) lands on the frame centre after scaling,
  // clamped so the footage always covers the whole frame (no blank edges).
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const tx = clamp(width / 2 - fx * s, Math.min(0, width - width * s), 0);
  const ty = clamp(height / 2 - fy * s, Math.min(0, height - height * s), 0);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#1c2030" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        }}
      >
        <Video src={staticFile(CAPTURE)} trimBefore={Math.round(src * fps)} muted style={{ width, height, display: "block" }} />
      </div>
    </AbsoluteFill>
  );
};
