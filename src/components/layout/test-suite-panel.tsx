/**
 * Test suite panel — Phase 2.7/3.1.
 * CRUD for test cases + run tests + pass/fail display.
 */

import { useCallback, useEffect } from "react";
import {
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  Upload,
} from "lucide-react";
import { useTestSuiteStore, type TestCase } from "@/stores/test-suite-store";
import { useEditorStore } from "@/stores/editor-store";
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

export function TestSuitePanel() {
  const testCases = useTestSuiteStore((s) => s.testCases);
  const isRunning = useTestSuiteStore((s) => s.isRunning);
  const passCount = useTestSuiteStore((s) => s.passCount);
  const failCount = useTestSuiteStore((s) => s.failCount);
  const hydrated = useTestSuiteStore((s) => s.hydrated);
  const addTestCase = useTestSuiteStore((s) => s.addTestCase);
  const removeTestCase = useTestSuiteStore((s) => s.removeTestCase);
  const runAllTests = useTestSuiteStore((s) => s.runAllTests);
  const clearAll = useTestSuiteStore((s) => s.clearAll);
  const importTestCases = useTestSuiteStore((s) => s.importTestCases);
  const hydrate = useTestSuiteStore((s) => s.hydrate);

  const expression = useEditorStore((s) => s.expression);
  const inputJson = useEditorStore((s) => s.inputJson);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const handleAddTest = useCallback(() => {
    addTestCase({
      name: `Test ${testCases.length + 1}`,
      expression,
      inputJson,
      expectedOutput: "",
    });
  }, [addTestCase, testCases.length, expression, inputJson]);

  const handleRunAll = useCallback(() => {
    runAllTests(evalAdapter);
  }, [runAllTests]);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(testCases, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visionata-tests.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [testCases]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const cases = JSON.parse(text) as TestCase[];
        if (Array.isArray(cases)) {
          importTestCases(cases);
        }
      } catch { /* invalid file */ }
    };
    input.click();
  }, [importTestCases]);

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: "var(--bg-surface)" }}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-3 py-2"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            Tests
          </span>
          {testCases.length > 0 && (
            <span
              className="rounded-full px-1.5 text-[10px]"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-secondary)",
              }}
            >
              {passCount}/{testCases.length} pass
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <PanelButton icon={<Upload size={12} />} label="Import" onClick={handleImport} />
          <PanelButton icon={<Download size={12} />} label="Export" onClick={handleExport} />
          <PanelButton icon={<Plus size={12} />} label="Add test" onClick={handleAddTest} />
          <PanelButton
            icon={<Play size={12} />}
            label={isRunning ? "Running..." : "Run all"}
            onClick={handleRunAll}
            disabled={isRunning || testCases.length === 0}
            accent
          />
        </div>
      </div>

      {/* Test cases list */}
      <div className="flex-1 overflow-y-auto">
        {testCases.length === 0 && (
          <div
            className="flex flex-col items-center justify-center p-6 text-center"
            style={{ color: "var(--text-tertiary)" }}
          >
            <p className="text-xs">No test cases yet</p>
            <button
              onClick={handleAddTest}
              className="mt-2 cursor-pointer rounded-md border-none px-3 py-1.5 text-xs"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-secondary)",
              }}
            >
              + Add first test
            </button>
          </div>
        )}
        {testCases.map((tc) => (
          <TestCaseRow key={tc.id} testCase={tc} onRemove={removeTestCase} />
        ))}
      </div>

      {/* Footer */}
      {testCases.length > 0 && (
        <div
          className="flex shrink-0 items-center justify-between border-t px-3 py-1.5 text-[10px]"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-tertiary)",
          }}
        >
          <span>
            {passCount} pass / {failCount} fail
          </span>
          <button
            onClick={clearAll}
            className="cursor-pointer border-none bg-transparent text-[10px] transition-colors"
            style={{ color: "var(--color-error)" }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function TestCaseRow({
  testCase,
  onRemove,
}: {
  testCase: TestCase;
  onRemove: (id: string) => void;
}) {
  const StatusIcon = {
    pending: Clock,
    pass: CheckCircle2,
    fail: XCircle,
    error: AlertCircle,
  }[testCase.status];

  const statusColor = {
    pending: "var(--text-tertiary)",
    pass: "var(--color-success)",
    fail: "var(--color-error)",
    error: "var(--color-warning)",
  }[testCase.status];

  return (
    <div
      className="flex items-center gap-2 border-b px-3 py-2"
      style={{ borderColor: "var(--border-default)" }}
    >
      <StatusIcon size={14} style={{ color: statusColor, flexShrink: 0 }} />
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-xs"
          style={{ color: "var(--text-primary)" }}
        >
          {testCase.name}
        </div>
        <div
          className="truncate font-mono text-[10px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {testCase.expression.slice(0, 60)}
        </div>
      </div>
      <button
        onClick={() => onRemove(testCase.id)}
        className="shrink-0 cursor-pointer rounded border-none bg-transparent p-1 transition-colors hover:bg-[var(--bg-elevated)]"
        style={{ color: "var(--text-tertiary)" }}
        aria-label={`Remove test: ${testCase.name}`}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function PanelButton({
  icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex cursor-pointer items-center gap-1 rounded-md border-none px-2 py-1 text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        backgroundColor: accent ? "var(--border-active)" : "transparent",
        color: accent ? "white" : "var(--text-secondary)",
      }}
      title={label}
      aria-label={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
