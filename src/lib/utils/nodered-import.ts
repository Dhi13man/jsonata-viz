/**
 * Node-RED flow import — Phase 4.3.
 * Extracts JSONata expressions from Node-RED flow JSON.
 * Node-RED function nodes and change nodes can contain JSONata expressions.
 */

interface NodeRedNode {
  id: string;
  type: string;
  name?: string;
  func?: string;
  rules?: Array<{
    t: string; // "jsonata"
    p: string;
    pt: string;
    to: string;
    tot: string;
  }>;
  [key: string]: unknown;
}

export interface ExtractedExpression {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  expression: string;
  context: string;
}

/**
 * Extract JSONata expressions from a Node-RED flow JSON.
 * Searches change nodes (rules with tot/pt = "jsonata") and
 * any node properties containing JSONata-like expressions.
 */
export function extractFromNodeRed(flowJson: string): ExtractedExpression[] {
  let nodes: NodeRedNode[];
  try {
    const parsed = JSON.parse(flowJson);
    nodes = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }

  const results: ExtractedExpression[] = [];

  for (const node of nodes) {
    if (!node || typeof node !== "object" || !node.type) continue;

    const nodeName = node.name || node.id || "unknown";

    // Change nodes with JSONata rules
    if (node.type === "change" && Array.isArray(node.rules)) {
      for (const rule of node.rules) {
        if (rule.tot === "jsonata" && rule.to) {
          results.push({
            nodeId: node.id,
            nodeName,
            nodeType: node.type,
            expression: rule.to,
            context: `Set ${rule.p} (${rule.pt})`,
          });
        }
        if (rule.t === "jsonata" && rule.p) {
          results.push({
            nodeId: node.id,
            nodeName,
            nodeType: node.type,
            expression: rule.p,
            context: "JSONata rule",
          });
        }
      }
    }

    // Switch nodes with JSONata conditions
    if (node.type === "switch" && Array.isArray(node.rules)) {
      for (const rule of node.rules) {
        if (
          rule.t === "jsonata" &&
          typeof (rule as Record<string, unknown>).v === "string"
        ) {
          results.push({
            nodeId: node.id,
            nodeName,
            nodeType: node.type,
            expression: (rule as Record<string, unknown>).v as string,
            context: "Switch condition",
          });
        }
      }
    }

    // Any string property that looks like JSONata (contains $, ~>, or common patterns)
    for (const [key, value] of Object.entries(node)) {
      if (
        key === "id" ||
        key === "type" ||
        key === "name" ||
        key === "func"
      )
        continue;
      if (typeof value !== "string" || value.length < 3) continue;
      if (/\$[a-zA-Z_]|~>|\.\./.test(value)) {
        // Likely a JSONata expression
        const alreadyFound = results.some(
          (r) => r.nodeId === node.id && r.expression === value,
        );
        if (!alreadyFound) {
          results.push({
            nodeId: node.id,
            nodeName,
            nodeType: node.type,
            expression: value,
            context: `Property: ${key}`,
          });
        }
      }
    }
  }

  return results;
}
