/**
 * Main workspace layout — Phase 1-3 integration.
 *
 * Three-column layout with sidebars, command palette, onboarding overlay,
 * keyboard shortcuts, and sub-expression evaluation.
 *
 * Layout presets:
 * - "graph": Canvas prominent, bottom panel collapsed
 * - "text": Bottom panel prominent, canvas collapsed
 * - "split": Equal split (default)
 */

import { useState, useCallback, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Toolbar } from "./toolbar";
import { StatusBar } from "./status-bar";
import { BottomPanel } from "./bottom-panel";
import { Canvas } from "@/components/canvas/canvas";
import { NodePalette } from "./node-palette";
import { PropertiesPanel } from "./properties-panel";
import { CommandPalette } from "./command-palette";
import { OnboardingOverlay } from "./onboarding-overlay";
import { TestSuitePanel } from "./test-suite-panel";
import { ExpressionDiff } from "./expression-diff";
import { HistoryPanel } from "./history-panel";
import { useExpressionSync } from "@/hooks/use-expression-sync";
import { useUrlSharing } from "@/hooks/use-url-sharing";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useSubExpressionEval } from "@/hooks/use-sub-expression-eval";
import { useAutoTestRunner } from "@/hooks/use-auto-test-runner";
import { useNodeKeyboardNav } from "@/hooks/use-node-keyboard-nav";
import { useProfiling } from "@/hooks/use-profiling";
import { useUIStore } from "@/stores/ui-store";
import { useFlowStore } from "@/stores/flow-store";
import { useEditorStore } from "@/stores/editor-store";
import { encodeShareUrl } from "@/lib/utils/lz-url";
import { TEMPLATES } from "@/lib/templates";
import { claimOrigin } from "@/stores/sync-coordinator";
import { exportFile, importFile } from "@/lib/utils/file-io";
import { extractFromNodeRed } from "@/lib/utils/nodered-import";
import { useTestSuiteStore } from "@/stores/test-suite-store";
import type { CommandItem } from "./command-palette";

export type BottomTab = "editors" | "tests" | "diff" | "history";

export function Workspace() {
  // Core pipelines
  useExpressionSync();
  useUrlSharing();
  useSubExpressionEval();
  useAutoTestRunner();
  useNodeKeyboardNav();
  const { profiling, runProfiling, clearProfiling } = useProfiling();

  // UI state
  const layoutPreset = useUIStore((s) => s.layoutPreset);
  const leftSidebarVisible = useUIStore((s) => s.leftSidebarVisible);
  const rightSidebarVisible = useUIStore((s) => s.rightSidebarVisible);
  const bottomPanelVisible = useUIStore((s) => s.bottomPanelVisible);

  // Command palette
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Bottom panel tab
  const [bottomTab, setBottomTab] = useState<BottomTab>("editors");

  const toggleCommandPalette = useCallback(
    () => setCommandPaletteOpen((v) => !v),
    [],
  );

  const handleShare = useCallback(() => {
    const { expression, inputJson } = useEditorStore.getState();
    const { testCases } = useTestSuiteStore.getState();
    const tests =
      testCases.length > 0 ? JSON.stringify(testCases) : undefined;
    const url = encodeShareUrl({ expression, input: inputJson, tests });
    if (!url) return;
    navigator.clipboard.writeText(url).catch(() => {
      window.prompt("Copy this URL:", url);
    });
  }, []);

  useKeyboardShortcuts({
    onToggleCommandPalette: toggleCommandPalette,
    onShare: handleShare,
  });

  // Insert expression from palette or template
  const handleInsertExpression = useCallback((expr: string) => {
    claimOrigin("text");
    useEditorStore.getState().setExpression(expr);
  }, []);

  // Build command list
  const commands: CommandItem[] = useMemo(
    () => [
      ...TEMPLATES.map((t) => ({
        id: `template:${t.id}`,
        label: t.name,
        description: t.description,
        action: () => {
          claimOrigin("text");
          useEditorStore.getState().setExpression(t.expression);
          useEditorStore.getState().setInputJson(t.sampleInput);
        },
      })),
      {
        id: "action:undo",
        label: "Undo",
        description: "Undo last graph change",
        shortcut: "Ctrl+Z",
        action: () => useFlowStore.temporal.getState().undo(),
      },
      {
        id: "action:redo",
        label: "Redo",
        description: "Redo last graph change",
        shortcut: "Ctrl+Shift+Z",
        action: () => useFlowStore.temporal.getState().redo(),
      },
      {
        id: "action:share",
        label: "Share",
        description: "Copy shareable URL to clipboard",
        shortcut: "Ctrl+S",
        action: handleShare,
      },
      {
        id: "action:toggle-left",
        label: "Toggle Palette",
        description: "Show/hide node palette sidebar",
        action: () => useUIStore.getState().toggleLeftSidebar(),
      },
      {
        id: "action:toggle-right",
        label: "Toggle Properties",
        description: "Show/hide properties panel",
        action: () => useUIStore.getState().toggleRightSidebar(),
      },
      {
        id: "action:export",
        label: "Export File",
        description: "Export expression + tests as .visionata.json",
        action: () => {
          const { expression, inputJson } = useEditorStore.getState();
          const { testCases } = useTestSuiteStore.getState();
          exportFile({
            version: 1,
            expression,
            inputJson,
            testCases: testCases.length > 0 ? testCases : undefined,
          });
        },
      },
      {
        id: "action:import",
        label: "Import File",
        description: "Import a .jsonata or .visionata.json file",
        action: async () => {
          const data = await importFile();
          if (data) {
            claimOrigin("text");
            useEditorStore.getState().setExpression(data.expression);
            useEditorStore.getState().setInputJson(data.inputJson);
            if (data.testCases) {
              useTestSuiteStore.getState().importTestCases(data.testCases);
            }
          }
        },
      },
      {
        id: "layout:graph",
        label: "Graph Layout",
        description: "Canvas-focused layout",
        shortcut: "Alt+1",
        action: () => useUIStore.getState().setLayoutPreset("graph"),
      },
      {
        id: "layout:text",
        label: "Text Layout",
        description: "Editor-focused layout",
        shortcut: "Alt+2",
        action: () => useUIStore.getState().setLayoutPreset("text"),
      },
      {
        id: "layout:split",
        label: "Split Layout",
        description: "Equal canvas and editor",
        shortcut: "Alt+3",
        action: () => useUIStore.getState().setLayoutPreset("split"),
      },
      {
        id: "view:diff",
        label: "Expression Diff",
        description: "Compare two expressions side by side",
        action: () => setBottomTab("diff"),
      },
      {
        id: "view:history",
        label: "Undo History",
        description: "View undo/redo timeline",
        action: () => setBottomTab("history"),
      },
      {
        id: "action:profile",
        label: "Run Profiling",
        description: "Measure execution time per node (heatmap overlay)",
        action: runProfiling,
      },
      {
        id: "action:clear-profile",
        label: "Clear Profiling",
        description: "Remove heatmap overlay",
        action: clearProfiling,
      },
      {
        id: "action:nodered-import",
        label: "Import Node-RED Flow",
        description: "Extract JSONata expressions from a Node-RED flow",
        action: async () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const text = await file.text();
            const exprs = extractFromNodeRed(text);
            if (exprs.length > 0 && exprs[0]) {
              claimOrigin("text");
              useEditorStore.getState().setExpression(exprs[0].expression);
            }
          };
          input.click();
        },
      },
    ],
    [handleShare, runProfiling, clearProfiling],
  );

  // Layout sizes based on preset
  const canvasSize =
    layoutPreset === "graph" ? 80 : layoutPreset === "text" ? 20 : 55;
  const bottomSize =
    layoutPreset === "graph" ? 20 : layoutPreset === "text" ? 80 : 45;

  const bottomContent = {
    editors: <BottomPanel />,
    tests: <TestSuitePanel />,
    diff: <ExpressionDiff />,
    history: <HistoryPanel />,
  }[bottomTab];

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        onToggleCommandPalette={toggleCommandPalette}
        onToggleLeftSidebar={() =>
          useUIStore.getState().toggleLeftSidebar()
        }
        onToggleRightSidebar={() =>
          useUIStore.getState().toggleRightSidebar()
        }
        bottomTab={bottomTab}
        onBottomTabChange={setBottomTab}
      />

      <div className="flex min-h-0 flex-1">
        {/* Left sidebar: Node palette */}
        {leftSidebarVisible && (
          <div
            className="w-56 shrink-0 overflow-y-auto border-r"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <NodePalette onInsertExpression={handleInsertExpression} />
          </div>
        )}

        {/* Main content area */}
        <PanelGroup direction="vertical" className="min-w-0 flex-1">
          <Panel defaultSize={canvasSize} minSize={10}>
            <Canvas profiling={profiling} />
          </Panel>

          <PanelResizeHandle
            className="flex h-1.5 items-center justify-center"
            style={{ backgroundColor: "var(--border-default)" }}
          >
            <div
              className="h-0.5 w-8 rounded-full"
              style={{ backgroundColor: "var(--text-tertiary)" }}
            />
          </PanelResizeHandle>

          {bottomPanelVisible && (
            <Panel defaultSize={bottomSize} minSize={10} maxSize={85}>
              {bottomContent}
            </Panel>
          )}
        </PanelGroup>

        {/* Right sidebar: Properties */}
        {rightSidebarVisible && (
          <div
            className="w-64 shrink-0 overflow-y-auto border-l"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <PropertiesPanel />
          </div>
        )}
      </div>

      <StatusBar />

      {/* Floating overlays */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
      />
      <OnboardingOverlay />
    </div>
  );
}
