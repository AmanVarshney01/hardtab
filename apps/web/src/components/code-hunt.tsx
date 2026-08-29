import { defaultKeymap } from "@codemirror/commands";
import { java } from "@codemirror/lang-java";
import { Compartment, EditorState, StateEffect, StateField, type Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightWhitespace,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useEffect, useRef } from "react";

import { codeExtensions, getTheme } from "@/lib/themes";

export interface SelectionInfo {
  from: number;
  to: number;
  line: number;
  col: number;
}

export interface ViewportInfo {
  /** 1-based first and last visible lines. */
  fromLine: number;
  toLine: number;
}

export interface CodeHuntApi {
  scrollToLine(line: number): void;
  /** Client (CSS px) coordinates of a document position, if it is rendered. */
  coordsAt(pos: number): { x: number; y: number } | null;
}

interface CodeHuntProps {
  doc: string;
  /** Character offset to spotlight (after a win or a surrender). */
  revealAt: number | null;
  showWhitespace: boolean;
  themeId: string;
  onSelection: (sel: SelectionInfo) => void;
  onViewport?: (vp: ViewportInfo) => void;
  onClaim: () => void;
  apiRef?: React.MutableRefObject<CodeHuntApi | null>;
}

const revealEffect = StateEffect.define<number | null>();

const revealField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(revealEffect)) {
        if (e.value === null) return Decoration.none;
        const mark: Range<Decoration> = Decoration.mark({ class: "cm-the-tab" }).range(e.value, e.value + 1);
        return Decoration.set([mark]);
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function CodeHunt({ doc, revealAt, showWhitespace, themeId, onSelection, onViewport, onClaim, apiRef }: CodeHuntProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const whitespaceCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const onSelectionRef = useRef(onSelection);
  const onClaimRef = useRef(onClaim);
  const onViewportRef = useRef(onViewport);
  onSelectionRef.current = onSelection;
  onClaimRef.current = onClaim;
  onViewportRef.current = onViewport;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const state = EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        java(),
        themeCompartment.current.of(codeExtensions(getTheme(themeId))),
        revealField,
        whitespaceCompartment.current.of([]),
        EditorState.readOnly.of(true),
        EditorState.tabSize.of(4),
        EditorView.contentAttributes.of({
          inputmode: "none",
          autocorrect: "off",
          autocapitalize: "off",
          spellcheck: "false",
          "aria-label": "Java source. Find the tab.",
        }),
        keymap.of([
          {
            key: "Enter",
            run: () => {
              onClaimRef.current();
              return true;
            },
          },
          ...defaultKeymap,
        ]),
        EditorView.updateListener.of((u) => {
          if (u.viewportChanged || u.docChanged) {
            const vp = u.view.viewport;
            onViewportRef.current?.({
              fromLine: u.state.doc.lineAt(vp.from).number,
              toLine: u.state.doc.lineAt(vp.to).number,
            });
          }
          if (!u.selectionSet && !u.docChanged && !u.focusChanged) return;
          const main = u.state.selection.main;
          const line = u.state.doc.lineAt(main.head);
          onSelectionRef.current({
            from: main.from,
            to: main.to,
            line: line.number,
            col: main.head - line.from + 1,
          });
        }),
      ],
    });

    const view = new EditorView({ state, parent: host });
    viewRef.current = view;
    if (apiRef) {
      apiRef.current = {
        coordsAt(pos) {
          const c = view.coordsAtPos(Math.min(Math.max(0, pos), view.state.doc.length));
          return c ? { x: c.left, y: (c.top + c.bottom) / 2 } : null;
        },
        scrollToLine(line) {
          const n = Math.min(Math.max(1, Math.round(line)), view.state.doc.lines);
          const pos = view.state.doc.line(n).from;
          view.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: "start" }) });
          view.focus();
        },
      };
    }
    view.focus();
    // Seed the radar with the initial viewport.
    onViewportRef.current?.({
      fromLine: view.state.doc.lineAt(view.viewport.from).number,
      toLine: view.state.doc.lineAt(view.viewport.to).number,
    });

    return () => {
      view.destroy();
      viewRef.current = null;
      if (apiRef) apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: whitespaceCompartment.current.reconfigure(showWhitespace ? highlightWhitespace() : []),
    });
  }, [showWhitespace]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: themeCompartment.current.reconfigure(codeExtensions(getTheme(themeId))) });
  }, [themeId]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (revealAt === null) {
      view.dispatch({ effects: revealEffect.of(null) });
      return;
    }
    view.dispatch({
      selection: { anchor: revealAt, head: revealAt + 1 },
      effects: [revealEffect.of(revealAt), EditorView.scrollIntoView(revealAt, { y: "center" })],
    });
  }, [revealAt]);

  return <div ref={hostRef} className="h-full min-h-0" />;
}
