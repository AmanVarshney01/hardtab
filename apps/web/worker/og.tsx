/**
 * Open Graph card. Two variants: the default pitch, and a shared result
 * ("found in 01:05") when the URL carries a time.
 */

export interface OgParams {
  lines: number;
  seed?: number;
  t?: number;
  w?: number;
}

const INK = "#1c2030";
const INK2 = "#242938";
const PAPER = "#e9e4d8";
const AMBER = "#f2b544";
const MUTE = "#8b90a0";
const RED = "#e5484d";
const GREEN = "#4ade80";

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Frame({ eyebrow, children, statusLeft, statusRight }: {
  eyebrow: string;
  children: React.ReactNode;
  statusLeft: string;
  statusRight: React.ReactNode;
}) {
  return (
    <div
      tw="w-full h-full flex flex-col justify-between p-16"
      style={{ backgroundColor: INK, color: PAPER, fontFamily: "Geist" }}
    >
      <div tw="flex items-center justify-between text-2xl tracking-widest" style={{ fontFamily: "Geist Mono" }}>
        <div tw="flex items-center">
          <div tw="w-4 h-4 mr-4" style={{ backgroundColor: RED }} />
          <div style={{ color: AMBER }}>{eyebrow}</div>
        </div>
        <div tw="flex items-baseline" style={{ color: MUTE }}>
          <span tw="mr-3" style={{ color: AMBER }}>{"\\t"}</span>
          <span>hardtab.amanv.dev</span>
        </div>
      </div>
      <div tw="flex flex-col">{children}</div>
      <div
        tw="flex items-center justify-between text-2xl -mx-16 -mb-16 px-16 py-4"
        style={{ fontFamily: "Geist Mono", color: MUTE, backgroundColor: INK2 }}
      >
        <div>{statusLeft}</div>
        <div tw="flex">{statusRight}</div>
      </div>
    </div>
  );
}

export function OgCard({ lines, t, w }: OgParams) {
  const linesLabel = lines.toLocaleString("en-US");
  const headline = "text-[120px] font-bold leading-[0.92] tracking-tighter";

  if (t !== undefined) {
    const wrong = w ?? 0;
    return (
      <Frame
        eyebrow="CHECKSTYLE · MIXEDINDENTATION · RESOLVED"
        statusLeft={`${linesLabel} lines   (1 selected)`}
        statusRight={
          <>
            <span tw="mr-8">Tab Size: 4</span>
            <span tw="mr-8">UTF-8</span>
            <span tw="mr-8">Java</span>
            <span style={{ color: GREEN }}>0 problems</span>
          </>
        }
      >
        <div tw={headline}>Found the tab</div>
        <div tw={`${headline} flex`}>
          <span tw="mr-6">in</span>
          <span style={{ color: AMBER, fontFamily: "Geist Mono", letterSpacing: "-0.02em" }}>{formatDuration(t)}</span>
          <span>.</span>
        </div>
        <div tw="mt-8 text-4xl" style={{ color: MUTE }}>
          {linesLabel} lines of Java
          {wrong > 0 ? ` · ${wrong} wrong claim${wrong === 1 ? "" : "s"} (+${wrong * 10}s)` : " · no wrong claims"}
          {" · same haystack, your turn."}
        </div>
      </Frame>
    );
  }

  return (
    <Frame
      eyebrow="CHECKSTYLE · MIXEDINDENTATION · 1 OCCURRENCE"
      statusLeft="Ln 1, Col 1   (nothing selected)"
      statusRight={
        <>
          <span tw="mr-8">Spaces: 4</span>
          <span tw="mr-8">UTF-8</span>
          <span tw="mr-8">Java</span>
          <span style={{ color: RED }}>! 1 problem</span>
        </>
      }
    >
      <div tw={headline}>One tab.</div>
      <div tw={headline}>{linesLabel} lines of Java.</div>
      <div tw={headline} style={{ color: AMBER }}>
        Find it.
      </div>
    </Frame>
  );
}
