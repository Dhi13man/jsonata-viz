/**
 * Node palette sidebar — Phase 2.1.
 * Searchable list of JSONata node types grouped by category.
 * Supports drag-to-canvas (Phase 2.2).
 */

import { useState, useCallback, type DragEvent } from "react";
import {
  Route,
  Sparkles,
  Calculator,
  GitBranch,
  List,
  Code2,
  Quote,
  ArrowUpDown,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { NodeCategory } from "@/lib/jsonata/types";
import { NODE_COLORS } from "@/lib/jsonata/types";

interface PaletteItem {
  type: string;
  label: string;
  description: string;
  category: NodeCategory;
  template: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Path
  { type: "name", label: "Field", description: "Access a field by name", category: "path", template: "fieldName" },
  { type: "path", label: "Path", description: "Navigate nested fields", category: "path", template: "a.b.c" },
  { type: "variable", label: "Variable", description: "Reference a variable", category: "path", template: "$var" },
  { type: "wildcard", label: "Wildcard", description: "Match all fields", category: "array", template: "*" },
  { type: "descendant", label: "Descendant", description: "Deep search", category: "path", template: "**" },
  // Functions
  { type: "function", label: "Function Call", description: "Call a built-in function", category: "function", template: "$sum()" },
  { type: "lambda", label: "Lambda", description: "Define an anonymous function", category: "lambda", template: "function($v){$v}" },
  // Operators
  { type: "binary-add", label: "Add (+)", description: "Addition", category: "operator", template: "a + b" },
  { type: "binary-sub", label: "Subtract (-)", description: "Subtraction", category: "operator", template: "a - b" },
  { type: "binary-mul", label: "Multiply (*)", description: "Multiplication", category: "operator", template: "a * b" },
  { type: "binary-div", label: "Divide (/)", description: "Division", category: "operator", template: "a / b" },
  { type: "binary-eq", label: "Equals (=)", description: "Equality check", category: "operator", template: "a = b" },
  { type: "binary-concat", label: "Concat (&)", description: "String concatenation", category: "operator", template: 'a & " " & b' },
  { type: "binary-range", label: "Range (..)", description: "Number range", category: "operator", template: "[1..10]" },
  { type: "apply", label: "Chain (~>)", description: "Pipe/chain operator", category: "operator", template: "a ~> $sum()" },
  // Conditional
  { type: "condition", label: "Conditional", description: "If-then-else", category: "conditional", template: "a ? b : c" },
  // Array
  { type: "filter", label: "Filter", description: "Array predicate filter", category: "array", template: "items[price > 10]" },
  { type: "sort", label: "Sort", description: "Sort array", category: "array", template: "items^(>price)" },
  { type: "unary-array", label: "Array", description: "Array construction", category: "operator", template: "[1, 2, 3]" },
  // Literals
  { type: "string", label: "String", description: "String literal", category: "literal", template: '"hello"' },
  { type: "number", label: "Number", description: "Number literal", category: "literal", template: "42" },
  { type: "regex", label: "Regex", description: "Regular expression", category: "literal", template: "/pattern/i" },
  // Transform
  { type: "transform", label: "Transform", description: "Object transform", category: "transform", template: "|data|{\"new\": old}|" },
  { type: "block", label: "Block", description: "Expression block", category: "lambda", template: "($x := 1; $x + 1)" },
  { type: "bind", label: "Bind", description: "Variable binding", category: "lambda", template: "$x := value" },
];

const CATEGORY_ICONS: Record<NodeCategory, LucideIcon> = {
  path: Route,
  function: Sparkles,
  operator: Calculator,
  conditional: GitBranch,
  array: List,
  lambda: Code2,
  literal: Quote,
  transform: ArrowUpDown,
  error: Route,
};

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  path: "Paths & Fields",
  function: "Functions",
  operator: "Operators",
  conditional: "Conditionals",
  array: "Array & Filters",
  lambda: "Lambdas & Blocks",
  literal: "Literals",
  transform: "Transforms",
  error: "Other",
};

const CATEGORY_ORDER: NodeCategory[] = [
  "path",
  "function",
  "operator",
  "conditional",
  "array",
  "lambda",
  "literal",
  "transform",
];

interface NodePaletteProps {
  onInsertExpression: (template: string) => void;
}

export function NodePalette({ onInsertExpression }: NodePaletteProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? PALETTE_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase()) ||
          item.template.toLowerCase().includes(search.toLowerCase()),
      )
    : PALETTE_ITEMS;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: filtered.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  const onDragStart = useCallback((e: DragEvent, template: string) => {
    e.dataTransfer.setData("application/visionata-template", template);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      {/* Search */}
      <div className="shrink-0 border-b p-2" style={{ borderColor: "var(--border-default)" }}>
        <div
          className="flex items-center gap-2 rounded-md px-2 py-1.5"
          style={{ backgroundColor: "var(--bg-elevated)" }}
        >
          <Search size={14} style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-none bg-transparent text-xs outline-none"
            style={{ color: "var(--text-primary)" }}
            aria-label="Search palette nodes"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {grouped.map(({ category, items }) => {
          const Icon = CATEGORY_ICONS[category];
          const color = NODE_COLORS[category];
          return (
            <div key={category} className="mb-3">
              <div
                className="mb-1 flex items-center gap-1.5 px-1 text-[11px] font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Icon size={12} style={{ color }} />
                {CATEGORY_LABELS[category]}
              </div>
              {items.map((item) => (
                <button
                  key={item.type}
                  className="flex w-full cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--bg-elevated)] active:cursor-grabbing"
                  style={{ color: "var(--text-secondary)", border: "none", background: "none" }}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.template)}
                  onClick={() => onInsertExpression(item.template)}
                  title={`${item.description}\nTemplate: ${item.template}`}
                  aria-label={`Insert ${item.label}: ${item.description}`}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
