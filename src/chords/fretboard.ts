/* ---------------------------------------------------------------------------
   The fretboard: every way to play a chord, found rather than looked up.

   A dictionary of stored shapes would only ever cover the chords someone
   thought to type in. This searches the neck instead, so "every way to play
   every chord" is literally true — including the chords nobody charts.
--------------------------------------------------------------------------- */

import { scoreVoicing } from "./difficulty.ts";
import { mod12, pitchClasses, type ParsedChord } from "./theory.ts";

/** Standard tuning, low E to high E, as MIDI note numbers. */
export const TUNING = [40, 45, 50, 55, 59, 64];
/** How far up the neck we look. Past this you are playing a different guitar. */
export const MAX_FRET = 15;
/** Frets one hand covers without moving: a shape may span four, index to little. */
export const HAND_SPAN = 4;
/** More than this and the results stop being a help and start being a list. */
const MAX_VOICINGS = 10;

export type Barre = {
  fret: number;
  /** String indices the index finger lies across, low to high. */
  from: number;
  to: number;
};

export type Voicing = {
  /** Per string, low E first: -1 muted, 0 open, n fretted. */
  frets: number[];
  /** Per string: 0 for open or muted, else the finger, 1 = index. */
  fingers: number[];
  barre: Barre | null;
  /** The fret the diagram's window starts at. 1 means "draw the nut". */
  baseFret: number;
  /** What it actually sounds, low to high. */
  midi: number[];
  difficulty: number;
};

/**
 * Works out a fingering, or reports that there isn't one.
 *
 * Four fingers, so a shape needing five or six stopped strings is only
 * playable if the index finger can lie flat across the lowest fret in it —
 * which is exactly what a barre is.
 */
export function fingerShape(frets: number[]): Pick<Voicing, "fingers" | "barre"> | null {
  const fingers = new Array(frets.length).fill(0);
  const fretted = frets.map((fret, string) => ({ fret, string })).filter((s) => s.fret > 0);
  if (fretted.length === 0) return { fingers, barre: null };

  const lowest = Math.min(...fretted.map((s) => s.fret));
  if (Math.max(...fretted.map((s) => s.fret)) - lowest >= HAND_SPAN) return null;

  // Low frets take low fingers; that ordering is what makes a shape reachable.
  const byReach = (a: { fret: number; string: number }, b: typeof a) =>
    a.fret - b.fret || a.string - b.string;

  if (fretted.length <= 4) {
    [...fretted].sort(byReach).forEach((s, i) => {
      fingers[s.string] = i + 1;
    });
    return { fingers, barre: null };
  }

  const atLowest = fretted.filter((s) => s.fret === lowest).map((s) => s.string);
  if (atLowest.length < 2) return null;

  const from = Math.min(...atLowest);
  const to = Math.max(...atLowest);
  // A flat finger presses everything it crosses: nothing under it can be open
  // or muted, so a shape that needs that is not a barre shape.
  for (let string = from; string <= to; string += 1) {
    if (frets[string] < lowest) return null;
  }

  const above = fretted.filter((s) => s.fret > lowest).sort(byReach);
  if (above.length > 3) return null;

  // A barre anchors at one end of the shape. An index finger lying across the
  // middle of the neck while lower strings are stopped higher up is something
  // the search will happily invent and nobody would actually play.
  const sounding = frets.map((fret, string) => ({ fret, string })).filter((s) => s.fret >= 0);
  const lowestSounding = Math.min(...sounding.map((s) => s.string));
  const highestSounding = Math.max(...sounding.map((s) => s.string));
  if (from !== lowestSounding && to !== highestSounding) return null;

  for (const string of atLowest) fingers[string] = 1;
  // The free fingers are taken from the top down: three of them are 2-3-4, but
  // two are the ring and little finger, not the middle and ring — reaching over
  // a barre with the middle finger is not how the hand works.
  const firstFree = 5 - above.length;
  above.forEach((s, i) => {
    fingers[s.string] = firstFree + i;
  });
  return { fingers, barre: { fret: lowest, from, to } };
}

/** Where the diagram's five-fret window starts. */
export const windowStart = (frets: number[]): number => {
  const fretted = frets.filter((fret) => fret > 0);
  if (fretted.length === 0) return 1;
  const highest = Math.max(...fretted);
  return highest <= 5 ? 1 : Math.min(...fretted);
};

/** Turns a shape into the notes it sounds, low to high. */
export const soundingNotes = (frets: number[], capo = 0): number[] =>
  frets
    .map((fret, string) => (fret < 0 ? -1 : TUNING[string] + fret + capo))
    .filter((note) => note >= 0);

export function buildVoicing(frets: number[], capo = 0): Voicing | null {
  const hand = fingerShape(frets);
  if (!hand) return null;
  const shape = { frets, barre: hand.barre };
  return {
    frets,
    fingers: hand.fingers,
    barre: hand.barre,
    baseFret: windowStart(frets),
    midi: soundingNotes(frets, capo),
    difficulty: scoreVoicing(shape),
  };
}

/* -- The search ------------------------------------------------------------ */

/**
 * Walks the neck one hand-position at a time and collects every shape that
 * sounds the chord and can actually be fingered.
 *
 * Two rules do most of the filtering, and both come from how chords are really
 * played rather than from theory:
 *
 * - The lowest sounding string must be the root. Chord charts are written in
 *   root position; an inversion is a different thing with a different name.
 * - Muted strings only run in from the edges. A string silenced in the middle
 *   of a shape is an advanced technique, and allowing it buries the shapes a
 *   player can actually use under hundreds they cannot.
 */
export function voicingsFor(chord: ParsedChord): Voicing[] {
  const tones = new Set(pitchClasses(chord));
  const needed = chord.quality.essential.reduce(
    (mask, interval) => mask | (1 << mod12(chord.rootPc + interval)),
    0,
  );
  const minSounding = chord.quality.intervals.length >= 4 ? 4 : 3;
  const found = new Map<string, Voicing>();
  const frets = new Array(TUNING.length).fill(-1);

  const collect = (covered: number) => {
    if ((covered & needed) !== needed) return;
    if (frets.filter((fret) => fret >= 0).length < minSounding) return;
    // With the hand up the neck, letting an open string ring underneath is a
    // deliberate drone rather than a shape anyone would look up.
    const stopped = frets.filter((fret) => fret > 0);
    if (stopped.length && Math.min(...stopped) > 5 && frets.includes(0)) return;
    const key = frets.join(",");
    if (found.has(key)) return;
    const voicing = buildVoicing([...frets]);
    if (voicing) found.set(key, voicing);
  };

  /** phase: 0 before the shape starts, 1 inside it, 2 after it has ended. */
  const walk = (options: number[][], string: number, phase: number, covered: number) => {
    if (string === TUNING.length) {
      if (phase !== 0) collect(covered);
      return;
    }

    frets[string] = -1;
    walk(options, string + 1, phase === 1 ? 2 : phase, covered);

    if (phase === 2) return;
    for (const fret of options[string]) {
      const pc = mod12(TUNING[string] + fret);
      // Opening the shape on anything but the root would be an inversion.
      if (phase === 0 && pc !== chord.rootPc) continue;
      frets[string] = fret;
      walk(options, string + 1, 1, covered | (1 << pc));
    }
    frets[string] = -1;
  };

  for (let start = 1; start + HAND_SPAN - 1 <= MAX_FRET; start += 1) {
    const options = TUNING.map((open, string) => {
      const reachable: number[] = [];
      // An open string is always available, wherever the hand happens to be.
      if (tones.has(mod12(open))) reachable.push(0);
      for (let fret = start; fret < start + HAND_SPAN; fret += 1) {
        if (tones.has(mod12(TUNING[string] + fret))) reachable.push(fret);
      }
      return reachable;
    });
    walk(options, 0, 0, 0);
  }

  return selectByPosition([...found.values()]);
}

/**
 * Sorting purely by difficulty returns ten near-identical shapes from the
 * bottom of the neck and buries the barre chords a player is actually looking
 * for. So the neck is read the way a chord dictionary lays it out: position by
 * position, taking the easiest shape in each and the fullest-sounding one if
 * that is a different shape. Only then is the result ordered easiest first.
 */
function selectByPosition(all: Voicing[]): Voicing[] {
  const positions = new Map<number, Voicing[]>();
  for (const voicing of all) {
    const group = positions.get(voicing.baseFret);
    if (group) group.push(voicing);
    else positions.set(voicing.baseFret, [voicing]);
  }

  const sounding = (voicing: Voicing) => voicing.midi.length;
  const picked = new Set<Voicing>();
  for (const group of positions.values()) {
    const easiest = [...group].sort((a, b) => a.difficulty - b.difficulty)[0];
    const fullest = [...group].sort(
      (a, b) => sounding(b) - sounding(a) || a.difficulty - b.difficulty,
    )[0];
    picked.add(easiest);
    picked.add(fullest);
  }

  return [...picked]
    .sort((a, b) => a.difficulty - b.difficulty || a.baseFret - b.baseFret)
    .slice(0, MAX_VOICINGS);
}
