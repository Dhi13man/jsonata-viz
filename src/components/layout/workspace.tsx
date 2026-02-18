/**
 * Main workspace layout.
 *
 * Phase 0.5: Simplified layout
 * - Toolbar (top)
 * - Canvas (main area)
 * - Bottom panel (JSON input | expression | output)
 * - Status bar (bottom)
 *
 * Left/right sidebars deferred to Phase 1/2.
 */

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Toolbar } from "./toolbar";
import { StatusBar } from "./status-bar";
import { BottomPanel } from "./bottom-panel";
import { Canvas } from "@/components/canvas/canvas";
import { useExpressionSync } from "@/hooks/use-expression-sync";
import { useUrlSharing } from "@/hooks/use-url-sharing";

export function Workspace() {
  // Initialize the expression -> parse -> map -> eval pipeline
  useExpressionSync();
  // Load shared expression from URL on mount
  useUrlSharing();

  return (
    <div className="flex h-screen flex-col">
      <Toolbar />

      <PanelGroup direction="vertical" className="flex-1">
        {/* Main canvas */}
        <Panel defaultSize={65} minSize={30}>
          <Canvas />
        </Panel>

        {/* Resize handle */}
        <PanelResizeHandle
          className="flex h-1.5 items-center justify-center"
          style={{ backgroundColor: "var(--border-default)" }}
        >
          <div
            className="h-0.5 w-8 rounded-full"
            style={{ backgroundColor: "var(--text-tertiary)" }}
          />
        </PanelResizeHandle>

        {/* Bottom evaluation panel */}
        <Panel defaultSize={35} minSize={15} maxSize={60}>
          <BottomPanel />
        </Panel>
      </PanelGroup>

      <StatusBar />
    </div>
  );
}
