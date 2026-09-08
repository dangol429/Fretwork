/**
 * Geometry for the line-art acoustic.
 *
 * The whole instrument lives in one 1610 x 580 coordinate space, lying
 * horizontally: body on the left, neck through the middle, headstock on the
 * right. Everything is symmetric about the centre line at y = 290.
 *
 * The stage element is locked to this aspect ratio, so any point here maps to a
 * percentage of the stage — which is how the real <input> is parked exactly on
 * the inlaid nameplate.
 */

export const VIEW = { w: 1610, h: 580 };
/** The horizontal centre line the whole instrument mirrors about. */
export const AXIS = 290;

/* -- Body ------------------------------------------------------------------
   Proportioned off a real flat-top: the waist pulls in to about 0.64 of the
   lower bout and the upper bout sits at 0.80, which is what keeps the outline
   from reading as a ukulele.                                                */

export const BODY_PATH = [
  "M 44 290",
  "C 44 156, 110 40, 200 40", // tail out to the lower bout
  "C 300 40, 348 130, 400 130", // lower bout into the waist
  "C 452 130, 476 90, 520 90", // waist out to the upper bout
  "C 574 90, 652 132, 660 228", // upper bout into the heel
  "L 660 352",
  "C 652 448, 574 490, 520 490",
  "C 476 490, 452 450, 400 450",
  "C 348 450, 300 540, 200 540",
  "C 110 540, 44 424, 44 290",
  "Z",
].join(" ");

export const SOUNDHOLE = { cx: 505, cy: AXIS, r: 72 };
/** Two plain rings — a rosette suggested rather than drawn in full. */
export const ROSETTE_RADII = [82, 90];

export const BRIDGE = { x: 186, y: 212, w: 80, h: 156, r: 16 };
export const SADDLE_X = 246;
/** Where the strings are anchored — the bridge pins, behind the saddle. */
export const PIN_X = 210;

/* -- Neck ------------------------------------------------------------------ */

export const HEEL_X = 660;
export const NUT_X = 1180;

const HEEL_HALF = 62;
const NUT_HALF = 54;

/** The neck tapers very slightly toward the nut, as a real one does. */
export const neckTop = (x: number) =>
  AXIS - HEEL_HALF + ((x - HEEL_X) / (NUT_X - HEEL_X)) * (HEEL_HALF - NUT_HALF);
export const neckBottom = (x: number) => 2 * AXIS - neckTop(x);

/** The inlaid nameplate the search field sits in. */
export const PLATE = { x: 750, y: 248, w: 320, h: 84, r: 10 };

/** The nameplate's centre, as a percentage of the artwork's width. */
export const PLATE_CENTER_PCT = `${((PLATE.x + PLATE.w / 2) / VIEW.w) * 100}%`;

/* Frets, spaced by equal temperament so they crowd toward the body. */
const fretDistance = (n: number, scale: number) => scale * (1 - 2 ** (-n / 12));
const FRET_SCALE = (NUT_X - HEEL_X) / (1 - 2 ** (-14 / 12));
const fretX = (n: number) => NUT_X - fretDistance(n, FRET_SCALE);

/** Only the frets the nameplate does not cover are drawn. */
export const FRETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
  .map(fretX)
  .filter((x) => x < PLATE.x || x > PLATE.x + PLATE.w);

/** The twelfth-fret double dot — the one marker a guitarist always looks for. */
export const INLAY_X = (fretX(11) + fretX(12)) / 2;
export const INLAY_YS = [AXIS - 26, AXIS + 26];

/* -- Headstock ------------------------------------------------------------- */

export const HEADSTOCK_PATH = [
  "M 1180 236",
  "C 1215 224, 1252 214, 1300 212",
  "L 1500 206",
  "C 1532 205, 1550 219, 1550 244",
  "L 1550 336",
  "C 1550 361, 1532 375, 1500 374",
  "L 1300 368",
  "C 1252 366, 1215 356, 1180 344",
].join(" ");

export const NUT = { x: 1175, y: 236, w: 9, h: 108, r: 3 };

export type Peg = {
  /** Post on the headstock face, where the string winds on. */
  x: number;
  y: number;
  /** Where the headstock edge sits above/below the post. */
  edgeY: number;
  /** The button the player turns, protruding past the edge. */
  buttonY: number;
};

/**
 * Six tuners, three a side. Indexed by string, outermost string to the
 * furthest post — which is what makes the strings fan the way they do.
 */
export const PEGS: Peg[] = [
  { x: 1375, y: 250, edgeY: 210, buttonY: 182 },
  { x: 1305, y: 250, edgeY: 212, buttonY: 184 },
  { x: 1235, y: 250, edgeY: 220, buttonY: 192 },
  { x: 1235, y: 330, edgeY: 360, buttonY: 388 },
  { x: 1305, y: 330, edgeY: 368, buttonY: 396 },
  { x: 1375, y: 330, edgeY: 370, buttonY: 398 },
];

/* -- Strings --------------------------------------------------------------- */

/** Wider at the saddle than at the nut, as the string spacing really is. */
const BRIDGE_SPREAD = 100;
const NUT_SPREAD = 66;

const spread = (i: number, total: number) => AXIS - total / 2 + i * (total / 5);

/** Bridge-pin y for string i — the pins line up with the string ends. */
export const pinY = (i: number) => spread(i, BRIDGE_SPREAD);

export type GuitarString = {
  /** Bridge pin, over the nut, on to the tuning post. */
  d: string;
  /** Bronze-wound (the low three) or plain steel. */
  wound: boolean;
  width: number;
  note: string;
};

const GAUGES = [3.2, 2.8, 2.3, 1.9, 1.55, 1.25];
const NOTES = ["E", "A", "D", "G", "B", "E"];

export const STRINGS: GuitarString[] = PEGS.map((peg, i) => ({
  d: `M ${PIN_X} ${pinY(i)} L ${NUT_X} ${spread(i, NUT_SPREAD)} L ${peg.x} ${peg.y}`,
  wound: i < 3,
  width: GAUGES[i],
  note: NOTES[i],
}));

/** Soundwave rings pushing out from the soundhole. */
export const RINGS = [140, 218, 300, 386];

/** Turns a point in this space into a percentage of the stage. */
export const pctX = (x: number) => `${(x / VIEW.w) * 100}%`;
export const pctY = (y: number) => `${(y / VIEW.h) * 100}%`;

/* -- The maker's label -----------------------------------------------------
   A paper label glued inside the body, read through the soundhole — the way a
   luthier signs the inside of an instrument. Set as a ring: the two arcs share
   one circle, the top one swept clockwise and the bottom one anticlockwise, so
   both read left to right with their letters standing up off the paper.       */

const LABEL_R = 57;

const labelArc = (sweep: 0 | 1) =>
  `M ${SOUNDHOLE.cx - LABEL_R} ${SOUNDHOLE.cy} ` +
  `A ${LABEL_R} ${LABEL_R} 0 0 ${sweep} ${SOUNDHOLE.cx + LABEL_R} ${SOUNDHOLE.cy}`;

export const LABEL = {
  /** Over the top of the ring. */
  topArc: labelArc(1),
  /** Under the bottom of it. */
  bottomArc: labelArc(0),
  /** Arc lengths the text is fitted to, so it can never spill past the ring. */
  topLength: 150,
  bottomLength: 92,
  /** The signature, in the middle where the label leaves room for one. */
  signY: SOUNDHOLE.cy + 12,
};

/* -- The pick --------------------------------------------------------------
   Wedged under the two lowest strings between the bridge and the soundhole,
   where a guitarist actually parks one. It is the dark-mode toggle: the
   drawing lives in the SVG so the strings can cross over it, and a transparent
   button is parked on top of it for the click, the focus ring and the label.  */

export const PICK = {
  cx: 356,
  cy: 350,
  /** Leaning the way a pick slid under a string ends up leaning. */
  tilt: -12,
  /** The reach of the hit area around it, in view units. */
  hitW: 86,
  hitH: 90,
};

/** A 351-shape plectrum: broad rounded shoulders down to a soft point, drawn
    about its own centre so the group can be rotated and flipped in place. */
export const PICK_PATH = [
  "M -32 -15",
  "C -32 -29, -21 -34, 0 -34",
  "C 21 -34, 32 -29, 32 -15",
  "C 32 3.5, 12 25.5, 2.7 33.1",
  "C 1.1 34.4, -1.1 34.4, -2.7 33.1",
  "C -12 25.5, -32 3.5, -32 -15",
  "Z",
].join(" ");
