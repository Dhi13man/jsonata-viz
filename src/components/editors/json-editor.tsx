/**
 * CodeMirror JSON editor with syntax highlighting and validation.
 * Phase 1.2: Replaces the plain textarea for JSON input.
 */

import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import {
  visionataEditorTheme,
  visionataSyntaxHighlighting,
} from "@/lib/codemirror/dark-theme";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function JsonEditor({ value, onChange, ariaLabel }: JsonEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  const extensions = useMemo(
    () => [
      json(),
      visionataSyntaxHighlighting,
      keymap.of(defaultKeymap),
      EditorView.contentAttributes.of({
        "aria-label": ariaLabel ?? "JSON Editor",
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
        foldGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
        highlightActiveLine: false,
      }}
      style={{ height: "100%", overflow: "auto" }}
    />
  );
}
