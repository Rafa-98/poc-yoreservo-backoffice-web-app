"use client";

import { useLayoutEffect, type ReactNode } from "react";
import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  subscribeToSystemTheme,
} from "./theme-store";

/**
 * Keeps the theme in sync after hydration:
 *  - re-applies it before paint (React dev Strict Mode can clear <html> attributes),
 *  - follows OS changes while the user has no explicit preference.
 * The first paint itself is handled by `themeInitScript` in the root layout.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    applyTheme(getStoredTheme() ?? getSystemTheme());

    return subscribeToSystemTheme((systemTheme) => {
      if (getStoredTheme() === null) applyTheme(systemTheme);
    });
  }, []);

  return <>{children}</>;
}
