/**
 * Auto-run test suite on expression or input changes — Phase 2.8.
 * Debounced to avoid excessive re-runs.
 */

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useTestSuiteStore } from "@/stores/test-suite-store";
import { evaluate } from "@/lib/worker/eval-bridge";

function evalAdapter(
  expr: string,
  input: string,
): Promise<{ result?: unknown; error?: string }> {
  return evaluate(expr, input).then((r) => ({
    result: r.result,
    error: r.error ? `${r.error.code}: ${r.error.message}` : undefined,
  }));
}

export function useAutoTestRunner() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = useEditorStore.subscribe(
      (s) => s.expression,
      () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          const { testCases, isRunning, runAllTests } =
            useTestSuiteStore.getState();
          if (testCases.length > 0 && !isRunning) {
            runAllTests(evalAdapter);
          }
        }, 1500);
      },
    );

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
