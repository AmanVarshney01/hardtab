import { Composition } from "remotion";

import { FPS, HardtabVideo, totalFrames } from "./HardtabVideo";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="hardtab"
      component={HardtabVideo}
      durationInFrames={totalFrames(FPS)}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
