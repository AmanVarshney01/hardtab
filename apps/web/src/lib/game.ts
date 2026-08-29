export const LEVELS = [
  { lines: 500, label: "Intern", blurb: "one file, one afternoon" },
  { lines: 5_000, label: "Mid-level", blurb: "a small module" },
  { lines: 20_000, label: "Senior", blurb: "the whole billing service" },
  { lines: 100_000, label: "Staff", blurb: "the monolith" },
] as const;

export const PENALTY_MS = 10_000;

export const WRONG_MESSAGES = [
  "That was a space. Four of them, actually.",
  "Nope. Spaces. Like the team agreed on.",
  "Wrong. The linter is disappointed in you.",
  "Those are spaces. Checkstyle has seen them and moved on.",
  "Spaces. +10s. Dave says hi.",
  "Not a tab. A tab would jump. That just… sat there.",
  "Incorrect. Please re-read the contributing guide.",
  "Spaces. Your PR has been marked 'changes requested'.",
  "That is whitespace, but not the whitespace.",
  "Wrong line. Wrong column. Right energy.",
];

export const WIN_MESSAGES = [
  "Found it. Merge unblocked.",
  "There it is. It had been there since 2014.",
  "Tab located. The build is green. Nobody will thank you.",
  "You did it. Add it to your performance review.",
];

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

export function formatDurationTenths(ms: number) {
  const tenths = Math.floor(Math.max(0, ms) / 100) % 10;
  return `${formatDuration(ms)}.${tenths}`;
}

export type Rank = "S" | "A" | "B" | "C" | "F";

export const RANK_COPY: Record<Rank, string> = {
  S: "Clean sweep. No strikes, barely looked.",
  A: "No strikes. The linter would hire you.",
  B: "A strike or two. Acceptable for a Tuesday.",
  C: "Several strikes. The tab found you.",
  F: "Did not finish. It's still in there.",
};

export function rankRun(opts: { won: boolean; cheated: boolean; wrong: number; scannedPct: number }): Rank {
  if (!opts.won || opts.cheated) return "F";
  if (opts.wrong === 0 && opts.scannedPct < 25) return "S";
  if (opts.wrong === 0) return "A";
  if (opts.wrong <= 2) return "B";
  return "C";
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const BEST_KEY = "find-space:best";

export type BestTimes = Record<string, number>;

export function loadBest(): BestTimes {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}") as BestTimes;
  } catch {
    return {};
  }
}

export function saveBest(lines: number, ms: number): boolean {
  const best = loadBest();
  const prev = best[String(lines)];
  if (prev !== undefined && prev <= ms) return false;
  best[String(lines)] = ms;
  localStorage.setItem(BEST_KEY, JSON.stringify(best));
  return true;
}
