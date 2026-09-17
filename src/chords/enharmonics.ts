/* ---------------------------------------------------------------------------
   Enharmonic canonicalization — one URL per pitch.

   Five pitch classes have two common names (C♯/D♭, D♯/E♭, F♯/G♭, G♯/A♭,
   A♯/B♭). Giving both their own page is duplicate content, so exactly one
   spelling per pitch is canonical and gets a live route; the other still
   resolves, but only to redirect here. This is the one file that makes that
   call — change a slug below and every route, sitemap entry and redirect
   follows from it.

   The choice follows the spelling most guitar chord-chart sites default to:
   sharp for C♯/F♯ (the barre positions guitarists reach for first), flat for
   E♭/A♭/B♭ (the spellings horn and keys players already read, and the ones
   guitar sites converge on for those three).
--------------------------------------------------------------------------- */

import type { PitchClass } from "./theory.ts";

export type RootSpelling = {
  pc: PitchClass;
  /** ASCII, as the chord engine's parser expects it: "Bb", "F#", "C". */
  ascii: string;
  /** URL segment: "bb", "f-sharp", "c". */
  slug: string;
};

/** One canonical spelling per pitch class, C through B. */
export const CANONICAL_ROOTS: RootSpelling[] = [
  { pc: 0, ascii: "C", slug: "c" },
  { pc: 1, ascii: "C#", slug: "c-sharp" },
  { pc: 2, ascii: "D", slug: "d" },
  { pc: 3, ascii: "Eb", slug: "eb" },
  { pc: 4, ascii: "E", slug: "e" },
  { pc: 5, ascii: "F", slug: "f" },
  { pc: 6, ascii: "F#", slug: "f-sharp" },
  { pc: 7, ascii: "G", slug: "g" },
  { pc: 8, ascii: "Ab", slug: "ab" },
  { pc: 9, ascii: "A", slug: "a" },
  { pc: 10, ascii: "Bb", slug: "bb" },
  { pc: 11, ascii: "B", slug: "b" },
];

/**
 * The other name for each of the five ambiguous pitches — shown alongside the
 * canonical one on the page, and matched (then redirected away from) if
 * someone links or types a URL spelled this way.
 */
export const ALT_ROOTS: Partial<Record<PitchClass, RootSpelling>> = {
  1: { pc: 1, ascii: "Db", slug: "d-flat" },
  3: { pc: 3, ascii: "D#", slug: "d-sharp" },
  6: { pc: 6, ascii: "Gb", slug: "g-flat" },
  8: { pc: 8, ascii: "G#", slug: "g-sharp" },
  10: { pc: 10, ascii: "A#", slug: "a-sharp" },
};

const BY_PC = new Map(CANONICAL_ROOTS.map((root) => [root.pc, root]));

export const canonicalRoot = (pc: PitchClass): RootSpelling => BY_PC.get(((pc % 12) + 12) % 12)!;

/** The alternate name for an ambiguous root, or null where there isn't one. */
export const altRoot = (pc: PitchClass): RootSpelling | null => ALT_ROOTS[((pc % 12) + 12) % 12] ?? null;
