/* ---------------------------------------------------------------------------
   Putting a `PageMeta` into a document — two ways, one shape.

   `renderHeadHtml` is a plain string builder: the prerender script calls it in
   Node, with no DOM available, to bake tags into the static file it writes.
   `applyHeadTags` does the same job in the browser, upserting elements by id
   after a client-side navigation, so the tab title and share tags stay true
   once someone has clicked from one chord to another without a reload.

   Both read the same `PageMeta`, so a chord page never says two different
   things about itself depending on how it was reached.
--------------------------------------------------------------------------- */

import { SITE_NAME } from "../config.ts";
import type { PageMeta } from "./meta.ts";

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Server side: the `<title>` and `<meta>` block for one page, as HTML.
 *  `noindex` is for the 404 shell — a page reachable only by mistyping a URL
 *  has no business in a search index. */
export function renderHeadHtml(meta: PageMeta, { noindex = false } = {}): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = escapeHtml(meta.canonical);
  const image = escapeHtml(meta.ogImage);

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    noindex ? `<meta name="robots" content="noindex">` : `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">`,
    `<meta property="og:type" content="${meta.ogType}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
  ].join("\n    ");
}

/**
 * Adopts the matching tag already in the document — whether it came from
 * index.html's static defaults or from this same function on an earlier
 * route — and only creates a new one when nothing matches. That is what keeps
 * a client-side navigation from leaving duplicate meta tags behind.
 */
function meta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  const el = (document.head.querySelector(selector) ?? document.createElement("meta")) as HTMLMetaElement;
  el.setAttribute(attr, key);
  el.setAttribute("content", content);
  if (!el.isConnected) document.head.appendChild(el);
}

/** Client side: keeps the tab title and share tags true after a route change. */
export function applyHeadTags(pageMeta: PageMeta) {
  document.title = pageMeta.title;

  const canonical = (document.head.querySelector('link[rel="canonical"]') ??
    document.createElement("link")) as HTMLLinkElement;
  canonical.rel = "canonical";
  canonical.href = pageMeta.canonical;
  if (!canonical.isConnected) document.head.appendChild(canonical);

  meta("name", "description", pageMeta.description);
  meta("property", "og:site_name", SITE_NAME);
  meta("property", "og:type", pageMeta.ogType);
  meta("property", "og:title", pageMeta.title);
  meta("property", "og:description", pageMeta.description);
  meta("property", "og:url", pageMeta.canonical);
  meta("property", "og:image", pageMeta.ogImage);
  meta("name", "twitter:card", "summary_large_image");
  meta("name", "twitter:title", pageMeta.title);
  meta("name", "twitter:description", pageMeta.description);
}
