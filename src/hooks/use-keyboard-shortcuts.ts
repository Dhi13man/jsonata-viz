/**
 * Global keyboard shortcuts — Phase 2.14.
 * Handles: Cmd/Ctrl+K (command palette), Cmd/Ctrl+Z/Y (undo/redo),
 * Cmd/Ctrl+1/2/3 (layout presets), Cmd/Ctrl+S (share).
 */

import { useEffect, useCallback } from "react";
import { useFlowStore } from "@/stores/flow-store";
import { useUIStore } from "@/stores/ui-store";

interface ShortcutHandlers {
  onToggleCommandPalette: () => void;
  onShare: () => void;
}

export function useKeyboardShortcuts({
  onToggleCommandPalette,
  onShare,
}: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K: Command palette
      if (mod && e.key === "k") {
        e.preventDefault();
        onToggleCommandPalette();
        return;
      }

      // Cmd/Ctrl+Z: Undo
      if (mod && e.key === "z" && !e.shiftKey) {
        // Only intercept if not focused on a text input
        const active = document.activeElement;
        if (
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLInputElement ||
          active?.closest(".cm-editor")
        ) {
          return; // let the editor handle it
        }
        e.preventDefault();
        useFlowStore.temporal.getState().undo();
        return;
      }

      // Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: Redo
      if (mod && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        const active = document.activeElement;
        if (
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLInputElement ||
          active?.closest(".cm-editor")
        ) {
          return;
        }
        e.preventDefault();
        useFlowStore.temporal.getState().redo();
        return;
      }

      // Cmd/Ctrl+S: Share (prevent browser save)
      if (mod && e.key === "s") {
        e.preventDefault();
        onShare();
        return;
      }

      // Layout presets: Alt+1/2/3 (avoids browser tab switching)
      if (e.altKey && !mod) {
        const setLayout = useUIStore.getState().setLayoutPreset;
        if (e.key === "1") {
          e.preventDefault();
          setLayout("graph");
        } else if (e.key === "2") {
          e.preventDefault();
          setLayout("text");
        } else if (e.key === "3") {
          e.preventDefault();
          setLayout("split");
        }
      }
    },
    [onToggleCommandPalette, onShare],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
