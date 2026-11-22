// Cuts a product out of a pure-white studio background (retailer photos): crops a
// region, flood-fills near-white from the edges to transparent, softens the edge
// and trims. Better than Vision subject lifting for clear glass on white.
//
//   SHARP=/path/to/node_modules/sharp node dev/tools/whitebg-cutout.mjs \
//     <in> <out.png> <x0,y0,x1,y1 fractions> [threshold=244]
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP || 'sharp');

const [, , input, output, regionArg = '0,0,1,1', thresholdArg = '244'] = process.argv;
const threshold = Number(thresholdArg);
const [x0, y0, x1, y1] = regionArg.split(',').map(Number);

const meta = await sharp(input).metadata();
const left = Math.round(x0 * meta.width);
const top = Math.round(y0 * meta.height);
const width = Math.round((x1 - x0) * meta.width);
const height = Math.round((y1 - y0) * meta.height);

const { data, info } = await sharp(input)
  .extract({ left, top, width, height })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

if (info.channels !== 4) throw new Error(`expected RGBA, got ${info.channels} channels`);
const w = info.width;
const h = info.height;
const isBg = (i) => {
  const r = data[i * 4];
  const g = data[i * 4 + 1];
  const b = data[i * 4 + 2];
  return Math.min(r, g, b) >= threshold && Math.max(r, g, b) - Math.min(r, g, b) < 14;
};

// Flood fill from every border pixel.
const bg = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
while (stack.length) {
  const i = stack.pop();
  if (bg[i] || !isBg(i)) continue;
  bg[i] = 1;
  const x = i % w;
  if (x > 0) stack.push(i - 1);
  if (x < w - 1) stack.push(i + 1);
  if (i >= w) stack.push(i - w);
  if (i < w * (h - 1)) stack.push(i + w);
}

// Alpha mask, slightly softened at the edge.
const mask = Buffer.alloc(w * h);
for (let i = 0; i < w * h; i++) mask[i] = bg[i] ? 0 : 255;
const blurred = await sharp(mask, { raw: { width: w, height: h, channels: 1 } })
  .blur(0.7)
  .raw()
  .toBuffer({ resolveWithObject: true });
const step = blurred.info.channels;
for (let i = 0; i < w * h; i++) data[i * 4 + 3] = Math.min(data[i * 4 + 3], blurred.data[i * step]);

// Trim to the subject.
let minX = w, minY = h, maxX = 0, maxY = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] > 16) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const pad = 4;
const ex = {
  left: Math.max(0, minX - pad),
  top: Math.max(0, minY - pad),
  width: Math.min(w, maxX + pad + 1) - Math.max(0, minX - pad),
  height: Math.min(h, maxY + pad + 1) - Math.max(0, minY - pad),
};
await sharp(data, { raw: { width: w, height: h, channels: 4 } }).extract(ex).png().toFile(output);
console.log(`${output}: ${ex.width}x${ex.height}`);
