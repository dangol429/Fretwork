/* ---------------------------------------------------------------------------
   A few chords worth linking to from any given one — its minor/major
   counterpart, its 7th, other close relatives — so a crawler (and a curious
   player) has somewhere to go besides back to search.

   Same root, different quality, in the order a player is most likely to want
   next. Only ever chords `resultFor` actually resolves, so nothing here links
   to a page that turns out not to exist.
--------------------------------------------------------------------------- */

import { resultFor, slugFor, type ChordCombo } from "./catalog.ts";
import type { QualityId } from "./theory.ts";

const RELATED_ORDER: QualityId[] = ["maj", "min", "dom7", "maj7", "min7", "sus4", "add9", "maj6"];

export type RelatedChord = { slug: string; name: string };

export function relatedChords(combo: ChordCombo, limit = 4): RelatedChord[] {
  const out: RelatedChord[] = [];

  for (const qualityId of RELATED_ORDER) {
    if (out.length >= limit) break;
    if (qualityId === combo.qualityId) continue;

    const result = resultFor({ rootPc: combo.rootPc, qualityId });
    if (!result) continue;

    out.push({ slug: slugFor(combo.rootPc, qualityId), name: result.chord.name });
  }

  return out;
}
