/**
 * Sub-expression evaluation — Phase 1.4 / 1.7.
 * Evaluates sub-expressions lazily on node selection/hover.
 * Results are cached in an LRU cache.
 */

import { useEffect, useRef } from "react";
import { useFlowStore } from "@/stores/flow-store";
import { useEditorStore } from "@/stores/editor-store";
import { evaluate } from "@/lib/worker/eval-bridge";
import { serialize } from "@/lib/jsonata/serializer";
import { LRUCache } from "@/lib/utils/lru-cache";
import type { ExprNode } from "@/lib/jsonata/types";

const previewCache = new LRUCache<string, string>(100);

/**
 * Watch selectedNodeId. When a node is selected, evaluate its
 * sub-expression and update the node's preview data.
 */
export function useSubExpressionEval() {
  const prevNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = useFlowStore.subscribe((state) => {
      const nodeId = state.selectedNodeId;
      if (!nodeId || nodeId === prevNodeIdRef.current) return;
      prevNodeIdRef.current = nodeId;

        const node = useFlowStore
          .getState()
          .nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const astNode = node.data.astNode as ExprNode;
        let subExpr: string;
        try {
          subExpr = serialize(astNode);
        } catch {
          return;
        }

        const inputJson = useEditorStore.getState().inputJson;
        const cacheKey = `${subExpr}::${inputJson}`;

        // Check cache first
        const cached = previewCache.get(cacheKey);
        if (cached !== undefined) {
          updateNodePreview(nodeId, cached);
          return;
        }

        // Evaluate in worker
        evaluate(subExpr, inputJson, 3000).then((response) => {
          let preview: string;
          if (response.error) {
            preview = `Error: ${response.error.message}`;
          } else {
            try {
              preview =
                response.result === undefined
                  ? "undefined"
                  : JSON.stringify(response.result, null, 2);
            } catch {
              preview = String(response.result);
            }
          }
          // Truncate for display
          if (preview.length > 200) {
            preview = preview.slice(0, 197) + "...";
          }
          previewCache.set(cacheKey, preview);
          updateNodePreview(nodeId, preview);
        });
    });

    return unsub;
  }, []);
}

function updateNodePreview(nodeId: string, preview: string) {
  const { nodes } = useFlowStore.getState();
  const updated = nodes.map((n) =>
    n.id === nodeId ? { ...n, data: { ...n.data, preview } } : n,
  );
  // Directly set nodes to avoid triggering full reflow
  useFlowStore.setState({ nodes: updated });
}
