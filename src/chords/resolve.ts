/* ---------------------------------------------------------------------------
   One query in, the whole answer out.

   The three tiers run most-faithful to most-forgiving: every real way to play
   it, then the same chord made easy with a capo, then a different chord that
   sounds close. The last two only appear when the chord is genuinely hard —
   telling someone who typed "Em" how to avoid Em would be noise.
--------------------------------------------------------------------------- */

import { capoSuggestions, type CapoSuggestion } from "./capo.ts";
import { isHardChord } from "./difficulty.ts";
import { voicingsFor, type Voicing } from "./fretboard.ts";
import { substitutesFor, type Substitute } from "./substitutes.ts";
import { parseChord, spellChord, type ParsedChord } from "./theory.ts";

export type ChordResult = {
  chord: ParsedChord;
  /** "B♭ · D · F" */
  notes: string[];
  /** Tier 1: every way to play it, easiest first. Never empty. */
  voicings: Voicing[];
  /** Whether the easier tiers are worth showing at all. */
  hard: boolean;
  /** Tier 2. Empty when the chord is easy, or has no open shape to borrow. */
  capo: CapoSuggestion[];
  /** Tier 3. Empty when the chord is easy, or nothing is close enough. */
  similar: Substitute[];
};

/** Returns null for a name we cannot parse, or a chord we cannot play at all. */
export function resolveChord(query: string): ChordResult | null {
  const chord = parseChord(query);
  if (!chord) return null;

  const voicings = voicingsFor(chord);
  if (voicings.length === 0) return null;

  const hard = isHardChord(voicings);

  return {
    chord,
    notes: spellChord(chord),
    voicings,
    hard,
    capo: hard ? capoSuggestions(chord) : [],
    similar: hard ? substitutesFor(chord) : [],
  };
}
