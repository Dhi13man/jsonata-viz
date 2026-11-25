/**
 * Execution profiling per AST node — Phase 3.4.
 * Evaluates each sub-expression independently and measures timing.
 * Results are stored as a map of nodeId -> timing.
 */

import { useState, useCallback } from "react";
import { useFlowStore } from "@/stores/flow-store";
import { useEditorStore } from "@/stores/editor-store";
import { evaluate } from "@/lib/worker/eval-bridge";
import { serialize } from "@/lib/jsonata/serializer";
import type { ExprNode } from "@/lib/jsonata/types";

export interface ProfilingResult {
  /** Map of node ID -> evaluation time in ms */
  timings: Map<string, number>;
  /** Maximum timing for normalization */
  maxTime: number;
  /** Whether profiling is in progress */
  isRunning: boolean;
}

export function useProfiling() {
  const [result, setResult] = useState<ProfilingResult>({
    timings: new Map(),
    maxTime: 0,
    isRunning: false,
  });

  const runProfiling = useCallback(async () => {
    setResult((prev) => ({ ...prev, isRunning: true }));

    const nodes = useFlowStore.getState().nodes;
    const inputJson = useEditorStore.getState().inputJson;
    const timings = new Map<string, number>();
    let maxTime = 0;

    for (const node of nodes) {
      const astNode = node.data.astNode as ExprNode | undefined;
      if (!astNode) continue;

      try {
        const subExpr = serialize(astNode);
        const response = await evaluate(subExpr, inputJson, 2000);
        const timing = response.timing;
        timings.set(node.id, timing);
        maxTime = Math.max(maxTime, timing);
      } catch {
        timings.set(node.id, 0);
      }
    }

    setResult({ timings, maxTime, isRunning: false });
  }, []);

  const clearProfiling = useCallback(() => {
    setResult({ timings: new Map(), maxTime: 0, isRunning: false });
  }, []);

  return { profiling: result, runProfiling, clearProfiling };
}

/**
 * Get heatmap color for a timing value relative to max.
 * Green (fast) -> Yellow (moderate) -> Red (slow)
 */
export function getHeatmapColor(timing: number, maxTime: number): string {
  if (maxTime === 0) return "transparent";
  const ratio = Math.min(timing / maxTime, 1);
  if (ratio < 0.33) return `rgba(63, 185, 80, ${0.1 + ratio * 0.6})`;
  if (ratio < 0.66) return `rgba(210, 153, 34, ${0.1 + ratio * 0.6})`;
  return `rgba(248, 81, 73, ${0.1 + ratio * 0.6})`;
}
