import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const geist = "Geist";
export const mono = "Geist Mono";

// Variable TTFs shipped with the site; loaded once at module init.
export const fontsReady = Promise.all([
  loadFont({ family: geist, url: staticFile("fonts/Geist.ttf"), weight: "100 900" }),
  loadFont({ family: mono, url: staticFile("fonts/GeistMono.ttf"), weight: "100 900" }),
]);
