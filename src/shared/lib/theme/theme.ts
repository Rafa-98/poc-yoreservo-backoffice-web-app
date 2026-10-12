export type Theme = "light" | "dark";

/**
 * localStorage key holding the user's explicit choice. Absent = follow the OS.
 * Same key as the HTML prototypes in `backoffice-ui-designs` (`yoreservo_theme`).
 */
export const THEME_STORAGE_KEY = "yoreservo_theme";

/** Attribute on <html> that drives every themed CSS variable. */
export const THEME_ATTRIBUTE = "data-theme";

/**
 * Value for the CSS `color-scheme` property per theme. The light theme uses
 * `only light` so browsers with a "force dark" feature (e.g. Samsung Internet
 * on a phone in dark mode) do not darken it on top of our own dark theme.
 */
export const COLOR_SCHEME: Record<Theme, string> = {
  light: "only light",
  dark: "dark",
};

/**
 * Runs synchronously while the HTML is parsed (before first paint) so the
 * correct theme is applied with no flash. Mirrors `applyTheme` in theme-store.
 * See: node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var d=document.documentElement;d.setAttribute(${JSON.stringify(
  THEME_ATTRIBUTE,
)},t);d.style.colorScheme=t==="dark"?${JSON.stringify(
  COLOR_SCHEME.dark,
)}:${JSON.stringify(COLOR_SCHEME.light)}}catch(e){}})()`;
