/**
 * Round-trip corpus test against JSONata's official test suite.
 *
 * Downloads 1,189 unique expressions from jsonata-js/jsonata test-suite.
 * For each parseable expression: parse -> serialize -> re-parse -> compare ASTs.
 * Target: >= 90% pass rate (Phase 0b.2 exit criteria).
 */

import { describe, it, expect } from "vitest";
import { parseExpression } from "./parser";
import { serialize } from "./serializer";
import corpus from "../../../tests/fixtures/jsonata-corpus.json";

/** Keys to strip from AST comparison (non-semantic fields) */
const STRIP_KEYS = new Set([
  "position",
  "keepArray",
  "keepSingletonArray",
  "focus",
  "level",
  "index",
  "input",
  "tuple",
  "consarray",
  "validate", // signature.validate is a function — differs per parse
]);

function stripPositions(node: unknown): unknown {
  if (node === null || node === undefined) return node;
  if (typeof node === "function") return undefined;
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

interface CorpusEntry {
  group: string;
  case: string;
  expr: string;
}

const entries = corpus as CorpusEntry[];

// Filter to parseable expressions only
const parseable = entries.filter((e) => {
  const { error } = parseExpression(e.expr);
  return error === null;
});

describe("AST Serializer Corpus (jsonata test suite)", () => {
  const passed: string[] = [];
  const failed: { expr: string; error: string }[] = [];

  for (const entry of parseable) {
    it(`[${entry.group}/${entry.case}] ${entry.expr.slice(0, 80)}`, () => {
      const first = parseExpression(entry.expr);
      expect(first.error).toBeNull();
      expect(first.ast).not.toBeNull();

      const serialized = serialize(first.ast);
      expect(serialized).toBeTruthy();

      const second = parseExpression(serialized);
      if (second.error) {
        failed.push({
          expr: entry.expr,
          error: `Re-parse failed: ${second.error.message} (serialized: "${serialized}")`,
        });
        throw new Error(
          `Re-parse failed for "${entry.expr}" -> "${serialized}": ${second.error.message}`,
        );
      }

      const ast1 = stripPositions(first.ast);
      const ast2 = stripPositions(second.ast);

      try {
        expect(ast2).toEqual(ast1);
        passed.push(entry.expr);
      } catch {
        failed.push({
          expr: entry.expr,
          error: `AST mismatch: "${entry.expr}" -> "${serialized}"`,
        });
        throw new Error(`AST mismatch for "${entry.expr}" -> "${serialized}"`);
      }
    });
  }
});
