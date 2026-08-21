/* ---------------------------------------------------------------------------
   How hard is this to play?

   Used twice: to order the voicings within a tier, and to decide whether a
   chord needs the easier tiers at all. Deliberately takes plain shape data
   rather than a Voicing, so the fretboard can score as it generates without
   the two modules importing each other in a circle.

   The weights are a player's weights, not a machine's. A barre is not a little
   harder than an open chord, it is the wall beginners hit — so it dominates,
   and open strings, which play themselves, pull the score back down.
--------------------------------------------------------------------------- */

export type Shape = {
  /** -1 muted, 0 open, n fretted. */
  frets: number[];
  barre: { fret: number } | null;
};

/** Anything at or under this, with open strings and no barre, is a first chord. */
export const EASY_LIMIT = 5;

export function scoreVoicing(shape: Shape): number {
  const fretted = shape.frets.filter((fret) => fret > 0);
  const open = shape.frets.filter((fret) => fret === 0).length;
  const muted = shape.frets.filter((fret) => fret === -1).length;
  const lowest = fretted.length ? Math.min(...fretted) : 0;
  const span = fretted.length ? Math.max(...fretted) - lowest : 0;

  return (
    (shape.barre ? 6 : 0) +
    fretted.length * 0.7 +
    span * 1.2 +
    // Further up the neck is a smaller, tighter, less familiar hand position.
    Math.max(0, lowest - 1) * 0.45 +
    // Strings you have to actively keep quiet are their own small tax.
    muted * 0.35 -
    open * 0.5
  );
}

/**
 * An open chord in the first position with nothing barred — the shapes a
 * player already has in their hands.
 */
export function isEasyOpen(voicing: Shape & { difficulty: number }): boolean {
  return (
    !voicing.barre &&
    voicing.frets.some((fret) => fret === 0) &&
    voicing.frets.every((fret) => fret <= 4) &&
    // Every chord a beginner learns first — C, A, G, E, D, Am, Em, Dm — stops
    // at most three strings. A fourth finger in the first position is where
    // easy stops, whatever the score says.
    voicing.frets.filter((fret) => fret > 0).length <= 3 &&
    voicing.difficulty <= EASY_LIMIT
  );
}

/**
 * A chord is hard when the easiest way to play it still needs a barre, or when
 * there is no easy open shape for it at all. That is the gate for tiers 2 and
 * 3: chords that are already easy get told so instead of being given advice
 * they do not need.
 */
export function isHardChord(voicings: (Shape & { difficulty: number })[]): boolean {
  if (voicings.length === 0) return true;
  return !voicings.some(isEasyOpen);
}
