import type { Theme } from "../../hooks/useTheme";
import "./ThemeToggle.css";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

/**
 * The light/dark switch for pages that aren't drawn over the guitar art — a
 * chord page gets this rather than the pick tucked under the strings (see
 * components/PickToggle), which only makes sense sitting on the hero's own
 * illustration.
 *
 * Sun and moon are two SVGs stacked in the same spot. Which one shows is
 * decided entirely by ThemeToggle.css's `[data-theme="dark"]` rule — the same
 * attribute every colour in the app already reads, stamped on <html> before
 * first paint — never by the `theme` prop. That is what lets this render
 * correctly on a server-prerendered chord page: the markup is identical
 * regardless of which theme the visitor turns out to have, and only the
 * (invisible) aria-pressed state depends on it.
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label="Toggle dark mode"
      aria-pressed={theme === "dark"}
    >
      <svg className="theme-toggle__icon theme-toggle__icon--sun" viewBox="-11 -11 22 22" aria-hidden="true">
        <circle cx="0" cy="0" r="4.2" />
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI) / 4;
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);
          return <line key={i} x1={sin * 6.1} y1={cos * 6.1} x2={sin * 9.1} y2={cos * 9.1} />;
        })}
      </svg>
      <svg className="theme-toggle__icon theme-toggle__icon--moon" viewBox="-11 -11 22 22" aria-hidden="true">
        <path d="M 9 0.79 A 9 9 0 1 1 -0.79 -9 A 7 7 0 0 0 9 0.79 Z" />
        <circle className="theme-toggle__star" cx="-7.4" cy="-7.4" r="0.9" />
        <circle className="theme-toggle__star" cx="-6" cy="-4" r="0.55" />
      </svg>
    </button>
  );
}
