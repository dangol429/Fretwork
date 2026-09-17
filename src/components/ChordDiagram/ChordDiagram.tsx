import { useId } from "react";
import type { Barre } from "../../chords/fretboard";
import "./ChordDiagram.css";

/* ---------------------------------------------------------------------------
   A chord diagram, drawn in the same hand as the guitar on the hero: thin
   confident strokes, no shading, everything coloured from tokens so it reads
   in either theme.

   Strings run down, frets across. The window is five frets — enough for any
   shape the search can produce, since a shape has to fit one hand.
--------------------------------------------------------------------------- */

const STRINGS = 6;
const FRETS = 5;
const STRING_GAP = 19;
const FRET_GAP = 22;

const GRID_W = (STRINGS - 1) * STRING_GAP;
const GRID_H = FRETS * FRET_GAP;
/** Room above the nut for the open and muted marks. */
const TOP = 20;
/** Room beside the grid for the fret number, clear of a barre that starts on
    the lowest string. */
const SIDE = 23;

const VIEW_W = GRID_W + SIDE * 2;
const VIEW_H = GRID_H + TOP + 10;

const stringX = (i: number) => SIDE + i * STRING_GAP;
/** The dot sits in the middle of the fret space, where a finger goes. */
const fretY = (fret: number, baseFret: number) => TOP + (fret - baseFret + 0.5) * FRET_GAP;

type ChordDiagramProps = {
  frets: number[];
  fingers: number[];
  barre: Barre | null;
  baseFret: number;
  /** Draws a capo in place of the nut, at this fret. */
  capo?: number;
  /** Read out instead of the picture. Omit inside a control that names itself. */
  description?: string;
};

export function ChordDiagram({
  frets,
  fingers,
  barre,
  baseFret,
  capo = 0,
  description,
}: ChordDiagramProps) {
  // With a capo the shape is fingered as if the capo were the nut, so the
  // window always starts at the top and the fret numbers come off the capo.
  const openLike = capo > 0 || baseFret === 1;
  const titleId = useId();
  const descId = useId();

  return (
    <svg
      className="diagram"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      {...(description
        ? { role: "img", "aria-labelledby": `${titleId} ${descId}` }
        : { "aria-hidden": true })}
    >
      {description && (
        <>
          <title id={titleId}>Chord diagram</title>
          <desc id={descId}>{description}</desc>
        </>
      )}

      {/* Frets. The first one doubles as the nut when the window is at the top. */}
      {Array.from({ length: FRETS + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          className="diagram__fret"
          x1={SIDE}
          y1={TOP + i * FRET_GAP}
          x2={SIDE + GRID_W}
          y2={TOP + i * FRET_GAP}
        />
      ))}

      {Array.from({ length: STRINGS }, (_, i) => (
        <line
          key={`string-${i}`}
          className="diagram__string"
          x1={stringX(i)}
          y1={TOP}
          x2={stringX(i)}
          y2={TOP + GRID_H}
        />
      ))}

      {openLike && capo === 0 && (
        <line
          className="diagram__nut"
          x1={SIDE - 1}
          y1={TOP}
          x2={SIDE + GRID_W + 1}
          y2={TOP}
        />
      )}

      {/* Where the window does not start at the nut, say which fret it does. */}
      {!openLike && baseFret > 1 && (
        <text className="diagram__fret-number" x={SIDE - 10} y={fretY(baseFret, baseFret)}>
          {baseFret}
        </text>
      )}

      {/* Open and muted strings, marked above the nut as they always are. */}
      {frets.map((fret, i) =>
        fret === 0 ? (
          <circle
            key={`mark-${i}`}
            className="diagram__open"
            cx={stringX(i)}
            cy={TOP - 10}
            r={3.6}
          />
        ) : fret < 0 ? (
          <g key={`mark-${i}`} className="diagram__muted">
            <line
              x1={stringX(i) - 3.4}
              y1={TOP - 13.4}
              x2={stringX(i) + 3.4}
              y2={TOP - 6.6}
            />
            <line
              x1={stringX(i) - 3.4}
              y1={TOP - 6.6}
              x2={stringX(i) + 3.4}
              y2={TOP - 13.4}
            />
          </g>
        ) : null,
      )}

      {barre && (
        <rect
          className="diagram__barre"
          x={stringX(barre.from) - 6.5}
          y={fretY(barre.fret, baseFret) - 6.5}
          width={(barre.to - barre.from) * STRING_GAP + 13}
          height={13}
          rx={6.5}
        />
      )}

      {/* Fingers. Strings held down by the barre are already drawn by the bar
          itself — all but the one at its end, which carries the finger number
          the way a printed chart puts it there. */}
      {frets.map((fret, i) =>
        fret > 0 && !(barre && fret === barre.fret && i > barre.from && i <= barre.to) ? (
          <g key={`dot-${i}`} className="diagram__finger">
            <circle cx={stringX(i)} cy={fretY(fret, baseFret)} r={7} />
            {fingers[i] > 0 && (
              <text x={stringX(i)} y={fretY(fret, baseFret)}>
                {fingers[i]}
              </text>
            )}
          </g>
        ) : null,
      )}

      {/* The capo: a clamp lying across the neck, overhanging it on both sides
          the way a real one does, so it never reads as a heavy nut. */}
      {capo > 0 && (
        <g className="diagram__capo">
          <rect x={SIDE - 8} y={TOP - 5.5} width={GRID_W + 16} height={9} rx={4.5} />
          <text className="diagram__fret-number" x={SIDE - 13} y={TOP}>
            {capo}
          </text>
        </g>
      )}
    </svg>
  );
}
