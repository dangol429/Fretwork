import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { NoteGlyph, type GlyphKind } from "./glyphs";
import "./CursorNotes.css";

type TrailNote = {
  kind: GlyphKind;
  size: number;
  /** How hard this note chases the one ahead of it. Lower = further behind. */
  lag: number;
  opacity: number;
  /** Resting tilt, in degrees. */
  tilt: number;
  /** Phase offset so the idle bob is not in unison. */
  phase: number;
  color: string;
};

const TRAIL: TrailNote[] = [
  { kind: "eighth", size: 30, lag: 0.21, opacity: 0.44, tilt: -12, phase: 0, color: "var(--terracotta)" },
  { kind: "clef", size: 27, lag: 0.165, opacity: 0.37, tilt: 8, phase: 0.8, color: "var(--line)" },
  { kind: "beamed", size: 26, lag: 0.13, opacity: 0.32, tilt: -17, phase: 1.5, color: "var(--terracotta-deep)" },
  { kind: "sixteenth", size: 23, lag: 0.102, opacity: 0.28, tilt: 14, phase: 2.2, color: "var(--line-soft)" },
  { kind: "eighth", size: 21, lag: 0.08, opacity: 0.24, tilt: -8, phase: 2.9, color: "var(--terracotta)" },
  { kind: "quarter", size: 19, lag: 0.062, opacity: 0.2, tilt: 11, phase: 3.6, color: "var(--line)" },
  { kind: "clef", size: 17, lag: 0.048, opacity: 0.15, tilt: -5, phase: 4.3, color: "var(--terracotta-deep)" },
];

/** Notes only start drifting once the instrument has finished being strung. */
const WAKE_AFTER_MS = 1200;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Musical glyphs that trail the pointer on a spring, each one lagging a little
 * further behind than the last — notes drifting off the strings.
 *
 * The animation runs entirely outside React: one rAF loop writing `transform`
 * on five nodes. No state changes, no layout reads, no re-renders.
 */
export function CursorNotes() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    // Coarse pointers have no cursor to follow.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const layer = layerRef.current;
    const nodes = noteRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!layer || nodes.length !== TRAIL.length) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const points = TRAIL.map(() => ({ x: target.x, y: target.y, vx: 0 }));

    const readyAt = performance.now() + WAKE_AFTER_MS;
    let seenPointer = false;
    let frame = 0;
    let last = performance.now();

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target.x = event.clientX;
      target.y = event.clientY;
      if (!seenPointer) {
        seenPointer = true;
        // Gather the trail at the pointer so it doesn't fly in from the centre.
        for (const point of points) {
          point.x = target.x;
          point.y = target.y;
        }
      }
    };

    const onLeave = () => layer.classList.remove("is-awake");
    const onEnter = () => {
      if (seenPointer && performance.now() > readyAt) layer.classList.add("is-awake");
    };

    const tick = (now: number) => {
      // Frame-rate independent easing, so 120Hz displays don't feel snappier.
      const dt = clamp(now - last, 1, 64);
      last = now;

      if (seenPointer && now > readyAt) layer.classList.add("is-awake");

      for (let i = 0; i < points.length; i += 1) {
        const note = TRAIL[i];
        const point = points[i];
        const lead = i === 0 ? target : points[i - 1];
        const k = 1 - (1 - note.lag) ** (dt / 16.667);

        const previousX = point.x;
        point.x += (lead.x - point.x) * k;
        point.y += (lead.y - point.y) * k;
        point.vx = point.x - previousX;

        const bob = Math.sin(now * 0.0022 + note.phase) * 5;
        const rotation = note.tilt + clamp(point.vx * 1.1, -20, 20);

        nodes[i].style.transform =
          `translate3d(${point.x - note.size / 2}px, ${point.y - note.size / 2 + bob}px, 0)` +
          ` rotate(${rotation}deg)`;
      }

      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div className="cursor-notes" ref={layerRef} aria-hidden="true">
      {TRAIL.map((note, i) => (
        <span
          key={`${note.kind}-${i}`}
          className="cursor-notes__note"
          ref={(el) => {
            noteRefs.current[i] = el;
          }}
          style={{ opacity: note.opacity, color: note.color }}
        >
          <NoteGlyph kind={note.kind} size={note.size} />
        </span>
      ))}
    </div>
  );
}
