/* ---------------------------------------------------------------------------
   The homepage's "popular chords" list.

   Hand-picked and hardcoded rather than computed from the catalog on purpose:
   the homepage is the one bundle that must NOT pull in the chord engine (see
   `load.ts`), and this list never changes, so there is nothing to compute.
   Slugs follow `catalog.ts`'s `slugFor` format — root slug, then the quality
   label slugified ("major", "minor") — so keep the two in step by hand if a
   quality's label or a root's slug ever changes.
--------------------------------------------------------------------------- */

export type PopularChord = { slug: string; name: string };

export const POPULAR_CHORDS: PopularChord[] = [
  { slug: "g-major", name: "G" },
  { slug: "c-major", name: "C" },
  { slug: "d-major", name: "D" },
  { slug: "e-minor", name: "Em" },
  { slug: "a-minor", name: "Am" },
  { slug: "f-major", name: "F" },
  { slug: "a-major", name: "A" },
  { slug: "e-major", name: "E" },
];
