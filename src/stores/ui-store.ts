/**
 * UIStore — panel visibility, theme, layout preferences.
 * All persisted to localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light";
export type LayoutPreset = "graph" | "text" | "split";

interface UIState {
  theme: Theme;
  layoutPreset: LayoutPreset;
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  bottomPanelVisible: boolean;
}

interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLayoutPreset: (preset: LayoutPreset) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomPanel: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      theme: getInitialTheme(),
      layoutPreset: "graph",
      leftSidebarVisible: false, // Collapsed by default per design: Phase 0.5
      rightSidebarVisible: false, // Phase 0.5: no properties panel yet
      bottomPanelVisible: true,

      setTheme: (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === "dark" ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", next);
          return { theme: next };
        }),
      setLayoutPreset: (layoutPreset) => set({ layoutPreset }),
      toggleLeftSidebar: () =>
        set((s) => ({ leftSidebarVisible: !s.leftSidebarVisible })),
      toggleRightSidebar: () =>
        set((s) => ({ rightSidebarVisible: !s.rightSidebarVisible })),
      toggleBottomPanel: () =>
        set((s) => ({ bottomPanelVisible: !s.bottomPanelVisible })),
    }),
    {
      name: "visionata-ui",
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.theme) {
          document.documentElement.setAttribute("data-theme", state.theme);
        }
      },
    },
  ),
);
