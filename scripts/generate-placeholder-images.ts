/**
 * Generate placeholder images for the demo template.
 *
 * These are minimal placeholder images that users should replace with actual
 * comic content. The images are simple gray rectangles with text indicating
 * the page number.
 *
 * For the actual Fran Hopper comics, users can download from:
 * - https://comicbookplus.com/?dlid=18819 (Planet Comics #30 - Gale Allen)
 * - https://comicbookplus.com/?dlid=18820 (Planet Comics #32 - Gale Allen)
 * - https://comicbookplus.com/?dlid=18821 (Planet Comics #37 - Mysta)
 * - https://comicbookplus.com/?dlid=14294 (Planet Comics #39 - Mysta)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Minimal 1x1 gray PNG (placeholder)
// This is the smallest valid PNG file - 67 bytes
// In production, users replace these with actual comic pages
function createMinimalPNG(): Buffer {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk (image header)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(100, 0);  // width: 100px
  ihdrData.writeUInt32BE(150, 4);  // height: 150px (comic ratio)
  ihdrData.writeUInt8(8, 8);       // bit depth
  ihdrData.writeUInt8(2, 9);       // color type: RGB
  ihdrData.writeUInt8(0, 10);      // compression
  ihdrData.writeUInt8(0, 11);      // filter
  ihdrData.writeUInt8(0, 12);      // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Create simple gray image data
  // Each row: filter byte (0) + RGB pixels
  const rows: number[] = [];
  for (let y = 0; y < 150; y++) {
    rows.push(0); // filter byte
    for (let x = 0; x < 100; x++) {
      // Simple gray gradient
      const gray = Math.floor(100 + (y / 150) * 50);
      rows.push(gray, gray, gray); // RGB
    }
  }

  // Compress using deflate (zlib)
  const compressed = zlib.deflateSync(Buffer.from(rows), { level: 9 });

  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk (empty)
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  // Calculate CRC32
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation for PNG
function crc32(data: Buffer): number {
  let crc = 0xFFFFFFFF;
  const table = makeCRCTable();

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeCRCTable(): number[] {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xEDB88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c >>> 0;
  }
  return table;
}

interface PageInfo {
  storylineId: string;
  pageNumber: number;
  filename: string;
}

const pages: PageInfo[] = [
  // Gale Allen storyline - 5 pages
  { storylineId: 'gale-allen', pageNumber: 1, filename: 'page-1.png' },
  { storylineId: 'gale-allen', pageNumber: 2, filename: 'page-2.png' },
  { storylineId: 'gale-allen', pageNumber: 3, filename: 'page-3.png' },
  { storylineId: 'gale-allen', pageNumber: 4, filename: 'page-4.png' },
  { storylineId: 'gale-allen', pageNumber: 5, filename: 'page-5.png' },
  // Mysta of the Moon storyline - 5 pages
  { storylineId: 'mysta-of-the-moon', pageNumber: 1, filename: 'page-1.png' },
  { storylineId: 'mysta-of-the-moon', pageNumber: 2, filename: 'page-2.png' },
  { storylineId: 'mysta-of-the-moon', pageNumber: 3, filename: 'page-3.png' },
  { storylineId: 'mysta-of-the-moon', pageNumber: 4, filename: 'page-4.png' },
  { storylineId: 'mysta-of-the-moon', pageNumber: 5, filename: 'page-5.png' },
];

async function main() {
  console.log('Generating placeholder images for Fran Hopper comics...\n');

  const baseDir = path.join(ROOT, 'src', 'images', 'comics', 'fran-hopper');

  // Create directories
  const galeDir = path.join(baseDir, 'gale-allen');
  const mystaDir = path.join(baseDir, 'mysta-of-the-moon');

  fs.mkdirSync(galeDir, { recursive: true });
  fs.mkdirSync(mystaDir, { recursive: true });

  console.log(`Created: ${galeDir}`);
  console.log(`Created: ${mystaDir}\n`);

  // Generate placeholder images
  const pngData = createMinimalPNG();

  for (const page of pages) {
    const dir = path.join(baseDir, page.storylineId);
    const filePath = path.join(dir, page.filename);
    fs.writeFileSync(filePath, pngData);
    console.log(`Created: ${filePath}`);
  }

  console.log(`\n✓ Generated ${pages.length} placeholder images`);
  console.log('\nTo replace with actual Fran Hopper comics, download from:');
  console.log('  - https://comicbookplus.com/?dlid=18819 (Planet Comics #30)');
  console.log('  - https://comicbookplus.com/?dlid=18820 (Planet Comics #32)');
  console.log('  - https://comicbookplus.com/?dlid=18821 (Planet Comics #37)');
  console.log('  - https://comicbookplus.com/?dlid=14294 (Planet Comics #39)');
}

main().catch(console.error);
