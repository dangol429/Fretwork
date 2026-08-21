/**
 * Hand-drawn musical glyphs for the cursor trail.
 *
 * Drawn as paths rather than typed as Unicode characters so the flags actually
 * curl and the weights stay consistent whatever fonts happen to be installed.
 * All share a 40 x 56 box; everything is painted in `currentColor`.
 */

export type GlyphKind = "eighth" | "sixteenth" | "beamed" | "quarter" | "clef";

const NoteHead = ({ cx, cy, rx = 8.4, ry = 6.1 }: { cx: number; cy: number; rx?: number; ry?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(-22 ${cx} ${cy})`} />
);

function Glyph({ kind }: { kind: GlyphKind }) {
  switch (kind) {
    case "eighth":
      return (
        <>
          <NoteHead cx={11} cy={45} />
          <path d="M19.2 43.6V8" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M19.2 8C29 12.5 34.5 19 33 27.5C31 34 27 37.5 24 39C28 34.5 30 29.5 28.5 24C27.2 19 23.5 15 19.2 13.8Z" />
        </>
      );

    case "sixteenth":
      return (
        <>
          <NoteHead cx={11} cy={45} />
          <path d="M19.2 43.6V8" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M19.2 8C29 12.5 34.5 19 33 27.5C31 34 27 37.5 24 39C28 34.5 30 29.5 28.5 24C27.2 19 23.5 15 19.2 13.8Z" />
          <path d="M19.2 16.5C27.5 20.5 32 26 30.5 33C29 38.5 25.5 41.5 23 42.8C26.5 38.5 28 34 26.6 29.6C25.5 25.6 22.8 22.6 19.2 21.6Z" />
        </>
      );

    case "beamed":
      return (
        <>
          <NoteHead cx={10} cy={46} rx={7.8} ry={5.7} />
          <NoteHead cx={30} cy={40} rx={7.8} ry={5.7} />
          <path d="M17.6 44.8V14.5" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M37.6 38.8V8.5" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16.5 14.6L38.7 8V13.9L16.5 20.5Z" />
        </>
      );

    case "quarter":
      return (
        <>
          <NoteHead cx={11} cy={45} />
          <path d="M19.2 43.6V9" strokeWidth="2.3" strokeLinecap="round" />
        </>
      );

    /* A treble-clef swash: the ascending stroke, the top curl, the spiral. */
    case "clef":
      return (
        <path
          d="M24 50C16 53 10 48 12.5 42C15 36.5 24 36.5 27 42C31 50 27.5 33 25 22C22.5 11 24.5 4.5 28.5 4C32.5 3.5 34 9 32.8 14.5C31 22.5 23 28 16.5 33.5C9 39.5 8.5 48 15.5 51.5"
          fill="none"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }
}

export function NoteGlyph({ kind, size }: { kind: GlyphKind; size: number }) {
  return (
    <svg
      width={size}
      height={size * (56 / 40)}
      viewBox="0 0 40 56"
      fill="currentColor"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <Glyph kind={kind} />
    </svg>
  );
}
