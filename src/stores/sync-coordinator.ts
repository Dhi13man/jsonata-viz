/**
 * SyncCoordinator — breaks the EditorStore -> FlowStore -> EditorStore cycle.
 *
 * Tracks which side (text or graph) initiated the current change.
 * When editOrigin === 'text', graph-derived updates to EditorStore are suppressed.
 * When editOrigin === 'graph', text-derived updates to FlowStore are suppressed.
 * editOrigin resets to null after debounce settles (300ms inactivity).
 */

type EditOrigin = "text" | "graph" | null;
type Listener = (origin: EditOrigin) => void;

const RESET_DELAY = 300;

let editOrigin: EditOrigin = null;
let resetTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener(editOrigin);
  }
}

/**
 * Claim edit origin. Suppresses echo propagation from the other side.
 */
export function claimOrigin(origin: "text" | "graph"): void {
  if (editOrigin === origin) {
    // Same origin — just reset the timer
    scheduleReset();
    return;
  }

  editOrigin = origin;
  scheduleReset();
  notify();
}

/**
 * Check if an update from the given origin should be suppressed.
 * Returns true if the update should be ignored (echo suppression).
 */
export function shouldSuppress(from: "text" | "graph"): boolean {
  if (editOrigin === null) return false;
  return editOrigin !== from;
}

/**
 * Get current edit origin.
 */
export function getOrigin(): EditOrigin {
  return editOrigin;
}

/**
 * Force reset origin (e.g., on blur or explicit sync).
 */
export function resetOrigin(): void {
  if (resetTimer) clearTimeout(resetTimer);
  editOrigin = null;
  notify();
}

/**
 * Subscribe to origin changes.
 */
export function onOriginChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function scheduleReset() {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    editOrigin = null;
    notify();
  }, RESET_DELAY);
}
