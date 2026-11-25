/**
 * CodeMirror expression editor with JSONata syntax highlighting.
 * Phase 1.5: Replaces the plain textarea for expression editing.
 */

import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { jsonataLanguage } from "@/lib/codemirror/jsonata-language";
import {
  visionataEditorTheme,
  visionataSyntaxHighlighting,
} from "@/lib/codemirror/dark-theme";

interface ExpressionEditorProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function ExpressionEditor({
  value,
  onChange,
  ariaLabel,
}: ExpressionEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  const extensions = useMemo(
    () => [
      jsonataLanguage,
      visionataSyntaxHighlighting,
      keymap.of(defaultKeymap),
      EditorView.contentAttributes.of({
        "aria-label": ariaLabel ?? "JSONata Expression",
      }),
    ],
    [ariaLabel],
  );

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      theme={visionataEditorTheme}
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
        highlightActiveLine: false,
      }}
      style={{ height: "100%", overflow: "auto" }}
    />
  );
}
