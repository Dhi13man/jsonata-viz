/**
 * Web Worker for JSONata evaluation.
 *
 * Runs in a dedicated worker thread to prevent main thread blocking.
 * Self-terminates after timeout (default 5s).
 * $eval binding is disabled for security.
 */

import jsonata from "jsonata";

export interface EvalRequest {
  id: string;
  expression: string;
  input: string;
  timeout?: number;
}

export interface EvalResponse {
  id: string;
  result?: unknown;
  error?: { code: string; message: string; position?: number; token?: string };
  timing: number;
}

const DEFAULT_TIMEOUT = 5000;

self.onmessage = async (event: MessageEvent<EvalRequest>) => {
  const { id, expression, input, timeout = DEFAULT_TIMEOUT } = event.data;
  const start = performance.now();

  // Set up timeout timer — bridge owns worker lifecycle via terminateWorker()
  const timer = setTimeout(() => {
    const response: EvalResponse = {
      id,
      error: {
        code: "TIMEOUT",
        message: `Expression timed out after ${timeout}ms.`,
      },
      timing: timeout,
    };
    self.postMessage(response);
  }, timeout);

  try {
    const compiled = jsonata(expression);

    // Disable $eval for security (prevents dynamic code execution from shared URLs)
    compiled.registerFunction("eval", () => {
      throw new Error("$eval is disabled for security.");
    });

    const parsedInput = input.trim() ? JSON.parse(input) : undefined;
    const result = await compiled.evaluate(parsedInput);
    const timing = performance.now() - start;

    clearTimeout(timer);

    const response: EvalResponse = { id, result, timing };
    self.postMessage(response);
  } catch (err: unknown) {
    clearTimeout(timer);
    const timing = performance.now() - start;

    const e = err as {
      code?: string;
      message?: string;
      position?: number;
      token?: string;
    };

    const response: EvalResponse = {
      id,
      error: {
        code: e.code ?? "EVAL_ERROR",
        message: e.message ?? "Unknown evaluation error",
        position: e.position,
        token: e.token,
      },
      timing,
    };
    self.postMessage(response);
  }
};
