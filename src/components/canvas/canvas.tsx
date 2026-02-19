/**
 * Main canvas component wrapping React Flow.
 * Renders the AST graph with custom node components.
 *
 * Phase 1-3: Animated edges, drag-drop from palette, error highlighting, profiling heatmap.
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
import { useEditorStore } from "@/stores/editor-store";
import { AstNode } from "./nodes/ast-node";
import { CanvasErrorBoundary } from "@/components/error-boundary/canvas-error-boundary";
import { claimOrigin } from "@/stores/sync-coordinator";
import { getHeatmapColor, type ProfilingResult } from "@/hooks/use-profiling";

const nodeTypes = {
  astNode: AstNode,
};

interface CanvasProps {
  profiling?: ProfilingResult;
}

export function Canvas({ profiling }: CanvasProps) {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const viewport = useFlowStore((s) => s.viewport);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const setViewport = useFlowStore((s) => s.setViewport);
  const parseError = useEditorStore((s) => s.parseError);

  const onViewportChange = useCallback(
    (vp: Viewport) => setViewport(vp),
    [setViewport],
  );

  // Intentionally capture viewport only on mount for defaultViewport
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultViewport = useMemo(() => viewport, []);

  // Apply profiling heatmap to nodes
  const displayNodes = useMemo(() => {
    if (!profiling || profiling.timings.size === 0) return nodes;
    return nodes.map((n) => {
      const timing = profiling.timings.get(n.id);
      if (timing === undefined) return n;
      return {
        ...n,
        data: {
          ...n.data,
          heatmapColor: getHeatmapColor(timing, profiling.maxTime),
          heatmapTiming: timing,
        },
      };
    });
  }, [nodes, profiling]);

  // Animate all edges for the data-flow pulsing effect
  const animatedEdges = useMemo(
    () => edges.map((e) => ({ ...e, animated: true })),
    [edges],
  );

  // Handle drag-drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const exprTemplate = event.dataTransfer.getData("application/visionata-template");
    if (exprTemplate) {
      claimOrigin("text");
      const { expression, setExpression } = useEditorStore.getState();
      const newExpr = expression ? `${expression} ~> ${exprTemplate}` : exprTemplate;
      setExpression(newExpr);
    }
  }, []);

  return (
    <CanvasErrorBoundary>
      <div
        className="h-full w-full"
        style={{ backgroundColor: "var(--bg-canvas)" }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {parseError && (
          <div
            className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-lg border px-4 py-2 text-xs"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--color-error)",
              color: "var(--color-error)",
            }}
          >
            Parse Error: {parseError.message}
          </div>
        )}
        <ReactFlow
          nodes={displayNodes}
          edges={animatedEdges}
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
