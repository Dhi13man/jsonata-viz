/**
 * Main-thread bridge to the JSONata evaluation Web Worker.
 *
 * Manages worker lifecycle:
 * - Spawns worker on first use
 * - Respawns if worker dies (timeout self-close)
 * - Tracks pending requests via Map<id, callback>
 * - Generates unique request IDs
 */

import type { EvalRequest, EvalResponse } from "./eval-worker";

type EvalCallback = (response: EvalResponse) => void;

let worker: Worker | null = null;
let requestCounter = 0;
const pendingRequests = new Map<string, EvalCallback>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./eval-worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<EvalResponse>) => {
      const response = event.data;
      const callback = pendingRequests.get(response.id);
      if (callback) {
        pendingRequests.delete(response.id);
        callback(response);
      }
    };

    worker.onerror = (event) => {
      console.error("[EvalBridge] Worker error:", event.message);
      // Respawn on error
      terminateWorker();
      // Reject all pending
      for (const [id, cb] of pendingRequests) {
        cb({
          id,
          error: {
            code: "WORKER_ERROR",
            message: "Evaluation worker crashed. Respawning.",
          },
          timing: 0,
        });
      }
      pendingRequests.clear();
    };
  }
  return worker;
}

function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

/**
 * Evaluate a JSONata expression in the Web Worker.
 * Returns a promise that resolves with the evaluation response.
 */
export function evaluate(
  expression: string,
  input: string,
  timeout?: number,
): Promise<EvalResponse> {
  return new Promise((resolve) => {
    const id = `eval-${++requestCounter}`;

    pendingRequests.set(id, (response) => {
      // If worker timed out and self-closed, we need to respawn
      if (response.error?.code === "TIMEOUT") {
        terminateWorker();
      }
      resolve(response);
    });

    const request: EvalRequest = { id, expression, input, timeout };

    try {
      getWorker().postMessage(request);
    } catch {
      pendingRequests.delete(id);
      resolve({
        id,
        error: {
          code: "WORKER_ERROR",
          message: "Failed to send message to evaluation worker.",
        },
        timing: 0,
      });
    }
  });
}
