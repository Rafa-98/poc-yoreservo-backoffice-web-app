"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Theme } from "./theme";
import {
  applyTheme,
  getAppliedTheme,
  persistTheme,
  subscribeToTheme,
} from "./theme-store";

/**
 * Reads and changes the current theme.
 * `theme` is "light" on the server and during hydration, then syncs to the
 * real value without a hydration mismatch (useSyncExternalStore contract).
 */
export function useTheme() {
  const theme = useSyncExternalStore<Theme>(
    subscribeToTheme,
    getAppliedTheme,
    () => "light",
  );

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    persistTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(getAppliedTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
