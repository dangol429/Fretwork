// Rasterizes the mark in public/favicon.svg into the PNG sizes app icons
// actually need (iOS and manifest icons don't accept SVG). Same technique as
// make-grain.mjs — a hand-rolled PNG writer, no image-processing dependency.
// Not part of the build — the outputs are committed:
//
//     node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

// The favicon's own 32x32 design, read off public/favicon.svg so the two
// never drift apart.
const VIEW = 32;
const BG = [0x4a, 0x2b, 0x1c];
const RING = [0xc2, 0x70, 0x3d];
const CENTER = [0xf0, 0xed, 0xe8];
const LINE = [0xde, 0xd7, 0xcb];
const RING_R = 8.5;
const RING_HALF_STROKE = 1.1;
const CENTER_R = 4.5;
const LINE_YS = [11, 16, 21];
const LINE_OPACITY = 0.75;

const mix = (a, b, t) => a.map((c, i) => Math.round(c * (1 - t) + b[i] * t));

/** Colour at one point in the SVG's own 0..32 coordinate space. */
function sample(sx, sy) {
  let colour = BG;

  const d = Math.hypot(sx - 16, sy - 16);
  if (Math.abs(d - RING_R) <= RING_HALF_STROKE) colour = RING;
  else if (d <= CENTER_R) colour = CENTER;

  // The string lines are drawn last in the source, over everything beneath.
  for (const ly of LINE_YS) {
    if (Math.abs(sy - ly) <= 0.5) colour = mix(colour, LINE, LINE_OPACITY);
  }

  return colour;
}

function rasterize(size) {
  const scale = VIEW / size;
  const pixels = Buffer.alloc(size * size * 3);
  let at = 0;
  // 2x2 supersampling: cheap anti-aliasing for the curved edges.
  const offsets = [0.25, 0.75];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (const oy of offsets) {
        for (const ox of offsets) {
          const [sr, sg, sb] = sample((x + ox) * scale, (y + oy) * scale);
          r += sr;
          g += sg;
          b += sb;
        }
      }
      pixels[at] = Math.round(r / 4);
      pixels[at + 1] = Math.round(g / 4);
      pixels[at + 2] = Math.round(b / 4);
      at += 3;
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function writePng(size, outPath) {
  const pixels = rasterize(size);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0; // filter: none
    pixels.copy(raw, rowStart + 1, y * size * 3, (y + 1) * size * 3);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour (RGB)

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  writeFileSync(outPath, png);
  console.log(`${outPath}: ${png.length} bytes`);
}

writePng(180, "public/apple-touch-icon.png");
writePng(192, "public/icon-192.png");
writePng(512, "public/icon-512.png");
