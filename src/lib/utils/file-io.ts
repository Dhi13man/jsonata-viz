/**
 * File import/export — Phase 2.9.
 * Exports/imports .jsonata format (JSON containing expression, input, tests).
 */

import type { TestCase } from "@/stores/test-suite-store";

interface VisionataFile {
  version: 1;
  expression: string;
  inputJson: string;
  testCases?: TestCase[];
}

export function exportFile(data: VisionataFile): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expression.visionata.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importFile(): Promise<VisionataFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.jsonata";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        // Validate minimal structure
        if (typeof data.expression === "string") {
          resolve({
            version: data.version ?? 1,
            expression: data.expression,
            inputJson: data.inputJson ?? "{}",
            testCases: Array.isArray(data.testCases) ? data.testCases : undefined,
          });
        } else if (typeof data === "string") {
          // Plain .jsonata text file
          resolve({
            version: 1,
            expression: data,
            inputJson: "{}",
          });
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}
