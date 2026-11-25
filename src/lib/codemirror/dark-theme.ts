/**
 * CodeMirror 6 theme matching Visionata design tokens.
 * Uses CSS custom properties so it adapts to dark/light mode.
 */

import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";

export const visionataEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-primary)",
      fontSize: "13px",
      fontFamily: "var(--font-mono)",
    },
    ".cm-content": {
      caretColor: "var(--text-primary)",
      padding: "12px",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--text-primary)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "var(--bg-elevated)",
      },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    ".cm-gutters": {
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-tertiary)",
      border: "none",
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: "var(--text-secondary)",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 16px",
      minWidth: "32px",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      color: "var(--text-secondary)",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      color: "var(--text-primary)",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: "var(--bg-elevated)",
      },
    },
    // Matching brackets
    "&.cm-focused .cm-matchingBracket": {
      backgroundColor: "rgba(88, 166, 255, 0.2)",
      outline: "1px solid rgba(88, 166, 255, 0.5)",
    },
    "&.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "rgba(248, 81, 73, 0.2)",
    },
    // Scrollbar
    ".cm-scroller": {
      overflow: "auto",
      scrollbarWidth: "thin",
      scrollbarColor: "var(--border-default) transparent",
    },
  },
  { dark: true },
);

const visionataHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--syntax-keyword)" },
  { tag: tags.operator, color: "var(--syntax-operator)" },
  { tag: tags.variableName, color: "var(--text-primary)" },
  { tag: tags.special(tags.variableName), color: "var(--syntax-special)" },
  { tag: tags.string, color: "var(--syntax-string)" },
  { tag: tags.number, color: "var(--syntax-operator)" },
  { tag: tags.bool, color: "var(--syntax-keyword)" },
  { tag: tags.null, color: "var(--syntax-keyword)" },
  { tag: tags.regexp, color: "var(--syntax-regexp)" },
  { tag: tags.punctuation, color: "var(--text-secondary)" },
  { tag: tags.bracket, color: "var(--text-secondary)" },
  { tag: tags.propertyName, color: "var(--syntax-operator)" },
]);

export const visionataSyntaxHighlighting = syntaxHighlighting(
  visionataHighlightStyle,
);
