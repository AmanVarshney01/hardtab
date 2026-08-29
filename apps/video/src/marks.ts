import data from "../public/marks.json";

type MarkName =
  | "landing"
  | "pick-5000"
  | "open-codebase"
  | "start-hunting"
  | "scrolling"
  | "drag-start"
  | "drag-end"
  | "arrows-start"
  | "arrows-end"
  | "strike"
  | "win"
  | "theme-hotdog"
  | "theme-phosphor"
  | "theme-eclipse"
  | "end";

const byName = new Map<string, number>(data.marks.map((m) => [m.name, m.t]));

/** Seconds into the capture at which a named moment happened. */
export function at(name: MarkName): number {
  const t = byName.get(name);
  if (t === undefined) throw new Error(`no mark ${name}`);
  return t;
}

export const CAPTURE = "capture.mp4";
export const capture = data;
