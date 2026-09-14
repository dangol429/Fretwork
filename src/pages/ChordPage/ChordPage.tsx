import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { ChordDiagram } from "../../components/ChordDiagram/ChordDiagram";
import { describeVoicing, readShape } from "../../chords/describe";
import { resolveSlug } from "../../chords/catalog";
import { altRoot } from "../../chords/enharmonics";
import { relatedChords } from "../../chords/related";
import { useChordSearch } from "../../chords/useChordNav";
import type { Voicing } from "../../chords/fretboard";
import type { ChordResult } from "../../chords/resolve";
import { hush, strum } from "../../audio/strum";
import { SITE_NAME } from "../../config";
import { applyHeadTags } from "../../seo/head";
import { buildChordFaqs, buildChordIntro, buildChordMeta } from "../../seo/meta";
import { breadcrumbSchema, faqSchema, howToSchema } from "../../seo/schema";
import { JsonLd } from "../../seo/JsonLd";
import { NotFound } from "../NotFound/NotFound";
import "./ChordPage.css";

/* ---------------------------------------------------------------------------
   The answer, in three tiers: most faithful first, most forgiving last.

   Tier 1 is every real way to play the chord. Tiers 2 and 3 only appear when
   the chord is genuinely hard — a player who typed "Em" does not need to be
   talked out of playing Em.
--------------------------------------------------------------------------- */

type PlayableProps = {
  voicing: Voicing;
  caption: string;
  /** The second line: the capo instruction, or how close a substitute is. */
  note?: string;
  badge?: string;
  capo?: number;
  /** What the button says it will play. */
  playing: string;
  index: number;
};

/** A pick, small enough to sit in the corner of a card and mean "strike it". */
const PICK = "M -7 -3.4 C -7 -6.6, -4.6 -7.6, 0 -7.6 C 4.6 -7.6, 7 -6.6, 7 -3.4 C 7 0.8, 2.6 5.8, 0.6 7.4 C 0.2 7.7, -0.2 7.7, -0.6 7.4 C -2.6 5.8, -7 0.8, -7 -3.4 Z";

function Playable({ voicing, caption, note, badge, capo = 0, playing, index }: PlayableProps) {
  const description = `Play ${playing}. ${caption}${note ? `. ${note}` : ""}. ${readShape(voicing, capo)}`;
  return (
    <button
      type="button"
      className="shape"
      data-enter="shape"
      style={{ "--i": index } as CSSProperties}
      onClick={() => strum(voicing.midi)}
      aria-label={description}
    >
      {badge && <span className="shape__badge">{badge}</span>}
      <ChordDiagram
        frets={voicing.frets}
        fingers={voicing.fingers}
        barre={voicing.barre}
        baseFret={voicing.baseFret}
        capo={capo}
        description={description}
      />
      <span className="shape__caption">{caption}</span>
      {note && <span className="shape__note">{note}</span>}
      <svg className="shape__pick" viewBox="-11 -11 22 22" aria-hidden="true">
        <path d={PICK} />
      </svg>
    </button>
  );
}

type TierProps = {
  index: number;
  label: string;
  aside: string;
  children: React.ReactNode;
};

function Tier({ index, label, aside, children }: TierProps) {
  const id = `tier-${index}`;
  return (
    <section className="tier" aria-labelledby={id}>
      <header className="tier__head">
        <span className="tier__index" aria-hidden="true">
          {index}
        </span>
        <h2 className="tier__label" id={id}>
          {label}
        </h2>
        <p className="tier__aside">{aside}</p>
      </header>
      <div className="tier__shapes">{children}</div>
    </section>
  );
}

type ChordAnswerProps = { slug: string; result: ChordResult };

/** The part of the page that only depends on data — reused as-is between the
 *  server prerender (given the result up front) and the client route below. */
export function ChordAnswer({ slug, result }: ChordAnswerProps) {
  const { chord, notes, voicings, hard, capo, similar } = result;
  const [draft, setDraft] = useState("");
  const search = useChordSearch();

  const combo = { rootPc: chord.rootPc, qualityId: chord.quality.id };
  const alt = altRoot(chord.rootPc);
  const related = relatedChords(combo);
  const meta = buildChordMeta(result, slug);
  const intro = buildChordIntro(result);
  const faqs = buildChordFaqs(result, alt);

  // `meta` is a fresh object every render; re-deriving it here rather than
  // depending on it directly keeps the effect from firing on every keystroke
  // in the search field above.
  useEffect(() => applyHeadTags(buildChordMeta(result, slug)), [result, slug]);

  // Two shapes can share a hand position — the easiest one there and the
  // fullest-sounding one. Where that happens, say how many strings each
  // sounds, since that is exactly the difference between them.
  const captions = voicings.map(describeVoicing);
  const shared = new Map<string, number>();
  for (const caption of captions) shared.set(caption, (shared.get(caption) ?? 0) + 1);
  const labels = captions.map((caption, i) =>
    (shared.get(caption) ?? 0) > 1
      ? `${caption} · ${voicings[i].midi.length} strings`
      : caption,
  );

  // Leaving the view should not leave a chord ringing behind it.
  useEffect(() => hush, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = draft.trim();
    if (!query) return;
    void search(query);
    setDraft("");
  };

  return (
    <main className="results">
      <header className="results__bar">
        <Link to="/" className="results__home">
          {SITE_NAME}
        </Link>

        <form className="results__search" role="search" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="results-chord">
            Search another chord
          </label>
          <input
            id="results-chord"
            className="results__input"
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Another chord…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
          />
        </form>
      </header>

      <nav className="results__breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/">Chords</Link>
          </li>
          <li aria-current="page">{chord.name}</li>
        </ol>
      </nav>

      <div className="results__head" data-enter="head">
        <h1 className="results__title">{chord.name}</h1>
        <p className="results__spoken">
          {chord.spoken}
          {alt && (
            <>
              {" "}
              · also written <span className="results__alt">{alt.ascii}{chord.quality.suffix}</span>
            </>
          )}
        </p>
        <p className="results__notes">{notes.join(" · ")}</p>
        <p className="results__intro">{intro}</p>
        <p className="results__hint">
          <svg className="results__hint-pick" viewBox="-11 -11 22 22" aria-hidden="true">
            <path d={PICK} />
          </svg>
          Click any shape to hear it played.
        </p>
      </div>

      <Tier
        index={1}
        label="Every way to play it"
        aside={`No capo. ${voicings.length} shapes, easiest first.`}
      >
        {voicings.map((voicing, i) => (
          <Playable
            key={voicing.frets.join(",")}
            voicing={voicing}
            index={i}
            caption={labels[i]}
            badge={i === 0 ? "Easiest" : undefined}
            playing={chord.name}
          />
        ))}
      </Tier>

      {!hard && (
        <p className="results__easy" data-enter="head">
          <span className="results__easy-mark" aria-hidden="true">
            ✓
          </span>
          <span>
            <strong>Already an easy open chord.</strong> There is an open shape for this one, so
            there is no capo trick or near-miss substitute worth showing — the first shape above is
            the one to learn.
          </span>
        </p>
      )}

      {hard && capo.length > 0 && (
        <Tier
          index={2}
          label="With a capo"
          aside="The very same notes, under an easier hand. It sounds identical."
        >
          {capo.map((suggestion) => (
            <Playable
              key={`${suggestion.shape.name}-${suggestion.capo}`}
              voicing={suggestion.voicing}
              index={suggestion.capo}
              capo={suggestion.capo}
              caption={`Capo ${suggestion.capo} · ${suggestion.shape.name} shape`}
              note={`Sounds ${chord.name}`}
              playing={`${chord.name} with a capo at fret ${suggestion.capo}`}
            />
          ))}
        </Tier>
      )}

      {hard && similar.length > 0 && (
        <Tier
          index={3}
          label="Sounds similar"
          aside="A different, easier chord. These play their own notes, so you can hear the difference."
        >
          {similar.map((substitute, i) => (
            <Playable
              key={substitute.shape.name}
              voicing={substitute.voicing}
              index={i}
              caption={substitute.shape.name}
              note={`Shares ${substitute.shared.length} of ${substitute.total} notes — ${substitute.shared.join(", ")}. Close, not identical.`}
              playing={`${substitute.shape.name}, a close substitute for ${chord.name}`}
            />
          ))}
        </Tier>
      )}

      {related.length > 0 && (
        <nav className="results__related" aria-label="Related chords">
          <h2 className="results__related-title">Related chords</h2>
          <ul>
            {related.map((rel) => (
              <li key={rel.slug}>
                <Link to={`/chord/${rel.slug}`}>{rel.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <JsonLd data={breadcrumbSchema(chord.name, meta.canonical)} />
      <JsonLd data={howToSchema(result, meta.canonical)} />
      {faqs.length > 0 && <JsonLd data={faqSchema(faqs)} />}
    </main>
  );
}

/** The `/chord/:slug` route itself: resolves the slug into an answer, a
 *  redirect to the canonical spelling, or a 404 — the one place that happens,
 *  so a direct visit and a client-side navigation mean exactly the same
 *  thing.
 *
 * An unknown slug is only ever reached by a fresh, hard navigation — nothing
 * in the app links to one — which means it always hydrates onto the static
 * `404.html` shell (see `entry-server.tsx`'s `renderNotFoundPage`). That
 * shell can't know the slug in advance, so this renders the same generic
 * `<NotFound/>` it does rather than one personalised with `slug`: showing a
 * different message here than what was already on screen is a hydration
 * mismatch for content that was never wrong in the first place. */
export function ChordPage({ slug }: { slug: string }) {
  const lookup = resolveSlug(slug);

  if (lookup.status === "redirect") return <Navigate to={lookup.to} replace />;
  if (lookup.status === "not-found") return <NotFound />;

  return <ChordAnswer slug={slug} result={lookup.result} />;
}
