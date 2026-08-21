/* ---------------------------------------------------------------------------
   Tier 2 — the capo shortcut.

   A capo is a movable nut. Clamp it at fret c and every open shape becomes the
   chord c semitones higher, with the same easy fingers. So the hard chord a
   player just looked up can very often be played as a shape they already know.

   The pitches are identical to the target chord — this is not an approximation,
   it is the same chord under an easier hand. That is what separates this tier
   from tier 3, and why it comes first.
--------------------------------------------------------------------------- */

import { buildVoicing, type Voicing } from "./fretboard.ts";
import { OPEN_SHAPES, type OpenShape } from "./shapes.ts";
import { mod12, type ParsedChord } from "./theory.ts";

/** Past this the capo is crowding the middle of the neck and the tone thins. */
export const MAX_CAPO = 7;
const MAX_SUGGESTIONS = 3;

export type CapoSuggestion = {
  shape: OpenShape;
  /** Which fret the capo clamps at. */
  capo: number;
  /** Frets are relative to the capo; `midi` is what it really sounds. */
  voicing: Voicing;
  /** "Capo 1 · play an A shape · = B♭" */
  label: string;
};

export function capoSuggestions(chord: ParsedChord): CapoSuggestion[] {
  return OPEN_SHAPES.filter((shape) => shape.quality === chord.quality.id)
    .map((shape) => ({ shape, capo: mod12(chord.rootPc - shape.rootPc) }))
    .filter(({ capo }) => capo >= 1 && capo <= MAX_CAPO)
    // Lowest capo first, then whichever shape is easiest under the hand.
    .sort((a, b) => a.capo - b.capo || a.shape.ease - b.shape.ease)
    .slice(0, MAX_SUGGESTIONS)
    .flatMap(({ shape, capo }) => {
      const voicing = buildVoicing(shape.frets, capo);
      if (!voicing) return [];
      return [
        {
          shape,
          capo,
          voicing,
          label: `Capo ${capo} · play ${shape.handle} · = ${chord.name}`,
        },
      ];
    });
}
