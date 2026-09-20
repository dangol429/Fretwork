/* ---------------------------------------------------------------------------
   What a chord page says about itself — to a browser tab, a search result, a
   link unfurled in a chat app, and a screen reader landing cold.

   Pure data in, strings out. `seo/head.ts` is what actually puts these into a
   document, server or client side; this file only decides what they say, so
   the two never disagree.
--------------------------------------------------------------------------- */

import type { RootSpelling } from "../chords/enharmonics.ts";
import type { ChordResult } from "../chords/resolve.ts";
import { SITE_NAME, SITE_URL } from "../config.ts";

export type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  ogType: "website";
  ogImage: string;
};

// A PNG rather than the SVG it's rendered from — og:image needs to work in
// unfurlers that don't accept SVG at all (some LinkedIn/Facebook crawler
// paths, some chat apps). Regenerate from public/og-default.svg with
// `node scripts/make-og-image.mjs` whenever the source art changes.
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export const HOME_META: PageMeta = {
  title: `${SITE_NAME} — every way to play every guitar chord`,
  description:
    "Look up any guitar chord and see every way to play it — every voicing up the neck, easiest first, with capo and substitute shapes when the chord is hard.",
  canonical: SITE_URL,
  ogType: "website",
  ogImage: DEFAULT_OG_IMAGE,
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The canonical URL a chord page lives at — the one every tag points back to. */
export function chordUrl(slug: string): string {
  return `${SITE_URL}/chord/${slug}`;
}

export function buildChordMeta(result: ChordResult, slug: string): PageMeta {
  const { chord, voicings, hard } = result;
  const shapeCount = plural(voicings.length, "voicing");

  const title = hard
    ? `${chord.name} Chord Guitar — Every Voicing, Capo Shortcut & Easy Alternative | ${SITE_NAME}`
    : `${chord.name} Chord Guitar — Every Voicing | ${SITE_NAME}`;

  const description = hard
    ? `${chord.spoken} on guitar: ${shapeCount} shown easiest first, plus a capo shortcut and an easier substitute shape for when the full chord is out of reach.`
    : `${chord.spoken} on guitar: ${shapeCount} shown easiest first. An easy open chord, no capo trick or substitute needed.`;

  return {
    title,
    description,
    canonical: chordUrl(slug),
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  };
}

/** The one or two genuine sentences under the heading — never the same twice. */
export function buildChordIntro(result: ChordResult): string {
  const { chord, voicings, hard } = result;
  const shapeCount = plural(voicings.length, "way");

  if (!hard) {
    return `${chord.spoken} is a beginner-friendly open chord — there's an easy shape for it in the first position, so it's usually one of the first ${chord.quality.label} chords a new player learns. ${shapeCount[0].toUpperCase()}${shapeCount.slice(1)} to play it are shown below, easiest first.`;
  }

  return `${chord.spoken} is generally considered a harder chord to play, since even its easiest full voicing needs a barre. There are ${shapeCount} to play it below, plus a capo shortcut and an easier substitute for when the barre isn't there yet.`;
}

export type Faq = { question: string; answer: string };

/**
 * Only ever built from what is genuinely already on the page — the difficulty
 * verdict, the capo/substitute tiers, the enharmonic spelling. A page with
 * nothing real to add beyond the always-true difficulty question still gets
 * that one; nothing here is invented to pad the schema out.
 */
export function buildChordFaqs(result: ChordResult, altRoot: RootSpelling | null): Faq[] {
  const { chord, hard, capo, similar } = result;
  const faqs: Faq[] = [
    {
      question: `Is ${chord.name} a hard chord to play on guitar?`,
      answer: hard
        ? `Yes — the easiest full voicing of ${chord.name} needs a barre, which most beginners take a while to build the strength and accuracy for.`
        : `No — ${chord.name} has an easy open-position shape, so it's a good chord for a beginner to learn early.`,
    },
  ];

  if (hard && capo.length > 0) {
    const first = capo[0];
    faqs.push({
      question: `What's an easier way to play ${chord.name}?`,
      answer: `Put a capo on fret ${first.capo} and play the ${first.shape.name} shape — it sounds exactly like ${chord.name}, played with an open-chord shape instead of a barre.`,
    });
  } else if (hard && similar.length > 0) {
    const first = similar[0];
    faqs.push({
      question: `What's an easier chord that sounds like ${chord.name}?`,
      answer: `${first.shape.name} is close — it shares ${first.shared.length} of ${first.total} notes with ${chord.name} and is a much easier open shape, though it isn't the identical chord.`,
    });
  }

  if (altRoot) {
    faqs.push({
      question: `Is ${chord.name} the same as ${altRoot.ascii}${chord.quality.suffix}?`,
      answer: `Yes — ${chord.name} and ${altRoot.ascii}${chord.quality.suffix} are two names for the same notes. This page uses ${chord.name} as the more common guitar spelling.`,
    });
  }

  return faqs;
}
