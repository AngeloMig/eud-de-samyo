// Rebuild the brand-tile cut-outs using the repo's white-background pipeline.
// SHARP=/path/to/sharp node dev/tools/prepare-brand-tiles.mjs
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP || 'sharp');
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sources = join(root, 'dev/source-photos/brand-tiles');
const work = join(sources, 'cutouts');
mkdirSync(work, { recursive: true });
const entries = JSON.parse(readFileSync(join(sources, 'sources.json'), 'utf8'));
for (const entry of entries) {
  const cutout = join(work, entry.file.replace('.webp', '.png'));
  if (!entry.existing_cutout) {
    execFileSync(process.execPath, [join(root, 'dev/tools/whitebg-cutout.mjs'),
      join(sources, entry.selected_original), cutout, entry.crop.join(','), '244']);
  }
  const input = entry.existing_cutout ? join(root, entry.existing_cutout) : cutout;
  // A narrow crop can leave a detached strip of packaging. Keep the main horizontal
  // silhouette, preserving the cap and clear-glass parts above and below it.
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const spans = [];
  let span = null;
  for (let x = 0; x < info.width; x++) {
    let count = 0;
    for (let y = 0; y < info.height; y++) if (data[(y * info.width + x) * 4 + 3] > 16) count++;
    if (count) {
      if (!span) span = { left: x, right: x, area: 0 };
      span.right = x;
      span.area += count;
    } else if (span) {
      spans.push(span);
      span = null;
    }
  }
  if (span) spans.push(span);
  spans.sort((a, b) => b.area - a.area);
  const main = spans[0];
  if (!main) throw new Error(`No bottle silhouette in ${entry.file}`);
  const left = Math.max(0, main.left - 2);
  const right = Math.min(info.width, main.right + 3);
  await sharp(input).extract({ left, top: 0, width: right - left, height: info.height })
    .resize({ width: 400, height: 500, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toFile(join(root, 'dev/shop-images', entry.file));
  console.log(entry.file);
}
