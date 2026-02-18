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
  ApplyNode,
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
  OperatorNode,
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
  "~>": 40, // apply/chain
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

/**
 * Main dispatch with generic post-processing for predicates and keepArray.
 */
function serializeNode(node: ExprNode): string {
  let result: string;

  switch (node.type) {
    case "path":
      result = serializePath(node);
      break;
    case "binary":
      result = serializeBinary(node);
      break;
    case "apply":
      result = serializeApply(node);
      break;
    case "unary":
      result = serializeUnary(node);
      break;
    case "name":
      result = serializeName(node);
      break;
    case "string":
      result = serializeString(node);
      break;
    case "number":
      result = serializeNumber(node);
      break;
    case "value":
      result = serializeValue(node);
      break;
    case "wildcard":
      result = serializeWildcard(node);
      break;
    case "descendant":
      result = serializeDescendant(node);
      break;
    case "parent":
      result = serializeParent(node);
      break;
    case "filter":
      result = serializeFilter(node);
      break;
    case "sort":
      result = serializeSort(node);
      break;
    case "block":
      result = serializeBlock(node);
      break;
    case "bind":
      result = serializeBind(node);
      break;
    case "condition":
      result = serializeCondition(node);
      break;
    case "function":
      result = serializeFunction(node);
      break;
    case "variable":
      result = serializeVariable(node);
      break;
    case "lambda":
      result = serializeLambda(node);
      break;
    case "partial":
      result = serializePartial(node);
      break;
    case "operator":
      result = serializeOperator(node);
      break;
    case "transform":
      result = serializeTransform(node);
      break;
    case "regex":
      result = serializeRegex(node);
      break;
    default: {
      // Exhaustiveness check — if we reach here, we have an unhandled type.
      const _: never = node;
      console.warn(`[serializer] unhandled node type: ${(_ as ExprNode).type}`);
      result = `/* unsupported: ${(_ as ExprNode).type} */`;
    }
  }

  // Generic predicate handling — filters/sorts attached to any expression
  if (node.predicate) {
    for (const pred of node.predicate) {
      if (pred.type === "filter") result += serializeFilter(pred);
      else if (pred.type === "sort") result += serializeSort(pred);
    }
  }

  // Generic keepArray handling — expr[] flattening
  // Skip for path nodes: their keepArray is derived from step-level keepArray
  if (node.keepArray && node.type !== "path") {
    result += "[]";
  }

  return result;
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
      if (i > 0 && step.type !== "filter" && step.type !== "sort") {
        parts.push(".");
      }
      parts.push(serializeNode(step));
    }
  }

  let result = parts.join("");

  // Object group-by: path{key: value, ...}
  if (node.group) {
    const pairs = (node.group.lhs ?? [])
      .map((pair) => {
        const [key, val] = pair;
        return `${serializeNode(key)}: ${serializeNode(val)}`;
      })
      .join(", ");
    result += `{${pairs}}`;
  }

  return result;
}

function serializeBinary(node: BinaryNode): string {
  const op = String(node.value);
  const parentPrec = getPrecedence(op);

  const lhs = serializeBinaryChild(node.lhs, parentPrec, "left");
  const rhs = serializeBinaryChild(node.rhs, parentPrec, "right");

  // Array subscript operator (no space)
  if (op === "[") {
    return `${lhs}[${rhs}]`;
  }

  return `${lhs} ${op} ${rhs}`;
}

function serializeApply(node: ApplyNode): string {
  const parentPrec = getPrecedence("~>");
  const lhs = serializeBinaryChild(node.lhs, parentPrec, "left");
  const rhs = serializeBinaryChild(node.rhs, parentPrec, "right");
  return `${lhs} ~> ${rhs}`;
}

function serializeBinaryChild(
  child: ExprNode,
  parentPrec: number,
  side: "left" | "right",
): string {
  const childStr = serializeNode(child);

  if (child.type === "binary" || child.type === "apply") {
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

  // keepArray: name[] flattening — handled by generic serializeNode post-processing

  return result;
}

function serializeString(node: StringNode): string {
  const val = String(node.value);
  // Escape special characters for round-trip safety
  const escaped = val
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
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

function serializeWildcard(node: WildcardNode): string {
  let result = "*";

  // Append stages (filter/sort on wildcard in a path)
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
  let result = `^(${terms})`;

  // Append stages (filter/sort on sort node in a path)
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
  let result: string;
  if (!node.value || node.value === "") {
    result = "$";
  } else {
    result = `$${node.value}`;
  }

  // Object group-by: $variable{key: value, ...}
  if (node.group) {
    const pairs = (node.group.lhs ?? [])
      .map((pair) => {
        const [key, val] = pair;
        return `${serializeNode(key)}: ${serializeNode(val)}`;
      })
      .join(", ");
    result += `{${pairs}}`;
  }

  return result;
}

function serializeLambda(node: LambdaNode): string {
  // Thunks are internal parser wrappers — unwrap them
  if (node.thunk) {
    return serializeNode(node.body);
  }

  const params = (node.arguments ?? []).map((a) => serializeNode(a)).join(", ");
  // Emit type signature if present: function($x, $y)<n-n:n>{body}
  const sig = node.signature?.definition ?? "";
  // The body may itself be a thunk lambda — unwrap it too
  let body = node.body;
  if (body.type === "lambda" && body.thunk) {
    body = body.body;
  }
  const bodyStr = serializeNode(body);
  return `function(${params})${sig}{${bodyStr}}`;
}

function serializePartial(node: PartialNode): string {
  const proc = serializeNode(node.procedure);
  const args = (node.arguments ?? [])
    .map((a) => {
      // The ? placeholder has type "operator" in the AST
      if (a.type === "operator" && a.value === "?") return "?";
      return serializeNode(a);
    })
    .join(", ");
  return `${proc}(${args})`;
}

function serializeOperator(node: OperatorNode): string {
  return String(node.value);
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
