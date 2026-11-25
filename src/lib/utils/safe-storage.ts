/**
 * Safe localStorage wrapper that handles QuotaExceededError.
 * Falls back gracefully — no data loss, just stops persisting.
 */

import type { StateStorage } from "zustand/middleware";

export const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      console.warn(`[storage] Failed to read "${name}" from localStorage`);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        console.warn(
          `[storage] localStorage quota exceeded for "${name}". Persistence disabled for this write.`,
        );
      } else {
        console.warn(`[storage] Failed to write "${name}" to localStorage`, e);
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      console.warn(`[storage] Failed to remove "${name}" from localStorage`);
    }
  },
};
