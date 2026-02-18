/**
 * Bottom panel: three-column evaluation view.
 * JSON Input (editable) | Expression (synced) | JSON Output (read-only)
 */

import { useCallback, useRef, useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { claimOrigin } from "@/stores/sync-coordinator";

export function BottomPanel() {
  const expression = useEditorStore((s) => s.expression);
  const inputJson = useEditorStore((s) => s.inputJson);
  const evalResult = useEditorStore((s) => s.evalResult);
  const evalError = useEditorStore((s) => s.evalError);
  const parseError = useEditorStore((s) => s.parseError);
  const setExpression = useEditorStore((s) => s.setExpression);
  const setInputJson = useEditorStore((s) => s.setInputJson);

  const exprRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync textarea value when expression changes from external source
  useEffect(() => {
    if (exprRef.current && exprRef.current.value !== expression) {
      exprRef.current.value = expression;
    }
  }, [expression]);

  const handleExpressionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      claimOrigin("text");
      setExpression(e.target.value);
    },
    [setExpression],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputJson(e.target.value);
    },
    [setInputJson],
  );

  const formattedOutput = formatOutput(evalResult, evalError, parseError);

  return (
    <div
      className="grid h-full grid-cols-3 gap-px"
      style={{ backgroundColor: "var(--border-default)" }}
    >
      {/* JSON Input */}
      <PanelColumn label="JSON Input">
        <textarea
          ref={inputRef}
          className="h-full w-full resize-none border-none p-3 font-mono text-[13px] outline-none"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
          value={inputJson}
          onChange={handleInputChange}
          spellCheck={false}
          aria-label="JSON Input"
        />
      </PanelColumn>

      {/* Expression */}
      <PanelColumn label="Expression">
        <textarea
          ref={exprRef}
          className="h-full w-full resize-none border-none p-3 font-mono text-[13px] outline-none"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
          defaultValue={expression}
          onChange={handleExpressionChange}
          spellCheck={false}
          aria-label="JSONata Expression"
        />
      </PanelColumn>

      {/* Output */}
      <PanelColumn label="Output">
        <pre
          className="h-full w-full overflow-auto p-3 font-mono text-[13px]"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: formattedOutput.isError
              ? "var(--color-error)"
              : "var(--text-primary)",
          }}
          aria-label="Evaluation Output"
          aria-live="polite"
        >
          {formattedOutput.text}
        </pre>
      </PanelColumn>
    </div>
  );
}

function PanelColumn({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col"
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      <div
        className="shrink-0 border-b px-3 py-1.5 text-[11px] font-medium"
        style={{
          borderColor: "var(--border-default)",
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function formatOutput(
  result: unknown,
  evalError: { code: string; message: string } | null,
  parseError: { code: string; message: string } | null,
): { text: string; isError: boolean } {
  if (parseError) {
    return {
      text: `Parse Error [${parseError.code}]: ${parseError.message}`,
      isError: true,
    };
  }
  if (evalError) {
    return {
      text: `Eval Error [${evalError.code}]: ${evalError.message}`,
      isError: true,
    };
  }
  if (result === undefined) {
    return { text: "No result", isError: false };
  }
  try {
    return { text: JSON.stringify(result, null, 2), isError: false };
  } catch {
    return { text: String(result), isError: false };
  }
}
