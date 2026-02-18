/**
 * JSONata AST node type definitions.
 *
 * Derived from jsonata source code (parser.js) and empirical testing
 * with expression.ast(). Pin jsonata version — these types are not
 * part of the public API.
 */

/** All known AST node type identifiers */
export type AstNodeType =
  | "path"
  | "binary"
  | "unary"
  | "name"
  | "string"
  | "number"
  | "value"
  | "wildcard"
  | "descendant"
  | "parent"
  | "filter"
  | "sort"
  | "block"
  | "bind"
  | "condition"
  | "function"
  | "variable"
  | "lambda"
  | "partial"
  | "transform"
  | "regex"
  | "apply"
  | "operator";

/** Base properties shared by all AST nodes */
interface AstNodeBase {
  type: AstNodeType;
  value?: unknown;
  position?: number;
  keepArray?: boolean;
  /** Predicate filters attached to any expression: expr[pred1][pred2] */
  predicate?: Array<FilterNode | SortNode>;
}

/** Path expression: a.b.c */
export interface PathNode extends AstNodeBase {
  type: "path";
  steps: ExprNode[];
  /** Object group-by: path{key: value, ...} */
  group?: {
    lhs: [ExprNode, ExprNode][];
    position?: number;
  };
}

/** Binary operator: a + b, a = b, a and b */
export interface BinaryNode extends AstNodeBase {
  type: "binary";
  value: string;
  lhs: ExprNode;
  rhs: ExprNode;
  position: number;
}

/** Apply (chain) operator: a ~> b */
export interface ApplyNode extends AstNodeBase {
  type: "apply";
  value: string;
  lhs: ExprNode;
  rhs: ExprNode;
  position: number;
}

/**
 * Unary node — multiple forms:
 * - Negation: { value: "-", expression: ExprNode }
 * - Array construction: { value: "[", expressions: ExprNode[] }
 * - Object construction: { value: "{", lhs: [key, value][][] }
 */
export interface UnaryNode extends AstNodeBase {
  type: "unary";
  value: string;
  /** Negation operand */
  expression?: ExprNode;
  /** Array construction items */
  expressions?: ExprNode[];
  /** Object construction key-value pairs: [[key, value], ...] */
  lhs?: [ExprNode, ExprNode][];
  position: number;
}

/** Field name reference: fieldName (may have filter/sort stages) */
export interface NameNode extends AstNodeBase {
  type: "name";
  value: string;
  position: number;
  /** Filter/sort operations attached to this name in a path */
  stages?: Array<FilterNode | SortNode>;
}

/** String literal: "hello" */
export interface StringNode extends AstNodeBase {
  type: "string";
  value: string;
  position: number;
}

/** Number literal: 42, 3.14 */
export interface NumberNode extends AstNodeBase {
  type: "number";
  value: number;
  position: number;
}

/** Boolean/null literal: true, false, null */
export interface ValueNode extends AstNodeBase {
  type: "value";
  value: boolean | null;
  position: number;
}

/** Wildcard: * */
export interface WildcardNode extends AstNodeBase {
  type: "wildcard";
  position: number;
  /** Filter/sort operations attached to this wildcard in a path */
  stages?: Array<FilterNode | SortNode>;
}

/** Descendant wildcard: ** */
export interface DescendantNode extends AstNodeBase {
  type: "descendant";
  position: number;
}

/** Parent reference: % (JSONata 2.x) */
export interface ParentNode extends AstNodeBase {
  type: "parent";
  position: number;
}

/** Array filter/predicate: a[predicate] */
export interface FilterNode extends AstNodeBase {
  type: "filter";
  expr: ExprNode;
  position: number;
}

/** Sort expression: a^(>field) */
export interface SortNode extends AstNodeBase {
  type: "sort";
  expr: ExprNode;
  terms: SortTerm[];
  position: number;
  /** Stages attached to this sort in a path */
  stages?: Array<FilterNode | SortNode>;
}

export interface SortTerm {
  descending: boolean;
  expression: ExprNode;
}

/** Block expression: (expr1; expr2; ...) */
export interface BlockNode extends AstNodeBase {
  type: "block";
  expressions: ExprNode[];
  position: number;
}

/** Variable binding: $x := value */
export interface BindNode extends AstNodeBase {
  type: "bind";
  lhs: ExprNode;
  rhs: ExprNode;
  position: number;
}

/** Conditional: condition ? then : else */
export interface ConditionNode extends AstNodeBase {
  type: "condition";
  condition: ExprNode;
  then: ExprNode;
  else?: ExprNode;
  position: number;
}

/** Function call: $sum(args) */
export interface FunctionNode extends AstNodeBase {
  type: "function";
  procedure: ExprNode;
  arguments: ExprNode[];
  position: number;
}

/** Variable reference: $varName */
export interface VariableNode extends AstNodeBase {
  type: "variable";
  value: string;
  position: number;
  /** Object group-by: $var{key: value, ...} */
  group?: {
    lhs: [ExprNode, ExprNode][];
    position?: number;
  };
}

/** Lambda: function($x){ $x + 1 } */
export interface LambdaNode extends AstNodeBase {
  type: "lambda";
  arguments: ExprNode[];
  signature?: LambdaSignature;
  body: ExprNode;
  thunk: boolean;
}

export interface LambdaSignature {
  /** Raw signature definition string: "<n-n:n>" */
  definition?: string;
  args: Array<{
    type: string;
    regex?: string;
    optional?: boolean;
    context?: boolean;
    array?: boolean;
  }>;
  return?: { type: string };
}

/** Partial application: $fn(?, arg) */
export interface PartialNode extends AstNodeBase {
  type: "partial";
  procedure: ExprNode;
  arguments: ExprNode[];
  position: number;
}

/** Operator placeholder: ? in partial application */
export interface OperatorNode extends AstNodeBase {
  type: "operator";
  value: string;
  position: number;
}

/** Transform: |source|update,delete| */
export interface TransformNode extends AstNodeBase {
  type: "transform";
  pattern: ExprNode;
  update: ExprNode;
  delete?: ExprNode;
  position: number;
}

/** Regex literal: /pattern/flags */
export interface RegexNode extends AstNodeBase {
  type: "regex";
  value: RegExp;
  position: number;
}

/** Union of all possible AST node types */
export type ExprNode =
  | PathNode
  | BinaryNode
  | ApplyNode
  | UnaryNode
  | NameNode
  | StringNode
  | NumberNode
  | ValueNode
  | WildcardNode
  | DescendantNode
  | ParentNode
  | FilterNode
  | SortNode
  | BlockNode
  | BindNode
  | ConditionNode
  | FunctionNode
  | VariableNode
  | LambdaNode
  | PartialNode
  | OperatorNode
  | TransformNode
  | RegexNode;

/**
 * Visual category for grouping AST nodes in the graph.
 * Maps to color scheme in DESIGN_SYSTEM.md.
 */
export type NodeCategory =
  | "path"
  | "function"
  | "operator"
  | "conditional"
  | "array"
  | "lambda"
  | "literal"
  | "transform"
  | "error";

/** Map AST node type to visual category */
export function getNodeCategory(nodeType: AstNodeType): NodeCategory {
  switch (nodeType) {
    case "path":
    case "name":
    case "variable":
    case "descendant":
    case "parent":
      return "path";
    case "function":
      return "function";
    case "binary":
    case "unary":
    case "apply":
    case "operator":
      return "operator";
    case "condition":
      return "conditional";
    case "filter":
    case "wildcard":
      return "array";
    case "lambda":
    case "partial":
    case "block":
    case "bind":
      return "lambda";
    case "string":
    case "number":
    case "value":
    case "regex":
      return "literal";
    case "sort":
    case "transform":
      return "transform";
    default:
      return "error";
  }
}

/** Color hex values per category (from DESIGN_SYSTEM.md) */
export const NODE_COLORS: Record<NodeCategory, string> = {
  path: "#58A6FF",
  function: "#BC8CFF",
  operator: "#D29922",
  conditional: "#F0883E",
  array: "#3FB950",
  lambda: "#F778BA",
  literal: "#8B949E",
  transform: "#39D2C0",
  error: "#F85149",
};
