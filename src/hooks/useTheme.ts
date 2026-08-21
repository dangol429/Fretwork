import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

/** Shared with the pre-paint script in index.html. Keep the two in step. */
const STORAGE_KEY = "fretwork-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Matches --paper in tokens.css, for the browser chrome on mobile. */
const CHROME_COLOR: Record<Theme, string> = {
  light: "#f0ede8",
  dark: "#17130f",
};

const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

/** localStorage throws in some privacy modes; a missing preference is not an error. */
function readStored(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/**
 * The theme, and the one function that changes it.
 *
 * The inline script in index.html has already resolved and stamped the theme on
 * <html> before first paint, so this hook starts from what is on screen rather
 * than deciding again — nothing flashes and there is no second source of truth.
 *
 * A manual choice wins permanently: once something is in localStorage, the OS
 * preference stops being consulted. Until then the page follows the system.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "light";
    const stamped = document.documentElement.dataset.theme;
    return isTheme(stamped) ? stamped : (readStored() ?? systemTheme());
  });

  // Paint the change: the cross-fade class goes on first so the new colours are
  // transitioned into rather than snapped to, and comes off once it has landed.
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.theme === theme) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!still) root.classList.add("is-theme-shifting");
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", CHROME_COLOR[theme]);
    if (still) return;

    const timer = window.setTimeout(() => root.classList.remove("is-theme-shifting"), 900);
    return () => window.clearTimeout(timer);
  }, [theme]);

  // Follow the system only while the user has not made a choice of their own.
  useEffect(() => {
    if (readStored()) return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setTheme(event.matches ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Choice is not persistable here; it still holds for this session.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
