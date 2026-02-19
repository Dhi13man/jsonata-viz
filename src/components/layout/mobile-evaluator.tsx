/**
 * Mobile-only evaluator — Phase 1.13.
 * Shown below 768px. Text expression + input + output only.
 * Links to desktop for full visual editor.
 */

import { useCallback } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { claimOrigin } from "@/stores/sync-coordinator";
import { Monitor } from "lucide-react";

export function MobileEvaluator() {
  const expression = useEditorStore((s) => s.expression);
  const inputJson = useEditorStore((s) => s.inputJson);
  const evalResult = useEditorStore((s) => s.evalResult);
  const evalError = useEditorStore((s) => s.evalError);
  const parseError = useEditorStore((s) => s.parseError);
  const setExpression = useEditorStore((s) => s.setExpression);
  const setInputJson = useEditorStore((s) => s.setInputJson);

  const handleExprChange = useCallback(
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

  const output = formatOutput(evalResult, evalError, parseError);

  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: "var(--bg-canvas)" }}
    >
      {/* Header */}
      <header
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center gap-2">
          <img src="/visionata.svg" alt="" className="h-5 w-5" width={20} height={20} />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Visionata
          </span>
        </div>
      </header>

      {/* Desktop CTA */}
      <div
        className="flex shrink-0 items-center gap-2 border-b px-4 py-2 text-[11px]"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
          color: "var(--text-secondary)",
        }}
      >
        <Monitor size={14} />
        Open on desktop for the full visual graph editor
      </div>

      {/* Expression */}
      <MobileSection label="Expression">
        <textarea
          value={expression}
          onChange={handleExprChange}
          className="h-24 w-full resize-none border-none p-3 font-mono text-xs outline-none"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
          spellCheck={false}
          aria-label="JSONata Expression"
        />
      </MobileSection>

      {/* JSON Input */}
      <MobileSection label="JSON Input">
        <textarea
          value={inputJson}
          onChange={handleInputChange}
          className="h-32 w-full resize-none border-none p-3 font-mono text-xs outline-none"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
          spellCheck={false}
          aria-label="JSON Input"
        />
      </MobileSection>

      {/* Output */}
      <MobileSection label="Output" grow>
        <pre
          className="h-full w-full overflow-auto p-3 font-mono text-xs"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: output.isError ? "var(--color-error)" : "var(--text-primary)",
          }}
          aria-label="Evaluation Output"
          aria-live="polite"
        >
          {output.text}
        </pre>
      </MobileSection>
    </div>
  );
}

function MobileSection({
  label,
  children,
  grow,
}: {
  label: string;
  children: React.ReactNode;
  grow?: boolean;
}) {
  return (
    <div
      className={`flex flex-col border-b ${grow ? "min-h-0 flex-1" : ""}`}
      style={{ borderColor: "var(--border-default)" }}
    >
      <div
        className="shrink-0 px-4 py-1.5 text-[11px] font-medium"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </div>
      <div className={grow ? "min-h-0 flex-1" : ""}>{children}</div>
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
