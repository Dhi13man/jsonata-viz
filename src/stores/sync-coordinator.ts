/**
 * SyncCoordinator — breaks the EditorStore -> FlowStore -> EditorStore cycle.
 *
 * Tracks which side (text or graph) initiated the current change.
 * When editOrigin === 'text', graph-derived updates to EditorStore are suppressed.
 * When editOrigin === 'graph', text-derived updates to FlowStore are suppressed.
 * editOrigin resets to null after debounce settles (300ms inactivity).
 */

type EditOrigin = "text" | "graph" | null;

const RESET_DELAY = 300;

let editOrigin: EditOrigin = null;
let resetTimer: ReturnType<typeof setTimeout> | null = null;

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
}

/**
 * Check if an update from the given origin should be suppressed.
 * Returns true if the update should be ignored (echo suppression).
 */
export function shouldSuppress(from: "text" | "graph"): boolean {
  if (editOrigin === null) return false;
  return editOrigin !== from;
}

function scheduleReset() {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    editOrigin = null;
  }, RESET_DELAY);
}

// Expose for E2E tests (DEV only, tree-shaken in production)
declare global {
  interface Window {
    __VISIONATA_CLAIM_ORIGIN__?: typeof claimOrigin;
  }
}

if (import.meta.env.DEV) {
  window.__VISIONATA_CLAIM_ORIGIN__ = claimOrigin;
}
