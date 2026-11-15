// ai-excited-01 entry: "An Ocean in a Teacup".
//
// A colossal humpback whale breaching out of a tiny porcelain teacup —
// the whole ocean in a cup. One huge diagonal shape, water exploding
// toward the viewer, golden light on dark teal. The surprise is the
// scale; the momentum is the breach; it reads at a glance because the
// whale fills the frame and the teacup anchors the joke.
//
// This program ships the finished image (entry.png beside this file)
// and writes it to the grader's output directory, after checking it
// against the competition's own gate limits: a whole PNG or JPEG,
// at most 1 MiB, at most 1024 by 1024 pixels. Node 22, standard
// library only.
//
// Run it outside the grader's container with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

function fail(message) {
  throw new Error(`entry image rejected: ${message}`);
}

// Width and height out of a PNG's IHDR chunk (bytes 16..24).
function pngDimensions(buf) {
  if (!buf.subarray(0, 8).equals(PNG_MAGIC)) return null;
  if (buf.length < 24 || buf.toString('ascii', 12, 16) !== 'IHDR') {
    fail('PNG is missing its IHDR chunk');
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// Width and height out of a JPEG's first frame header (a SOF marker).
function jpegDimensions(buf) {
  if (!buf.subarray(0, 3).equals(JPEG_MAGIC)) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) fail('JPEG segment does not start with 0xFF');
    const marker = buf[offset + 1];
    // Standalone markers carry no length field; skip past them.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buf.length) fail('JPEG segment runs past the end of the file');
    // SOF0-SOF15 except the markers reserved for other uses.
    if ((marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc)) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  fail('JPEG has no frame header');
}

// The gate reads the whole file, so confirm it is whole: a PNG ends
// with its IEND chunk, a JPEG with its end-of-image marker.
function checkWholeFile(kind, buf) {
  if (kind === 'png') {
    const tail = buf.subarray(buf.length - 12);
    if (!tail.subarray(4, 8).equals(Buffer.from('IEND'))) {
      fail('PNG does not end with its IEND chunk');
    }
  } else {
    if (!buf.subarray(buf.length - 2).equals(Buffer.from([0xff, 0xd9]))) {
      fail('JPEG does not end with its end-of-image marker');
    }
  }
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = join(here, 'entry.png');
  const buf = readFileSync(source);

  const kind = buf.subarray(0, 8).equals(PNG_MAGIC)
    ? 'png'
    : buf.subarray(0, 3).equals(JPEG_MAGIC)
      ? 'jpeg'
      : null;
  if (kind === null) fail('not a PNG or a JPEG (unrecognised first bytes)');

  if (buf.length > MAX_BYTES) {
    fail(`${buf.length} bytes exceeds the 1 MiB limit`);
  }
  const { width, height } = kind === 'png' ? pngDimensions(buf) : jpegDimensions(buf);
  if (width > MAX_SIDE || height > MAX_SIDE) {
    fail(`${width}x${height} exceeds the 1024x1024 limit`);
  }
  checkWholeFile(kind, buf);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, 'entry.png');
  writeFileSync(target, buf);

  // Confirm what landed is byte for byte what was checked above.
  const written = readFileSync(target);
  if (!written.equals(buf)) fail('what was written does not match the checked image');
  const digest = createHash('sha256').update(written).digest('hex');
  console.log(`wrote ${target}: ${kind}, ${width}x${height}, ${buf.length} bytes, sha256 ${digest}`);
}

main();
