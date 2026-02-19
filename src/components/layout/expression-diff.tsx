/**
 * Expression diff/comparison view — Phase 3.3.
 * Side-by-side display of two expressions with token-level diff highlighting.
 */

import { useState, useCallback, useMemo } from "react";
import { useEditorStore } from "@/stores/editor-store";

interface DiffToken {
  text: string;
  type: "unchanged" | "added" | "removed";
}

/** Simple word-level diff using LCS algorithm */
function computeDiff(a: string, b: string): { left: DiffToken[]; right: DiffToken[] } {
  const wordsA = a.split(/(\s+|[(){}[\].,;:~><=!&|+\-*/^?$@#`"']+)/);
  const wordsB = b.split(/(\s+|[(){}[\].,;:~><=!&|+\-*/^?$@#`"']+)/);

  // LCS table
  const m = wordsA.length;
  const n = wordsB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        wordsA[i - 1] === wordsB[j - 1]
          ? dp[i - 1]![j - 1]! + 1
          : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }

  // Backtrack
  const left: DiffToken[] = [];
  const right: DiffToken[] = [];
  let i = m;
  let j = n;
  const stackL: DiffToken[] = [];
  const stackR: DiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
      stackL.push({ text: wordsA[i - 1]!, type: "unchanged" });
      stackR.push({ text: wordsB[j - 1]!, type: "unchanged" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      stackR.push({ text: wordsB[j - 1]!, type: "added" });
      j--;
    } else {
      stackL.push({ text: wordsA[i - 1]!, type: "removed" });
      i--;
    }
  }

  left.push(...stackL.reverse());
  right.push(...stackR.reverse());
  return { left, right };
}

export function ExpressionDiff() {
  const currentExpression = useEditorStore((s) => s.expression);
  const [compareExpression, setCompareExpression] = useState("");

  const diff = useMemo(
    () => computeDiff(currentExpression, compareExpression),
    [currentExpression, compareExpression],
  );

  const handleCompareChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCompareExpression(e.target.value);
    },
    [],
  );

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      <div
        className="shrink-0 border-b px-3 py-2 text-[11px] font-medium"
        style={{
          borderColor: "var(--border-default)",
          color: "var(--text-tertiary)",
        }}
      >
        Expression Diff
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-px" style={{ backgroundColor: "var(--border-default)" }}>
        {/* Current expression (left) */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <div
            className="shrink-0 px-3 py-1 text-[10px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Current
          </div>
          <div className="flex-1 overflow-auto p-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
            {diff.left.map((token, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor:
                    token.type === "removed"
                      ? "rgba(248, 81, 73, 0.2)"
                      : "transparent",
                  textDecoration:
                    token.type === "removed" ? "line-through" : "none",
                }}
              >
                {token.text}
              </span>
            ))}
          </div>
        </div>

        {/* Compare expression (right) */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          <div
            className="shrink-0 px-3 py-1 text-[10px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Compare (paste expression)
          </div>
          <textarea
            value={compareExpression}
            onChange={handleCompareChange}
            placeholder="Paste a second expression to compare..."
            className="h-16 w-full shrink-0 resize-none border-b border-none p-3 font-mono text-xs outline-none"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
            }}
            spellCheck={false}
          />
          <div className="flex-1 overflow-auto p-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
            {diff.right.map((token, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor:
                    token.type === "added"
                      ? "rgba(63, 185, 80, 0.2)"
                      : "transparent",
                }}
              >
                {token.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
