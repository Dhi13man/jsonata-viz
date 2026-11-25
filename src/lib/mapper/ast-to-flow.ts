/**
 * Maps JSONata AST to React Flow nodes and edges.
 *
 * Key design: semantic grouping — path steps are collapsed into a single
 * compound node (e.g., $.orders.items.price -> one node) with option
 * to expand later.
 */

import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { ExprNode, PathNode } from "@/lib/jsonata/types";
import { getNodeCategory, type NodeCategory } from "@/lib/jsonata/types";
import { serialize } from "@/lib/jsonata/serializer";

export interface FlowNodeData {
  label: string;
  category: NodeCategory;
  astNode: ExprNode;
  /** Collapsed path string for path nodes */
  fullPath?: string;
  /** Evaluation result preview (set lazily) */
  preview?: string;
  /** Index signature required by React Flow's Node<Record<string, unknown>> constraint */
  [key: string]: unknown;
}

export type AstFlowNode = Node<FlowNodeData>;
export type AstFlowEdge = Edge;

interface MapResult {
  nodes: AstFlowNode[];
  edges: AstFlowEdge[];
}

/**
 * Map a JSONata AST to React Flow nodes and edges.
 * ID counter is scoped per call for StrictMode safety.
 */
export function mapAstToFlow(ast: ExprNode | null): MapResult {
  if (!ast) return { nodes: [], edges: [] };
  let counter = 0;
  const nextId = () => `ast-${++counter}`;
  const nodes: AstFlowNode[] = [];
  const edges: AstFlowEdge[] = [];
  buildGraph(ast, null, nodes, edges, nextId);
  applyDagreLayout(nodes, edges);
  return { nodes, edges };
}

function buildGraph(
  node: ExprNode,
  parentId: string | null,
  nodes: AstFlowNode[],
  edges: AstFlowEdge[],
  nextId: () => string,
): string {
  const id = nextId();

  // Semantic grouping: collapse path nodes into a single compound node
  if (node.type === "path") {
    return buildPathNode(node, id, parentId, nodes, edges, nextId);
  }

  const label = getNodeLabel(node);
  const category = getNodeCategory(node.type);

  nodes.push({
    id,
    type: "astNode",
    position: { x: 0, y: 0 },
    data: { label, category, astNode: node },
  });

  if (parentId) {
    edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      type: "smoothstep",
    });
  }

  // Recursively process children
  addChildren(node, id, nodes, edges, nextId);

  return id;
}

function buildPathNode(
  node: PathNode,
  id: string,
  parentId: string | null,
  nodes: AstFlowNode[],
  edges: AstFlowEdge[],
  nextId: () => string,
): string {
  // Check if this path is a simple name sequence (a.b.c)
  const isSimplePath = node.steps.every(
    (s) =>
      s.type === "name" ||
      s.type === "variable" ||
      s.type === "wildcard" ||
      s.type === "descendant" ||
      s.type === "parent",
  );

  if (isSimplePath && node.steps.length > 0) {
    // Collapse into single compound node
    const fullPath = serialize(node);
    const label =
      fullPath.length > 30 ? fullPath.slice(0, 27) + "..." : fullPath;

    nodes.push({
      id,
      type: "astNode",
      position: { x: 0, y: 0 },
      data: {
        label,
        category: "path",
        astNode: node,
        fullPath,
      },
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: "smoothstep",
      });
    }
    return id;
  }

  // Complex path: create a path group node, then child nodes for each step
  const label = "path";
  nodes.push({
    id,
    type: "astNode",
    position: { x: 0, y: 0 },
    data: { label, category: "path", astNode: node },
  });

  if (parentId) {
    edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      type: "smoothstep",
    });
  }

  for (const step of node.steps) {
    buildGraph(step, id, nodes, edges, nextId);
  }

  return id;
}

function addChildren(
  node: ExprNode,
  parentId: string,
  nodes: AstFlowNode[],
  edges: AstFlowEdge[],
  nextId: () => string,
): void {
  switch (node.type) {
    case "binary":
    case "apply":
      buildGraph(node.lhs, parentId, nodes, edges, nextId);
      buildGraph(node.rhs, parentId, nodes, edges, nextId);
      break;
    case "unary":
      if (node.expression) {
        buildGraph(node.expression, parentId, nodes, edges, nextId);
      }
      if (node.expressions) {
        for (const expr of node.expressions) {
          buildGraph(expr, parentId, nodes, edges, nextId);
        }
      }
      if (node.lhs) {
        for (const pair of node.lhs) {
          buildGraph(pair[0], parentId, nodes, edges, nextId);
          buildGraph(pair[1], parentId, nodes, edges, nextId);
        }
      }
      break;
    case "function":
      if (node.procedure.type !== "variable") {
        buildGraph(node.procedure, parentId, nodes, edges, nextId);
      }
      for (const arg of node.arguments ?? []) {
        buildGraph(arg, parentId, nodes, edges, nextId);
      }
      break;
    case "lambda":
      buildGraph(node.body, parentId, nodes, edges, nextId);
      break;
    case "condition":
      buildGraph(node.condition, parentId, nodes, edges, nextId);
      buildGraph(node.then, parentId, nodes, edges, nextId);
      if (node.else) buildGraph(node.else, parentId, nodes, edges, nextId);
      break;
    case "block":
      for (const expr of node.expressions) {
        buildGraph(expr, parentId, nodes, edges, nextId);
      }
      break;
    case "bind":
      buildGraph(node.lhs, parentId, nodes, edges, nextId);
      buildGraph(node.rhs, parentId, nodes, edges, nextId);
      break;
    case "filter":
      buildGraph(node.expr, parentId, nodes, edges, nextId);
      break;
    case "sort":
      if (node.expr) buildGraph(node.expr, parentId, nodes, edges, nextId);
      for (const term of node.terms) {
        buildGraph(term.expression, parentId, nodes, edges, nextId);
      }
      break;
    case "partial":
      buildGraph(node.procedure, parentId, nodes, edges, nextId);
      for (const arg of node.arguments ?? []) {
        buildGraph(arg, parentId, nodes, edges, nextId);
      }
      break;
    case "transform":
      buildGraph(node.pattern, parentId, nodes, edges, nextId);
      buildGraph(node.update, parentId, nodes, edges, nextId);
      if (node.delete) buildGraph(node.delete, parentId, nodes, edges, nextId);
      break;
    // Leaf nodes: name, string, number, value, variable, wildcard, descendant, parent, regex, operator
    default:
      break;
  }
}

function getNodeLabel(node: ExprNode): string {
  switch (node.type) {
    case "binary":
    case "apply":
      return String(node.value);
    case "unary":
      return `${node.value}(unary)`;
    case "name":
      return String(node.value);
    case "string":
      return `"${String(node.value).length > 20 ? String(node.value).slice(0, 17) + "..." : node.value}"`;
    case "number":
      return String(node.value);
    case "value":
      return String(node.value);
    case "wildcard":
      return "*";
    case "descendant":
      return "**";
    case "parent":
      return "%";
    case "variable":
      return node.value ? `$${node.value}` : "$";
    case "function": {
      if (node.procedure.type === "variable") {
        return node.procedure.value ? `$${node.procedure.value}()` : "$()";
      }
      return "fn()";
    }
    case "lambda":
      return "lambda";
    case "condition":
      return "? :";
    case "block":
      return "(block)";
    case "bind":
      return ":=";
    case "filter":
      return "[filter]";
    case "sort":
      return "^(sort)";
    case "partial":
      return "partial()";
    case "transform":
      return "|transform|";
    case "regex":
      return node.value instanceof RegExp ? node.value.toString() : "/regex/";
    default:
      return node.type;
  }
}

/** Apply dagre auto-layout to position nodes */
function applyDagreLayout(nodes: AstFlowNode[], edges: AstFlowEdge[]): void {
  if (nodes.length === 0) return;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 60,
    ranksep: 80,
    marginx: 20,
    marginy: 20,
  });

  const nodeWidth = 200;
  const nodeHeight = 60;

  for (const node of nodes) {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  for (const node of nodes) {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      };
    }
  }
}
