/* ---------------------------------------------------------------------------
   The chord list, made finite.

   `chords/fretboard.ts` can search out a voicing for any root and quality —
   that is what makes the engine work at all — but a website needs a countable
   set of pages, not a generator. Twelve roots by the qualities in
   `theory.ts` is that set: it is enumerated once here, and it is what the
   build walks to pre-render every chord page and write the sitemap.

   `resolveSlug` is the one function a route or the build script needs: given
   whatever is in the URL, it says whether that is a chord (and its answer),
   a non-canonical spelling to send elsewhere, or nothing at all.
--------------------------------------------------------------------------- */

import { resolveChord, type ChordResult } from "./resolve.ts";
import { QUALITIES, quality as qualityById, type PitchClass, type QualityId } from "./theory.ts";
import { ALT_ROOTS, CANONICAL_ROOTS, canonicalRoot, type RootSpelling } from "./enharmonics.ts";

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type ChordCombo = { rootPc: PitchClass; qualityId: QualityId };

/** Every root/quality pair this site can have a page for — the whole catalog. */
export function allChordCombos(): ChordCombo[] {
  return CANONICAL_ROOTS.flatMap((root) => QUALITIES.map((q) => ({ rootPc: root.pc, qualityId: q.id })));
}

const QUALITY_SLUGS = new Map(QUALITIES.map((q) => [q.id, slugify(q.label)]));
const QUALITY_BY_SLUG = new Map(QUALITIES.map((q) => [slugify(q.label), q.id]));

/** The chord's own canonical URL slug — the single source every link points to. */
export function slugFor(rootPc: PitchClass, qualityId: QualityId): string {
  return `${canonicalRoot(rootPc).slug}-${QUALITY_SLUGS.get(qualityId)}`;
}

/** Resolves an already-parsed combo into the answer this site shows for it. */
export function resultFor(combo: ChordCombo): ChordResult | null {
  const root = canonicalRoot(combo.rootPc);
  const suffix = qualityById(combo.qualityId).suffix;
  return resolveChord(`${root.ascii}${suffix}`);
}

/** `slug` must start with `root.slug + "-"`, and the rest must be a known quality. */
function matchSlug(slug: string, root: RootSpelling): QualityId | null {
  const prefix = `${root.slug}-`;
  if (!slug.startsWith(prefix)) return null;
  return QUALITY_BY_SLUG.get(slug.slice(prefix.length)) ?? null;
}

export type SlugLookup =
  | { status: "ok"; combo: ChordCombo; result: ChordResult }
  | { status: "redirect"; to: string }
  | { status: "not-found" };

/** What a `/chord/:slug` URL means: an answer, a redirect, or nothing. */
export function resolveSlug(slug: string): SlugLookup {
  for (const root of CANONICAL_ROOTS) {
    const qualityId = matchSlug(slug, root);
    if (qualityId === null) continue;
    const combo = { rootPc: root.pc, qualityId };
    const result = resultFor(combo);
    return result ? { status: "ok", combo, result } : { status: "not-found" };
  }

  for (const [pc, alt] of Object.entries(ALT_ROOTS)) {
    if (!alt) continue;
    const qualityId = matchSlug(slug, alt);
    if (qualityId === null) continue;
    return { status: "redirect", to: `/chord/${slugFor(Number(pc), qualityId)}` };
  }

  return { status: "not-found" };
}
