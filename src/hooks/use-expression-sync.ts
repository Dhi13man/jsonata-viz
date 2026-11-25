/**
 * Hook that orchestrates the expression -> parse -> map -> evaluate pipeline.
 *
 * Watches EditorStore.expression and EditorStore.inputJson.
 * On change:
 *   1. Parse expression -> AST
 *   2. Map AST -> React Flow nodes/edges
 *   3. Evaluate expression in Web Worker
 *
 * Uses SyncCoordinator to prevent echo loops.
 */

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useFlowStore } from "@/stores/flow-store";
import { parseExpression } from "@/lib/jsonata/parser";
import { mapAstToFlow } from "@/lib/mapper/ast-to-flow";
import { evaluate } from "@/lib/worker/eval-bridge";
import { createAdaptiveDebounce } from "@/lib/utils/debounce";
import { shouldSuppress } from "@/stores/sync-coordinator";

export function useExpressionSync() {
  useEffect(() => {
    const debouncer = createAdaptiveDebounce(
      () => {
        const {
          expression,
          inputJson,
          setAst,
          setEvalResult,
          setIsEvaluating,
        } = useEditorStore.getState();

        // Guard against echo from graph edits
        if (shouldSuppress("text")) return;

        // Step 1: Parse
        const { ast, error: parseError } = parseExpression(expression);
        setAst(ast, parseError);

        // Step 2: Map AST to flow graph
        if (ast) {
          const { nodes, edges } = mapAstToFlow(ast);
          useFlowStore.getState().setGraph(nodes, edges);
        } else {
          useFlowStore.getState().setGraph([], []);
        }

        // Step 3: Evaluate (async, in Web Worker)
        if (ast && expression.trim()) {
          setIsEvaluating(true);
          evaluate(expression, inputJson).then((response) => {
            debouncer.updateTiming(response.timing);
            setEvalResult(
              response.result,
              response.error
                ? {
                    code: response.error.code,
                    message: response.error.message,
                    position: response.error.position,
                    token: response.error.token,
                  }
                : null,
              response.timing,
            );
          });
        } else {
          setEvalResult(undefined, null, 0);
        }
      },
      100,
      1.5,
    );

    // Subscribe to expression and input changes
    const unsubExpr = useEditorStore.subscribe(
      (state) => state.expression,
      () => debouncer.call(),
      { fireImmediately: true },
    );

    const unsubInput = useEditorStore.subscribe(
      (state) => state.inputJson,
      () => debouncer.call(),
    );

    return () => {
      unsubExpr();
      unsubInput();
      debouncer.cancel();
    };
  }, []);
}
