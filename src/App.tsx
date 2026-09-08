import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { CursorNotes } from "./components/CursorNotes/CursorNotes";
import { Hero } from "./components/Hero/Hero";
import { loadResults, resolveChordAsync, warmChords } from "./chords/load";
import type { ChordResult } from "./chords/resolve";
import { useTheme } from "./hooks/useTheme";

const Results = lazy(loadResults);

// A page opened straight onto a chord needs the engine immediately, so the
// fetch starts here — beside React's own start-up rather than after it.
if (typeof window !== "undefined" && window.location.hash) warmChords();

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
 *
 * Resolving a chord is asynchronous only because the engine that does it is a
 * separate chunk — see chords/load.ts. `answer` therefore lags `query` by one
 * fetch, and carries the query it was computed from so the two are never read
 * out of step.
 */

const readHash = () => {
  try {
    return decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  } catch {
    // A hand-mangled escape sequence should land on the hero, not throw.
    return "";
  }
};

type Answer = { query: string; result: ChordResult | null };

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState(readHash);
  const [answer, setAnswer] = useState<Answer | null>(null);
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

  // `answer` only ever caches the last resolution; it is never cleared, so the
  // effect has nothing to do when there is no query. What is on screen is
  // decided below, from the query.
  useEffect(() => {
    if (!query) return;
    let live = true;
    void resolveChordAsync(query).then((result) => {
      if (live) setAnswer({ query, result });
    });
    return () => {
      live = false;
    };
  }, [query]);

  // While the engine chunk is in flight, whatever is already on screen stays
  // there: the last answer if there is one, the hero if there is not. Nothing
  // blinks to blank, and a query is only ever called unreadable once the engine
  // has actually read it.
  const settled = answer !== null && answer.query === query;
  const showing = query ? (answer?.result ?? null) : null;

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
      {showing ? (
        <Suspense fallback={null}>
          <Results result={showing} onSearch={go} onHome={home} />
        </Suspense>
      ) : (
        <Hero
          theme={theme}
          onToggleTheme={toggleTheme}
          onSearch={go}
          notFound={settled ? query : null}
        />
      )}
      <CursorNotes />
    </div>
  );
}
