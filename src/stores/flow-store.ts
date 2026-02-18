/**
 * FlowStore — React Flow state (nodes, edges, viewport).
 * Derived from AST. Only viewport and manual positions are persisted.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Viewport,
} from "@xyflow/react";
import type { AstFlowNode, AstFlowEdge } from "@/lib/mapper/ast-to-flow";

interface FlowState {
  nodes: AstFlowNode[];
  edges: AstFlowEdge[];
  viewport: Viewport;
  /** Track which nodes the user has manually repositioned */
  manualPositions: Record<string, { x: number; y: number }>;
  /** Currently selected node ID */
  selectedNodeId: string | null;
}

interface FlowActions {
  setGraph: (nodes: AstFlowNode[], edges: AstFlowEdge[]) => void;
  onNodesChange: (changes: NodeChange<AstFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<AstFlowEdge>[]) => void;
  setViewport: (viewport: Viewport) => void;
  setSelectedNodeId: (id: string | null) => void;
}

export const useFlowStore = create<FlowState & FlowActions>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      manualPositions: {},
      selectedNodeId: null,

      setGraph: (nodes, edges) => {
        // Apply persisted manual positions to nodes
        const positions = get().manualPositions;
        const adjusted = nodes.map((n) => {
          const manual = positions[n.id];
          if (manual) {
            return { ...n, position: manual };
          }
          return n;
        });
        set({ nodes: adjusted, edges });
      },

      onNodesChange: (changes) => {
        set((state) => {
          const updated = applyNodeChanges(changes, state.nodes);

          // Track manual position changes
          const newPositions = { ...state.manualPositions };
          for (const change of changes) {
            if (
              change.type === "position" &&
              change.position &&
              change.dragging === false
            ) {
              newPositions[change.id] = change.position;
            }
          }

          // Track selection
          let selectedNodeId = state.selectedNodeId;
          for (const change of changes) {
            if (change.type === "select") {
              selectedNodeId = change.selected ? change.id : null;
            }
          }

          return {
            nodes: updated,
            manualPositions: newPositions,
            selectedNodeId,
          };
        });
      },

      onEdgesChange: (changes) => {
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        }));
      },

      setViewport: (viewport) => set({ viewport }),
      setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
    }),
    {
      name: "visionata-flow",
      version: 1,
      partialize: (state) => ({
        viewport: state.viewport,
        manualPositions: state.manualPositions,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<FlowState> | undefined;
        const vp = p?.viewport;
        const validViewport =
          vp &&
          typeof vp.x === "number" &&
          typeof vp.y === "number" &&
          typeof vp.zoom === "number"
            ? vp
            : current.viewport;
        const mp = p?.manualPositions;
        const validPositions =
          mp && typeof mp === "object" && !Array.isArray(mp)
            ? mp
            : current.manualPositions;
        return {
          ...current,
          viewport: validViewport,
          manualPositions: validPositions,
        };
      },
    },
  ),
);
