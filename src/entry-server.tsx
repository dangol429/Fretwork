/* ---------------------------------------------------------------------------
   The build-time renderer. Node-only — never shipped to the browser.

   `scripts/prerender.mjs` builds this file with Vite's SSR mode and imports
   the result to turn every known chord into a real static `.html` file:
   `renderToString` for the body markup, `renderHeadHtml` for the `<title>`
   and meta block, both built from the exact same `ChordResult` the client
   would compute for the same slug — so hydration has nothing to reconcile.

   The catalog helpers are re-exported here too, so the prerender script has
   one build artifact to import rather than two.
--------------------------------------------------------------------------- */

import { Suspense } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { CursorNotes } from "./components/CursorNotes/CursorNotes";
import { ChordAnswer } from "./pages/ChordPage/ChordPage";
import { NotFound } from "./pages/NotFound/NotFound";
import type { ChordResult } from "./chords/resolve";
import { renderHeadHtml } from "./seo/head";
import { buildChordMeta, HOME_META } from "./seo/meta";

export { allChordCombos, resolveSlug, resultFor, slugFor, type ChordCombo } from "./chords/catalog";
export { canonicalRoot } from "./chords/enharmonics";
export { SITE_URL } from "./config";

export type RenderedPage = { body: string; head: string };

/**
 * Mirrors `App.tsx`'s own DOM shape exactly — the `.app` wrapper, the
 * `<Suspense>` boundary around the route, `<CursorNotes>` alongside it — down
 * to the initial (pre-"is-loaded") class name, since App only adds that after
 * its own first-paint effect runs. Anything that differs here is something
 * `hydrateRoot` will notice and repaint, discarding this page's head start.
 *
 * The `<Suspense>` boundary is what lets this work at all: the client's real
 * route is `React.lazy(loadChordPage)`, which is still loading on first paint,
 * but a boundary in the same tree position — even one whose server content
 * didn't need to suspend — is exactly what tells hydration to keep this
 * markup on screen until that chunk catches up, rather than discard it.
 */
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <Suspense fallback={null}>{children}</Suspense>
      <CursorNotes />
    </div>
  );
}

/** A chord's static file: the exact markup and head tags the client will
 *  hydrate onto and then keep in sync with. */
export function renderChordPage(slug: string, result: ChordResult): RenderedPage {
  const body = renderToString(
    <StaticRouter location={`/chord/${slug}`}>
      <AppShell>
        <ChordAnswer slug={slug} result={result} />
      </AppShell>
    </StaticRouter>,
  );
  const head = renderHeadHtml(buildChordMeta(result, slug));
  return { body, head };
}

/** The static 404 — served by most static hosts for any path with no file of
 *  its own, which is exactly what an unknown or non-canonical slug is here. */
export function renderNotFoundPage(): RenderedPage {
  const body = renderToString(
    <StaticRouter location="/not-found">
      <AppShell>
        <NotFound />
      </AppShell>
    </StaticRouter>,
  );
  const head = renderHeadHtml({ ...HOME_META, title: "Not found | Fretwork" }, { noindex: true });
  return { body, head };
}
