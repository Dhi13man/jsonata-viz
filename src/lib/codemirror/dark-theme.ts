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
  { tag: tags.keyword, color: "#ff7b72" },
  { tag: tags.operator, color: "#79c0ff" },
  { tag: tags.variableName, color: "#e6edf3" },
  { tag: tags.special(tags.variableName), color: "#d2a8ff" },
  { tag: tags.string, color: "#a5d6ff" },
  { tag: tags.number, color: "#79c0ff" },
  { tag: tags.bool, color: "#ff7b72" },
  { tag: tags.null, color: "#ff7b72" },
  { tag: tags.regexp, color: "#7ee787" },
  { tag: tags.punctuation, color: "#8b949e" },
  { tag: tags.bracket, color: "#8b949e" },
  { tag: tags.propertyName, color: "#79c0ff" },
]);

export const visionataSyntaxHighlighting =
  syntaxHighlighting(visionataHighlightStyle);
