/* ---------------------------------------------------------------------------
   The chord engine, and the route that shows its answer, on demand.

   Nothing in `chords/` — nor the chord page, nor the audio — is needed to draw
   the hero, and it is the hero that everyone lands on. Keeping them out of the
   entry chunk takes roughly a third of the stylesheet, and with it a third of
   the render-blocking bytes, off the first paint.

   Both imports are memoised, so warming and using them share one request.
--------------------------------------------------------------------------- */

import type { ChordResult } from "./resolve";

type ResolveModule = typeof import("./resolve");
type ChordPageModule = typeof import("../pages/ChordPage/ChordPage");

let engine: Promise<ResolveModule> | null = null;
let page: Promise<ChordPageModule> | null = null;

const loadEngine = () => (engine ??= import("./resolve"));

/** The lazy chord-page route's loader, in the shape `React.lazy` wants. */
export const loadChordPage = () =>
  (page ??= import("../pages/ChordPage/ChordPage")).then((m) => ({ default: m.ChordPage }));

/** Resolve a query, fetching the engine first if this is the first one. */
export async function resolveChordAsync(query: string): Promise<ChordResult | null> {
  const { resolveChord } = await loadEngine();
  return resolveChord(query);
}

/**
 * Start both fetches without waiting for them.
 *
 * Called the moment someone touches the search field, which is a good deal
 * earlier than the moment they press Enter — by then the chunk is usually
 * already there and the answer appears without a gap.
 */
export function warmChords() {
  void loadEngine();
  void loadChordPage();
}
