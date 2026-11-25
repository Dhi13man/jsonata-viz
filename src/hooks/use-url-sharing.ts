/**
 * Hook that reads share data from URL on mount.
 * If URL contains compressed expression data, loads it into the editor.
 * If URL contains test suite data, loads it into the test store.
 */

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useTestSuiteStore } from "@/stores/test-suite-store";
import { decodeShareUrl } from "@/lib/utils/lz-url";
import type { TestCase } from "@/stores/test-suite-store";

export function useUrlSharing() {
  useEffect(() => {
    const shareData = decodeShareUrl();
    if (shareData) {
      useEditorStore.getState().setExpression(shareData.expression);
      if (shareData.input) {
        useEditorStore.getState().setInputJson(shareData.input);
      }
      if (shareData.tests) {
        try {
          const testCases = JSON.parse(shareData.tests) as TestCase[];
          if (Array.isArray(testCases)) {
            useTestSuiteStore.getState().importTestCases(testCases);
          }
        } catch {
          // Invalid test data, skip
        }
      }
      // Clean URL without reload
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);
}
