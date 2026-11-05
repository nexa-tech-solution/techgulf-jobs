"use client";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { basicSetup } from "codemirror";
import { snippetCompletion, type CompletionContext } from "@codemirror/autocomplete";
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { lintGutter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

export interface CvCodeEditorHandle { jumpTo: (pos: number) => void; insert: (text: string) => void }

const latex = StreamLanguage.define(stex);

const COMMANDS = [
  ["section", "\\section{${}}"],
  ["subsection", "\\subsection{${}}"],
  ["entry", "\\entry{${title}}{${organisation}}{${dates}}{${place}}"],
  ["skills", "\\skills{${label}}{${values}}"],
  ["itemize", "\\begin{itemize}\n  \\item ${}\n\\end{itemize}"],
  ["enumerate", "\\begin{enumerate}\n  \\item ${}\n\\end{enumerate}"],
  ["item", "\\item ${}"],
  ["textbf", "\\textbf{${}}"],
  ["textit", "\\textit{${}}"],
  ["underline", "\\underline{${}}"],
  ["href", "\\href{${url}}{${label}}"],
  ["url", "\\url{${}}"],
  ["name", "\\name{${}}"],
  ["headline", "\\headline{${}}"],
  ["email", "\\email{${}}"],
  ["phone", "\\phone{${}}"],
  ["location", "\\location{${}}"],
  ["website", "\\website{${}}"],
  ["personal", "\\personal{${label}}{${value}}"],
  ["sidebar", "\\begin{sidebar}\n  ${}\n\\end{sidebar}"],
  ["accentcolor", "\\accentcolor{${0f766e}}"],
  ["newpage", "\\newpage"],
].map(([label, snippet]) => snippetCompletion(snippet, { label: `\\${label}`, type: "keyword" }));

function complete(context: CompletionContext) {
  const word = context.matchBefore(/\\[a-zA-Z]*/);
  return word ? { from: word.from, options: COMMANDS, validFor: /^\\[a-zA-Z]*$/ } : null;
}

const colours = HighlightStyle.define([
  { tag: [tags.tagName, tags.keyword, tags.atom], color: "var(--primary)", fontWeight: "500" },
  { tag: tags.comment, color: "var(--muted)", fontStyle: "italic" },
  { tag: [tags.bracket, tags.string], color: "var(--accent)" },
]);

const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "13.5px", backgroundColor: "var(--surface)", color: "var(--ink)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
  ".cm-gutters": { backgroundColor: "var(--surface-2)", color: "var(--muted)", borderInlineEnd: "1px solid var(--border)" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--primary) 7%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" },
  ".cm-cursor": { borderLeftColor: "var(--ink)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "color-mix(in srgb, var(--primary) 25%, transparent) !important" },
  ".cm-tooltip": { backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" },
  ".cm-panels": { backgroundColor: "var(--surface-2)", color: "var(--ink)" },
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  diagnostics: Diagnostic[];
  label: string;
  ref?: Ref<CvCodeEditorHandle>;
}

export function CvCodeEditor({ value, onChange, diagnostics, label, ref }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latestChange = useRef(onChange);
  useEffect(() => { latestChange.current = onChange; }, [onChange]);

  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          latex,
          latex.data.of({ autocomplete: complete }),
          syntaxHighlighting(colours),
          lintGutter(),
          theme,
          EditorView.lineWrapping,
          // Lets Arabic lines read right to left inside the left-to-right code pane.
          EditorView.perLineTextDirection.of(true),
          EditorView.contentAttributes.of({ "aria-label": label }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) latestChange.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => { editor.destroy(); view.current = null; };
    // The editor keeps its own text after mounting; the effect below applies outside changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside changes: a new template, a reset, or a newer copy arriving from the account.
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const length = editor.state.doc.length;
    editor.dispatch(setDiagnostics(editor.state, diagnostics.filter((d) => d.to <= length)));
  }, [diagnostics]);

  useImperativeHandle(ref, () => ({
    insert(text) {
      const editor = view.current;
      if (!editor) return;
      const code = editor.state.doc.toString();
      const { from, to } = editor.state.selection.main;
      const beginAt = code.indexOf("\\begin{document}");
      const endAt = code.indexOf("\\end{document}");
      const bodyStart = beginAt < 0 ? 0 : beginAt + "\\begin{document}".length;
      const bodyEnd = endAt < 0 ? code.length : endAt;
      // The cursor starts on line 1, where body commands would be errors, so those go at the end of the body instead.
      const inBody = from >= bodyStart && to <= bodyEnd;
      const range = inBody ? { from, to } : { from: bodyEnd, to: bodyEnd };
      editor.dispatch({ changes: { ...range, insert: text }, selection: { anchor: range.from + text.length }, scrollIntoView: true });
      editor.focus();
    },
    jumpTo(pos) {
      const editor = view.current;
      if (!editor) return;
      const anchor = Math.min(pos, editor.state.doc.length);
      editor.dispatch({ selection: { anchor }, scrollIntoView: true });
      editor.focus();
    },
  }), []);

  return <div ref={host} dir="ltr" className="h-full min-h-0 overflow-hidden" />;
}
