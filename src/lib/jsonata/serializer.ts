/**
 * AST-to-expression serializer for JSONata.
 *
 * Recursive descent serializer with precedence-aware parenthesization.
 * No official serializer exists in the jsonata package — this is custom.
 *
 * References:
 * - @stedi/prettier-plugin-jsonata (AST traversal patterns)
 * - jsonata/src/parser.js (canonical precedence table)
 *
 * Strategy: Conservative parenthesization — always wrap binary sub-expressions
 * when parent precedence >= child precedence. Correct over pretty.
 */

import type {
  ExprNode,
  PathNode,
  BinaryNode,
  UnaryNode,
  NameNode,
  StringNode,
  NumberNode,
  ValueNode,
  WildcardNode,
  DescendantNode,
  ParentNode,
  FilterNode,
  SortNode,
  BlockNode,
  BindNode,
  ConditionNode,
  FunctionNode,
  VariableNode,
  LambdaNode,
  PartialNode,
  TransformNode,
  RegexNode,
} from "./types";

/**
 * Operator precedence table.
 * Lower number = lower precedence (binds less tightly).
 * Verified against jsonata/src/parser.js.
 */
const PRECEDENCE: Record<string, number> = {
  ":=": 10, // bind
  "?": 20, // ternary (unused in binary, but for reference)
  or: 25,
  and: 30,
  "=": 40,
  "!=": 40,
  "<": 40,
  "<=": 40,
  ">": 40,
  ">=": 40,
  in: 40,
  "&": 50, // concat
  "+": 60,
  "-": 60,
  "*": 70,
  "/": 70,
  "%": 70,
  "..": 80, // range
};

function getPrecedence(op: string): number {
  return PRECEDENCE[op] ?? 100;
}

/**
 * Serialize a JSONata AST back to an expression string.
 * Returns null if the node type is unrecognized (fallback case).
 */
export function serialize(node: ExprNode | null | undefined): string {
  if (!node) return "";
  return serializeNode(node);
}

function serializeNode(node: ExprNode): string {
  switch (node.type) {
    case "path":
      return serializePath(node);
    case "binary":
      return serializeBinary(node);
    case "unary":
      return serializeUnary(node);
    case "name":
      return serializeName(node);
    case "string":
      return serializeString(node);
    case "number":
      return serializeNumber(node);
    case "value":
      return serializeValue(node);
    case "wildcard":
      return serializeWildcard(node);
    case "descendant":
      return serializeDescendant(node);
    case "parent":
      return serializeParent(node);
    case "filter":
      return serializeFilter(node);
    case "sort":
      return serializeSort(node);
    case "block":
      return serializeBlock(node);
    case "bind":
      return serializeBind(node);
    case "condition":
      return serializeCondition(node);
    case "function":
      return serializeFunction(node);
    case "variable":
      return serializeVariable(node);
    case "lambda":
      return serializeLambda(node);
    case "partial":
      return serializePartial(node);
    case "transform":
      return serializeTransform(node);
    case "regex":
      return serializeRegex(node);
    default: {
      // Exhaustiveness check — if we reach here, we have an unhandled type.
      const _: never = node;
      console.warn(`[serializer] unhandled node type: ${(_ as ExprNode).type}`);
      return `/* unsupported: ${(_ as ExprNode).type} */`;
    }
  }
}

function serializePath(node: PathNode): string {
  if (!node.steps || node.steps.length === 0) return "";

  const parts: string[] = [];
  for (let i = 0; i < node.steps.length; i++) {
    const step = node.steps[i]!;

    if (step.type === "filter") {
      // Filter attaches to previous step: a[predicate]
      parts.push(serializeFilter(step));
    } else if (step.type === "sort") {
      // Sort attaches to previous step: a^(>field)
      parts.push(serializeSort(step));
    } else {
      const serialized = serializeNode(step);
      if (i > 0 && step.type !== "filter" && step.type !== "sort") {
        parts.push(".");
      }
      parts.push(serialized);
    }
  }
  return parts.join("");
}

function serializeBinary(node: BinaryNode): string {
  const op = String(node.value);
  const parentPrec = getPrecedence(op);

  const lhs = serializeBinaryChild(node.lhs, parentPrec, "left");
  const rhs = serializeBinaryChild(node.rhs, parentPrec, "right");

  // Array construction operator (no space)
  if (op === "[") {
    return `${lhs}[${rhs}]`;
  }

  return `${lhs} ${op} ${rhs}`;
}

function serializeBinaryChild(
  child: ExprNode,
  parentPrec: number,
  side: "left" | "right",
): string {
  const childStr = serializeNode(child);

  if (child.type === "binary") {
    const childPrec = getPrecedence(String(child.value));
    // Parenthesize when child binds less tightly, or when equal precedence
    // on the right side (left-associative operators need parens on right)
    if (
      childPrec < parentPrec ||
      (childPrec === parentPrec && side === "right")
    ) {
      return `(${childStr})`;
    }
  }
  return childStr;
}

function serializeUnary(node: UnaryNode): string {
  const op = String(node.value);

  // Array construction: [expr1, expr2, ...]
  if (op === "[") {
    const items = (node.expressions ?? [])
      .map((e) => serializeNode(e))
      .join(", ");
    return `[${items}]`;
  }

  // Object construction: {"key": value, ...}
  if (op === "{") {
    const pairs = (node.lhs ?? [])
      .map((pair) => {
        const [key, val] = pair;
        return `${serializeNode(key)}: ${serializeNode(val)}`;
      })
      .join(", ");
    return `{${pairs}}`;
  }

  // Negation: -expr
  if (node.expression) {
    return `-${serializeNode(node.expression)}`;
  }

  return op;
}

function serializeName(node: NameNode): string {
  const name = String(node.value);
  // Backtick-escape names that contain special characters
  let result: string;
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    result = name;
  } else {
    result = "`" + name.replace(/`/g, "\\`") + "`";
  }

  // Append stages (filter/sort operations attached to this name)
  if (node.stages) {
    for (const stage of node.stages) {
      if (stage.type === "filter") {
        result += serializeFilter(stage);
      } else if (stage.type === "sort") {
        result += serializeSort(stage);
      }
    }
  }

  return result;
}

function serializeString(node: StringNode): string {
  const val = String(node.value);
  // Use double quotes; escape internal double quotes
  return `"${val.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function serializeNumber(node: NumberNode): string {
  return String(node.value);
}

function serializeValue(node: ValueNode): string {
  if (node.value === null) return "null";
  if (node.value === true) return "true";
  if (node.value === false) return "false";
  return String(node.value);
}

function serializeWildcard(_node: WildcardNode): string {
  return "*";
}

function serializeDescendant(_node: DescendantNode): string {
  return "**";
}

function serializeParent(_node: ParentNode): string {
  return "%";
}

function serializeFilter(node: FilterNode): string {
  return `[${serializeNode(node.expr)}]`;
}

function serializeSort(node: SortNode): string {
  const terms = node.terms
    .map((t) => {
      const dir = t.descending ? ">" : "<";
      return `${dir}${serializeNode(t.expression)}`;
    })
    .join(", ");
  return `^(${terms})`;
}

function serializeBlock(node: BlockNode): string {
  const exprs = node.expressions.map((e) => serializeNode(e)).join("; ");
  return `(${exprs})`;
}

function serializeBind(node: BindNode): string {
  return `${serializeNode(node.lhs)} := ${serializeNode(node.rhs)}`;
}

function serializeCondition(node: ConditionNode): string {
  const cond = serializeNode(node.condition);
  const then = serializeNode(node.then);
  if (node.else) {
    return `${cond} ? ${then} : ${serializeNode(node.else)}`;
  }
  return `${cond} ? ${then}`;
}

function serializeFunction(node: FunctionNode): string {
  const proc = serializeNode(node.procedure);
  const args = (node.arguments ?? []).map((a) => serializeNode(a)).join(", ");
  return `${proc}(${args})`;
}

function serializeVariable(node: VariableNode): string {
  // Empty variable name means the root context ($)
  if (!node.value || node.value === "") return "$";
  return `$${node.value}`;
}

function serializeLambda(node: LambdaNode): string {
  // Thunks are internal parser wrappers — unwrap them
  if (node.thunk) {
    return serializeNode(node.body);
  }

  const params = (node.arguments ?? []).map((a) => serializeNode(a)).join(", ");
  // The body may itself be a thunk lambda — unwrap it too
  let body = node.body;
  if (body.type === "lambda" && body.thunk) {
    body = body.body;
  }
  const bodyStr = serializeNode(body);
  return `function(${params}){${bodyStr}}`;
}

function serializePartial(node: PartialNode): string {
  const proc = serializeNode(node.procedure);
  const args = (node.arguments ?? [])
    .map((a) => {
      if (a.type === "variable" && a.value === "?") return "?";
      return serializeNode(a);
    })
    .join(", ");
  return `${proc}(${args})`;
}

function serializeTransform(node: TransformNode): string {
  const pattern = serializeNode(node.pattern);
  const update = serializeNode(node.update);
  if (node.delete) {
    return `|${pattern}|${update},${serializeNode(node.delete)}|`;
  }
  return `|${pattern}|${update}|`;
}

function serializeRegex(node: RegexNode): string {
  if (node.value instanceof RegExp) {
    const source = node.value.source;
    // JSONata auto-adds 'g' flag; strip it for round-trip compatibility
    const flags = node.value.flags.replace("g", "");
    return `/${source}/${flags}`;
  }
  return String(node.value);
}
