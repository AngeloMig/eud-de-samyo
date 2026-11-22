// Converts transparent PNG cut-outs to WebP (alpha kept) at a web-friendly size,
// then removes the PNGs.
//   SHARP=/path/to/node_modules/sharp node dev/tools/to-webp.mjs [dir=assets] [maxHeight=900] [maxWidth=900]
// Sample cut-outs live in assets/ (sample-*.png); product cut-outs for upload to
// Shopify Files live in dev/shop-images/.
import { readdirSync, unlinkSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP || 'sharp');
const [, , dirArg = 'assets', maxH = '900', maxW = '900'] = process.argv;
const dir = resolve(dirArg);

for (const file of readdirSync(dir).filter((f) => f.endsWith('.png'))) {
  const src = join(dir, file);
  const out = src.replace(/\.png$/, '.webp');
  const info = await sharp(src)
    .resize({ width: Number(maxW), height: Number(maxH), fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toFile(out);
  unlinkSync(src);
  console.log(`${file.replace('.png', '.webp')}: ${info.width}x${info.height}, ${Math.round(statSync(out).size / 1024)} KB`);
}
