/**
 * Undo/redo history panel — Phase 3.6.
 * Shows a chronological list of undo states with "restore" action.
 */

import { useCallback } from "react";
import { useStore } from "zustand";
import { useFlowStore } from "@/stores/flow-store";
import { Clock, RotateCcw } from "lucide-react";

export function HistoryPanel() {
  const pastStates = useStore(useFlowStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useFlowStore.temporal, (s) => s.futureStates);
  const undo = useStore(useFlowStore.temporal, (s) => s.undo);
  const redo = useStore(useFlowStore.temporal, (s) => s.redo);

  const handleUndo = useCallback(
    (steps: number) => {
      for (let i = 0; i < steps; i++) undo();
    },
    [undo],
  );

  const handleRedo = useCallback(
    (steps: number) => {
      for (let i = 0; i < steps; i++) redo();
    },
    [redo],
  );

  const totalEntries = pastStates.length + 1 + futureStates.length;

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      <div
        className="flex shrink-0 items-center gap-2 border-b px-3 py-2"
        style={{
          borderColor: "var(--border-default)",
        }}
      >
        <Clock size={12} style={{ color: "var(--text-tertiary)" }} />
        <span
          className="text-[11px] font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          History ({totalEntries} states)
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pastStates.length === 0 && futureStates.length === 0 && (
          <div
            className="p-4 text-center text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            No history yet. Move nodes to create undo states.
          </div>
        )}

        {/* Future states (redo-able) — shown on top, grayed */}
        {[...futureStates].reverse().map((_state, idx) => (
          <HistoryEntry
            key={`future-${idx}`}
            label={`Redo step ${futureStates.length - idx}`}
            isCurrent={false}
            isFuture
            onClick={() => handleRedo(futureStates.length - idx)}
          />
        ))}

        {/* Current state */}
        <HistoryEntry label="Current state" isCurrent onClick={() => {}} />

        {/* Past states (undo-able) */}
        {[...pastStates].reverse().map((_state, idx) => (
          <HistoryEntry
            key={`past-${idx}`}
            label={`Step ${pastStates.length - idx}`}
            isCurrent={false}
            onClick={() => handleUndo(idx + 1)}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryEntry({
  label,
  isCurrent,
  isFuture,
  onClick,
}: {
  label: string;
  isCurrent: boolean;
  isFuture?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isCurrent}
      className="flex w-full items-center gap-2 border-b border-none px-3 py-2 text-left text-[11px] transition-colors hover:bg-[var(--bg-elevated)] disabled:cursor-default"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: isCurrent ? "var(--bg-elevated)" : "transparent",
        color: isFuture
          ? "var(--text-tertiary)"
          : isCurrent
            ? "var(--border-active)"
            : "var(--text-secondary)",
        opacity: isFuture ? 0.6 : 1,
      }}
    >
      <RotateCcw size={10} style={{ opacity: isCurrent ? 0 : 1 }} />
      <span className="flex-1">{label}</span>
      {isCurrent && (
        <span
          className="rounded-full px-1.5 text-[9px]"
          style={{
            backgroundColor: "var(--border-active)",
            color: "white",
          }}
        >
          now
        </span>
      )}
    </button>
  );
}
