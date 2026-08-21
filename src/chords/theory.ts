/* ---------------------------------------------------------------------------
   Chord theory: names in, pitch classes out.

   Nothing here knows about a guitar. It is the layer everything else asks
   "what notes is this chord made of", and the only place a chord name is ever
   parsed.

   Modules under src/chords import each other with explicit `.ts` extensions —
   which the tsconfig allows — so the whole theory layer can be run straight
   through `node` for checking, without a bundler or a browser in the way.
--------------------------------------------------------------------------- */

/** Semitones above C. C = 0 … B = 11. */
export type PitchClass = number;

const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
/** The natural pitch of each letter, in the same order. */
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

/** Roots we prefer to spell with flats, because that is how they are written. */
const FLAT_ROOTS = new Set([1, 3, 6, 8, 10]);

export const mod12 = (n: number): PitchClass => ((n % 12) + 12) % 12;

/** How a pitch class is spelled, honouring the accidental the user typed. */
export function noteName(pc: PitchClass, preferFlat = FLAT_ROOTS.has(mod12(pc))): string {
  return (preferFlat ? FLAT_NAMES : SHARP_NAMES)[mod12(pc)];
}

export type QualityId =
  | "maj"
  | "min"
  | "dim"
  | "aug"
  | "sus2"
  | "sus4"
  | "maj6"
  | "min6"
  | "dom7"
  | "maj7"
  | "min7"
  | "m7b5"
  | "dim7"
  | "dom9"
  | "maj9"
  | "min9"
  | "add9"
  | "7sus4"
  | "power";

export type Quality = {
  id: QualityId;
  /** Written after the root: "m7", "maj7", "" for major. */
  suffix: string;
  /** Spoken form, for the results heading and for screen readers. */
  label: string;
  /** Semitones above the root. */
  intervals: number[];
  /**
   * Letters above the root, paired with intervals: 2 means "a third of some
   * kind", 6 means "a seventh of some kind". This is what makes C♯ major spell
   * its third E♯ rather than F, and G minor spell its third B♭ rather than A♯.
   */
  degrees: number[];
  /**
   * The intervals a voicing may not leave out. The fifth is droppable in
   * anything with four notes or more — guitarists drop it constantly, because
   * six strings and four fingers do not stretch to everything.
   */
  essential: number[];
};

const q = (
  id: QualityId,
  suffix: string,
  label: string,
  /** [semitones above the root, scale degree it is written on] */
  spelling: [number, number][],
  essential: number[] = spelling.map(([semitones]) => semitones),
): Quality => ({
  id,
  suffix,
  label,
  intervals: spelling.map(([semitones]) => semitones),
  degrees: spelling.map(([, degree]) => degree),
  essential,
});

export const QUALITIES: Quality[] = [
  q("maj", "", "major", [[0, 0], [4, 2], [7, 4]]),
  q("min", "m", "minor", [[0, 0], [3, 2], [7, 4]]),
  q("dim", "dim", "diminished", [[0, 0], [3, 2], [6, 4]]),
  q("aug", "aug", "augmented", [[0, 0], [4, 2], [8, 4]]),
  q("sus2", "sus2", "suspended 2nd", [[0, 0], [2, 1], [7, 4]]),
  q("sus4", "sus4", "suspended 4th", [[0, 0], [5, 3], [7, 4]]),
  q("maj6", "6", "major 6th", [[0, 0], [4, 2], [7, 4], [9, 5]], [0, 4, 9]),
  q("min6", "m6", "minor 6th", [[0, 0], [3, 2], [7, 4], [9, 5]], [0, 3, 9]),
  q("dom7", "7", "dominant 7th", [[0, 0], [4, 2], [7, 4], [10, 6]], [0, 4, 10]),
  q("maj7", "maj7", "major 7th", [[0, 0], [4, 2], [7, 4], [11, 6]], [0, 4, 11]),
  q("min7", "m7", "minor 7th", [[0, 0], [3, 2], [7, 4], [10, 6]], [0, 3, 10]),
  q("m7b5", "m7♭5", "half-diminished", [[0, 0], [3, 2], [6, 4], [10, 6]]),
  q("dim7", "dim7", "diminished 7th", [[0, 0], [3, 2], [6, 4], [9, 6]]),
  q("dom9", "9", "dominant 9th", [[0, 0], [4, 2], [7, 4], [10, 6], [2, 1]], [0, 4, 10, 2]),
  q("maj9", "maj9", "major 9th", [[0, 0], [4, 2], [7, 4], [11, 6], [2, 1]], [0, 4, 11, 2]),
  q("min9", "m9", "minor 9th", [[0, 0], [3, 2], [7, 4], [10, 6], [2, 1]], [0, 3, 10, 2]),
  q("add9", "add9", "added 9th", [[0, 0], [4, 2], [7, 4], [2, 1]], [0, 4, 2]),
  q("7sus4", "7sus4", "dominant 7th suspended 4th", [[0, 0], [5, 3], [7, 4], [10, 6]], [0, 5, 10]),
  q("power", "5", "power chord", [[0, 0], [7, 4]]),
];

const BY_ID = new Map(QUALITIES.map((quality) => [quality.id, quality]));

export const quality = (id: QualityId): Quality => BY_ID.get(id)!;

/* -- Parsing ---------------------------------------------------------------
   One entry point. Everything downstream works with the parsed result, so a
   chord name is never picked apart twice or in two different ways.          */

/**
 * A capital M means major, a lowercase m means minor, and that single letter
 * is the whole difference between M7 and m7. So the capital-M forms are
 * resolved before anything is lowercased; every other spelling is
 * case-insensitive.
 */
const CAPITAL_M: Record<string, QualityId> = {
  "": "maj",
  "6": "maj6",
  "7": "maj7",
  "9": "maj9",
};

const ALIASES: Record<string, QualityId> = {
  "": "maj",
  maj: "maj",
  major: "maj",
  m: "min",
  min: "min",
  minor: "min",
  "-": "min",
  dim: "dim",
  o: "dim",
  "°": "dim",
  aug: "aug",
  "+": "aug",
  sus2: "sus2",
  sus: "sus4",
  sus4: "sus4",
  "6": "maj6",
  maj6: "maj6",
  m6: "min6",
  min6: "min6",
  "-6": "min6",
  "7": "dom7",
  dom7: "dom7",
  maj7: "maj7",
  ma7: "maj7",
  j7: "maj7",
  "△": "maj7",
  "△7": "maj7",
  m7: "min7",
  min7: "min7",
  "-7": "min7",
  m7b5: "m7b5",
  min7b5: "m7b5",
  "-7b5": "m7b5",
  "ø": "m7b5",
  halfdim: "m7b5",
  dim7: "dim7",
  o7: "dim7",
  "°7": "dim7",
  "9": "dom9",
  maj9: "maj9",
  m9: "min9",
  min9: "min9",
  add9: "add9",
  add2: "add9",
  "7sus4": "7sus4",
  "7sus": "7sus4",
  "5": "power",
};

export type ParsedChord = {
  rootPc: PitchClass;
  /** Index into the letter ladder, C = 0. The rest of the chord spells up from it. */
  rootLetter: number;
  /** The root as written: "B♭". */
  root: string;
  quality: Quality;
  /** Whether the root was written — or is conventionally written — as a flat. */
  preferFlat: boolean;
  /** "B♭m7", spelled the way the user asked for it. */
  name: string;
  /** "B♭ minor 7th", for the heading and for screen readers. */
  spoken: string;
};

/** Returns null for anything that is not a chord we can name. */
export function parseChord(input: string): ParsedChord | null {
  const cleaned = input.trim().replace(/[♯]/g, "#").replace(/[♭]/g, "b").replace(/\s+/g, "");
  const rootMatch = /^([A-Ga-g])(#|b|s)?/.exec(cleaned);
  if (!rootMatch) return null;

  const letterIndex = LETTERS.indexOf(rootMatch[1].toUpperCase());
  const accidental = rootMatch[2] === "s" ? "#" : rootMatch[2];
  const shift = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  const rootPc = mod12(LETTER_PC[letterIndex] + shift);

  const suffix = cleaned.slice(rootMatch[0].length);
  const id =
    suffix.startsWith("M") && !/^M[a-z]/.test(suffix)
      ? CAPITAL_M[suffix.slice(1)]
      : ALIASES[suffix.toLowerCase()];
  if (!id) return null;

  const found = quality(id);
  const preferFlat = accidental === "b" || (!accidental && FLAT_ROOTS.has(rootPc));
  // Spell the root the way it was asked for, so a search for Bb never answers
  // in A♯ — and so the rest of the chord can be spelled up from that letter.
  const rootLetter = accidental ? letterIndex : LETTERS.indexOf(noteName(rootPc, preferFlat)[0]);
  const rootShift = mod12(rootPc - LETTER_PC[rootLetter]);
  const root = LETTERS[rootLetter] + accidentalFor(rootShift);

  return {
    rootPc,
    rootLetter,
    quality: found,
    preferFlat,
    root,
    name: `${root}${found.suffix}`,
    spoken: `${root} ${found.label}`,
  };
}

/** The set of pitch classes a chord contains, root first. */
export function pitchClasses(chord: Pick<ParsedChord, "rootPc" | "quality">): PitchClass[] {
  const seen = new Set<PitchClass>();
  for (const interval of chord.quality.intervals) seen.add(mod12(chord.rootPc + interval));
  return [...seen];
}

/** Sharps or flats, however many it takes to bend a letter onto a pitch. */
function accidentalFor(shift: number): string {
  const signed = shift > 6 ? shift - 12 : shift;
  return signed === 0 ? "" : signed > 0 ? "♯".repeat(signed) : "♭".repeat(-signed);
}

/**
 * The chord's notes as a musician writes them: one per scale degree, each on
 * its own letter. C♯ major is C♯ E♯ G♯ — never C♯ F G♯, which is the same three
 * pitches spelled as something that isn't a chord.
 */
export function spellChord(
  chord: Pick<ParsedChord, "rootPc" | "rootLetter" | "quality" | "preferFlat">,
): string[] {
  const seen = new Set<PitchClass>();
  const spelled: string[] = [];

  chord.quality.intervals.forEach((interval, i) => {
    const pc = mod12(chord.rootPc + interval);
    if (seen.has(pc)) return;
    seen.add(pc);
    const letter = (chord.rootLetter + chord.quality.degrees[i]) % 7;
    const accidental = accidentalFor(mod12(pc - LETTER_PC[letter]));
    // E♭dim7 is spelled E♭ G♭ B♭♭ D♭♭ and a guitarist reads that as a typo.
    // Where the correct spelling needs a double accidental, name the pitch
    // plainly instead — the same compromise every printed chart makes.
    spelled.push(accidental.length > 1 ? noteName(pc, chord.preferFlat) : LETTERS[letter] + accidental);
  });

  return spelled;
}

/** Pitch class to how this particular chord writes it — for shared-note labels. */
export function spellingMap(
  chord: Pick<ParsedChord, "rootPc" | "rootLetter" | "quality" | "preferFlat">,
): Map<PitchClass, string> {
  const map = new Map<PitchClass, string>();
  pitchClasses(chord).forEach((pc, i) => map.set(pc, spellChord(chord)[i]));
  return map;
}
