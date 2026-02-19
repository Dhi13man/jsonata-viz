/**
 * TestSuiteStore — test case management with IndexedDB persistence.
 * Phase 2.7: CRUD for test cases.
 * Phase 3.1: Regression test runner.
 */

import { create } from "zustand";
import { openDB, type IDBPDatabase } from "idb";

export interface TestCase {
  id: string;
  name: string;
  inputJson: string;
  expression: string;
  expectedOutput: string;
  /** Last evaluation result (stringified) */
  lastResult?: string;
  lastError?: string;
  status: "pending" | "pass" | "fail" | "error";
  createdAt: number;
  updatedAt: number;
}

interface TestSuiteState {
  testCases: TestCase[];
  isRunning: boolean;
  passCount: number;
  failCount: number;
  /** Whether the store has been hydrated from IndexedDB */
  hydrated: boolean;
}

interface TestSuiteActions {
  /** Hydrate from IndexedDB on mount */
  hydrate: () => Promise<void>;
  addTestCase: (tc: Omit<TestCase, "id" | "createdAt" | "updatedAt" | "status">) => Promise<void>;
  updateTestCase: (id: string, updates: Partial<TestCase>) => Promise<void>;
  removeTestCase: (id: string) => Promise<void>;
  /** Run a single test case against current expression/input */
  runTestCase: (id: string, evaluate: (expr: string, input: string) => Promise<{ result?: unknown; error?: string }>) => Promise<void>;
  /** Run all test cases */
  runAllTests: (evaluate: (expr: string, input: string) => Promise<{ result?: unknown; error?: string }>) => Promise<void>;
  /** Import test cases from JSON */
  importTestCases: (cases: TestCase[]) => Promise<void>;
  /** Clear all test cases */
  clearAll: () => Promise<void>;
}

const DB_NAME = "visionata-tests";
const STORE_NAME = "test-cases";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

function generateId(): string {
  return `tc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useTestSuiteStore = create<TestSuiteState & TestSuiteActions>()(
  (set, get) => ({
    testCases: [],
    isRunning: false,
    passCount: 0,
    failCount: 0,
    hydrated: false,

    hydrate: async () => {
      try {
        const db = await getDB();
        const all = await db.getAll(STORE_NAME);
        const cases = (all as TestCase[]).sort((a, b) => a.createdAt - b.createdAt);
        set({ testCases: cases, hydrated: true });
      } catch {
        set({ hydrated: true });
      }
    },

    addTestCase: async (tc) => {
      const now = Date.now();
      const testCase: TestCase = {
        ...tc,
        id: generateId(),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      try {
        const db = await getDB();
        await db.put(STORE_NAME, testCase);
      } catch { /* IDB unavailable */ }
      set((s) => ({ testCases: [...s.testCases, testCase] }));
    },

    updateTestCase: async (id, updates) => {
      const existing = get().testCases.find((tc) => tc.id === id);
      if (!existing) return;
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      try {
        const db = await getDB();
        await db.put(STORE_NAME, updated);
      } catch { /* IDB unavailable */ }
      set((s) => ({
        testCases: s.testCases.map((tc) => (tc.id === id ? updated : tc)),
      }));
    },

    removeTestCase: async (id) => {
      try {
        const db = await getDB();
        await db.delete(STORE_NAME, id);
      } catch { /* IDB unavailable */ }
      set((s) => ({
        testCases: s.testCases.filter((tc) => tc.id !== id),
      }));
    },

    runTestCase: async (id, evaluate) => {
      const tc = get().testCases.find((t) => t.id === id);
      if (!tc) return;

      try {
        const { result, error } = await evaluate(tc.expression, tc.inputJson);
        if (error) {
          get().updateTestCase(id, { status: "error", lastError: error, lastResult: undefined });
          return;
        }
        const resultStr = JSON.stringify(result, null, 2);
        const expectedStr = tc.expectedOutput.trim();
        // Normalize comparison: parse both as JSON if possible
        let pass = false;
        try {
          pass = JSON.stringify(JSON.parse(resultStr)) === JSON.stringify(JSON.parse(expectedStr));
        } catch {
          pass = resultStr === expectedStr;
        }
        get().updateTestCase(id, {
          status: pass ? "pass" : "fail",
          lastResult: resultStr,
          lastError: undefined,
        });
      } catch (e) {
        get().updateTestCase(id, {
          status: "error",
          lastError: e instanceof Error ? e.message : String(e),
        });
      }
    },

    runAllTests: async (evaluate) => {
      set({ isRunning: true });
      const cases = get().testCases;
      let pass = 0;
      let fail = 0;
      for (const tc of cases) {
        await get().runTestCase(tc.id, evaluate);
        const updated = get().testCases.find((t) => t.id === tc.id);
        if (updated?.status === "pass") pass++;
        else fail++;
      }
      set({ isRunning: false, passCount: pass, failCount: fail });
    },

    importTestCases: async (cases) => {
      const now = Date.now();
      const withIds = cases.map((tc, i) => ({
        ...tc,
        id: tc.id || generateId(),
        createdAt: tc.createdAt || now + i,
        updatedAt: now,
        status: "pending" as const,
      }));
      try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        for (const tc of withIds) {
          tx.store.put(tc);
        }
        await tx.done;
      } catch { /* IDB unavailable */ }
      set((s) => ({ testCases: [...s.testCases, ...withIds] }));
    },

    clearAll: async () => {
      try {
        const db = await getDB();
        await db.clear(STORE_NAME);
      } catch { /* IDB unavailable */ }
      set({ testCases: [], passCount: 0, failCount: 0 });
    },
  }),
);
