/* ---------------------------------------------------------------------------
   The chord engine, and the view that shows its answer, on demand.

   Nothing in `chords/` — nor `Results`, `ChordDiagram` or the audio — is needed
   to draw the hero, and it is the hero that everyone lands on. Keeping them out
   of the entry chunk takes roughly a third of the stylesheet, and with it a
   third of the render-blocking bytes, off the first paint.

   Both imports are memoised, so warming and using them share one request.
--------------------------------------------------------------------------- */

import type { ChordResult } from "./resolve";

type ResolveModule = typeof import("./resolve");
type ResultsModule = typeof import("../components/Results/Results");

let engine: Promise<ResolveModule> | null = null;
let view: Promise<ResultsModule> | null = null;

const loadEngine = () => (engine ??= import("./resolve"));

/** The lazy `Results` component's loader, in the shape `React.lazy` wants. */
export const loadResults = () =>
  (view ??= import("../components/Results/Results")).then((m) => ({ default: m.Results }));

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
  void loadResults();
}
