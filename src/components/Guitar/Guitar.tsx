import { useEffect, useRef, type CSSProperties } from "react";
import {
  BODY_PATH,
  BRIDGE,
  FRETS,
  HEADSTOCK_PATH,
  HEEL_X,
  INLAY_X,
  INLAY_YS,
  LABEL,
  MARK,
  NUT,
  NUT_X,
  PEGS,
  PICK,
  PICK_PATH,
  PIN_X,
  pinY,
  PLATE,
  RINGS,
  ROSETTE_RADII,
  SADDLE_X,
  SOUNDHOLE,
  STRINGS,
  VIEW,
  neckBottom,
  neckTop,
} from "./geometry";
import "./Guitar.css";

type GuitarProps = {
  /** Lights the nameplate and sets the strings shimmering. */
  focused: boolean;
  /** Bumping this re-plucks the strings — on focus, and on every keystroke. */
  pluck: number;
  /** Bumping this turns the pick over. Driven by the dark-mode toggle. */
  flip: number;
  makerName: string;
};

/**
 * The instrument, in line art, as one inline SVG.
 *
 * Every part that later steps will need to move — each string, each peg, the
 * nameplate — is its own addressable element rather than a flattened drawing.
 *
 * Nothing here knows which theme is on: every colour is a token, so the whole
 * drawing changes character when the tokens do.
 */
export function Guitar({ focused, pluck, flip, makerName }: GuitarProps) {
  const stringsRef = useRef<SVGGElement>(null);
  const pickRef = useRef<SVGGElement>(null);

  // Restarting a CSS animation needs the class dropped, a reflow forced, and
  // the class put back — remounting instead would replay the entrance draw.
  useEffect(() => {
    if (pluck === 0) return;
    const strings = stringsRef.current;
    if (!strings) return;
    strings.classList.remove("is-plucked");
    void strings.getBoundingClientRect();
    strings.classList.add("is-plucked");
  }, [pluck]);

  // Same restart trick, on its own layer: the group carrying the entrance
  // fade cannot also carry the flip, or one rule would silently win.
  useEffect(() => {
    if (flip === 0) return;
    const pick = pickRef.current;
    if (!pick) return;
    pick.classList.remove("is-flipping");
    void pick.getBoundingClientRect();
    pick.classList.add("is-flipping");
  }, [flip]);

  return (
    <svg
      className={`gtr${focused ? " is-focused" : ""}`}
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      role="img"
      aria-labelledby="gtr-title gtr-desc"
    >
      <title id="gtr-title">An acoustic guitar, drawn in line art</title>
      <desc id="gtr-desc">
        The body and soundhole lie on the left, the neck runs through the middle with the
        chord search inlaid into it, and the headstock with six tuning pegs sits on the
        right, signed by {makerName}.
      </desc>

      <defs>
        <linearGradient id="gtr-plate" x1="0" y1="0" x2="0" y2="1">
          <stop className="gtr-plate-top" offset="0%" />
          <stop className="gtr-plate-bottom" offset="100%" />
        </linearGradient>
        <filter id="gtr-glow" x="-25%" y="-160%" width="150%" height="420%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        {/* The shadow the instrument drops on whatever it is lying on. */}
        <filter id="gtr-cast" x="-14%" y="-24%" width="128%" height="152%">
          <feGaussianBlur stdDeviation="13" />
        </filter>
        {/* Celluloid has a sheen: both faces are lit from the top edge. */}
        <linearGradient id="gtr-pick-warm" x1="0" y1="0" x2="0" y2="1">
          <stop className="gtr-pick-warm-lit" offset="0%" />
          <stop className="gtr-pick-warm-base" offset="100%" />
        </linearGradient>
        <linearGradient id="gtr-pick-dark" x1="0" y1="0" x2="0" y2="1">
          <stop className="gtr-pick-dark-lit" offset="0%" />
          <stop className="gtr-pick-dark-base" offset="100%" />
        </linearGradient>
        {/* Looking into the body through the soundhole. */}
        <radialGradient id="gtr-hole" cx="50%" cy="50%" r="50%">
          <stop className="gtr-hole-core" offset="0%" />
          <stop className="gtr-hole-rim" offset="100%" />
        </radialGradient>
        {/* And, after dark, the light coming back out of it. */}
        <radialGradient id="gtr-spill" cx="50%" cy="50%" r="50%">
          <stop className="gtr-spill-core" offset="24%" />
          <stop className="gtr-spill-edge" offset="100%" />
        </radialGradient>
      </defs>

      {/* Grounded: the silhouette again, offset and blurred, so the drawing
          sits on the paper instead of floating over it. */}
      <g className="gtr__ground" filter="url(#gtr-cast)" data-enter="ground">
        <path d={BODY_PATH} />
        <path
          d={`M ${HEEL_X} ${neckTop(HEEL_X)} L ${NUT_X} ${neckTop(NUT_X)} L ${NUT_X} ${neckBottom(
            NUT_X,
          )} L ${HEEL_X} ${neckBottom(HEEL_X)} Z`}
        />
        <path className="gtr__ground-far" d={`${HEADSTOCK_PATH} Z`} />
      </g>

      {/* Sound pushing out from the soundhole. */}
      <g className="gtr__rings">
        {RINGS.map((r, i) => (
          <circle
            key={r}
            cx={SOUNDHOLE.cx}
            cy={SOUNDHOLE.cy}
            r={r}
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </g>

      {/* After dark, light spills out of the body and washes over the top. In
          daylight the token behind it is fully transparent and nothing shows. */}
      <circle
        className="gtr__spill"
        cx={SOUNDHOLE.cx}
        cy={SOUNDHOLE.cy}
        r={172}
        fill="url(#gtr-spill)"
        data-enter="surface"
      />

      {/* Faint surfaces, so the linework reads as an object and not a wireframe. */}
      <g className="gtr__surfaces" data-enter="surface">
        <path d={BODY_PATH} />
        <path
          d={`M ${HEEL_X} ${neckTop(HEEL_X)} L ${NUT_X} ${neckTop(NUT_X)} L ${NUT_X} ${neckBottom(
            NUT_X,
          )} L ${HEEL_X} ${neckBottom(HEEL_X)} Z`}
        />
        <path d={`${HEADSTOCK_PATH} Z`} />
      </g>

      {/* --- Body ---------------------------------------------------------- */}
      <path className="gtr__line gtr__body" d={BODY_PATH} pathLength={1} data-draw="body" />

      {/* Depth inside the hole. Daylight makes it a shadow you look into; the
          dark palette turns the same element into the warm mouth of a lit body. */}
      <circle
        className="gtr__hole-inner"
        cx={SOUNDHOLE.cx}
        cy={SOUNDHOLE.cy}
        r={SOUNDHOLE.r}
        fill="url(#gtr-hole)"
        data-enter="hole"
      />

      <circle
        className="gtr__line gtr__soundhole"
        cx={SOUNDHOLE.cx}
        cy={SOUNDHOLE.cy}
        r={SOUNDHOLE.r}
        pathLength={1}
        data-draw="soundhole"
      />
      {ROSETTE_RADII.map((r) => (
        <circle
          key={r}
          className="gtr__line gtr__rosette"
          cx={SOUNDHOLE.cx}
          cy={SOUNDHOLE.cy}
          r={r}
          pathLength={1}
          data-draw="soundhole"
        />
      ))}

      {/* The maker's label, glued inside the body and read through the hole. */}
      <g className="gtr__label" data-enter="label" aria-hidden="true">
        <path id="gtr-label-top" d={LABEL.topArc} fill="none" />
        <path id="gtr-label-bottom" d={LABEL.bottomArc} fill="none" />
        <text className="gtr__label-arc">
          <textPath
            href="#gtr-label-top"
            startOffset="50%"
            textLength={LABEL.topLength}
            lengthAdjust="spacing"
          >
            A HANDBUILT INSTRUMENT
          </textPath>
        </text>
        <text className="gtr__label-arc">
          <textPath
            href="#gtr-label-bottom"
            startOffset="50%"
            textLength={LABEL.bottomLength}
            lengthAdjust="spacing"
          >
            OP. 1 · MMXXVI
          </textPath>
        </text>
        <text
          className="gtr__label-sign"
          x={SOUNDHOLE.cx}
          y={LABEL.signY}
          textAnchor="middle"
        >
          {makerName}
        </text>
      </g>

      <g className="gtr__bridge">
        <rect
          className="gtr__line"
          x={BRIDGE.x}
          y={BRIDGE.y}
          width={BRIDGE.w}
          height={BRIDGE.h}
          rx={BRIDGE.r}
          pathLength={1}
          data-draw="bridge"
        />
        <line
          className="gtr__line gtr__saddle"
          x1={SADDLE_X}
          y1={BRIDGE.y + 10}
          x2={SADDLE_X}
          y2={BRIDGE.y + BRIDGE.h - 10}
          pathLength={1}
          data-draw="bridge"
        />
      </g>
      <g className="gtr__pins" data-enter="bridge">
        {STRINGS.map((_, i) => (
          <circle key={`pin-${i}`} cx={PIN_X} cy={pinY(i)} r={6} />
        ))}
      </g>

      {/* --- Neck ---------------------------------------------------------- */}
      <line
        className="gtr__line gtr__neck-edge"
        x1={HEEL_X}
        y1={neckTop(HEEL_X)}
        x2={NUT_X}
        y2={neckTop(NUT_X)}
        pathLength={1}
        data-draw="neck"
      />
      <line
        className="gtr__line gtr__neck-edge"
        x1={HEEL_X}
        y1={neckBottom(HEEL_X)}
        x2={NUT_X}
        y2={neckBottom(NUT_X)}
        pathLength={1}
        data-draw="neck"
      />

      <g className="gtr__frets">
        {FRETS.map((x, i) => (
          <line
            key={x}
            className="gtr__line gtr__fret"
            x1={x}
            y1={neckTop(x)}
            x2={x}
            y2={neckBottom(x)}
            pathLength={1}
            data-draw="fret"
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </g>

      {/* The twelfth-fret double dot. */}
      <g className="gtr__inlays" data-enter="fret">
        {INLAY_YS.map((y) => (
          <circle key={y} cx={INLAY_X} cy={y} r={7} />
        ))}
      </g>

      {/* The nameplate: a recess cut into the neck to hold the search field. */}
      <g className="gtr__plate" data-enter="plate">
        <rect
          className="gtr__plate-glow"
          x={PLATE.x}
          y={PLATE.y}
          width={PLATE.w}
          height={PLATE.h}
          rx={PLATE.r}
          filter="url(#gtr-glow)"
        />
        <rect
          className="gtr__plate-face"
          x={PLATE.x}
          y={PLATE.y}
          width={PLATE.w}
          height={PLATE.h}
          rx={PLATE.r}
          fill="url(#gtr-plate)"
        />
        {/* Light falls from above, so the near edge shades and the far edge catches it. */}
        <path
          className="gtr__plate-shadow"
          d={`M ${PLATE.x + 10} ${PLATE.y + 3} H ${PLATE.x + PLATE.w - 10}`}
        />
        <path
          className="gtr__plate-highlight"
          d={`M ${PLATE.x + 10} ${PLATE.y + PLATE.h - 3} H ${PLATE.x + PLATE.w - 10}`}
        />
        <rect
          className="gtr__line gtr__plate-edge"
          x={PLATE.x}
          y={PLATE.y}
          width={PLATE.w}
          height={PLATE.h}
          rx={PLATE.r}
        />
      </g>

      <rect
        className="gtr__nut"
        x={NUT.x}
        y={NUT.y}
        width={NUT.w}
        height={NUT.h}
        rx={NUT.r}
        data-enter="neck"
      />

      {/* --- Headstock ----------------------------------------------------- */}
      <path
        className="gtr__line gtr__headstock"
        d={HEADSTOCK_PATH}
        pathLength={1}
        data-draw="headstock"
      />

      {/* --- The pick ------------------------------------------------------
          Drawn here, immediately before the strings, so the two lowest strings
          cross over it and it reads as genuinely tucked underneath. It is the
          dark-mode toggle; the button that operates it is <PickToggle />,
          parked transparently on top of this same spot. Two faces, cross-faded
          by the theme: warm celluloid with a sun, tortoise shell with a moon. */}
      <g className="gtr__pick" data-enter="pick">
        <g
          className="gtr__pick-flip"
          ref={pickRef}
          style={{ "--pick-x": `${PICK.cx}px`, "--pick-y": `${PICK.cy}px` } as CSSProperties}
        >
          <g transform={`translate(${PICK.cx} ${PICK.cy}) rotate(${PICK.tilt})`}>
            <g className="gtr__pick-face gtr__pick-face--sun">
              <path className="gtr__pick-body" d={PICK_PATH} />
              <g className="gtr__pick-mark">
                <circle cx="0" cy="8" r="4.9" />
                {Array.from({ length: 8 }, (_, i) => {
                  const angle = (i * Math.PI) / 4;
                  const sin = Math.sin(angle);
                  const cos = Math.cos(angle);
                  return (
                    <line
                      key={i}
                      x1={sin * 7.9}
                      y1={8 - cos * 7.9}
                      x2={sin * 10.9}
                      y2={8 - cos * 10.9}
                    />
                  );
                })}
              </g>
            </g>

            <g className="gtr__pick-face gtr__pick-face--moon">
              <path className="gtr__pick-body" d={PICK_PATH} />
              <g className="gtr__pick-mark">
                {/* A crescent: one disc with a second bitten out of it. */}
                <path d="M 3.03 -1.52 A 10.5 10.5 0 1 0 3.03 17.52 A 9.7 9.7 0 0 1 3.03 -1.52 Z" />
                <circle className="gtr__pick-star" cx="6.6" cy="2.2" r="1.4" />
                <circle className="gtr__pick-star" cx="8.8" cy="8.8" r="1" />
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* --- Strings: bridge pin, over the nut, on to the tuning post ------
          Four layers per string, each owning exactly one animation: the outer
          group takes the pluck, the next the idle sway, the next the shimmer
          while the field is live, and the path itself the entrance draw.
          Stacking them keeps the four from overwriting one another the way
          competing `animation` rules would. */}
      <g className="gtr__strings" ref={stringsRef}>
        {STRINGS.map((string, i) => (
          <g key={`${string.note}-${i}`} className="gtr__wire" style={{ "--i": i } as CSSProperties}>
            <g className="gtr__sway">
              <g className="gtr__shimmer">
                <path
                  className={`gtr__string${string.wound ? " is-wound" : ""}`}
                  d={string.d}
                  strokeWidth={string.width}
                  pathLength={1}
                  data-draw="string"
                />
              </g>
            </g>
          </g>
        ))}
      </g>

      {/* Tuners last, so each post sits cleanly over the strings passing it. */}
      <g className="gtr__pegs">
        {PEGS.map((peg, i) => (
          <g key={`${peg.x}-${peg.y}`} style={{ "--i": i } as CSSProperties}>
            <line
              className="gtr__line gtr__peg-stem"
              x1={peg.x}
              y1={peg.edgeY}
              x2={peg.x}
              y2={peg.buttonY}
              pathLength={1}
              data-draw="peg"
            />
            <ellipse
              className="gtr__peg-button"
              cx={peg.x}
              cy={peg.buttonY}
              rx={16}
              ry={10}
              pathLength={1}
              data-draw="peg"
            />
            <circle
              className="gtr__peg-post"
              cx={peg.x}
              cy={peg.y}
              r={9}
              pathLength={1}
              data-draw="peg"
            />
          </g>
        ))}
      </g>

      {/* --- The maker's mark, engraved on the headstock ------------------- */}
      <text className="gtr__mark" x={MARK.x} y={MARK.y} textAnchor="middle" data-enter="mark">
        {makerName}
      </text>
    </svg>
  );
}
