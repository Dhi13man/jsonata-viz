/**
 * EditorStore — source of truth for expression text and JSON input.
 * Persisted to localStorage: expression text + input JSON only.
 */

import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { ExprNode } from "@/lib/jsonata/types";
import type { JsonataError } from "@/lib/jsonata/parser";

interface EditorState {
  /** Current JSONata expression text */
  expression: string;
  /** Current JSON input text */
  inputJson: string;
  /** Parsed AST (derived, not persisted) */
  ast: ExprNode | null;
  /** Parse error (derived, not persisted) */
  parseError: JsonataError | null;
  /** Evaluation result */
  evalResult: unknown;
  /** Evaluation error */
  evalError: JsonataError | null;
  /** Evaluation timing in ms */
  evalTiming: number;
  /** Whether evaluation is in progress */
  isEvaluating: boolean;
}

interface EditorActions {
  setExpression: (expression: string) => void;
  setInputJson: (input: string) => void;
  setAst: (ast: ExprNode | null, error: JsonataError | null) => void;
  setEvalResult: (
    result: unknown,
    error: JsonataError | null,
    timing: number,
  ) => void;
  setIsEvaluating: (evaluating: boolean) => void;
}

const DEFAULT_EXPRESSION = "Account.Order.Product.Price";
const DEFAULT_INPUT = JSON.stringify(
  {
    Account: {
      "Account Name": "Firefly",
      Order: [
        {
          OrderID: "order103",
          Product: [
            { "Product Name": "Bowler Hat", Price: 34.45, Quantity: 2 },
            { "Product Name": "Trilby hat", Price: 21.67, Quantity: 1 },
          ],
        },
        {
          OrderID: "order104",
          Product: [{ "Product Name": "Cloak", Price: 107.99, Quantity: 1 }],
        },
      ],
    },
  },
  null,
  2,
);

export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        expression: DEFAULT_EXPRESSION,
        inputJson: DEFAULT_INPUT,
        ast: null,
        parseError: null,
        evalResult: undefined,
        evalError: null,
        evalTiming: 0,
        isEvaluating: false,

        setExpression: (expression) => set({ expression }),
        setInputJson: (inputJson) => set({ inputJson }),
        setAst: (ast, parseError) => set({ ast, parseError }),
        setEvalResult: (evalResult, evalError, evalTiming) =>
          set({ evalResult, evalError, evalTiming, isEvaluating: false }),
        setIsEvaluating: (isEvaluating) => set({ isEvaluating }),
      }),
      {
        name: "visionata-editor",
        version: 1,
        partialize: (state) => ({
          expression: state.expression,
          inputJson: state.inputJson,
        }),
        merge: (persisted, current) => {
          const p = persisted as Partial<EditorState> | undefined;
          return {
            ...current,
            expression:
              typeof p?.expression === "string"
                ? p.expression
                : current.expression,
            inputJson:
              typeof p?.inputJson === "string"
                ? p.inputJson
                : current.inputJson,
          };
        },
      },
    ),
  ),
);
