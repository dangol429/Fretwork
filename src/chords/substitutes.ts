/* ---------------------------------------------------------------------------
   Tier 3 — the chord that sounds close enough.

   Not the same chord. A different, easier one that shares most of its notes,
   offered honestly and never as an equivalent. Two notes in common is the
   floor: below that it stops being a substitute and starts being a wrong chord,
   and we would rather show nothing.

   Because it really is different, it plays its own notes rather than the
   target's — hearing the two next to each other is the whole point.
--------------------------------------------------------------------------- */

import { buildVoicing, type Voicing } from "./fretboard.ts";
import { OPEN_SHAPES, shapePitchClasses, type OpenShape } from "./shapes.ts";
import { pitchClasses, spellingMap, type ParsedChord, type PitchClass } from "./theory.ts";

/** Fewer notes in common than this and it is simply another chord. */
const MIN_SHARED = 2;
const MAX_SUGGESTIONS = 2;

export type Substitute = {
  shape: OpenShape;
  /** The notes the two chords have in common, spelled for display. */
  shared: string[];
  /** How many notes the target has, so the label can be honest about the miss. */
  total: number;
  voicing: Voicing;
};

export function substitutesFor(chord: ParsedChord): Substitute[] {
  const target = pitchClasses(chord);
  const targetSet = new Set<PitchClass>(target);
  // Shared notes are named the way the target chord names them, not the way
  // the substitute does — the player is comparing them against their chord.
  const spelling = spellingMap(chord);

  const scored = OPEN_SHAPES.flatMap((shape) => {
    const sounded = shapePitchClasses(shape);
    // The same notes is the same chord, however it is spelled or fingered.
    const identical =
      sounded.size === targetSet.size && [...sounded].every((pc) => targetSet.has(pc));
    if (identical) return [];

    const shared = target.filter((pc) => sounded.has(pc));
    if (shared.length < MIN_SHARED) return [];

    const voicing = buildVoicing(shape.frets);
    if (!voicing) return [];

    return [
      {
        shape,
        shared: shared.map((pc) => spelling.get(pc) ?? ""),
        total: target.length,
        voicing,
        // Sharing the root is what makes a substitute sound like the chord it
        // is standing in for, so it outweighs one extra note in common.
        score: shared.length * 2 + (sounded.has(chord.rootPc) ? 1 : 0),
      },
    ];
  });

  const ranked = scored.sort((a, b) => b.score - a.score || a.shape.ease - b.shape.ease);

  // Two suggestions built on the same root — Dm and Dm7 — are one suggestion
  // shown twice. Keep the best of each root so a second one earns its place.
  const roots = new Set<PitchClass>();
  const chosen: typeof ranked = [];
  for (const candidate of ranked) {
    if (roots.has(candidate.shape.rootPc)) continue;
    roots.add(candidate.shape.rootPc);
    chosen.push(candidate);
    if (chosen.length === MAX_SUGGESTIONS) break;
  }

  return chosen.map(({ score: _score, ...substitute }) => substitute);
}
