import jsonata from "jsonata";
import type { ExprNode } from "./types";

export interface ParseResult {
  ast: ExprNode | null;
  error: JsonataError | null;
}

export interface JsonataError {
  code: string;
  message: string;
  position?: number;
  token?: string;
}

/**
 * Parse a JSONata expression string into an AST.
 * Wraps the jsonata library's parse step.
 */
export function parseExpression(expression: string): ParseResult {
  if (!expression.trim()) {
    return { ast: null, error: null };
  }

  try {
    const compiled = jsonata(expression);
    const ast = compiled.ast() as ExprNode;
    return { ast, error: null };
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    const raw = err as Record<string, unknown>;
    return {
      ast: null,
      error: {
        code: typeof raw.code === "string" ? raw.code : "UNKNOWN",
        message: e.message ?? "Unknown parse error",
        position: typeof raw.position === "number" ? raw.position : undefined,
        token: typeof raw.token === "string" ? raw.token : undefined,
      },
    };
  }
}
