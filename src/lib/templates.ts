/**
 * Starter templates — Phase 2.10.
 * Common JSONata patterns with sample input.
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  expression: string;
  sampleInput: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "simple-path",
    name: "Simple Path",
    description: "Navigate nested objects",
    category: "Basics",
    expression: "Account.Order.Product.Price",
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [{ Price: 34.45 }, { Price: 21.67 }] },
          { Product: [{ Price: 107.99 }] },
        ],
      },
    }, null, 2),
  },
  {
    id: "array-filter",
    name: "Array Filter",
    description: "Filter items by condition",
    category: "Basics",
    expression: "Account.Order.Product[Price > 30]",
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [
            { "Product Name": "Bowler Hat", Price: 34.45 },
            { "Product Name": "Trilby", Price: 21.67 },
          ]},
          { Product: [{ "Product Name": "Cloak", Price: 107.99 }] },
        ],
      },
    }, null, 2),
  },
  {
    id: "aggregation",
    name: "Aggregation",
    description: "Sum, count, and average",
    category: "Functions",
    expression: '$sum(Account.Order.Product.Price)',
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [{ Price: 34.45 }, { Price: 21.67 }] },
          { Product: [{ Price: 107.99 }] },
        ],
      },
    }, null, 2),
  },
  {
    id: "string-manipulation",
    name: "String Manipulation",
    description: "Concatenation and transformation",
    category: "Functions",
    expression: 'Account.Order.Product.("Product: " & `Product Name` & " @ $" & $string(Price))',
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [
            { "Product Name": "Bowler Hat", Price: 34.45 },
            { "Product Name": "Trilby", Price: 21.67 },
          ]},
        ],
      },
    }, null, 2),
  },
  {
    id: "conditional",
    name: "Conditional Logic",
    description: "If-then-else expressions",
    category: "Logic",
    expression: 'Account.Order.Product.(Price > 50 ? "expensive" : "affordable")',
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [{ Price: 34.45 }, { Price: 107.99 }] },
        ],
      },
    }, null, 2),
  },
  {
    id: "object-transform",
    name: "Object Transform",
    description: "Reshape data structure",
    category: "Transform",
    expression: 'Account.Order.{"orderId": OrderID, "total": $sum(Product.Price), "items": $count(Product)}',
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { OrderID: "order103", Product: [{ Price: 34.45 }, { Price: 21.67 }] },
          { OrderID: "order104", Product: [{ Price: 107.99 }] },
        ],
      },
    }, null, 2),
  },
  {
    id: "map-reduce",
    name: "Map & Reduce",
    description: "Transform and aggregate data",
    category: "Functions",
    expression: 'Account.Order ~> $map(function($o){$sum($o.Product.Price)})',
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [{ Price: 34.45 }, { Price: 21.67 }] },
          { Product: [{ Price: 107.99 }] },
        ],
      },
    }, null, 2),
  },
  {
    id: "sorting",
    name: "Sort Array",
    description: "Sort items by field",
    category: "Array",
    expression: "Account.Order.Product^(>Price)",
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [
            { "Product Name": "Bowler Hat", Price: 34.45 },
            { "Product Name": "Trilby", Price: 21.67 },
            { "Product Name": "Cloak", Price: 107.99 },
          ]},
        ],
      },
    }, null, 2),
  },
  {
    id: "variable-binding",
    name: "Variable Binding",
    description: "Assign and reuse values",
    category: "Advanced",
    expression: '($prices := Account.Order.Product.Price; {"min": $min($prices), "max": $max($prices), "avg": $average($prices)})',
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [{ Price: 34.45 }, { Price: 21.67 }] },
          { Product: [{ Price: 107.99 }] },
        ],
      },
    }, null, 2),
  },
  {
    id: "lambda",
    name: "Lambda Functions",
    description: "Define inline functions",
    category: "Advanced",
    expression: '($discount := function($p, $pct){$p * (1 - $pct / 100)}; Account.Order.Product.{"name": `Product Name`, "discounted": $discount(Price, 10)})',
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [
            { "Product Name": "Bowler Hat", Price: 34.45 },
            { "Product Name": "Cloak", Price: 107.99 },
          ]},
        ],
      },
    }, null, 2),
  },
  {
    id: "regex-match",
    name: "Regex Pattern Matching",
    description: "Match and extract with regex",
    category: "Advanced",
    expression: 'Account.Order.Product[`Product Name` ~> /hat/i].`Product Name`',
    sampleInput: JSON.stringify({
      Account: {
        Order: [
          { Product: [
            { "Product Name": "Bowler Hat", Price: 34.45 },
            { "Product Name": "Trilby hat", Price: 21.67 },
            { "Product Name": "Cloak", Price: 107.99 },
          ]},
        ],
      },
    }, null, 2),
  },
  {
    id: "range",
    name: "Number Range",
    description: "Generate a sequence of numbers",
    category: "Basics",
    expression: "[1..10].$",
    sampleInput: "{}",
  },
];
