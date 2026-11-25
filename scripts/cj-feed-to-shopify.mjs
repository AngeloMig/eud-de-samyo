#!/usr/bin/env node
// Turns a CJ (Commission Junction) product feed from an affiliate advertiser such as
// FragranceX into a Shopify product import CSV for Sangyo's AFFILIATE listings:
// products whose button says "Buy at FragranceX" and goes to your CJ tracking link.
// They are not sold by Sangyo, so nothing here sets real prices or stock.
//
// Local tool, not part of the theme (scripts/ is in .shopifyignore). No dependencies.
// How to get the feed and import the result: docs/CJ-FEED.md.
//
//   node scripts/cj-feed-to-shopify.mjs --in feed.csv --out shopify-import.csv \
//     [--brands "Dior,Chanel,Hermès"] [--match "sauvage,homme intense"] \
//     [--brand-map "Christian Dior=Dior,Giorgio Armani=Armani"] \
//     [--retailer FragranceX] [--include-testers] [--include-sets] \
//     [--limit 200] [--in-stock] [--status draft|active]
//
// Reads CSV, tab- or pipe-delimited feeds, in either CJ's classic columns (NAME,
// DESCRIPTION, BUYURL, IMAGEURL, PRICE, SALEPRICE, CURRENCY, MANUFACTURER, SKU, UPC,
// INSTOCK…) or the Google-Shopping-style columns (title, description, link,
// image_link, price, sale_price, brand, id, gtin, availability…).
//
// One product per perfume (name + brand + concentration), one variant per size, with:
//   - the feed's own description (licensed with the feed; nothing is written for it),
//   - the first image,
//   - product.metafields.samyo.affiliate_offers: JSON list of {size, url, price,
//     in_stock, sku} the theme uses for the button and price per size,
//   - samyo.retailer, samyo.price_checked (today), fragrance.concentration,
//   - tags affiliate + retailer + gender, Status draft (review before publishing).
import { readFileSync, writeFileSync } from 'node:fs';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith('--')) continue;
  const key = a.slice(2);
  const next = process.argv[i + 1];
  if (next === undefined || next.startsWith('--')) args[key] = true;
  else {
    args[key] = next;
    i++;
  }
}
if (!args.in || !args.out) {
  console.error('Usage: node scripts/cj-feed-to-shopify.mjs --in feed.csv --out shopify-import.csv [options]  (see the file header)');
  process.exit(1);
}

const list = (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const retailer = typeof args.retailer === 'string' ? args.retailer : 'FragranceX';
const brands = list(args.brands).map((b) => b.toLowerCase());
const matches = list(args.match).map((m) => m.toLowerCase());
const brandMap = Object.fromEntries(list(args['brand-map']).map((p) => p.split('=').map((s) => s.trim())));
const limit = Number(args.limit) || Infinity;
const status = args.status === 'active' ? 'active' : 'draft';
const today = new Date().toISOString().slice(0, 10);

// ---------- Read the feed ----------
const raw = readFileSync(args.in, 'utf8').replace(/^﻿/, '');
const firstLine = raw.slice(0, raw.indexOf('\n'));
const delimiter = ['\t', '|', ','].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];

function parse(text, d) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === d) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

const [header, ...lines] = parse(raw, delimiter);
const cols = header.map((h) => h.trim().toLowerCase());
const pick = (row, ...names) => {
  for (const n of names) {
    const i = cols.indexOf(n.toLowerCase());
    if (i > -1 && row[i] !== undefined && row[i].trim() !== '') return row[i].trim();
  }
  return '';
};

// ---------- Understand one row ----------
const CONC = [
  [/extrait/i, 'Extrait de Parfum'],
  [/eau de parfum|\bedp\b/i, 'Eau de Parfum'],
  [/eau de toilette|\bedt\b/i, 'Eau de Toilette'],
  [/eau de cologne|\bedc\b|\bcologne\b/i, 'Eau de Cologne'],
  [/\bparfum\b|\bpure perfume\b/i, 'Parfum'],
];
const toMl = (n, unit) => {
  if (/ml/i.test(unit)) return Math.round(n);
  const ml = n * 29.5735;
  return ml < 20 ? Math.round(ml) : Math.round(ml / 5) * 5; // 3.4 oz -> 100 ml, 1.7 oz -> 50 ml
};
const money = (value, currency) => {
  const m = String(value).match(/([\d.,]+)\s*([A-Z]{3})?/);
  if (!m) return '';
  const amount = Number(m[1].replace(/,/g, ''));
  const cur = m[2] || currency || 'USD';
  const symbol = { USD: '$', PHP: '₱', EUR: '€', GBP: '£' }[cur];
  return symbol ? `${symbol}${amount.toFixed(2)}` : `${amount.toFixed(2)} ${cur}`;
};
const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleCase = (s) => s.replace(/\b([a-z])([a-z']*)/gi, (_, a, b) => a.toUpperCase() + b.toLowerCase()).replace(/\bDe\b/g, 'de');

const skipped = { brand: 0, match: 0, tester: 0, set: 0, stock: 0, nolink: 0 };
const groups = new Map();

for (const row of lines) {
  const title = pick(row, 'title', 'name', 'product_name');
  const link = pick(row, 'buyurl', 'link', 'click_url', 'buy_url');
  if (!title || !link) {
    skipped.nolink++;
    continue;
  }
  const feedBrand = pick(row, 'brand', 'manufacturer');
  // FragranceX titles look like "Sauvage by Christian Dior Eau De Parfum Spray 3.4 oz (Men)".
  const by = title.match(/^(.*?)\s+by\s+(.*)$/i);
  const name = (by ? by[1] : title).trim();
  const brand0 = feedBrand || (by ? by[2].replace(/\s+(eau|parfum|cologne|tester|gift|set|spray|\d).*$/i, '') : '');
  const brand = brandMap[brand0] || brand0;
  const hay = `${title} ${pick(row, 'description')}`;
  if (brands.length && !brands.includes(brand.toLowerCase()) && !brands.includes(brand0.toLowerCase())) {
    skipped.brand++;
    continue;
  }
  if (matches.length && !matches.some((m) => title.toLowerCase().includes(m))) {
    skipped.match++;
    continue;
  }
  const tester = /\btester\b|\bunboxed\b/i.test(title);
  if (tester && !args['include-testers']) {
    skipped.tester++;
    continue;
  }
  if (/gift set|\bset\b|\bkit\b|\bminiature set\b/i.test(title) && !args['include-sets']) {
    skipped.set++;
    continue;
  }
  const availability = pick(row, 'availability', 'instock', 'in_stock').toLowerCase();
  const inStock = availability === '' ? null : /^(in stock|yes|true|1|y)$/.test(availability);
  if (args['in-stock'] && inStock === false) {
    skipped.stock++;
    continue;
  }
  const concentration = (CONC.find(([re]) => re.test(title)) || [])[1] || '';
  const size = title.match(/(\d+(?:\.\d+)?)\s*(oz|ml)\b/i);
  const sizeLabel = size ? `${toMl(Number(size[1]), size[2])} ml` : 'One size';
  const gender = (title.match(/\((men|women|unisex)\)/i) || [])[1];
  const currency = pick(row, 'currency');
  const price = money(pick(row, 'sale_price', 'saleprice') || pick(row, 'price', 'retailprice'), currency);

  const productTitle = `${titleCase(name)}${concentration ? ` ${concentration}` : ''}${tester ? ' (Tester)' : ''}`;
  const key = `${brand}|${productTitle}`.toLowerCase();
  if (!groups.has(key)) {
    if (groups.size >= limit) continue;
    groups.set(key, {
      handle: slug(`${brand} ${productTitle}`),
      title: productTitle,
      vendor: brand,
      description: pick(row, 'description'),
      image: pick(row, 'image_link', 'imageurl', 'image_url'),
      type: 'Fragrance',
      concentration,
      tags: ['affiliate', slug(retailer), gender && gender.toLowerCase()].filter(Boolean),
      offers: [],
    });
  }
  const g = groups.get(key);
  if (g.offers.some((o) => o.size === sizeLabel)) continue; // same size twice: keep the first
  g.offers.push({
    size: sizeLabel,
    url: link,
    price,
    in_stock: inStock,
    sku: pick(row, 'id', 'sku', 'ad_id'),
    barcode: pick(row, 'gtin', 'upc'),
  });
}

// ---------- Write the Shopify CSV ----------
const HEAD = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published', 'Status',
  'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Barcode', 'Variant Price',
  'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Requires Shipping', 'Variant Taxable',
  'Image Src', 'Image Position', 'Image Alt Text',
  'Affiliate offers (product.metafields.samyo.affiliate_offers)',
  'Retailer (product.metafields.samyo.retailer)',
  'Price checked (product.metafields.samyo.price_checked)',
  'Concentration (product.metafields.fragrance.concentration)',
];
const csv = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const body = (text) =>
  /<\w+[^>]*>/.test(text)
    ? text
    : text
        .split(/\n{2,}/)
        .map((p) => `<p>${esc(p.trim())}</p>`)
        .join('');

const out = [HEAD.map(csv).join(',')];
let variants = 0;
for (const g of groups.values()) {
  g.offers.sort((a, b) => parseInt(a.size) - parseInt(b.size));
  const offersJson = JSON.stringify(g.offers.map(({ barcode, ...o }) => o));
  g.offers.forEach((o, i) => {
    const first = i === 0;
    variants++;
    out.push(
      [
        g.handle,
        first ? g.title : '',
        first ? body(g.description) : '',
        first ? g.vendor : '',
        first ? g.type : '',
        first ? g.tags.join(', ') : '',
        first ? (status === 'active' ? 'TRUE' : 'FALSE') : '',
        first ? status : '',
        first ? 'Size' : '',
        o.size,
        o.sku,
        o.barcode,
        '0.00', // not sold by Sangyo: the retailer's price lives in the offers metafield
        'deny',
        'manual',
        'FALSE',
        'FALSE',
        first ? g.image : '',
        first && g.image ? '1' : '',
        first && g.image ? `${g.vendor} ${g.title}` : '',
        first ? offersJson : '',
        first ? retailer : '',
        first ? today : '',
        first ? g.concentration : '',
      ]
        .map(csv)
        .join(',')
    );
  });
}
writeFileSync(args.out, `${out.join('\n')}\n`);
console.log(
  `${groups.size} products, ${variants} sizes -> ${args.out}` +
    `\nskipped: ${Object.entries(skipped).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(', ') || 'none'}`
);
