/* ---------------------------------------------------------------------------
   JSON-LD, built from the same data the page already shows — never invented
   for the schema's sake. If a section has nothing genuine to say (an easy
   chord has no capo/substitute tier), the schema that would describe it is
   simply left out rather than padded.
--------------------------------------------------------------------------- */

import type { Voicing } from "../chords/fretboard.ts";
import type { ChordResult } from "../chords/resolve.ts";
import { SITE_NAME, SITE_URL } from "../config.ts";
import type { Faq } from "./meta.ts";

const STRING_NAMES = [
  "low E (6th) string",
  "A (5th) string",
  "D (4th) string",
  "G (3rd) string",
  "B (2nd) string",
  "high E (1st) string",
];

/** One step per string of the easiest voicing — what a HowTo is meant to be. */
function howToSteps(voicing: Voicing): { name: string; text: string }[] {
  const steps: { name: string; text: string }[] = [];

  if (voicing.barre) {
    const { fret, from, to } = voicing.barre;
    steps.push({
      name: `Barre fret ${fret}`,
      text: `Lay one finger flat across the ${STRING_NAMES[from]} through the ${STRING_NAMES[to]} at fret ${fret}.`,
    });
  }

  voicing.frets.forEach((fret, i) => {
    const barred = voicing.barre && fret === voicing.barre.fret && i >= voicing.barre.from && i <= voicing.barre.to;
    if (barred) return;

    if (fret < 0) {
      steps.push({ name: `Mute the ${STRING_NAMES[i]}`, text: `Rest a finger lightly on the ${STRING_NAMES[i]} so it doesn't ring.` });
    } else if (fret === 0) {
      steps.push({ name: `Leave the ${STRING_NAMES[i]} open`, text: `Play the ${STRING_NAMES[i]} open, without fretting it.` });
    } else {
      const finger = voicing.fingers[i];
      steps.push({
        name: `Fret the ${STRING_NAMES[i]}`,
        text: `Press the ${STRING_NAMES[i]} down at fret ${fret}${finger > 0 ? ` with your finger ${finger}` : ""}.`,
      });
    }
  });

  const muted = voicing.frets.some((fret) => fret < 0);
  steps.push({
    name: "Strum",
    text: `Strum from the low E down to the high E${muted ? ", skipping the muted strings" : ""}.`,
  });
  return steps;
}

export function breadcrumbSchema(chordName: string, canonicalUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Chords", item: SITE_URL },
      { "@type": "ListItem", position: 3, name: chordName, item: canonicalUrl },
    ],
  };
}

export function howToSchema(result: ChordResult, canonicalUrl: string) {
  const easiest = result.voicings[0];
  const steps = howToSteps(easiest);

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to play ${result.chord.name} on guitar`,
    description: `The easiest way to play ${result.chord.name}: a ${steps.length}-step fingering, easiest voicing first.`,
    url: canonicalUrl,
    step: steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

export function faqSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function webApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "A free guitar chord tool: look up any chord and see every voicing up the neck, easiest first, with a capo shortcut and an easier substitute when the chord is hard.",
    applicationCategory: "MusicApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
