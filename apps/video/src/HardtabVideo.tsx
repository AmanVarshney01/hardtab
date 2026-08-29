import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Easing, useVideoConfig } from "remotion";

import { Camera } from "./Camera";
import { at } from "./marks";

const W = 1920;
const H = 1080;
const CENTRE: [number, number] = [W / 2, H / 2];
/** Where the tab's indent sits in the capture (line centred at 46% height, indent at the left gutter). */
const TAB: [number, number] = [150, H * 0.46];
const HUD: [number, number] = [W / 2, 40];
const WIN_PANEL: [number, number] = [W - 330, H - 300];

export const FPS = 30;

const shots = () => {
  const drag0 = at("drag-start");
  const drag1 = at("drag-end");
  const arrows0 = at("arrows-start");
  const arrows1 = at("arrows-end");
  return [
    { id: "scroll", seconds: 2.2, caption: { eyebrow: "5,000 lines of java", text: "One of these indents is a tab." },
      cam: { src: at("scrolling") - 0.2, scale: [1.0, 1.04] as [number, number], focus: [CENTRE, CENTRE] as [[number, number], [number, number]] } },
    { id: "drag", seconds: drag1 - drag0 + 1.3, caption: { eyebrow: "your only instrument", text: "Spaces grow one column. The tab jumps four." },
      cam: { src: drag0 - 0.5, scale: [1.0, 2.6] as [number, number], focus: [CENTRE, TAB] as [[number, number], [number, number]], easing: Easing.bezier(0.3, 0, 0.1, 1) } },
    { id: "arrows", seconds: arrows1 - arrows0 + 1.0, caption: { eyebrow: "or walk it", text: "Arrow keys: one column per space, four per tab." },
      cam: { src: arrows0 - 0.3, scale: [2.6, 2.6] as [number, number], focus: [TAB, TAB] as [[number, number], [number, number]] } },
    { id: "strike", seconds: 2.2, hot: true, caption: { eyebrow: "wrong claim", text: "+10 seconds. The linter is disappointed." },
      cam: { src: at("strike") - 0.3, scale: [1.5, 1.15] as [number, number], focus: [TAB, HUD] as [[number, number], [number, number]] } },
    { id: "win", seconds: 4.2, caption: { eyebrow: "build passed", text: "Rank it. Share the seed. Ruin a friend's afternoon." },
      cam: { src: at("win") - 0.2, scale: [1.0, 1.7] as [number, number], focus: [CENTRE, WIN_PANEL] as [[number, number], [number, number]], easing: Easing.bezier(0.2, 0, 0.1, 1) } },
    { id: "themes", seconds: at("theme-eclipse") - at("theme-hotdog") + 0.4, caption: { eyebrow: "hotdog stand · phosphor · eclipse 2009", text: "Twelve themes. All of them regrettable." },
      cam: { src: at("theme-hotdog") - 0.2, scale: [1.0, 1.06] as [number, number], focus: [CENTRE, CENTRE] as [[number, number], [number, number]] } },
  ];
};

export const HardtabVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const list = shots();
  return (
    <AbsoluteFill style={{ backgroundColor: "#1c2030" }}>
      <TransitionSeries>
        {list.flatMap((s, i) => [
          <TransitionSeries.Sequence key={s.id} durationInFrames={Math.round(s.seconds * fps)} name={s.id}>
            <Camera {...s.cam} />
          </TransitionSeries.Sequence>,
          i < list.length - 1 ? <TransitionSeries.Transition key={`${s.id}-t`} presentation={fade()} timing={linearTiming({ durationInFrames: Math.round(0.3 * fps) })} /> : null,
        ])}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/** Total length in frames, derived from the shot list. */
export const totalFrames = (fps: number) => {
  const list = shots();
  const scenes = list.reduce((a, s) => a + s.seconds, 0);
  const transitions = 0.3 * (list.length - 1);
  return Math.round((scenes - transitions) * fps);
};
