// Regression: the bag must show Shopify's actual paid prices, including partial eligibility.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
let Drawer;
vm.runInNewContext(readFileSync(new URL('../../assets/perfume-cart-drawer.js', import.meta.url), 'utf8'), {
  HTMLElement: class {},
  customElements: { get() {}, define(name, cls) { Drawer = cls; } },
  Intl, URL,
  location: { href: 'https://example.test/' },
});
const d = new Drawer();
d.dataset = { 'vial-2': '/vial.webp' };
const names = ['Uomo Born in Roma', 'Terre d’Hermès', 'The One', 'Eros', 'Bright Crystal', 'Light Blue'];
const original = [75000, 48000, 46000, 46000, 42000, 31500];
const render = (paid) => d.setCard({ set: 'Wardrobe six · 6 × 2 ml|test', lines: original.map((p, i) => ({ key: String(i), product_title: names[i], quantity: 1, variant_title: '2 ml', original_line_price: p, final_line_price: paid[i] })) }, 0, { currency: 'PHP' });
const corrected = render([52500, 33600, 32200, 32200, 29400, 22050]);
assert.match(corrected, /You save ₱865\.50/);
assert.match(corrected, /₱2,019\.50/);
assert.match(corrected, /Bright Crystal<\/span><span class="pcd__vial-pricing"><b>₱294\.00<\/b><small>Save ₱126\.00/);
assert.match(corrected, /Light Blue<\/span><span class="pcd__vial-pricing"><b>₱220\.50<\/b><small>Save ₱94\.50/);
const partial = render([55500, 35520, 34040, 34040, 42000, 31500]);
assert.match(partial, /You save ₱559\.00/);
assert.match(partial, /₱2,326\.00/);
assert.match(partial, /Bright Crystal<\/span><span class="pcd__vial-pricing"><b>₱420\.00<\/b><\/span>/);
const noDiscount = render(original);
assert.doesNotMatch(noDiscount, /You save|<small>Save/);
assert.match(noDiscount, /₱2,885\.00/);
console.log('Cart drawer: corrected 30%, partial eligibility and no-discount prices reconcile.');
