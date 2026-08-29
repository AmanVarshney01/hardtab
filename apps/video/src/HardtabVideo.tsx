import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Easing, useVideoConfig } from "remotion";

import { Camera } from "./Camera";
import { Caption, ScreenOverlay, Tag } from "./Chrome";
import { at } from "./marks";
import { Intro, Outro } from "./scenes/Cards";

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
    { id: "landing", seconds: 5.2, caption: { eyebrow: "the real site", text: "One tab hidden in 100,000 lines." },
      cam: { src: at("landing") + 0.4, scale: [1, 1.22] as [number, number], focus: [CENTRE, [700, 470]] as [[number, number], [number, number]] } },
    { id: "briefing", seconds: 2.8, caption: { eyebrow: "briefing", text: "It looks exactly like four spaces." },
      cam: { src: at("open-codebase") + 0.9, scale: [1.08, 1.12] as [number, number], focus: [CENTRE, CENTRE] as [[number, number], [number, number]] } },
    { id: "scroll", seconds: 3.4, caption: { eyebrow: "5,000 lines · seed shared", text: "Same link, same tab, same place." },
      cam: { src: at("scrolling") - 0.6, scale: [1.02, 1.0] as [number, number], focus: [CENTRE, CENTRE] as [[number, number], [number, number]] } },
    { id: "drag", seconds: drag1 - drag0 + 1.3, caption: { eyebrow: "your only instrument", text: "Spaces grow one column. The tab jumps four." },
      cam: { src: drag0 - 0.5, scale: [1.0, 2.6] as [number, number], focus: [CENTRE, TAB] as [[number, number], [number, number]], easing: Easing.bezier(0.3, 0, 0.1, 1) } },
    { id: "arrows", seconds: arrows1 - arrows0 + 1.0, caption: { eyebrow: "or walk it", text: "Arrow keys: one column per space, four per tab." },
      cam: { src: arrows0 - 0.3, scale: [2.6, 2.6] as [number, number], focus: [TAB, TAB] as [[number, number], [number, number]] } },
    { id: "strike", seconds: 2.2, hot: true, caption: { eyebrow: "wrong claim", text: "+10 seconds. The linter is disappointed." },
      cam: { src: at("strike") - 0.3, scale: [1.5, 1.15] as [number, number], focus: [TAB, HUD] as [[number, number], [number, number]] } },
    { id: "win", seconds: 4.2, caption: { eyebrow: "build passed", text: "Rank it. Share the seed. Ruin a friend's afternoon." },
      cam: { src: at("win") - 0.2, scale: [1.0, 1.7] as [number, number], focus: [CENTRE, WIN_PANEL] as [[number, number], [number, number]], easing: Easing.bezier(0.2, 0, 0.1, 1) } },
    { id: "themes", seconds: at("end") - at("theme-hotdog") - 0.6, caption: { eyebrow: "hotdog stand · phosphor · eclipse 2009", text: "Twelve themes. All of them regrettable." },
      cam: { src: at("theme-hotdog") - 0.2, scale: [1.0, 1.06] as [number, number], focus: [CENTRE, CENTRE] as [[number, number], [number, number]] } },
  ];
};

export const HardtabVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const list = shots();
  const xfade = (d = 0.4) => (
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: Math.round(d * fps) })} />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#1c2030" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={Math.round(3.2 * fps)} name="Intro">
          <Intro />
        </TransitionSeries.Sequence>
        {xfade(0.5)}
        {list.flatMap((s, i) => [
          <TransitionSeries.Sequence key={s.id} durationInFrames={Math.round(s.seconds * fps)} name={s.id}>
            <Camera {...s.cam} />
            <Tag />
            <Caption eyebrow={s.caption.eyebrow} text={s.caption.text} hot={s.hot} />
          </TransitionSeries.Sequence>,
          i < list.length - 1 ? <TransitionSeries.Transition key={`${s.id}-t`} presentation={fade()} timing={linearTiming({ durationInFrames: Math.round(0.3 * fps) })} /> : null,
        ])}
        {xfade(0.5)}
        <TransitionSeries.Sequence durationInFrames={Math.round(3.4 * fps)} name="Outro">
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <ScreenOverlay />
    </AbsoluteFill>
  );
};

/** Total length in frames, derived from the shot list. */
export const totalFrames = (fps: number) => {
  const list = shots();
  const scenes = 3.2 + list.reduce((a, s) => a + s.seconds, 0) + 3.4;
  const transitions = 0.5 + 0.3 * (list.length - 1) + 0.5;
  return Math.round((scenes - transitions) * fps);
};
