/**
 * Generates valid, branded PNG icons for the YoReservo BackOffice PWA:
 * - public/icons/icon-192x192.png (192x192)
 * - public/icons/icon-512x512.png (512x512)
 * - public/icons/icon-maskable-512x512.png (512x512, maskable safe zone)
 * - public/apple-touch-icon.png (180x180)
 *
 * Uses pure Node.js (`node:zlib`, `node:fs`) with Signed Distance Field (SDF)
 * anti-aliasing to produce crisp dark emerald (#1F290F) & electric lime (#C6F23B) icons.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";

// Brand palette
const EMERALD_DARK = [31, 41, 15]; // #1F290F
const OBSIDIAN_BG = [15, 20, 12]; // #0F140C
const ELECTRIC_LIME = [198, 242, 59]; // #C6F23B
const EMERALD_SURFACE = [43, 58, 21]; // #2B3A15

// CRC32 implementation for PNG chunks
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type 0 (None)
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const compressed = deflateSync(raw, { level: 9 });
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", iend),
  ]);
}

// Signed Distance Field helpers in normalized [-1, 1] coordinates
function sdRoundedBox(px, py, bx, by, r) {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r
  );
}

function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.max(
    0,
    Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)),
  );
  return Math.hypot(pax - bax * h, pay - bay * h);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function mixColor(base, over, alpha) {
  const a = clamp01(alpha);
  return [
    Math.round(base[0] * (1 - a) + over[0] * a),
    Math.round(base[1] * (1 - a) + over[1] * a),
    Math.round(base[2] * (1 - a) + over[2] * a),
  ];
}

function renderIcon(size, { maskable = false, fullBleed = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const aa = 2.0 / size; // anti-aliasing feather width in normalized coords
  const contentScale = maskable ? 0.76 : 0.9;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Normalized coordinates in [-1, 1]
      const nx = ((x + 0.5) / size) * 2 - 1;
      const ny = ((y + 0.5) / size) * 2 - 1;

      // Outer shape
      const outerDist =
        maskable || fullBleed
          ? -1
          : sdRoundedBox(nx, ny, 0.96, 0.96, 0.42);

      if (outerDist > aa) {
        const idx = (y * size + x) * 4;
        rgba[idx] = 0;
        rgba[idx + 1] = 0;
        rgba[idx + 2] = 0;
        rgba[idx + 3] = 0;
        continue;
      }

      const outerAlpha =
        maskable || fullBleed ? 1 : clamp01(0.5 - outerDist / aa);

      // Subtle radial gradient from #1F290F center to #0F140C edges
      const radial = clamp01(Math.hypot(nx, ny) * 0.75);
      let color = mixColor(EMERALD_DARK, OBSIDIAN_BG, radial * 0.55);

      // Scaled coordinates for inner emblem
      const sx = nx / contentScale;
      const sy = ny / contentScale;

      // Inner court frame (rounded rectangle border)
      const frameDist = Math.abs(sdRoundedBox(sx, sy, 0.78, 0.78, 0.24)) - 0.022;
      const frameAlpha = clamp01(0.5 - frameDist / aa);
      color = mixColor(color, EMERALD_SURFACE, frameAlpha * 0.9);

      // Top-right accent corner arc / badge glow (smooth fade)
      const badgeCornerDist = Math.abs(sdRoundedBox(sx, sy, 0.78, 0.78, 0.24)) - 0.014;
      const cornerWeight = clamp01((sx - 0.05) * 1.8) * clamp01((-sy - 0.05) * 1.8);
      if (cornerWeight > 0) {
        const glowAlpha = clamp01(0.5 - badgeCornerDist / aa) * cornerWeight;
        color = mixColor(color, ELECTRIC_LIME, glowAlpha * 0.65);
      }

      // Subtle court center line at bottom
      const courtLineDist = sdSegment(sx, sy, -0.45, 0.54, 0.45, 0.54) - 0.016;
      const courtLineAlpha = clamp01(0.5 - courtLineDist / aa);
      color = mixColor(color, ELECTRIC_LIME, courtLineAlpha * 0.38);

      // Center dot on court line
      const centerDotDist = Math.hypot(sx, sy - 0.54) - 0.045;
      const centerDotAlpha = clamp01(0.5 - centerDotDist / aa);
      color = mixColor(color, ELECTRIC_LIME, centerDotAlpha * 0.85);

      // Bold "Y" glyph (left side)
      const stroke = 0.068;
      const yLeftBranch = sdSegment(sx, sy, -0.52, -0.34, -0.30, -0.02);
      const yRightBranch = sdSegment(sx, sy, -0.08, -0.34, -0.30, -0.02);
      const yStem = sdSegment(sx, sy, -0.30, -0.02, -0.30, 0.30);
      const yDist = Math.min(yLeftBranch, yRightBranch, yStem) - stroke;

      // Bold "R" glyph (right side)
      const rStem = sdSegment(sx, sy, 0.13, -0.34, 0.13, 0.30);
      const rTopBar = sdSegment(sx, sy, 0.13, -0.34, 0.35, -0.34);
      const rMidBar = sdSegment(sx, sy, 0.13, -0.02, 0.35, -0.02);
      // Right bowl of R
      const bowlCenterX = 0.35;
      const bowlCenterY = -0.18;
      const bowlRadius = 0.16;
      const rBowl =
        sx >= bowlCenterX
          ? Math.abs(Math.hypot(sx - bowlCenterX, sy - bowlCenterY) - bowlRadius)
          : 10;
      const rLeg = sdSegment(sx, sy, 0.30, -0.02, 0.50, 0.30);
      const rDist =
        Math.min(rStem, rTopBar, rMidBar, rBowl, rLeg) - stroke;

      const glyphDist = Math.min(yDist, rDist);
      const glyphAlpha = clamp01(0.5 - glyphDist / aa);
      color = mixColor(color, ELECTRIC_LIME, glyphAlpha);

      const idx = (y * size + x) * 4;
      rgba[idx] = color[0];
      rgba[idx + 1] = color[1];
      rgba[idx + 2] = color[2];
      rgba[idx + 3] = Math.round(outerAlpha * 255);
    }
  }

  return encodePng(size, size, rgba);
}

const targets = [
  {
    path: join(process.cwd(), "public", "icons", "icon-192x192.png"),
    size: 192,
    options: { maskable: false, fullBleed: false },
  },
  {
    path: join(process.cwd(), "public", "icons", "icon-512x512.png"),
    size: 512,
    options: { maskable: false, fullBleed: false },
  },
  {
    path: join(process.cwd(), "public", "icons", "icon-maskable-512x512.png"),
    size: 512,
    options: { maskable: true, fullBleed: true },
  },
  {
    path: join(process.cwd(), "public", "apple-touch-icon.png"),
    size: 180,
    options: { maskable: false, fullBleed: true },
  },
];

for (const target of targets) {
  mkdirSync(dirname(target.path), { recursive: true });
  const pngBuffer = renderIcon(target.size, target.options);
  writeFileSync(target.path, pngBuffer);
  console.log(
    `Generated ${target.path} (${target.size}x${target.size}, ${pngBuffer.length} bytes)`,
  );
}
