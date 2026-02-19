/**
 * Custom React Flow node component for JSONata AST nodes.
 *
 * Visual spec from DESIGN_SYSTEM.md:
 * - Left color border (3px) in category color
 * - Type icon (16x16 Lucide)
 * - Node label (JetBrains Mono 13px)
 * - Inline value preview (11px, secondary text)
 * - Input/output ports (8px circles, category color)
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Route,
  Sparkles,
  Calculator,
  GitBranch,
  List,
  Code2,
  Quote,
  ArrowUpDown,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { AstFlowNode } from "@/lib/mapper/ast-to-flow";
import { NODE_COLORS, type NodeCategory } from "@/lib/jsonata/types";
import { NodeErrorBoundary } from "@/components/error-boundary/node-error-boundary";

const CATEGORY_ICONS: Record<NodeCategory, LucideIcon> = {
  path: Route,
  function: Sparkles,
  operator: Calculator,
  conditional: GitBranch,
  array: List,
  lambda: Code2,
  literal: Quote,
  transform: ArrowUpDown,
  error: AlertTriangle,
};

function AstNodeInner({ id, data, selected }: NodeProps<AstFlowNode>) {
  const { label, category, fullPath, preview } = data;
  const heatmapColor = data.heatmapColor as string | undefined;
  const heatmapTiming = data.heatmapTiming as number | undefined;
  const color = NODE_COLORS[category as NodeCategory];
  const Icon = CATEGORY_ICONS[category as NodeCategory];

  return (
    <NodeErrorBoundary nodeId={id}>
      <div
        className="flex max-w-[320px] min-w-[120px] items-start gap-2 rounded-lg px-3 py-2"
        style={{
          backgroundColor: heatmapColor || "var(--bg-surface)",
          border: `1px solid ${selected ? "var(--border-active)" : "var(--border-default)"}`,
          borderLeft: `3px solid ${color}`,
          boxShadow: selected ? "var(--shadow-glow-blue)" : undefined,
          transition:
            "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), background-color var(--duration-normal) var(--ease-standard)",
        }}
        title={heatmapTiming !== undefined ? `Eval: ${heatmapTiming.toFixed(1)}ms` : undefined}
      >
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            width: 8,
            height: 8,
            background: color,
            border: "2px solid var(--bg-surface)",
          }}
        />

        {/* Icon */}
        <div className="mt-0.5 shrink-0" style={{ color }}>
          <Icon size={16} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div
            className="truncate font-mono text-[13px] leading-tight"
            style={{ color: "var(--text-primary)" }}
            title={fullPath ?? label}
          >
            {label}
          </div>
          {preview !== undefined && (
            <div
              className="mt-0.5 truncate font-mono text-[11px]"
              style={{ color: "var(--text-secondary)" }}
              title={String(preview)}
            >
              {formatPreview(preview)}
            </div>
          )}
        </div>

        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            width: 8,
            height: 8,
            background: color,
            border: "2px solid var(--bg-surface)",
          }}
        />
      </div>
    </NodeErrorBoundary>
  );
}

function formatPreview(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") {
    return value.length > 50 ? value.slice(0, 47) + "..." : value;
  }
  const str = JSON.stringify(value);
  return str.length > 50 ? str.slice(0, 47) + "..." : str;
}

export const AstNode = memo(AstNodeInner);
