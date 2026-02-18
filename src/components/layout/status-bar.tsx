import { useEditorStore } from "@/stores/editor-store";
import { useFlowStore } from "@/stores/flow-store";
import { Shield } from "lucide-react";

export function StatusBar() {
  const parseError = useEditorStore((s) => s.parseError);
  const evalTiming = useEditorStore((s) => s.evalTiming);
  const isEvaluating = useEditorStore((s) => s.isEvaluating);
  const nodeCount = useFlowStore((s) => s.nodes.length);

  return (
    <footer
      className="flex h-7 shrink-0 items-center justify-between border-t px-3 text-[11px]"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
        color: "var(--text-tertiary)",
      }}
    >
      {/* Left: client-side indicator */}
      <div className="flex items-center gap-3">
        <span
          className="flex items-center gap-1"
          style={{ color: "var(--color-success)" }}
        >
          <Shield size={12} />
          Client-side only
        </span>
        <span>
          {nodeCount} node{nodeCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Right: status info */}
      <div className="flex items-center gap-3">
        {parseError && (
          <span style={{ color: "var(--color-error)" }}>
            Parse error: {parseError.code}
          </span>
        )}
        {isEvaluating ? (
          <span>Evaluating...</span>
        ) : evalTiming > 0 ? (
          <span>Eval: {evalTiming.toFixed(0)}ms</span>
        ) : null}
      </div>
    </footer>
  );
}
