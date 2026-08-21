import { useCallback, useEffect, useMemo, useState } from "react";
import { CursorNotes } from "./components/CursorNotes/CursorNotes";
import { Hero } from "./components/Hero/Hero";
import { Results } from "./components/Results/Results";
import { resolveChord } from "./chords/resolve";
import { useTheme } from "./hooks/useTheme";

/**
 * `is-loaded` is what starts the entrance choreography. It goes on after the
 * first paint so every element is already in its "before" state and nothing
 * flashes in unstyled.
 *
 * The theme is owned here rather than inside the hero: it belongs to the whole
 * app, and the toggle that changes it happens to live on the guitar.
 *
 * Which view is showing is owned by the URL rather than by state alone, so a
 * chord can be linked to and the back button does what it should. The hash is
 * the whole route: #Bb is the B♭ page, no hash is the hero.
 */

const readHash = () => {
  try {
    return decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  } catch {
    // A hand-mangled escape sequence should land on the hero, not throw.
    return "";
  }
};

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState(readHash);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // popstate covers the back button, hashchange covers someone editing the URL.
  useEffect(() => {
    const sync = () => setQuery(readHash());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const result = useMemo(() => (query ? resolveChord(query) : null), [query]);

  const go = useCallback((next: string) => {
    const trimmed = next.trim();
    const url = trimmed
      ? `#${encodeURIComponent(trimmed)}`
      : window.location.pathname + window.location.search;
    window.history.pushState(null, "", url);
    setQuery(trimmed);
    window.scrollTo({ top: 0 });
  }, []);

  const home = useCallback(() => go(""), [go]);

  return (
    <div className={`app${loaded ? " is-loaded" : ""}`}>
      {result ? (
        <Results result={result} onSearch={go} onHome={home} />
      ) : (
        <Hero
          theme={theme}
          onToggleTheme={toggleTheme}
          onSearch={go}
          notFound={query || null}
        />
      )}
      <CursorNotes />
    </div>
  );
}
