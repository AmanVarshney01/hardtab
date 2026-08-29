/**
 * A welcome for anyone who opens DevTools to find the tab. The banner is
 * logged at boot; the getter trap fires only when the console actually
 * renders the object, i.e. when someone is really looking.
 */
import { track } from "./analytics";

const AMBER = "#f2b544";
const PAPER = "#e9e4d8";
const MUTE = "#8b90a0";
const RED = "#e5484d";

const title = `font: 700 28px Geist, ui-sans-serif, system-ui; color: ${PAPER}; letter-spacing: -0.03em;`;
const mono = `font: 13px "Geist Mono", ui-monospace, monospace; color: ${MUTE};`;
const amber = `font: 700 13px "Geist Mono", ui-monospace, monospace; color: ${AMBER};`;
const red = `font: 700 13px "Geist Mono", ui-monospace, monospace; color: ${RED};`;

export function installConsoleBanner() {
  if (typeof window === "undefined" || import.meta.env.DEV) return;

  console.log(`%c\\t %chardtab`, `font: 700 28px "Geist Mono", monospace; color: ${AMBER};`, title);
  console.log(
    `%cOh. DevTools. For a tab.\n\n` +
      `%cLet's be honest about what's happening here: you looked at 100,000 lines of Java,\n` +
      `decided your cursor wasn't good enough, and came to the console like it owes you money.\n\n` +
      `%cA few notes while you're here:\n` +
      `%c  · Ctrl+F only sees what's on screen. That was on purpose.\n` +
      `  · Yes, the seed is in the URL. Yes, the generator is in the bundle. We know.\n` +
      `  · The tab does not glow. Neither do you.\n` +
      `  · Whoever wrote this file used both tabs and spaces. Look in a mirror; it was you.\n\n` +
      `%cFind it with the cursor like a person, or don't. The rank screen already knows.`,
    amber,
    mono,
    amber,
    mono,
    red,
  );

  // Fires when the console expands/inspects the object — i.e. when it is open and looked at.
  let caught = false;
  const bait = {};
  Object.defineProperty(bait, "hint", {
    get() {
      if (!caught) {
        caught = true;
        track("devtools_open");
        console.log(
          `%cCaught you looking. %cThe tab is on line ${Math.floor(Math.random() * 100_000) + 1}. Probably. Go check.`,
          red,
          mono,
        );
      }
      return "no";
    },
    enumerable: true,
  });
  console.log("%cWant a hint? Expand this:", amber, bait);
}
