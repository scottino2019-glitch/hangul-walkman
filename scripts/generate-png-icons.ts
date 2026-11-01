import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width: number, height: number, renderPixel: (x: number, y: number) => [number, number, number, number]): Buffer {
  const bytesPerPixel = 4;
  const scanlineLength = 1 + width * bytesPerPixel;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y);
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // Helper to calculate CRC32
  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = data.length;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const typeAndData = chunk.subarray(4, 8 + len);
    chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
    return chunk;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // No interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderCassetteIcon(width: number, height: number, isMaskable = false): Buffer {
  const marginRatio = isMaskable ? 0.15 : 0.05;
  const innerSize = width * (1 - marginRatio * 2);
  const minX = width * marginRatio;
  const minY = height * marginRatio;

  return createPng(width, height, (x, y) => {
    // If maskable, full dark background
    if (x < minX || x > width - minX || y < minY || y > height - minY) {
      return [24, 26, 32, 255]; // Dark background #181a20
    }

    const nx = (x - minX) / innerSize;
    const ny = (y - minY) / innerSize;

    // Body of Walkman (rounded rect: 0.05 .. 0.95)
    if (nx >= 0.05 && nx <= 0.95 && ny >= 0.08 && ny <= 0.92) {
      // Top header banner
      if (ny <= 0.22) {
        if (nx >= 0.1 && nx <= 0.2 && ny >= 0.12 && ny <= 0.18) {
          return [231, 111, 81, 255]; // Orange accent square
        }
        return [37, 42, 52, 255]; // #252a34 top plate
      }

      // Middle Cassette Window (ny between 0.26 and 0.72, nx between 0.12 and 0.88)
      if (nx >= 0.12 && nx <= 0.88 && ny >= 0.26 && ny <= 0.72) {
        // Window bezel
        if (nx < 0.15 || nx > 0.85 || ny < 0.29 || ny > 0.69) {
          return [20, 23, 29, 255];
        }

        // Inside tape body (white/cream cassette)
        if (nx >= 0.18 && nx <= 0.82 && ny >= 0.32 && ny <= 0.66) {
          // Label area
          if (ny >= 0.35 && ny <= 0.47 && nx >= 0.22 && nx <= 0.78) {
            return [231, 111, 81, 255]; // Orange cassette label #e76f51
          }

          // Two tape reels
          const ldx = nx - 0.33;
          const rdx = nx - 0.67;
          const dy = ny - 0.54;
          const leftDist = Math.sqrt(ldx * ldx + dy * dy);
          const rightDist = Math.sqrt(rdx * rdx + dy * dy);

          if (leftDist < 0.08 || rightDist < 0.08) {
            if (leftDist < 0.03 || rightDist < 0.03) {
              return [46, 52, 64, 255]; // Center peg
            }
            if (leftDist < 0.05 || rightDist < 0.05) {
              return [236, 239, 244, 255]; // White spool ring
            }
            return [46, 52, 64, 255]; // Reel circle
          }

          return [216, 222, 233, 255]; // Cream tape shell
        }

        return [13, 15, 19, 255]; // Window glass tint
      }

      // Bottom Button Area (ny >= 0.76 && ny <= 0.88)
      if (ny >= 0.76 && ny <= 0.88 && nx >= 0.12 && nx <= 0.88) {
        // Distinct buttons
        const buttonIdx = Math.floor((nx - 0.12) / ((0.88 - 0.12) / 5));
        const subX = ((nx - 0.12) % ((0.88 - 0.12) / 5)) / ((0.88 - 0.12) / 5);
        if (subX > 0.15 && subX < 0.85) {
          if (buttonIdx === 1) {
            return [231, 111, 81, 255]; // PLAY button orange
          }
          return [76, 86, 106, 255]; // Metallic keys
        }
        return [32, 36, 44, 255]; // Button cavity
      }

      // Main plastic Walkman body gradient
      const shade = Math.floor(46 + ny * 15);
      return [shade, shade + 6, shade + 18, 255];
    }

    return [24, 26, 32, 255]; // Base background
  });
}

const publicDir = path.resolve(process.cwd(), 'public');

// Generate 192x192
fs.writeFileSync(path.resolve(publicDir, 'pwa-192x192.png'), renderCassetteIcon(192, 192, false));
console.log('Generated pwa-192x192.png');

// Generate 512x512
fs.writeFileSync(path.resolve(publicDir, 'pwa-512x512.png'), renderCassetteIcon(512, 512, false));
console.log('Generated pwa-512x512.png');

// Generate Maskable 512x512 (with safe margins)
fs.writeFileSync(path.resolve(publicDir, 'pwa-maskable-512x512.png'), renderCassetteIcon(512, 512, true));
console.log('Generated pwa-maskable-512x512.png');

// Generate Apple Touch Icon 180x180
fs.writeFileSync(path.resolve(publicDir, 'apple-touch-icon.png'), renderCassetteIcon(180, 180, false));
console.log('Generated apple-touch-icon.png');
