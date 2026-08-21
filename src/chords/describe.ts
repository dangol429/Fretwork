/* ---------------------------------------------------------------------------
   Saying what a shape is, the way a player would say it.
--------------------------------------------------------------------------- */

import type { Voicing } from "./fretboard.ts";

const ORDINALS = [
  "",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
  "13th",
  "14th",
  "15th",
];

export const ordinal = (n: number): string => ORDINALS[n] ?? `${n}th`;

/** "Open position", "Barre at the 6th", "5th position". */
export function describeVoicing(voicing: Voicing): string {
  if (voicing.barre) return `Barre at the ${ordinal(voicing.barre.fret)}`;
  const stopped = voicing.frets.filter((fret) => fret > 0);
  const open = voicing.frets.some((fret) => fret === 0);
  if (stopped.length === 0) return "All open strings";
  const lowest = Math.min(...stopped);
  if (lowest <= 3 && open) return "Open position";
  return `${ordinal(lowest)} position`;
}

/** What a screen reader gets instead of the picture. */
export function readShape(voicing: Voicing, capo = 0): string {
  const strings = ["low E", "A", "D", "G", "B", "high E"];
  // Fret numbers are counted the way the shape is fingered and the way the
  // diagram draws it: from the capo when there is one, from the nut when there
  // is not. Saying "fret 3" for a shape the eye reads at 2 helps nobody.
  const parts = voicing.frets.map((fret, i) => {
    if (fret < 0) return `${strings[i]} muted`;
    if (fret === 0) return `${strings[i]} ${capo > 0 ? "open above the capo" : "open"}`;
    return `${strings[i]} fret ${fret}`;
  });
  const barre = voicing.barre
    ? `, barre across strings ${strings[voicing.barre.from]} to ${strings[voicing.barre.to]} at fret ${voicing.barre.fret}`
    : "";
  const capoNote = capo > 0 ? `Capo at fret ${capo}, and counting from it: ` : "";
  return `${capoNote}${parts.join(", ")}${barre}.`;
}
