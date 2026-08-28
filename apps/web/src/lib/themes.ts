import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

export interface Theme {
  id: string;
  name: string;
  tagline: string;
  /** Page chrome. */
  ui: {
    ink: string; // page background
    ink2: string; // panels
    ink3: string; // hover / secondary
    paper: string; // foreground text
    mute: string; // secondary text
    border: string;
    accent: string; // primary buttons, eyebrows, the revealed tab
    accentFg: string; // text on accent
    squiggle: string; // errors / penalties
  };
  /** Editor colours. */
  code: {
    bg?: string;
    fg?: string;
    gutterFg?: string;
    selection: string;
    cursor?: string;
    activeLine?: string;
    kw: string;
    str: string;
    cmt: string;
    type: string;
    num: string;
    fn: string;
    varName: string;
    punct?: string;
    font?: string;
    boldKeywords?: boolean;
    italicComments?: boolean;
  };
}

export const THEMES: readonly Theme[] = [
  {
    id: "ink",
    name: "Ink",
    tagline: "the house style",
    ui: {
      ink: "#1c2030",
      ink2: "#242938",
      ink3: "#2f3547",
      paper: "#e9e4d8",
      mute: "#8b90a0",
      border: "#343a4d",
      accent: "#f2b544",
      accentFg: "#1a1405",
      squiggle: "#e5484d",
    },
    code: {
      selection: "rgba(242, 181, 68, 0.42)",
      kw: "#c678dd",
      str: "#98c379",
      cmt: "#7a8196",
      type: "#e5c07b",
      num: "#d19a66",
      fn: "#61afef",
      varName: "#e06c75",
      italicComments: true,
    },
  },
  {
    id: "one-dark",
    name: "One Dark",
    tagline: "atom's ghost",
    ui: {
      ink: "#282c34",
      ink2: "#21252b",
      ink3: "#2c313a",
      paper: "#abb2bf",
      mute: "#5c6370",
      border: "#3e4451",
      accent: "#e5c07b",
      accentFg: "#282c34",
      squiggle: "#e06c75",
    },
    code: {
      selection: "rgba(229, 192, 123, 0.35)",
      kw: "#c678dd",
      str: "#98c379",
      cmt: "#5c6370",
      type: "#e5c07b",
      num: "#d19a66",
      fn: "#61afef",
      varName: "#e06c75",
      italicComments: true,
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    tagline: "for night shifts",
    ui: {
      ink: "#282a36",
      ink2: "#21222c",
      ink3: "#343746",
      paper: "#f8f8f2",
      mute: "#6272a4",
      border: "#44475a",
      accent: "#ffb86c",
      accentFg: "#282a36",
      squiggle: "#ff5555",
    },
    code: {
      selection: "rgba(255, 184, 108, 0.35)",
      kw: "#ff79c6",
      str: "#f1fa8c",
      cmt: "#6272a4",
      type: "#8be9fd",
      num: "#bd93f9",
      fn: "#50fa7b",
      varName: "#f8f8f2",
      italicComments: true,
    },
  },
  {
    id: "monokai",
    name: "Monokai",
    tagline: "sublime, 2012",
    ui: {
      ink: "#272822",
      ink2: "#1e1f1c",
      ink3: "#3e3d32",
      paper: "#f8f8f2",
      mute: "#75715e",
      border: "#49483e",
      accent: "#fd971f",
      accentFg: "#272822",
      squiggle: "#f92672",
    },
    code: {
      selection: "rgba(253, 151, 31, 0.35)",
      kw: "#f92672",
      str: "#e6db74",
      cmt: "#75715e",
      type: "#66d9ef",
      num: "#ae81ff",
      fn: "#a6e22e",
      varName: "#f8f8f2",
      italicComments: true,
    },
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    tagline: "retro groove",
    ui: {
      ink: "#282828",
      ink2: "#1d2021",
      ink3: "#3c3836",
      paper: "#ebdbb2",
      mute: "#928374",
      border: "#504945",
      accent: "#fe8019",
      accentFg: "#282828",
      squiggle: "#fb4934",
    },
    code: {
      selection: "rgba(254, 128, 25, 0.35)",
      kw: "#fb4934",
      str: "#b8bb26",
      cmt: "#928374",
      type: "#fabd2f",
      num: "#d3869b",
      fn: "#8ec07c",
      varName: "#ebdbb2",
      italicComments: true,
    },
  },
  {
    id: "nord",
    name: "Nord",
    tagline: "arctic, calm, wrong",
    ui: {
      ink: "#2e3440",
      ink2: "#3b4252",
      ink3: "#434c5e",
      paper: "#d8dee9",
      mute: "#7b88a1",
      border: "#4c566a",
      accent: "#ebcb8b",
      accentFg: "#2e3440",
      squiggle: "#bf616a",
    },
    code: {
      selection: "rgba(235, 203, 139, 0.35)",
      kw: "#81a1c1",
      str: "#a3be8c",
      cmt: "#616e88",
      type: "#8fbcbb",
      num: "#b48ead",
      fn: "#88c0d0",
      varName: "#d8dee9",
      italicComments: true,
    },
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    tagline: "a beige you can trust",
    ui: {
      ink: "#fdf6e3",
      ink2: "#eee8d5",
      ink3: "#e4dcc3",
      paper: "#073642",
      mute: "#93a1a1",
      border: "#d6cfb5",
      accent: "#cb4b16",
      accentFg: "#fdf6e3",
      squiggle: "#dc322f",
    },
    code: {
      selection: "rgba(203, 75, 22, 0.28)",
      kw: "#859900",
      str: "#2aa198",
      cmt: "#93a1a1",
      type: "#b58900",
      num: "#d33682",
      fn: "#268bd2",
      varName: "#657b83",
      italicComments: true,
    },
  },
  {
    id: "github-light",
    name: "GitHub Light",
    tagline: "as seen in code review",
    ui: {
      ink: "#ffffff",
      ink2: "#f6f8fa",
      ink3: "#eaeef2",
      paper: "#1f2328",
      mute: "#656d76",
      border: "#d0d7de",
      accent: "#bf8700",
      accentFg: "#ffffff",
      squiggle: "#cf222e",
    },
    code: {
      selection: "rgba(191, 135, 0, 0.28)",
      kw: "#cf222e",
      str: "#0a3069",
      cmt: "#6e7781",
      type: "#953800",
      num: "#0550ae",
      fn: "#8250df",
      varName: "#1f2328",
    },
  },
  {
    id: "eclipse",
    name: "Eclipse 2009",
    tagline: "the authentic Java experience",
    ui: {
      ink: "#ffffff",
      ink2: "#ececec",
      ink3: "#dcdcdc",
      paper: "#000000",
      mute: "#6d6d6d",
      border: "#a0a0a0",
      accent: "#7f0055",
      accentFg: "#ffffff",
      squiggle: "#ff0000",
    },
    code: {
      selection: "rgba(200, 200, 255, 0.85)",
      gutterFg: "#787878",
      activeLine: "#e8f2fe",
      kw: "#7f0055",
      str: "#2a00ff",
      cmt: "#3f7f5f",
      type: "#000000",
      num: "#000000",
      fn: "#000000",
      varName: "#0000c0",
      font: "Consolas, 'Courier New', monospace",
      boldKeywords: true,
    },
  },
  {
    id: "notepad",
    name: "Notepad",
    tagline: "where the tab was born",
    ui: {
      ink: "#ffffff",
      ink2: "#f0f0f0",
      ink3: "#e5e5e5",
      paper: "#000000",
      mute: "#767676",
      border: "#a0a0a0",
      accent: "#0078d7",
      accentFg: "#ffffff",
      squiggle: "#c50f1f",
    },
    code: {
      selection: "rgba(0, 120, 215, 0.4)",
      gutterFg: "#a0a0a0",
      activeLine: "transparent",
      kw: "#000000",
      str: "#000000",
      cmt: "#000000",
      type: "#000000",
      num: "#000000",
      fn: "#000000",
      varName: "#000000",
      font: "'Courier New', Courier, monospace",
    },
  },
  {
    id: "phosphor",
    name: "Phosphor",
    tagline: "green on black, burn-in included",
    ui: {
      ink: "#04140a",
      ink2: "#08200f",
      ink3: "#0d2d16",
      paper: "#33ff66",
      mute: "#1f9a44",
      border: "#155c2a",
      accent: "#ffbf00",
      accentFg: "#04140a",
      squiggle: "#ff5c33",
    },
    code: {
      selection: "rgba(255, 191, 0, 0.35)",
      kw: "#b6ffc8",
      str: "#7dff9c",
      cmt: "#1f9a44",
      type: "#dfffe6",
      num: "#a8ffbd",
      fn: "#33ff66",
      varName: "#33ff66",
      boldKeywords: true,
    },
  },
  {
    id: "hotdog",
    name: "Hotdog Stand",
    tagline: "windows 3.1 · not a joke, it shipped",
    ui: {
      ink: "#ff0000",
      ink2: "#d00000",
      ink3: "#ffff00",
      paper: "#ffff00",
      mute: "#ffffff",
      border: "#000000",
      accent: "#000000",
      accentFg: "#ffff00",
      squiggle: "#ffffff",
    },
    code: {
      selection: "rgba(0, 0, 0, 0.55)",
      cursor: "#000000",
      activeLine: "rgba(0,0,0,0.12)",
      gutterFg: "#ffffff",
      kw: "#ffffff",
      str: "#ffff00",
      cmt: "#000000",
      type: "#ffffff",
      num: "#ffffff",
      fn: "#ffff00",
      varName: "#ffff00",
      boldKeywords: true,
    },
  },
];

export const DEFAULT_THEME_ID = "ink";

export function getTheme(id: string): Theme {
  return THEMES.find((th) => th.id === id) ?? (THEMES[0] as Theme);
}

/** CSS custom properties for the page chrome. Applied to <html>. */
export function uiVars(theme: Theme): Record<string, string> {
  const u = theme.ui;
  return {
    "--ink": u.ink,
    "--ink-2": u.ink2,
    "--ink-3": u.ink3,
    "--paper": u.paper,
    "--mute": u.mute,
    "--amber": u.accent,
    "--squiggle": u.squiggle,
    "--background": u.ink,
    "--foreground": u.paper,
    "--card": u.ink2,
    "--card-foreground": u.paper,
    "--popover": u.ink2,
    "--popover-foreground": u.paper,
    "--primary": u.accent,
    "--primary-foreground": u.accentFg,
    "--secondary": u.ink3,
    "--secondary-foreground": u.paper,
    "--muted": u.ink2,
    "--muted-foreground": u.mute,
    "--accent": u.ink3,
    "--accent-foreground": u.paper,
    "--destructive": u.squiggle,
    "--border": u.border,
    "--input": u.border,
    "--ring": u.accent,
  };
}

/** CodeMirror extension (editor theme + syntax colours) for a theme. */
export function codeExtensions(theme: Theme): Extension {
  const c = theme.code;
  const u = theme.ui;
  const bg = c.bg ?? u.ink;
  const fg = c.fg ?? u.paper;

  const editorTheme = EditorView.theme(
    {
      "&": { backgroundColor: bg, color: fg, height: "100%" },
      ".cm-scroller": { overflow: "auto", fontFamily: c.font ?? "var(--font-mono)" },
      ".cm-content": { caretColor: c.cursor ?? u.accent, padding: "16px 0 40vh 0" },
      ".cm-line": { padding: "0 16px 0 8px" },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: c.cursor ?? u.accent, borderLeftWidth: "2px" },
      "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground": {
        backgroundColor: `${c.selection} !important`,
      },
      ".cm-activeLine": { backgroundColor: c.activeLine ?? "color-mix(in srgb, currentColor 5%, transparent)" },
      ".cm-gutters": {
        backgroundColor: bg,
        color: c.gutterFg ?? u.mute,
        border: "none",
        borderRight: `1px solid ${u.border}`,
      },
      ".cm-activeLineGutter": { backgroundColor: u.ink2, color: fg },
      ".cm-lineNumbers .cm-gutterElement": { minWidth: "6.5ch", padding: "0 12px 0 8px" },
    },
    { dark: isDark(bg) },
  );

  const highlight = HighlightStyle.define([
    {
      tag: [t.keyword, t.definitionKeyword, t.moduleKeyword, t.controlKeyword, t.modifier, t.operatorKeyword, t.self],
      color: c.kw,
      fontWeight: c.boldKeywords ? "bold" : "normal",
    },
    { tag: [t.string, t.character], color: c.str },
    {
      tag: [t.lineComment, t.blockComment, t.docComment, t.comment],
      color: c.cmt,
      fontStyle: c.italicComments ? "italic" : "normal",
    },
    { tag: [t.typeName, t.standard(t.typeName)], color: c.type },
    { tag: [t.integer, t.float, t.bool, t.null, t.number], color: c.num },
    { tag: t.function(t.variableName), color: c.fn },
    { tag: [t.variableName, t.definition(t.variableName)], color: c.varName },
    {
      tag: [t.operator, t.punctuation, t.separator, t.paren, t.brace, t.squareBracket, t.derefOperator],
      color: c.punct ?? fg,
    },
  ]);

  return [editorTheme, syntaxHighlighting(highlight)];
}

export function isDarkTheme(theme: Theme) {
  return isDark(theme.code.bg ?? theme.ui.ink);
}

function isDark(hex: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return true;
  const n = parseInt(m[1] as string, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
