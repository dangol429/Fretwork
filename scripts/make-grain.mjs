// Pre-renders the paper tooth behind every view.
//
// This used to be an <feTurbulence> filter evaluated at paint time over the
// whole viewport, which was the most expensive thing on the page. Rendering the
// same noise once, here, turns it into a bitmap the compositor merely tiles.
//
// Output: a seamless 128x128 4-bit grayscale PNG. Not part of the build — the
// result is committed, and this only needs running again if the grain changes:
//
//     node scripts/make-grain.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const SIZE = 128;

// Deterministic hash on a wrapped integer lattice, so the tile is seamless.
const hash = (x, y, seed) => {
  let h = (x & 1023) * 374761393 + (y & 1023) * 668265263 + seed * 1274126177;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

const smooth = (t) => t * t * (3 - 2 * t);

// Value noise whose lattice wraps at SIZE, so opposite edges match exactly.
const valueNoise = (x, y, cell, seed) => {
  const period = SIZE / cell;
  const fx = x / cell;
  const fy = y / cell;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = smooth(fx - x0);
  const ty = smooth(fy - y0);
  const wrap = (n) => ((n % period) + period) % period;
  const a = hash(wrap(x0), wrap(y0), seed);
  const b = hash(wrap(x0 + 1), wrap(y0), seed);
  const c = hash(wrap(x0), wrap(y0 + 1), seed);
  const d = hash(wrap(x0 + 1), wrap(y0 + 1), seed);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
};

// Three octaves, like the fractalNoise it replaces: per-pixel tooth on top of
// two coarser passes so the grain has some drift rather than being flat static.
//
// Written at 4 bits a pixel, two pixels to a byte. The tile is only ever seen
// through 4-5% opacity, where sixteen levels and two hundred and fifty six are
// the same picture, and half the file.
const raw = Buffer.alloc((SIZE / 2 + 1) * SIZE);
let at = 0;
for (let y = 0; y < SIZE; y += 1) {
  raw[at] = 0; // PNG scanline filter: none
  at += 1;
  for (let x = 0; x < SIZE; x += 2) {
    const level = (px) => {
      const n =
        hash(px, y, 1) * 0.5 + valueNoise(px, y, 2, 7) * 0.3 + valueNoise(px, y, 8, 13) * 0.2;
      return Math.max(0, Math.min(15, Math.round(n * 15)));
    };
    raw[at] = (level(x) << 4) | level(x + 1);
    at += 1;
  }
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

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 4; // bit depth
ihdr[9] = 0; // colour type: grayscale
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = process.argv[2] ?? "public/grain.png";
writeFileSync(out, png);
console.log(`${out}: ${png.length} bytes`);
