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

/**
 * Five notes, not seven. Each one is a composited node the browser transforms
 * every frame, and in dark mode each one also carries a drop-shadow; the last
 * two were the faintest in the trail and the least missed, and dropping them
 * takes roughly a third off the per-frame cost of the effect.
 */
const TRAIL: TrailNote[] = [
  { kind: "eighth", size: 30, lag: 0.21, opacity: 0.44, tilt: -12, phase: 0, color: "var(--terracotta)" },
  { kind: "clef", size: 27, lag: 0.165, opacity: 0.37, tilt: 8, phase: 0.8, color: "var(--line)" },
  { kind: "beamed", size: 26, lag: 0.13, opacity: 0.32, tilt: -17, phase: 1.5, color: "var(--terracotta-deep)" },
  { kind: "sixteenth", size: 23, lag: 0.102, opacity: 0.28, tilt: 14, phase: 2.2, color: "var(--line-soft)" },
  { kind: "eighth", size: 21, lag: 0.08, opacity: 0.24, tilt: -8, phase: 2.9, color: "var(--terracotta)" },
];

/** Notes only start drifting once the instrument has finished being strung. */
const WAKE_AFTER_MS = 900;

/**
 * How long the trail keeps bobbing after it has caught up with a pointer that
 * has stopped. Past this the loop parks itself; a pointermove starts it again.
 */
const IDLE_AFTER_MS = 1400;

/** Below this, the furthest note is close enough to its target to call it rest. */
const SETTLED_PX = 0.35;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Musical glyphs that trail the pointer on a spring, each one lagging a little
 * further behind than the last — notes drifting off the strings.
 *
 * The animation runs entirely outside React: one rAF loop writing `transform`
 * on five nodes. No state changes, no layout reads, no re-renders.
 *
 * The loop is not always running. It starts on the first pointer move and parks
 * itself once the trail has caught up and stopped, so a page nobody is waving a
 * mouse at costs nothing per frame — which is the difference between an effect
 * that is free when idle and one that quietly taxes every interaction.
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
    let movedAt = performance.now();

    const start = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target.x = event.clientX;
      target.y = event.clientY;
      movedAt = performance.now();
      if (!seenPointer) {
        seenPointer = true;
        // Gather the trail at the pointer so it doesn't fly in from the centre.
        for (const point of points) {
          point.x = target.x;
          point.y = target.y;
        }
      }
      start();
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

      let moving = false;

      for (let i = 0; i < points.length; i += 1) {
        const note = TRAIL[i];
        const point = points[i];
        const lead = i === 0 ? target : points[i - 1];
        const k = 1 - (1 - note.lag) ** (dt / 16.667);

        const previousX = point.x;
        point.x += (lead.x - point.x) * k;
        point.y += (lead.y - point.y) * k;
        point.vx = point.x - previousX;

        if (Math.abs(lead.x - point.x) > SETTLED_PX || Math.abs(lead.y - point.y) > SETTLED_PX) {
          moving = true;
        }

        const bob = Math.sin(now * 0.0022 + note.phase) * 5;
        const rotation = note.tilt + clamp(point.vx * 1.1, -20, 20);

        nodes[i].style.transform =
          `translate3d(${point.x - note.size / 2}px, ${point.y - note.size / 2 + bob}px, 0)` +
          ` rotate(${rotation}deg)`;
      }

      // Park once the trail has caught up and the pointer has been still for a
      // moment. The idle bob is not worth a frame of anyone's battery.
      if (!moving && now - movedAt > IDLE_AFTER_MS) {
        frame = 0;
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    // No first frame until there is a pointer to follow: on load the notes are
    // parked and invisible anyway, and the main thread has better things to do.

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
