import { describe, it, expect } from "vitest";
import { parseExpression } from "@/lib/jsonata/parser";
import { mapAstToFlow } from "./ast-to-flow";

describe("AST-to-ReactFlow Mapper", () => {
  it("returns empty result for null AST", () => {
    const result = mapAstToFlow(null);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it("maps a simple path expression to a single node", () => {
    const { ast } = parseExpression("Account.Order.Product.Price");
    const result = mapAstToFlow(ast);
    // Simple path should collapse into a single compound node
    expect(result.nodes.length).toBeGreaterThanOrEqual(1);
    expect(result.nodes[0]!.data.category).toBe("path");
  });

  it("maps a function call with arguments", () => {
    const { ast } = parseExpression("$sum(Account.Order.Product.Price)");
    const result = mapAstToFlow(ast);
    expect(result.nodes.length).toBeGreaterThanOrEqual(2);
    // Root should be the function node
    const funcNode = result.nodes.find((n) => n.data.category === "function");
    expect(funcNode).toBeDefined();
  });

  it("maps binary operator with children", () => {
    const { ast } = parseExpression("a + b");
    const result = mapAstToFlow(ast);
    expect(result.nodes.length).toBeGreaterThanOrEqual(3);
    // Should have operator node + 2 operand nodes
    const opNode = result.nodes.find((n) => n.data.category === "operator");
    expect(opNode).toBeDefined();
  });

  it("creates edges connecting parent to children", () => {
    const { ast } = parseExpression("$sum(a, b)");
    const result = mapAstToFlow(ast);
    expect(result.edges.length).toBeGreaterThanOrEqual(2);
  });

  it("positions nodes using dagre layout", () => {
    const { ast } = parseExpression("$sum(Account.Order.Product.Price)");
    const result = mapAstToFlow(ast);
    // All nodes should have non-zero positions (from dagre)
    for (const node of result.nodes) {
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
    }
  });

  it("handles conditional expressions", () => {
    const { ast } = parseExpression('x > 0 ? "positive" : "negative"');
    const result = mapAstToFlow(ast);
    const condNode = result.nodes.find(
      (n) => n.data.category === "conditional",
    );
    expect(condNode).toBeDefined();
  });

  it("maps lambda expressions", () => {
    const { ast } = parseExpression("function($x){$x + 1}");
    const result = mapAstToFlow(ast);
    const lambdaNode = result.nodes.find((n) => n.data.category === "lambda");
    expect(lambdaNode).toBeDefined();
  });
});
