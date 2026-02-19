/**
 * Keyboard navigation between canvas nodes — Phase 3.5.
 * Tab/Shift+Tab cycles through nodes; Enter inspects selected node.
 * Only active when canvas has focus (not editors).
 */

import { useEffect, useCallback } from "react";
import { useFlowStore } from "@/stores/flow-store";

export function useNodeKeyboardNav() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle Tab/Enter when not in input fields
    const active = document.activeElement;
    if (
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLInputElement ||
      active?.closest(".cm-editor")
    ) {
      return;
    }

    const { nodes, selectedNodeId, setSelectedNodeId } =
      useFlowStore.getState();
    if (nodes.length === 0) return;

    if (e.key === "Tab") {
      e.preventDefault();
      const currentIdx = selectedNodeId
        ? nodes.findIndex((n) => n.id === selectedNodeId)
        : -1;

      let nextIdx: number;
      if (e.shiftKey) {
        // Shift+Tab: previous node
        nextIdx = currentIdx <= 0 ? nodes.length - 1 : currentIdx - 1;
      } else {
        // Tab: next node
        nextIdx = currentIdx >= nodes.length - 1 ? 0 : currentIdx + 1;
      }

      setSelectedNodeId(nodes[nextIdx]!.id);
    }

    if (e.key === "Escape" && selectedNodeId) {
      e.preventDefault();
      setSelectedNodeId(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
