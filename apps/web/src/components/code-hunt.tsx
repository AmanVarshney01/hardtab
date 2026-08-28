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

interface CodeHuntProps {
  doc: string;
  /** Character offset to spotlight (after a win or a surrender). */
  revealAt: number | null;
  showWhitespace: boolean;
  themeId: string;
  onSelection: (sel: SelectionInfo) => void;
  onClaim: () => void;
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

export function CodeHunt({ doc, revealAt, showWhitespace, themeId, onSelection, onClaim }: CodeHuntProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const whitespaceCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const onSelectionRef = useRef(onSelection);
  const onClaimRef = useRef(onClaim);
  onSelectionRef.current = onSelection;
  onClaimRef.current = onClaim;

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
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
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
