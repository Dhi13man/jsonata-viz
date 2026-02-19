/**
 * Expression complexity scoring — Phase 3.7.
 * Weighted metric based on AST depth, node count, and feature usage.
 */

import type { ExprNode } from "@/lib/jsonata/types";

interface ComplexityScore {
  /** Total weighted score */
  score: number;
  /** Human-readable label */
  label: "Simple" | "Moderate" | "Complex" | "Very Complex";
  /** Total AST nodes */
  nodeCount: number;
  /** Maximum nesting depth */
  maxDepth: number;
  /** Number of lambda/function definitions */
  lambdaCount: number;
  /** Number of variable bindings */
  bindCount: number;
}

const WEIGHTS: Record<string, number> = {
  path: 1,
  name: 1,
  string: 1,
  number: 1,
  value: 1,
  wildcard: 1,
  descendant: 2,
  parent: 2,
  variable: 1,
  operator: 1,
  binary: 2,
  unary: 2,
  apply: 2,
  filter: 3,
  sort: 3,
  condition: 3,
  function: 2,
  lambda: 4,
  partial: 3,
  block: 2,
  bind: 2,
  transform: 4,
  regex: 2,
};

export function calculateComplexity(ast: ExprNode | null): ComplexityScore {
  if (!ast) {
    return { score: 0, label: "Simple", nodeCount: 0, maxDepth: 0, lambdaCount: 0, bindCount: 0 };
  }

  let nodeCount = 0;
  let maxDepth = 0;
  let lambdaCount = 0;
  let bindCount = 0;
  let weightedSum = 0;

  function walk(node: ExprNode, depth: number) {
    nodeCount++;
    maxDepth = Math.max(maxDepth, depth);
    weightedSum += WEIGHTS[node.type] ?? 1;

    if (node.type === "lambda") lambdaCount++;
    if (node.type === "bind") bindCount++;

    // Walk children based on node type
    const n = node as unknown as Record<string, unknown>;
    if (n.lhs && typeof n.lhs === "object" && "type" in (n.lhs as object)) {
      walk(n.lhs as ExprNode, depth + 1);
    }
    if (n.rhs && typeof n.rhs === "object" && "type" in (n.rhs as object)) {
      walk(n.rhs as ExprNode, depth + 1);
    }
    if (n.expression && typeof n.expression === "object" && "type" in (n.expression as object)) {
      walk(n.expression as ExprNode, depth + 1);
    }
    if (n.condition && typeof n.condition === "object" && "type" in (n.condition as object)) {
      walk(n.condition as ExprNode, depth + 1);
    }
    if (n.then && typeof n.then === "object" && "type" in (n.then as object)) {
      walk(n.then as ExprNode, depth + 1);
    }
    if (n.else && typeof n.else === "object" && "type" in (n.else as object)) {
      walk(n.else as ExprNode, depth + 1);
    }
    if (n.body && typeof n.body === "object" && "type" in (n.body as object)) {
      walk(n.body as ExprNode, depth + 1);
    }
    if (n.procedure && typeof n.procedure === "object" && "type" in (n.procedure as object)) {
      walk(n.procedure as ExprNode, depth + 1);
    }
    if (n.pattern && typeof n.pattern === "object" && "type" in (n.pattern as object)) {
      walk(n.pattern as ExprNode, depth + 1);
    }
    if (n.update && typeof n.update === "object" && "type" in (n.update as object)) {
      walk(n.update as ExprNode, depth + 1);
    }
    if (n.delete && typeof n.delete === "object" && "type" in (n.delete as object)) {
      walk(n.delete as ExprNode, depth + 1);
    }
    if (n.expr && typeof n.expr === "object" && "type" in (n.expr as object)) {
      walk(n.expr as ExprNode, depth + 1);
    }
    if (Array.isArray(n.steps)) {
      for (const step of n.steps) {
        if (step && typeof step === "object" && "type" in step) {
          walk(step as ExprNode, depth + 1);
        }
      }
    }
    if (Array.isArray(n.expressions)) {
      for (const expr of n.expressions) {
        if (expr && typeof expr === "object" && "type" in expr) {
          walk(expr as ExprNode, depth + 1);
        }
      }
    }
    if (Array.isArray(n.arguments)) {
      for (const arg of n.arguments) {
        if (arg && typeof arg === "object" && "type" in arg) {
          walk(arg as ExprNode, depth + 1);
        }
      }
    }
    if (Array.isArray(n.stages)) {
      for (const stage of n.stages) {
        if (stage && typeof stage === "object" && "type" in stage) {
          walk(stage as ExprNode, depth + 1);
        }
      }
    }
    if (Array.isArray(n.predicate)) {
      for (const pred of n.predicate) {
        if (pred && typeof pred === "object" && "type" in pred) {
          walk(pred as ExprNode, depth + 1);
        }
      }
    }
    // Object construction lhs: [[key, value], ...]
    if (Array.isArray(n.lhs) && Array.isArray((n.lhs as unknown[])[0])) {
      for (const pair of n.lhs as [ExprNode, ExprNode][]) {
        if (Array.isArray(pair)) {
          for (const item of pair) {
            if (item && typeof item === "object" && "type" in item) {
              walk(item, depth + 1);
            }
          }
        }
      }
    }
    // Group
    if (n.group && typeof n.group === "object") {
      const group = n.group as { lhs?: [ExprNode, ExprNode][] };
      if (Array.isArray(group.lhs)) {
        for (const pair of group.lhs) {
          for (const item of pair) {
            if (item && typeof item === "object" && "type" in item) {
              walk(item, depth + 1);
            }
          }
        }
      }
    }
    // Sort terms
    if (Array.isArray(n.terms)) {
      for (const term of n.terms as Array<{ expression?: ExprNode }>) {
        if (term.expression && typeof term.expression === "object" && "type" in term.expression) {
          walk(term.expression, depth + 1);
        }
      }
    }
  }

  walk(ast, 0);

  // Combine metrics: weighted sum + depth bonus + lambda bonus
  const score = weightedSum + maxDepth * 2 + lambdaCount * 3 + bindCount;

  let label: ComplexityScore["label"];
  if (score <= 5) label = "Simple";
  else if (score <= 15) label = "Moderate";
  else if (score <= 40) label = "Complex";
  else label = "Very Complex";

  return { score, label, nodeCount, maxDepth, lambdaCount, bindCount };
}
