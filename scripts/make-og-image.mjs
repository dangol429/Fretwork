// Rasterizes public/og-default.svg into public/og-default.png.
//
// The SVG is what most link-unfurlers (Slack, Discord, iMessage, X) read
// directly, but a few older or stricter ones (some LinkedIn/Facebook crawler
// paths, some chat apps) only accept a raster og:image. Unlike the app icons
// in make-icons.mjs — flat shapes and circles, cheap to rasterize by hand —
// this image has real text set in system fonts, which a hand-rolled rasterizer
// can't render well. @resvg/resvg-js (a real SVG renderer, via resvg + fontdb)
// is a devDependency for this reason; it never ships in the app bundle, only
// its output (the committed PNG) does.
//
// Not part of the build — the output is committed:
//
//     node scripts/make-og-image.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const svg = readFileSync("public/og-default.svg", "utf8");

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
  font: { loadSystemFonts: true },
});
const png = resvg.render().asPng();

writeFileSync("public/og-default.png", png);
console.log(`public/og-default.png: ${png.length} bytes`);
