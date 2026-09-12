// ---------------------------------------------------------------------------
// Turns the SPA shell `vite build` already produced into real per-chord HTML
// files, using the server bundle `vite build --ssr src/entry-server.tsx`
// wrote to dist-server/. Run after both builds — see package.json.
//
// For each chord in the catalog this writes dist/chord/<slug>/index.html with
// genuine markup (not an empty root div) and its own <title>/meta block, then
// writes dist/404.html and dist/sitemap.xml alongside it. Non-canonical
// enharmonic slugs get no file of their own — see chords/enharmonics.ts — so
// there is exactly one page per chord.
// ---------------------------------------------------------------------------

import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const distDir = path.resolve("dist");
const ssrDir = path.resolve("dist-server");
const ssrEntry = path.join(ssrDir, "entry-server.js");

if (!existsSync(ssrEntry)) {
  throw new Error(`Expected ${ssrEntry} — run "vite build --ssr src/entry-server.tsx --outDir dist-server" first.`);
}

const ssrEntryUrl = pathToFileURL(ssrEntry);
ssrEntryUrl.search = `t=${Date.now()}`;
const { allChordCombos, resultFor, slugFor, renderChordPage, renderNotFoundPage, SITE_URL } = await import(
  ssrEntryUrl.href
);

const template = await readFile(path.join(distDir, "index.html"), "utf8");
if (!template.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html does not contain \'<div id="root"></div>\' — prerender injection point moved.');
}
const META_BLOCK = /<!-- page-meta:start -->[\s\S]*?<!-- page-meta:end -->/;
if (!META_BLOCK.test(template)) {
  throw new Error("dist/index.html has no page-meta:start/end markers — prerender injection point moved.");
}

const withBody = (html, bodyHtml) => html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
// Replaces the homepage's own tags rather than appending beside them —
// two <title> elements would leave document.title (and a crawler reading raw
// HTML) pointed at whichever one comes first, which is never the right one.
const withHead = (html, headHtml) => html.replace(META_BLOCK, headHtml);

const urls = [`${SITE_URL}/`];
let written = 0;

for (const combo of allChordCombos()) {
  const slug = slugFor(combo.rootPc, combo.qualityId);
  const result = resultFor(combo);
  if (!result) continue; // the catalog only enumerates root/quality pairs that resolve

  const { body, head } = renderChordPage(slug, result);
  const html = withHead(withBody(template, body), head);

  const outDir = path.join(distDir, "chord", slug);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), html);

  urls.push(`${SITE_URL}/chord/${slug}`);
  written++;
}

const notFound = renderNotFoundPage();
await writeFile(path.join(distDir, "404.html"), withHead(withBody(template, notFound.body), notFound.head));

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`),
  "</urlset>",
  "",
].join("\n");
await writeFile(path.join(distDir, "sitemap.xml"), sitemap);

await rm(ssrDir, { recursive: true, force: true });

console.log(`Prerendered ${written} chord pages. Wrote sitemap.xml (${urls.length} urls) and 404.html.`);
