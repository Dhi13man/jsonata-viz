/**
 * Main canvas component wrapping React Flow.
 * Renders the AST graph with custom node components.
 */

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useFlowStore } from "@/stores/flow-store";
import { AstNode } from "./nodes/ast-node";
import { CanvasErrorBoundary } from "@/components/error-boundary/canvas-error-boundary";

const nodeTypes = {
  astNode: AstNode,
};

export function Canvas() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const viewport = useFlowStore((s) => s.viewport);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const setViewport = useFlowStore((s) => s.setViewport);

  const onViewportChange = useCallback(
    (vp: Viewport) => setViewport(vp),
    [setViewport],
  );

  // Intentionally capture viewport only on mount for defaultViewport
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultViewport = useMemo(() => viewport, []);

  return (
    <CanvasErrorBoundary>
      <div
        className="h-full w-full"
        style={{ backgroundColor: "var(--bg-canvas)" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onViewportChange={onViewportChange}
          nodeTypes={nodeTypes}
          defaultViewport={defaultViewport}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
          minZoom={0.1}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--border-default)"
          />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            style={{
              backgroundColor: "var(--bg-surface)",
            }}
          />
        </ReactFlow>
      </div>
    </CanvasErrorBoundary>
  );
}
