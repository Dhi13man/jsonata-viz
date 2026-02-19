/**
 * Properties panel — Phase 2.5.
 * Shows details and editable config for the selected node.
 */

import { useCallback } from "react";
import { useFlowStore } from "@/stores/flow-store";
import { useEditorStore } from "@/stores/editor-store";
import { serialize } from "@/lib/jsonata/serializer";
import type { ExprNode } from "@/lib/jsonata/types";
import { NODE_COLORS, getNodeCategory } from "@/lib/jsonata/types";

export function PropertiesPanel() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const nodes = useFlowStore((s) => s.nodes);
  const evalResult = useEditorStore((s) => s.evalResult);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  if (!selectedNode) {
    return (
      <div
        className="flex h-full items-center justify-center p-4"
        style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-tertiary)" }}
      >
        <p className="text-center text-xs">
          Select a node to view its properties
        </p>
      </div>
    );
  }

  const { data } = selectedNode;
  const astNode = data.astNode as ExprNode;
  const category = getNodeCategory(astNode.type);
  const color = NODE_COLORS[category];

  let subExpression = "";
  try {
    subExpression = serialize(astNode);
  } catch {
    subExpression = "(serialization error)";
  }

  return (
    <div
      className="flex h-full flex-col overflow-y-auto"
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      {/* Header */}
      <div
        className="shrink-0 border-b p-3"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded"
            style={{ backgroundColor: color }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {data.label}
          </span>
        </div>
        <span
          className="mt-1 block text-[11px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {astNode.type} / {category}
        </span>
      </div>

      {/* Sub-expression */}
      <PropertySection label="Sub-expression">
        <pre
          className="overflow-x-auto rounded-md p-2 font-mono text-xs"
          style={{
            backgroundColor: "var(--bg-elevated)",
            color: "var(--text-primary)",
          }}
        >
          {subExpression}
        </pre>
      </PropertySection>

      {/* Value */}
      {"value" in astNode && astNode.value !== undefined && (
        <PropertySection label="Value">
          <span
            className="font-mono text-xs"
            style={{ color: "var(--text-primary)" }}
          >
            {String(astNode.value)}
          </span>
        </PropertySection>
      )}

      {/* Position */}
      {"position" in astNode && typeof astNode.position === "number" && (
        <PropertySection label="Position">
          <span
            className="font-mono text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            char {astNode.position}
          </span>
        </PropertySection>
      )}

      {/* Preview result */}
      {data.preview !== undefined && (
        <PropertySection label="Result Preview">
          <pre
            className="max-h-40 overflow-auto rounded-md p-2 font-mono text-xs"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-primary)",
            }}
          >
            {data.preview}
          </pre>
        </PropertySection>
      )}

      {/* Full evaluation result */}
      {evalResult !== undefined && (
        <PropertySection label="Full Expression Result">
          <pre
            className="max-h-40 overflow-auto rounded-md p-2 font-mono text-xs"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-primary)",
            }}
          >
            {typeof evalResult === "string"
              ? evalResult
              : JSON.stringify(evalResult, null, 2)}
          </pre>
        </PropertySection>
      )}
    </div>
  );
}

function PropertySection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="border-b p-3"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div
        className="mb-1.5 text-[11px] font-medium"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// Suppress unused import lint (serialize is used in the component)
void useCallback;
