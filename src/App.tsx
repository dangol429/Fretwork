import { Suspense, lazy, useEffect, useState } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { CursorNotes } from "./components/CursorNotes/CursorNotes";
import { HomePage } from "./pages/HomePage/HomePage";
import { NotFound } from "./pages/NotFound/NotFound";
import { loadChordPage, warmChords } from "./chords/load";

const LazyChordPage = lazy(loadChordPage);

// A page opened straight onto a chord needs the engine immediately, so the
// fetch starts here — beside React's own start-up rather than after it.
if (typeof window !== "undefined" && window.location.pathname.startsWith("/chord/")) warmChords();

function ChordRoute() {
  const { slug = "" } = useParams();
  return <LazyChordPage slug={slug} />;
}

/**
 * `is-loaded` is what starts the entrance choreography. It goes on after the
 * first paint so every element is already in its "before" state and nothing
 * flashes in unstyled.
 *
 * Which page is showing is owned by the router rather than by state — every
 * chord has a real URL, so it can be linked to, pre-rendered, and the back
 * button does what it should.
 */
export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={`app${loaded ? " is-loaded" : ""}`}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chord/:slug" element={<ChordRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <CursorNotes />
    </div>
  );
}
