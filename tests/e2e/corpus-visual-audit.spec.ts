/**
 * Corpus Visual Audit — Tests every JSONata expression in the corpus
 * through the UI to verify:
 *
 * 1. Expression parses without crash (no blank canvas + no error = bug)
 * 2. Nodes render on canvas (nodeCount > 0 for valid expressions)
 * 3. Parse errors from "errors" group are shown correctly
 * 4. No uncaught exceptions in console
 * 5. Node labels make cognitive sense for a no-code builder
 *
 * Results are written to tests/e2e/corpus-audit-results.json
 */

import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CorpusEntry {
  group: string;
  case: string;
  expr: string;
}

interface TestResult {
  group: string;
  case: string;
  expr: string;
  domNodeCount: number;
  hasParseError: boolean;
  hasEvalError: boolean;
  outputPreview: string;
  nodeLabels: string[];
  consoleErrors: string[];
  crashed: boolean;
  skipped: boolean;
  issues: string[];
}

interface GroupSummary {
  total: number;
  pass: number;
  fail: number;
  skipped: number;
  noNodes: number;
  parseErrors: number;
  evalErrors: number;
  crashes: number;
}

// Load corpus
const corpusPath = path.resolve(__dirname, "../fixtures/jsonata-corpus.json");
const corpus: CorpusEntry[] = JSON.parse(fs.readFileSync(corpusPath, "utf-8"));

// Groups that are EXPECTED to produce parse errors
const EXPECTED_ERROR_GROUPS = new Set(["errors"]);

// Known expressions that are intentionally invalid or test engine limits
const KNOWN_PARSE_FAILURES = new Set([
  "()", // empty block — may not parse
  // function-signatures: unsupported type parameters with lambda unicode
  "λ($arg)<n<n>>{$arg}(5)",
  'λ($arr)<(sa<n>)>>{$arr}([[1]])',
  // literals: out-of-range and invalid escapes
  "10e1000",
  '"\\y"',
  '"\\u"',
  '"\\u123t"',
  // token-conversion: invalid path syntax
  "$.7a",
  "$.7",
  // transform: intentional missing close bracket
  '$lowercase("Missing close brackets"',
  // variables: invalid assignment target
  "($a := [1,2]; $a[1]:=3; $a)",
]);

/**
 * Groups containing intentional infinite recursion that permanently freeze
 * the web worker. These test JSONata engine limits, NOT the visualizer.
 * We verify their AST parses (in the serializer corpus test) but skip
 * UI rendering to avoid worker deadlock.
 */
const SKIP_GROUPS = new Set(["tail-recursion", "performance"]);

/** Reload page every N expressions to avoid state corruption. */
const BATCH_SIZE = 75;

/** Wait for debounce (max 400ms) + parse + map + render to settle. */
const SYNC_WAIT_MS = 600;

test.describe("Corpus Visual Audit", () => {
  test.setTimeout(1_200_000); // 20 minutes

  test("all corpus expressions render correctly", async ({ page }) => {
    const results: TestResult[] = [];
    const groupStats: Record<string, GroupSummary> = {};

    async function freshLoad() {
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.removeItem("visionata-editor");
        localStorage.removeItem("visionata-flow");
        localStorage.removeItem("visionata-ui");
      });
      await page.reload();
      await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(500);
    }

    async function testExpression(
      entry: CorpusEntry,
      consoleErrors: string[],
      uncaughtErrors: string[],
    ): Promise<TestResult> {
      consoleErrors.length = 0;

      // Set expression via Zustand store directly — bypasses CodeMirror DOM
      // which doesn't support fill() (not a textarea/input)
      await page.evaluate((expr) => {
        window.__VISIONATA_CLAIM_ORIGIN__?.("text");
        window.__VISIONATA_EDITOR__?.getState().setExpression(expr);
      }, entry.expr);
      await page.waitForTimeout(SYNC_WAIT_MS);

      let domNodeCount = await page.locator(".react-flow__node").count();
      const outputEl = page.getByLabel("Evaluation Output");
      let outputText = (await outputEl.textContent()) ?? "";
      let hasParseError = outputText.startsWith("Parse Error");
      let hasEvalError = outputText.startsWith("Eval Error");

      // Retry once if zero nodes but no error on a non-expected-error expression
      // — likely a debounce timing race
      const isExpectedFailure =
        EXPECTED_ERROR_GROUPS.has(entry.group) ||
        KNOWN_PARSE_FAILURES.has(entry.expr);
      if (domNodeCount === 0 && !hasParseError && !isExpectedFailure) {
        await page.waitForTimeout(SYNC_WAIT_MS);
        domNodeCount = await page.locator(".react-flow__node").count();
        outputText = (await outputEl.textContent()) ?? "";
        hasParseError = outputText.startsWith("Parse Error");
        hasEvalError = outputText.startsWith("Eval Error");
      }

      const nodeLabels = await page
        .locator(".react-flow__node")
        .allTextContents();

      const issues: string[] = [];

      if (!isExpectedFailure) {
        if (hasParseError) {
          issues.push(`UNEXPECTED_PARSE_ERROR: ${outputText.slice(0, 100)}`);
        }
        if (domNodeCount === 0 && !hasParseError) {
          issues.push(
            "ZERO_NODES_NO_ERROR: expression produced no nodes but no parse error shown",
          );
        }
      }

      if (uncaughtErrors.length > 0) {
        issues.push(`UNCAUGHT_ERROR: ${uncaughtErrors.join("; ")}`);
        uncaughtErrors.length = 0;
      }

      if (domNodeCount > 0) {
        for (const label of nodeLabels) {
          const trimmed = label.trim();
          // "null", "true", "false", "undefined" are valid literal/name labels
          if (trimmed === "") {
            issues.push("EMPTY_LABEL: node has empty label");
          }
          if (trimmed === "path" && domNodeCount === 1) {
            issues.push(
              'GENERIC_PATH_LABEL: single node labeled "path" without detail',
            );
          }
        }
      }

      if (domNodeCount > 50) {
        issues.push(
          `EXCESSIVE_NODES: ${domNodeCount} nodes — may overwhelm no-code users`,
        );
      }

      return {
        group: entry.group,
        case: entry.case,
        expr: entry.expr,
        domNodeCount,
        hasParseError,
        hasEvalError,
        outputPreview: outputText.slice(0, 200),
        nodeLabels,
        consoleErrors: [...consoleErrors],
        crashed: false,
        skipped: false,
        issues,
      };
    }

    function ensureGroupStats(group: string) {
      if (!groupStats[group]) {
        groupStats[group] = {
          total: 0,
          pass: 0,
          fail: 0,
          skipped: 0,
          noNodes: 0,
          parseErrors: 0,
          evalErrors: 0,
          crashes: 0,
        };
      }
      return groupStats[group]!;
    }

    // Process corpus in batches
    for (
      let batchStart = 0;
      batchStart < corpus.length;
      batchStart += BATCH_SIZE
    ) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, corpus.length);
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(corpus.length / BATCH_SIZE);
      console.log(
        `Batch ${batchNum}/${totalBatches}: expressions ${batchStart + 1}-${batchEnd}`,
      );

      // Check if this batch has any non-skipped expressions
      const batchEntries = corpus.slice(batchStart, batchEnd);
      const hasTestable = batchEntries.some((e) => !SKIP_GROUPS.has(e.group));

      if (hasTestable) {
        await freshLoad();
      }

      const consoleErrors: string[] = [];
      const uncaughtErrors: string[] = [];
      if (hasTestable) {
        page.on("console", (msg) => {
          if (msg.type() === "error") consoleErrors.push(msg.text());
        });
        page.on("pageerror", (err) => uncaughtErrors.push(err.message));
      }

      for (let i = batchStart; i < batchEnd; i++) {
        const entry = corpus[i]!;
        const g = ensureGroupStats(entry.group);
        g.total++;

        // Skip groups that freeze the web worker
        if (SKIP_GROUPS.has(entry.group)) {
          g.skipped++;
          results.push({
            group: entry.group,
            case: entry.case,
            expr: entry.expr,
            domNodeCount: 0,
            hasParseError: false,
            hasEvalError: false,
            outputPreview: "",
            nodeLabels: [],
            consoleErrors: [],
            crashed: false,
            skipped: true,
            issues: [],
          });
          continue;
        }

        let result: TestResult;
        try {
          result = await testExpression(entry, consoleErrors, uncaughtErrors);
        } catch (err) {
          result = {
            group: entry.group,
            case: entry.case,
            expr: entry.expr,
            domNodeCount: 0,
            hasParseError: false,
            hasEvalError: false,
            outputPreview: "",
            nodeLabels: [],
            consoleErrors: [],
            crashed: true,
            skipped: false,
            issues: [`CRASH: ${(err as Error).message}`],
          };
        }

        results.push(result);

        if (result.issues.length === 0) g.pass++;
        else g.fail++;
        if (result.domNodeCount === 0 && !result.hasParseError) g.noNodes++;
        if (result.hasParseError) g.parseErrors++;
        if (result.hasEvalError) g.evalErrors++;
        if (result.crashed) g.crashes++;
      }
    }

    // Compute summary
    const tested = results.filter((r) => !r.skipped);
    const allIssues = tested.filter((r) => r.issues.length > 0);
    const issuesByType: Record<string, number> = {};
    for (const r of allIssues) {
      for (const issue of r.issues) {
        const type = issue.split(":")[0]!;
        issuesByType[type] = (issuesByType[type] ?? 0) + 1;
      }
    }

    const summary = {
      totalInCorpus: corpus.length,
      totalTested: tested.length,
      totalSkipped: results.filter((r) => r.skipped).length,
      totalPassed: tested.filter((r) => r.issues.length === 0).length,
      totalFailed: allIssues.length,
      issuesByType,
      groupStats,
    };

    const outputPath = path.resolve(__dirname, "corpus-audit-results.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        { summary, issues: allIssues, allResults: results },
        null,
        2,
      ),
    );

    console.log("\n========== CORPUS VISUAL AUDIT SUMMARY ==========");
    console.log(`Total in corpus: ${summary.totalInCorpus}`);
    console.log(`Tested: ${summary.totalTested}`);
    console.log(`Skipped: ${summary.totalSkipped}`);
    console.log(`Passed: ${summary.totalPassed}`);
    console.log(`Issues found: ${summary.totalFailed}`);
    console.log("Issue breakdown:", summary.issuesByType);
    console.log(`Results written to: ${outputPath}`);
    console.log("==================================================\n");

    const crashes = tested.filter((r) => r.crashed);
    expect(
      crashes.length,
      `${crashes.length} expressions caused crashes`,
    ).toBe(0);
  });
});
