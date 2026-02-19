import { describe, it, expect } from "vitest";
import { parseExpression } from "./parser";
import { serialize } from "./serializer";
import type { ExprNode } from "./types";

/**
 * Round-trip test helper.
 * Parses expression -> serializes -> re-parses -> compares ASTs.
 * We strip position fields since they may differ in the re-parsed AST.
 */
/** Keys to strip from AST comparison (non-semantic fields) */
const STRIP_KEYS = new Set(["position", "keepArray", "keepSingletonArray"]);

function stripPositions(node: unknown): unknown {
  if (node === null || node === undefined) return node;
  if (typeof node !== "object") return node;
  if (node instanceof RegExp) return `/${node.source}/${node.flags}`;
  if (Array.isArray(node)) return node.map(stripPositions);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (STRIP_KEYS.has(key)) continue;
    result[key] = stripPositions(value);
  }
  return result;
}

function assertRoundTrip(expression: string) {
  const first = parseExpression(expression);
  expect(first.error).toBeNull();
  expect(first.ast).not.toBeNull();

  const serialized = serialize(first.ast);
  expect(serialized).toBeTruthy();

  const second = parseExpression(serialized);
  expect(second.error).toBeNull();
  expect(second.ast).not.toBeNull();

  const ast1 = stripPositions(first.ast);
  const ast2 = stripPositions(second.ast);
  expect(ast2).toEqual(ast1);
}

describe("AST Serializer", () => {
  describe("literals", () => {
    it("serializes string literals", () => {
      assertRoundTrip('"hello"');
      assertRoundTrip('"hello world"');
    });

    it("serializes number literals", () => {
      assertRoundTrip("42");
      assertRoundTrip("3.14");
      assertRoundTrip("-1");
    });

    it("serializes boolean literals", () => {
      assertRoundTrip("true");
      assertRoundTrip("false");
    });

    it("serializes null", () => {
      assertRoundTrip("null");
    });
  });

  describe("path expressions", () => {
    it("serializes simple field access", () => {
      assertRoundTrip("name");
    });

    it("serializes dot-separated paths", () => {
      assertRoundTrip("Account.Order.Product.Price");
    });

    it("serializes paths with array index", () => {
      assertRoundTrip("Account.Order[0]");
    });

    it("serializes wildcard", () => {
      assertRoundTrip("Account.*");
    });

    it("serializes descendant wildcard", () => {
      assertRoundTrip("Account.**");
    });
  });

  describe("binary operators", () => {
    it("serializes arithmetic", () => {
      assertRoundTrip("a + b");
      assertRoundTrip("a - b");
      assertRoundTrip("a * b");
      assertRoundTrip("a / b");
      assertRoundTrip("a % b");
    });

    it("serializes comparison", () => {
      assertRoundTrip("a = b");
      assertRoundTrip("a != b");
      assertRoundTrip("a < b");
      assertRoundTrip("a <= b");
      assertRoundTrip("a > b");
      assertRoundTrip("a >= b");
    });

    it("serializes logical operators", () => {
      assertRoundTrip("a and b");
      assertRoundTrip("a or b");
    });

    it("serializes string concatenation", () => {
      assertRoundTrip("a & b");
    });

    it("serializes range operator", () => {
      assertRoundTrip("[1..5]");
    });

    it("handles operator precedence", () => {
      assertRoundTrip("a + b * c");
      assertRoundTrip("(a + b) * c");
      assertRoundTrip("a and b or c");
    });

    it("preserves right-associative grouping", () => {
      assertRoundTrip("a - (b - c)");
      assertRoundTrip("a / (b / c)");
      assertRoundTrip("a - (b + c)");
    });

    it("serializes in operator", () => {
      assertRoundTrip('"hello" in items');
    });
  });

  describe("variables", () => {
    it("serializes variable references", () => {
      assertRoundTrip("$x");
      assertRoundTrip("$myVar");
    });

    it("serializes variable binding", () => {
      assertRoundTrip("$x := 42");
    });
  });

  describe("functions", () => {
    it("serializes function calls", () => {
      assertRoundTrip("$sum(Account.Order.Price)");
      assertRoundTrip("$count(items)");
      assertRoundTrip("$substring(name, 0, 3)");
    });

    it("serializes chained function calls", () => {
      assertRoundTrip("$trim($uppercase(name))");
    });

    it("serializes lambda functions", () => {
      assertRoundTrip("function($x){$x + 1}");
      assertRoundTrip("function($x, $y){$x + $y}");
    });

    it("serializes higher-order function usage", () => {
      assertRoundTrip("$map(items, function($v){$v * 2})");
      assertRoundTrip("$filter(items, function($v){$v > 10})");
      assertRoundTrip("$reduce(items, function($prev, $curr){$prev + $curr})");
    });
  });

  describe("conditionals", () => {
    it("serializes ternary with else", () => {
      assertRoundTrip('x > 0 ? "positive" : "non-positive"');
    });

    it("serializes ternary without else", () => {
      assertRoundTrip('x > 0 ? "positive"');
    });
  });

  describe("blocks", () => {
    it("serializes block expressions", () => {
      assertRoundTrip("($x := 5; $x + 1)");
    });
  });

  describe("array/object construction", () => {
    it("serializes array filter predicates", () => {
      assertRoundTrip("Account.Order[Price > 100]");
    });

    it("serializes sort expressions", () => {
      assertRoundTrip("Account.Order^(<Price)");
      assertRoundTrip("Account.Order^(>Price)");
    });
  });

  describe("transform", () => {
    it("serializes transform expressions", () => {
      assertRoundTrip("|Account.Order|{'status': 'shipped'}|");
    });
  });

  describe("regex", () => {
    it("serializes regex literals without flags", () => {
      assertRoundTrip("/[a-z]+/");
    });

    it("serializes regex with i flag", () => {
      assertRoundTrip("/[a-z]+/i");
    });
  });

  describe("complex real-world expressions", () => {
    it("serializes JSONata Exerciser examples", () => {
      assertRoundTrip("Account.Order.Product.Price");
      assertRoundTrip("$sum(Account.Order.Product.Price)");
      assertRoundTrip("Account.Order.Product.(Price * Quantity)");
    });

    it("serializes nested function calls with lambda", () => {
      assertRoundTrip(
        "$map(Account.Order, function($o){$sum($o.Product.Price)})",
      );
    });

    it("serializes complex conditional logic", () => {
      assertRoundTrip('type = "premium" ? price * 0.9 : price');
    });
  });

  describe("null/empty handling", () => {
    it("returns empty string for null input", () => {
      expect(serialize(null as unknown as ExprNode)).toBe("");
    });

    it("returns empty string for undefined input", () => {
      expect(serialize(undefined as unknown as ExprNode)).toBe("");
    });
  });
});
