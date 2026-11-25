import { useMemo } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useFlowStore } from "@/stores/flow-store";
import { Shield, Gauge } from "lucide-react";
import { calculateComplexity } from "@/lib/utils/complexity";

export function StatusBar() {
  const ast = useEditorStore((s) => s.ast);
  const parseError = useEditorStore((s) => s.parseError);
  const evalTiming = useEditorStore((s) => s.evalTiming);
  const isEvaluating = useEditorStore((s) => s.isEvaluating);
  const nodeCount = useFlowStore((s) => s.nodes.length);

  const complexity = useMemo(() => calculateComplexity(ast), [ast]);

  const complexityColor =
    complexity.label === "Simple"
      ? "var(--color-success)"
      : complexity.label === "Moderate"
        ? "var(--color-warning)"
        : "var(--color-error)";

  return (
    <footer
      className="flex h-7 shrink-0 items-center justify-between border-t px-3 text-[11px]"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
        color: "var(--text-tertiary)",
      }}
    >
      {/* Left: client-side indicator + node count + complexity */}
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
        {complexity.score > 0 && (
          <span
            className="flex items-center gap-1"
            style={{ color: complexityColor }}
            title={`Score: ${complexity.score} | Depth: ${complexity.maxDepth} | Lambdas: ${complexity.lambdaCount} | Binds: ${complexity.bindCount}`}
          >
            <Gauge size={12} />
            {complexity.label}
          </span>
        )}
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
