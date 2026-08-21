/* ---------------------------------------------------------------------------
   The easy open shapes — the chords a player already has in their hands.

   This is the one hand-written table in the chord layer, and it earns its keep
   twice over: with a capo these shapes become any chord of the same quality
   (tier 2), and left where they are they are the pool of honest substitutes
   (tier 3). Everything in here is a shape someone learns in their first month.

   Every entry is checked against the theory layer, so a typo in a fret is a
   failure rather than a quietly wrong chord.
--------------------------------------------------------------------------- */

import { mod12, type PitchClass, type QualityId } from "./theory.ts";
import { TUNING } from "./fretboard.ts";

export type OpenShape = {
  /** How it is written on a chord chart: "Am7". */
  name: string;
  /** What the hand is doing, for the capo label: "an A shape". */
  handle: string;
  quality: QualityId;
  rootPc: PitchClass;
  frets: number[];
  /** Lower is easier. Breaks ties between shapes at the same capo fret. */
  ease: number;
};

const shape = (
  name: string,
  handle: string,
  quality: QualityId,
  rootPc: PitchClass,
  frets: number[],
  ease: number,
): OpenShape => ({ name, handle, quality, rootPc, frets, ease });

export const OPEN_SHAPES: OpenShape[] = [
  // Major
  shape("E", "an E shape", "maj", 4, [0, 2, 2, 1, 0, 0], 1),
  shape("A", "an A shape", "maj", 9, [-1, 0, 2, 2, 2, 0], 2),
  shape("D", "a D shape", "maj", 2, [-1, -1, 0, 2, 3, 2], 3),
  shape("G", "a G shape", "maj", 7, [3, 2, 0, 0, 0, 3], 4),
  shape("C", "a C shape", "maj", 0, [-1, 3, 2, 0, 1, 0], 5),

  // Minor
  shape("Em", "an Em shape", "min", 4, [0, 2, 2, 0, 0, 0], 1),
  shape("Am", "an Am shape", "min", 9, [-1, 0, 2, 2, 1, 0], 2),
  shape("Dm", "a Dm shape", "min", 2, [-1, -1, 0, 2, 3, 1], 3),

  // Dominant 7th
  shape("E7", "an E7 shape", "dom7", 4, [0, 2, 0, 1, 0, 0], 1),
  shape("A7", "an A7 shape", "dom7", 9, [-1, 0, 2, 0, 2, 0], 2),
  shape("D7", "a D7 shape", "dom7", 2, [-1, -1, 0, 2, 1, 2], 3),
  shape("B7", "a B7 shape", "dom7", 11, [-1, 2, 1, 2, 0, 2], 3),
  shape("G7", "a G7 shape", "dom7", 7, [3, 2, 0, 0, 0, 1], 4),
  shape("C7", "a C7 shape", "dom7", 0, [-1, 3, 2, 3, 1, 0], 5),

  // Minor 7th
  shape("Em7", "an Em7 shape", "min7", 4, [0, 2, 0, 0, 0, 0], 1),
  shape("Am7", "an Am7 shape", "min7", 9, [-1, 0, 2, 0, 1, 0], 2),
  shape("Dm7", "a Dm7 shape", "min7", 2, [-1, -1, 0, 2, 1, 1], 3),

  // Major 7th
  shape("Cmaj7", "a Cmaj7 shape", "maj7", 0, [-1, 3, 2, 0, 0, 0], 2),
  shape("Amaj7", "an Amaj7 shape", "maj7", 9, [-1, 0, 2, 1, 2, 0], 3),
  shape("Emaj7", "an Emaj7 shape", "maj7", 4, [0, 2, 1, 1, 0, 0], 3),
  shape("Dmaj7", "a Dmaj7 shape", "maj7", 2, [-1, -1, 0, 2, 2, 2], 3),
  shape("Gmaj7", "a Gmaj7 shape", "maj7", 7, [3, 2, 0, 0, 0, 2], 4),

  // Suspended
  shape("Asus2", "an Asus2 shape", "sus2", 9, [-1, 0, 2, 2, 0, 0], 2),
  shape("Dsus2", "a Dsus2 shape", "sus2", 2, [-1, -1, 0, 2, 3, 0], 3),
  shape("Esus4", "an Esus4 shape", "sus4", 4, [0, 2, 2, 2, 0, 0], 2),
  shape("Asus4", "an Asus4 shape", "sus4", 9, [-1, 0, 2, 2, 3, 0], 2),
  shape("Dsus4", "a Dsus4 shape", "sus4", 2, [-1, -1, 0, 2, 3, 3], 3),
];

/** The pitch classes a shape actually sounds, open, with no capo. */
export function shapePitchClasses(target: OpenShape): Set<PitchClass> {
  const pcs = new Set<PitchClass>();
  target.frets.forEach((fret, string) => {
    if (fret >= 0) pcs.add(mod12(TUNING[string] + fret));
  });
  return pcs;
}
