import {
  COLOR_SCHEME,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type Theme,
} from "./theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function getStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies...).
    return null;
  }
}

export function getSystemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** The <html data-theme> attribute is the single source of truth. */
export function getAppliedTheme(): Theme {
  return document.documentElement.getAttribute(THEME_ATTRIBUTE) === "dark"
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute(THEME_ATTRIBUTE, theme);
  root.style.colorScheme = COLOR_SCHEME[theme];
}

export function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore: the choice still applies for the current session.
  }
}

/** Subscribes to changes of the applied theme (for `useSyncExternalStore`). */
export function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [THEME_ATTRIBUTE],
  });
  return () => observer.disconnect();
}

/** Calls `onChange` when the OS color scheme changes. */
export function subscribeToSystemTheme(onChange: (theme: Theme) => void) {
  const media = window.matchMedia(DARK_QUERY);
  const listener = (event: MediaQueryListEvent) =>
    onChange(event.matches ? "dark" : "light");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
