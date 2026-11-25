// Renders the theme's custom sections with their presets into static HTML pages, so
// they can be checked in a browser without a Shopify store. Shopify-only filters and
// objects are stubbed (no products, sample menu). Not part of the theme
// (see .shopifyignore).
//
//   LIQUIDJS=/path/to/node_modules/liquidjs node dev/render-preview.mjs
//     -> dev/home.html            header + templates/index.json (hero + showcase)
//     -> dev/preview.html         showcase only
//   Options: --autoplay  --nav=list|thumbs|numbers  (showcase)
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Local price proposal, generated from the calculator's maths and explicit inputs.
// Rebuild with: node dev/tools/export-decant-preview.mjs
const decantPricingPath = join(root, 'dev/pricing/decant-preview.json');
const decantPricing = existsSync(decantPricingPath) ? JSON.parse(readFileSync(decantPricingPath, 'utf8')) : null;
const require = createRequire(import.meta.url);
const { Liquid } = require(process.env.LIQUIDJS || 'liquidjs');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const engine = new Liquid({ root: [join(root, 'snippets')], extname: '.liquid', jsTruthy: false });

const kw = (list) => Object.fromEntries(list.filter(Array.isArray));
// Like Shopify, version asset URLs so browsers never keep a stale copy.
engine.registerFilter('asset_url', (f) => {
  const file = join(root, 'assets', f);
  const v = existsSync(file) ? Math.round(statSync(file).mtimeMs) : 0;
  return `../assets/${f}?v=${v}`;
});
engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('image_url', (img, ...a) => ({ img, ...kw(a), toString() { return img?.src || ''; } }));
engine.registerFilter('image_tag', (o, ...a) => {
  const attrs = kw(a);
  return `<img src="${o?.img?.src || ''}" alt="${attrs.alt ?? ''}" class="${attrs.class || ''}" loading="${attrs.loading || 'lazy'}">`;
});
// Shopify colour filters (approximate, HSL-based) for previews.
const hexToHsl = (hex) => {
  const h = String(hex).replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let hh = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh /= 6;
  }
  return [hh * 360, s * 100, l * 100];
};
const hslToHex = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0');
  return `#${f(0)}${f(8)}${f(4)}`;
};
engine.registerFilter('color_brightness', (hex) => {
  const h = String(hex).replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000;
});
engine.registerFilter('color_darken', (hex, amt) => { const [h, s, l] = hexToHsl(hex); return hslToHex(h, s, Math.max(0, l - amt)); });
engine.registerFilter('color_lighten', (hex, amt) => { const [h, s, l] = hexToHsl(hex); return hslToHex(h, s, Math.min(100, l + amt)); });
engine.registerFilter('money', (cents) => `₱${(Number(cents) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
engine.registerFilter('money_without_currency', (cents) => (Number(cents) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 }));

// {% style %} -> <style>, {% schema %} -> nothing
engine.registerTag('style', {
  parse(token, remain) {
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain);
    stream.on('tag:endstyle', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => {
      throw new Error('tag style not closed');
    });
    stream.start();
  },
  *render(ctx, emitter) {
    emitter.write('<style>');
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    emitter.write('</style>');
  },
});
// {% form 'product', product, id: '…', class: '…' %} -> a plain form posting to /cart/add
engine.registerTag('form', {
  parse(token, remain) {
    this.args = token.args;
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain);
    stream.on('tag:endform', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => {
      throw new Error('tag form not closed');
    });
    stream.start();
  },
  *render(ctx, emitter) {
    const attr = (name) => {
      const m = this.args.match(new RegExp(`${name}:\\s*([\\w.]+|'[^']*')`));
      if (!m) return '';
      const raw = m[1];
      return raw.startsWith("'") ? raw.slice(1, -1) : String(ctx.getSync(raw.split('.')) ?? '');
    };
    const action = /^\s*'customer'/.test(this.args) ? '/contact#' + attr('id') : '/cart/add';
    const extra = [...this.args.matchAll(/(data-[\w-]+):\s*'([^']*)'/g)].map(([, k, v]) => ` ${k}="${v}"`).join('');
    emitter.write(`<form method="post" action="${action}" accept-charset="UTF-8" enctype="multipart/form-data" id="${attr('id')}" class="${attr('class')}"${extra} novalidate>`);
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    emitter.write('</form>');
  },
});

// {% paginate %}: one page in previews.
engine.registerTag('paginate', {
  parse(token, remain) {
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain);
    stream.on('tag:endpaginate', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => {
      throw new Error('tag paginate not closed');
    });
    stream.start();
  },
  *render(ctx, emitter) {
    ctx.push({ paginate: { pages: 1, current_page: 1, parts: [], previous: null, next: null } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
  },
});
engine.registerFilter('structured_data', () => '{}');
engine.registerFilter('payment_terms', () => '');
engine.registerFilter('payment_button', () => '');
engine.registerFilter('metafield_tag', (f) => (f && f.value) || '');

engine.registerTag('schema', {
  parse(token, remain) {
    while (remain.length) {
      const t = remain.shift();
      if (t.name === 'endschema') return;
    }
  },
  render() {},
});

const defaults = (settings) =>
  Object.fromEntries(settings.filter((s) => s.id).map((s) => [s.id, s.default ?? (s.type === 'checkbox' ? false : '')]));

// PREVIEW ONLY: an example Journal. The articles are made up for the preview (general
// perfume basics, no claims about any product); the store writes its own.
const U = (id) => ({ src: `https://images.unsplash.com/${id}?w=1400&q=70&auto=format&fit=crop`, alt: '' });
const PARA = (t) => t.map((x) => `<p>${x}</p>`).join('');
const DEMO_ARTICLES = [
  ['how-to-choose-a-perfume-youve-never-smelled', "How to choose a perfume you've never smelled", 'Guides', 'photo-1585768750637-ada36319a484', '2026-11-18',
    PARA(["Buying perfume online starts with words instead of a scent strip, so it helps to know which words matter. Start with the family: fresh, floral, woody, amber or gourmand. If you already love one perfume, its family is the safest place to look first.", "Then read the notes in order. The top notes are the first impression and fade quickly; the heart is the character you will live with; the base is what stays on skin and clothes for hours.", "<h2>Use what you already know</h2>", "Think of smells you like outside perfume: lemon peel, cut grass, vanilla, wood smoke, clean laundry. Those likes tend to carry over to fragrance families.", "<blockquote>The heart notes are the ones you will smell most of the day.</blockquote>", "Finally, think about where you will wear it. A scent for the office can be quieter than one for an evening out."])],
  ['eau-de-parfum-or-eau-de-toilette', 'Eau de Parfum or Eau de Toilette?', 'Basics', 'photo-1515446134809-993c501ca304', '2026-11-12',
    PARA(["The names describe concentration: how much perfume oil is in the bottle. Eau de Parfum has more than Eau de Toilette, so it usually smells richer and lasts longer.", "That does not make one better than the other. Some perfumes are made to be light and bright, and the Eau de Toilette is the version their creators intended.", "How long any perfume lasts also depends on your skin, how much you spray and the weather."])],
  ['wearing-perfume-in-philippine-heat', 'Wearing perfume in Philippine heat', 'Weather', 'photo-1612253167527-0598073d2979', '2026-11-05',
    PARA(["Heat and humidity make perfume project more and fade faster, so a scent that feels soft in an air-conditioned shop can feel loud outside.", "Fewer sprays, applied to clothes as well as skin, keep a fragrance pleasant for longer on hot days. Fresh and citrus families tend to feel easier in the afternoon heat."])],
  ['top-heart-and-base-notes-explained', 'Top, heart and base notes, explained', 'Basics', 'photo-1563364664-399838d1394c', '2026-10-29',
    PARA(["A perfume changes as it dries. The lightest materials evaporate first, which is why the opening smells different from the same perfume an hour later.", "Reading a perfume's pyramid tells you what to expect at each stage."])],
].map(([handle, title, tag, img, date, content], i) => ({
  id: 7000 + i, handle, title, tags: [tag], image: U(img), published_at: date, author: 'Sangyó', content, excerpt: '',
  url: `/blogs/journal/${handle}`,
}));
const DEMO_BLOG = { title: 'Journal', handle: 'journal', url: '/blogs/journal', articles: DEMO_ARTICLES, articles_count: DEMO_ARTICLES.length, all_tags: ['Basics', 'Guides', 'Weather'] };

const globalSettingsData = JSON.parse(readFileSync(join(root, 'config/settings_data.json'), 'utf8'));
const globalSettings = typeof globalSettingsData.current === 'object' ? globalSettingsData.current : globalSettingsData.presets[globalSettingsData.current];
const globals = {
  settings: globalSettings,
  blogs: { journal: DEMO_BLOG },
  // PREVIEW ONLY: the vial picker page, so links to it (homepage set cards, product pages) work.
  pages: { 'build-your-set': { url: 'vial-picker.html' } },
  request: { design_mode: false },
  routes: {
    collections_url: '/collections',
    root_url: '/',
    cart_url: '/cart',
    cart_add_url: '/cart/add',
    cart_change_url: '/cart/change',
    cart_update_url: '/cart/update',
    search_url: '/search',
    account_url: '/account',
    all_products_collection_url: '/collections/all',
  },
  shop: { name: 'Sangyo', customer_accounts_enabled: true, enabled_payment_types: [] },
  cart: { item_count: 2 },
  customer: null,
  template: { name: 'index' },
};
// Like Shopify, global objects (routes, cart, shop…) are visible inside rendered snippets.
Object.assign(engine.options.globals, globals);


// Menus (link_list settings) become sample link lists: the recommended menus from
// docs/SETUP.md ("Navigation"). Entries are [title, url, children?].
const BRANDS = ['Armani', 'Chanel', 'Dior', 'Dolce & Gabbana', 'Hermès', 'Jo Malone', 'Tom Ford', 'Valentino', 'Versace', 'YSL'];
const handleOf = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const MENUS = {
  'main-menu': [
    ['Shop all', '/collections/all'],
    ['Brands', '/collections', BRANDS.map((b) => [b, `/collections/${handleOf(b)}`])],
    ['Scent notes', '/pages/scent-guide'],
    ['Journal', '/blogs/journal'],
    ['About', '/pages/about'],
  ],
  footer: [['Shipping & delivery', '/policies/shipping-policy'], ['Returns', '/policies/refund-policy'], ['Authenticity', '/pages/authenticity'], ['About us', '/pages/about'], ['Contact', '/pages/contact'], ['Privacy policy', '/policies/privacy-policy'], ['Terms of service', '/policies/terms-of-service']],
};
// Preview only: a few brand collections carry a product photo, as a real store's would.
const BRAND_IMAGES = {
  Armani: 'samyo-armani-stronger-with-you-intensely.webp',
  Dior: 'samyo-dior-sauvage-edp.webp',
  'Dolce & Gabbana': 'samyo-dg-the-one.webp',
};
const toLinks = (items, top) =>
  items.map(([title, url, kids], i) => ({
    title,
    url,
    type: url.startsWith('/collections/') ? 'collection_link' : 'http_link',
    object: BRAND_IMAGES[title] ? { image: { src: `../dev/shop-images/${BRAND_IMAGES[title]}`, alt: '' }, products: [] } : { products: [] },
    active: top && i === 0,
    current: false,
    links: kids ? toLinks(kids, false) : [],
  }));
function stubMenus(schemaSettings, values) {
  for (const def of schemaSettings) {
    if (def.type !== 'link_list' || !def.id) continue;
    const handle = typeof values[def.id] === 'string' && values[def.id] ? values[def.id] : 'main-menu';
    values[def.id] = { links: toLinks(MENUS[handle] || MENUS['main-menu'], handle === 'main-menu') };
  }
}

// Preview-only demo products (dev/preview-products.json) so Add to bag can be seen.
const demo = existsSync(join(root, 'dev/preview-products.json'))
  ? JSON.parse(readFileSync(join(root, 'dev/preview-products.json'), 'utf8'))
  : {};
let variantId = 9000;
const demoVariants = {}; // variant id -> what the fake cart returns (preview only)
let DEMO_RATINGS = false; // example ratings for the product-section preview only
function demoProduct(sectionName, i) {
  const d = sectionName === 'perfume-showcase' ? demo.showcase?.[i] : null;
  if (!d) return null;
  const variants = d.variants.map(([title, price, available]) => ({ id: ++variantId, title, price, available }));
  const first = variants.find((v) => v.available) || variants[0];
  return {
    title: d.title,
    vendor: d.vendor,
    url: '#product',
    description: '',
    available: variants.some((v) => v.available),
    has_only_default_variant: variants.length === 1,
    variants,
    selected_or_first_available_variant: first,
    price_min: Math.min(...variants.map((v) => v.price)),
    price_varies: variants.length > 1,
    metafields: DEMO_RATINGS && d.rating
      ? { reviews: { rating: { value: { rating: d.rating, scale_min: 1, scale_max: 5 } }, rating_count: { value: d.rating_count } } }
      : {},
    featured_media: null,
  };
}

// Template values that point at Shopify (Files, links) resolve to local stand-ins.
const resolveValue = (v) => {
  if (typeof v !== 'string') return v;
  const file = v.match(/^shopify:\/\/shop_images\/(.+)$/);
  if (file) return { src: `../dev/shop-images/${file[1]}`, alt: '' };
  if (v.startsWith('shopify://')) return '#';
  return v;
};
const resolveSettings = (obj = {}) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, resolveValue(v)]));

async function renderSection(name, id, overrides = {}, templateSection = null, blockOverrides = {}, scope = {}) {
  const source = readFileSync(join(root, `sections/${name}.liquid`), 'utf8');
  const schema = JSON.parse(source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/)[1]);
  const settings = { ...defaults(schema.settings), ...resolveSettings(templateSection?.settings), ...overrides };
  stubMenus(schema.settings, settings);
  const blockDefaults = Object.fromEntries((schema.blocks || []).map((b) => [b.type, defaults(b.settings || [])]));
  const source_blocks = templateSection
    ? templateSection.block_order.map((key) => templateSection.blocks[key])
    : schema.presets?.[0]?.blocks || [];
  const blocks = source_blocks.map((b, i) => {
    const blockSchema = (schema.blocks || []).find((x) => x.type === b.type)?.settings || [];
    const st = { ...blockDefaults[b.type], image: null, ...resolveSettings(b.settings), product: demoProduct(name, i), ...(blockOverrides[i] || {}) };
    stubMenus(blockSchema, st);
    if (st.product) {
      for (const v of st.product.variants) {
        demoVariants[v.id] = { product_title: st.product.title, vendor: st.product.vendor, variant_title: v.title, price: v.price, final_line_price: v.price, image: st.image?.src || '', url: '#product', currency: 'PHP' };
      }
    }
    return { id: `${id}-b${i + 1}`, type: b.type, shopify_attributes: `data-block-id="${id}-b${i + 1}"`, settings: st };
  });
  return engine.parseAndRender(source, { ...globals, ...scope, section: { id, index: 1, settings, blocks } });
}

const head = readFileSync(join(root, 'snippets/perfume-head.liquid'), 'utf8')
  .replace(/{%-?\s*comment\s*-?%}[\s\S]*?{%-?\s*endcomment\s*-?%}/g, '')
  .replace(/{{\s*'perfume-tokens\.css'.*}}/, `<link rel="stylesheet" href="../assets/perfume-tokens.css?v=${Math.round(statSync(join(root, 'assets/perfume-tokens.css')).mtimeMs)}">`);

// PREVIEW ONLY: point the store's URLs at the preview pages so every page links up.
const PREVIEW_LINKS = [
  [/^\/products\/[^"#?]*/, 'product.html'],
  [/^\/collections(\/[^"#?]*)?$/, 'collection.html'],
  [/^\/pages\/scent-guide$/, 'scent-guide.html'],
  [/^\/pages\/find-your-scent$/, 'find-your-scent.html'],
  [/^#(shop-all|brands|armani|chanel|dior|dolce-gabbana|herm-s|jo-malone|tom-ford|valentino|versace|ysl)$/, 'collection.html'],
  [/^#(scent-notes|journal|about)$/, 'scent-guide.html'],
  [/^\/pages\/about$/, 'scent-guide.html'],
  [/^\/blogs\/journal$/, 'journal.html'],
  [/^\/blogs\/journal\/tagged\/[^"#?]*$/, 'journal.html'],
  [/^\/blogs\/journal\/[^"#?]*$/, 'article.html'],
  [/^\/$/, 'home.html'],
  [/^#product$/, 'product.html'],
];
const linkPages = (html) =>
  html.replace(/href="([^"]*)"/g, (all, url) => {
    const hit = PREVIEW_LINKS.find(([re]) => re.test(url));
    return hit ? `href="${hit[1]}"` : all;
  });

const page = (title, body, filler = true) => linkPages(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${head}
<style>
  body { margin: 0; background: var(--pf-paper); color: var(--pf-ink); }
  .preview-next { padding: 96px var(--pf-gutter); font-family: var(--pf-font-serif); font-size: var(--pf-display-sm); }
</style>
</head>
<body>
<script>
  // PREVIEW ONLY: a fake cart (add, change, read) so Add to bag and the drawer work without a store.
  (() => {
    const variants = ${JSON.stringify(demoVariants)};
    const ids = Object.keys(variants);
    const items = [];
    let note = '';
    const put = (id, qty) => {
      const v = variants[id];
      if (!v) return;
      const it = items.find((x) => x.key === 'k' + id);
      if (it) it.quantity += qty;
      else items.push({ key: 'k' + id, variant_id: Number(id), quantity: qty, ...v });
    };
    // Start with two items, like the header's demo count.
    if (ids.length) { put(ids[1] || ids[0], 1); put(ids[ids.length - 1], 1); }
    const cart = () => {
      items.forEach((x) => { x.final_price = x.price; x.final_line_price = x.price * x.quantity; });
      return { item_count: items.reduce((a, x) => a + x.quantity, 0), total_price: items.reduce((a, x) => a + x.final_line_price, 0), currency: 'PHP', note, items };
    };
    const realFetch = window.fetch.bind(window);
    const json = (o) => new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } });
    window.fetch = async (url, opts = {}) => {
      const u = String(url);
      if (u.endsWith('/cart/add.js')) {
        await new Promise((r) => setTimeout(r, 900));
        const id = opts.body && opts.body.get ? opts.body.get('id') : null;
        put(id, 1);
        const it = items.find((x) => x.key === 'k' + id) || {};
        return json({ ...it, quantity: 1 });
      }
      if (u.endsWith('/cart/change.js')) {
        await new Promise((r) => setTimeout(r, 350));
        const b = JSON.parse(opts.body || '{}');
        const i = items.findIndex((x) => x.key === b.id);
        if (i > -1) { if (b.quantity > 0) items[i].quantity = b.quantity; else items.splice(i, 1); }
        return json(cart());
      }
      if (u.endsWith('/cart/update.js')) {
        const b = JSON.parse(opts.body || '{}');
        if (typeof b.note === 'string') note = b.note;
        return json(cart());
      }
      if (u.endsWith('/cart.js')) return json(cart());
      return realFetch(url, opts);
    };
  })();
</script>
<div style="position:fixed;left:8px;bottom:8px;z-index:200;font:11px/1.4 sans-serif;background:#26221f;color:#fff;padding:4px 8px;border-radius:4px;opacity:.75">Preview: demo products &amp; prices</div>
${body}
${filler ? '<div class="preview-next">Next section…</div>' : ''}
</body>
</html>`);

const showcaseOverrides = {};
if (args.autoplay) showcaseOverrides.autoplay = true;
if (args.nav) showcaseOverrides.nav_layout = args.nav;

// Home page: templates/index.json when present (what the store will show), else presets.
const templatePath = join(root, 'templates/index.json');
const template = existsSync(templatePath)
  ? JSON.parse(readFileSync(templatePath, 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, ''))
  : { order: ['hero', 'showcase'], sections: { hero: { type: 'perfume-hero' }, showcase: { type: 'perfume-showcase' } } };

// Override homepage range copy in memory only. The Shopify template is untouched.
if (decantPricing) {
  for (const section of Object.values(template.sections).filter(s => s.type === 'perfume-decants')) {
    for (const block of Object.values(section.blocks || {}).filter(b => b.type === 'bundle')) {
      const ml = Number(block.settings.size), count = Number(block.settings.count);
      const set = decantPricing.setMix.find(s => s.ml === ml && s.count === count);
      if (!set) continue;
      const index = [1, 2, 5, 10].indexOf(ml);
      const values = decantPricing.products.map(p => p.prices[index]).sort((a, b) => a - b);
      const amount = list => Math.round(list.reduce((a, n) => a + n, 0) * (1-set.discount/100) * 100) / 100;
      const money = n => '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 2 });
      block.settings.price = `${money(amount(values.slice(0, count)))} – ${money(amount(values.slice(-count)))}`;
      block.settings.badge = set.discount ? `${set.discount}% off` : '';
    }
  }
}

async function renderGroup(file, fallbackType, id) {
  const path = join(root, `sections/${file}`);
  if (!existsSync(path)) return renderSection(fallbackType, id);
  const group = JSON.parse(readFileSync(path, 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, ''));
  const out = [];
  for (const key of group.order) out.push(await renderSection(group.sections[key].type, key, {}, group.sections[key]));
  return out.join('\n');
}
const header = await renderGroup('header-group.json', 'perfume-header', 'header');
const footer = await renderGroup('footer-group.json', 'perfume-footer', 'footer');
const parts = [];
let showcase = '';
for (const key of template.order) {
  const sec = template.sections[key];
  if (sec.disabled) continue;
  const tpl = sec.blocks ? sec : null;
  const html = await renderSection(sec.type, key, sec.type === 'perfume-showcase' ? showcaseOverrides : {}, tpl);
  if (sec.type === 'perfume-showcase') showcase = html;
  parts.push(html);
}

writeFileSync(join(root, 'dev/home.html'), page('Sangyo home preview', `${header}\n<main id="MainContent">${parts.join('\n')}</main>\n${footer}`, false));
writeFileSync(join(root, 'dev/preview.html'), page('Perfume showcase preview', showcase));
console.log(`wrote dev/home.html (${template.order.join(', ')}) and dev/preview.html`);

// Footer review pages: the real section and forms, without the long homepage.
const footerGroupPreview = JSON.parse(readFileSync(join(root, 'sections/footer-group.json'), 'utf8'));
const footerSectionPreview = footerGroupPreview.sections.footer;
for (const [file, label, layout, alternative] of [
  ['footer-new.html', 'Editorial footer', 'atelier', 'footer-original.html'],
  ['footer-original.html', 'Original footer', 'classic', 'footer-new.html'],
]) {
  const footerPreview = await renderSection('perfume-footer', 'footer', { layout, reveal: false, ...(layout === 'classic' ? { wordmark_motion: 'none', wordmark_deboss: false, wordmark_mist: false } : {}) }, footerSectionPreview);
  const reviewBar = `<main id="MainContent" style="padding:20px clamp(22px,4vw,64px);display:flex;justify-content:space-between;gap:20px;align-items:center;font:12px 'Instrument Sans',sans-serif;background:#f7f5f0;color:#292521"><span>Footer preview · ${label}</span><a style="color:inherit;min-height:44px;display:inline-flex;align-items:center;text-underline-offset:4px" href="${alternative}">Compare ${layout === 'atelier' ? 'original' : 'new design'}</a></main>`;
  writeFileSync(join(root, `dev/${file}`), page(`Sangyó · ${label}`, reviewBar + footerPreview, false).replace('Preview: demo products &amp; prices', 'Footer design preview'));
}
await import('./tools/build-footer-motion.mjs');
await import('./tools/build-footer-hover.mjs');

// ---------- Hero ideas 1-6 (dev/hero-ideas.html) ----------
// Each idea is its own page (header + hero) so it can be framed at desktop or phone
// size; dev/hero-ideas.html shows them side by side with the current hero.
const heroTpl = template.sections.hero;
const heroPage = async (file, title, overrides, extra = '') => {
  const hero = await renderSection('perfume-hero', 'hero', overrides, heroTpl);
  writeFileSync(join(root, `dev/${file}`), page(title, `${header}\n<main id="MainContent">${hero}</main>${extra}`, false));
};
const NOW = { show_preloader: false };
const SAMPLE_TRUST = '100% authentic, from authorised distributors\nCash on delivery available\nShips from Manila within 24 hours';
await heroPage('hero-now.html', 'Hero: now', NOW);
await heroPage('hero-idea-1.html', 'Hero idea 1', { ...NOW, button_label: 'Shop fragrances', button2_label: 'Find your scent' });
await heroPage(
  'hero-idea-2.html',
  'Hero idea 2',
  NOW,
  `<style>.phh-tile.is-demo .phh-tile__label{opacity:1;transform:none}.phh-tile.is-demo img{transform:translateY(-5%) scale(1.05) rotate(-2deg)}</style>
<script>setTimeout(()=>{const t=document.querySelectorAll('.phh-tile')[0];if(!t)return;t.classList.add('is-demo');const c=document.querySelector('[data-phh-cursor]');const r=t.getBoundingClientRect();if(c){c.classList.add('is-on','is-big');c.style.transform='translate3d('+(r.left+r.width/2)+'px,'+(r.top+r.height/2)+'px,0)';}},2600);</script>`
);
await heroPage('hero-idea-4.html', 'Hero idea 4', { show_preloader: false, intro_speed: 'fast' });
await heroPage('hero-idea-4-now.html', 'Hero idea 4 (now)', { show_preloader: true });
await heroPage('hero-idea-5.html', 'Hero idea 5', { ...NOW, labels_on_touch: true });
await heroPage(
  'hero-idea-6.html',
  'Hero idea 6',
  { ...NOW, heading: 'Find the perfume\nthat smells\nlike you', slogan: 'Designer fragrances, delivered across the Philippines', trust_points: SAMPLE_TRUST }
);
console.log('wrote dev/hero-now.html and dev/hero-idea-*.html');

// ---------- Product-section ideas (dev/showcase-ideas.html) ----------
const showTpl = template.sections.showcase;
const showPage = async (file, title, overrides, blockOverrides = {}, extra = '') => {
  const html = await renderSection('perfume-showcase', 'showcase', overrides, showTpl, blockOverrides);
  writeFileSync(join(root, `dev/${file}`), page(title, `${header}\n<main id="MainContent">${html}</main>${extra}`, false));
};
await showPage('showcase-now.html', 'Product section: now', {});
DEMO_RATINGS = true;
await showPage('showcase-idea-1.html', 'Product idea 1: rating', { show_rating: true },
  {}, '<div style="position:fixed;right:8px;bottom:8px;z-index:200;font:11px sans-serif;background:#9b2c2c;color:#fff;padding:4px 8px;border-radius:4px">Example rating, not real data</div>');
DEMO_RATINGS = false;
await showPage('showcase-idea-2.html', 'Product idea 2: compare', { show_compare: true }, {},
  `<script>setTimeout(()=>document.querySelector('[data-ps-compare-open]')?.click(),1800);</script>`);
await showPage('showcase-idea-3.html', 'Product idea 3: mini bag', { after_add: 'mini' }, {},
  `<script>setTimeout(()=>document.querySelector('.ps-panel.is-active .ps-form')?.requestSubmit(),1800);</script>`);
await showPage('showcase-idea-4.html', 'Product idea 4: affiliate', {},
  { 3: { product: null, affiliate_url: '#cj-tracking-link-example', affiliate_label: 'Buy at FragranceX', affiliate_approved: true } },
  `<script>setTimeout(()=>document.querySelectorAll('[data-ps-next]')[0] && (document.querySelector('perfume-showcase').go(3)),1500);</script>`);
console.log('wrote dev/showcase-now.html and dev/showcase-idea-*.html');

// ---------- Product page and collection page (dev/product.html, dev/collection.html) ----------
// PREVIEW ONLY demo data. Notes are the four the homepage already shows for Dior Homme
// Intense; performance and scent profile stay empty on purpose (shows "Not assessed yet").
const IMG = {
  'Sauvage Eau de Parfum': ['samyo-dior-sauvage-edp.webp'],
  'Dior Homme Intense': ['samyo-dior-homme-intense.webp', 'with-box/samyo-dior-homme-intense.webp'],
  'The One': ['samyo-dg-the-one.webp'],
  'Stronger With You Intensely': ['samyo-armani-stronger-with-you-intensely.webp', 'with-box/samyo-armani-stronger-with-you-intensely.webp'],
};
const CONC = { 'Sauvage Eau de Parfum': 'Eau de Parfum', 'Dior Homme Intense': 'Eau de Parfum', 'Stronger With You Intensely': 'Eau de Parfum' };
const TINT = { 'Sauvage Eau de Parfum': '#D6DDE5', 'Dior Homme Intense': '#DFD9E6', 'The One': '#EAD8C2', 'Stronger With You Intensely': '#F1D2C6' };
let mediaId = 500;
const note = (name, art) => ({ name: { value: name }, art: { value: art }, description: { value: '' }, image: { value: null } });
const demoProducts = (demo.showcase || []).map((d) => {
  const media = (IMG[d.title] || []).map((f) => ({ id: ++mediaId, alt: '', preview_image: { src: `../dev/shop-images/${f}` } }));
  const variants = d.variants.map(([title, price, available]) => ({
    id: ++variantId, title, price, available, options: [title], compare_at_price: null, featured_media: null,
  }));
  const first = variants.find((v) => v.available) || variants[0];
  for (const v of variants) {
    demoVariants[v.id] = { product_title: d.title, vendor: d.vendor, variant_title: v.title, price: v.price, final_line_price: v.price, image: media[0]?.preview_image.src || '', url: 'product.html', currency: 'PHP' };
  }
  return {
    id: variantId * 7, title: d.title, vendor: d.vendor, url: 'product.html', handle: d.title.toLowerCase().replace(/[^a-z]+/g, '-'),
    description: '', available: variants.some((v) => v.available), has_only_default_variant: variants.length === 1,
    variants, selected_or_first_available_variant: first, price_min: Math.min(...variants.map((v) => v.price)),
    price_varies: variants.length > 1, media, featured_media: media[0] || null,
    options_with_values: [{ name: 'Size', values: variants.map((v) => ({ name: v.title })) }],
    collections: [{ title: d.vendor, url: 'collection.html', handle: 'brand' }],
    metafields: { fragrance: { concentration: CONC[d.title] ? { value: CONC[d.title] } : null, tile_color: { value: TINT[d.title] } }, reviews: {} },
  };
});
// Matching data for Similar fragrances: the notes the homepage presets already show.
const HOME_NOTES = {
  'Sauvage Eau de Parfum': [['Bergamot', 'bergamot'], ['Sichuan pepper', 'pepper'], ['Lavender', 'lavender'], ['Vanilla', 'vanilla']],
  'The One': [['Grapefruit', 'grapefruit'], ['Cardamom', 'cardamom'], ['Tobacco', 'tobacco'], ['Amber', 'amber']],
  'Stronger With You Intensely': [['Pink pepper', 'pepper'], ['Cinnamon', 'cinnamon'], ['Vanilla', 'vanilla'], ['Tonka', 'tonka']],
};
demoProducts.forEach((p) => {
  if (HOME_NOTES[p.title]) p.metafields.fragrance.profile = { value: { name: { value: p.title }, middle_notes: { value: HOME_NOTES[p.title].map(([a, b]) => note(a, b)) } } };
});
const homme = demoProducts.find((p) => p.title === 'Dior Homme Intense');
if (homme) {
  homme.description = '<p>Powdery and woody: iris and lavender over vetiver and cedar.</p>';
  homme.metafields.fragrance.tagline = { value: 'powdery iris, dark woods' };
  homme.metafields.fragrance.top_notes = { value: [note('Lavender', 'lavender')] };
  homme.metafields.fragrance.middle_notes = { value: [note('Iris', 'iris')] };
  homme.metafields.fragrance.base_notes = { value: [note('Vetiver', 'vetiver'), note('Cedar', 'cedar')] };
  homme.metafields.fragrance.profile = { value: {
    name: { value: 'Dior Homme Intense' }, brand: { value: 'Dior' }, concentration: { value: 'Eau de Parfum' },
    tagline: { value: 'powdery iris, dark woods' },
    top_notes: { value: [note('Lavender', 'lavender')] }, middle_notes: { value: [note('Iris', 'iris')] },
    base_notes: { value: [note('Vetiver', 'vetiver'), note('Cedar', 'cedar')] },
  } };
  const productTpl = JSON.parse(readFileSync(join(root, 'templates/product.json'), 'utf8'));
  const pScope = {
    product: homme,
    collection: null,
    template: { name: 'product' },
    recommendations: { 'performed?': true, performed: true, products: demoProducts.filter((p) => p !== homme) },
    collections: { all: { products: demoProducts } },
  };
  const pHeader = await renderGroupScoped('header-group.json', pScope);
  const pParts = [];
  // PREVIEW ONLY: placeholder reviews so the Testimonials design can be seen. Never real.
  const EXAMPLE = (i, stars) => ({ type: 'review', settings: { stars, quote: 'Example review: a real customer\'s words go here, exactly as they wrote them.', name: `Example name ${i}`, city: 'City', product_name: 'Dior Homme Intense', verified: i % 2 === 1 } });
  const exampleReviews = { blocks: { r1: EXAMPLE(1, 5), r2: EXAMPLE(2, 5), r3: EXAMPLE(3, 4), r4: EXAMPLE(4, 5) }, block_order: ['r1', 'r2', 'r3', 'r4'] };
  for (const key of productTpl.order) {
    const sec = productTpl.sections[key];
    const tpl = sec.type === 'perfume-testimonials' ? { ...sec, ...exampleReviews } : sec.blocks ? sec : { ...sec, blocks: {}, block_order: [] };
    let html = await renderSection(sec.type, key, {}, tpl, {}, pScope);
    if (sec.type === 'perfume-testimonials') html = html.replace('<span class="prv__anchor"', '<p style="position:absolute;right:16px;top:16px;margin:0;font:11px sans-serif;background:#9b2c2c;color:#fff;padding:4px 8px;border-radius:4px">Example placeholders, not real reviews</p><span class="prv__anchor"');
    pParts.push(html);
  }
  writeFileSync(join(root, 'dev/product.html'), page('Sangyo product preview', `${pHeader}\n<main id="MainContent">${pParts.join('\n')}</main>\n${footer}`, false));
  console.log('wrote dev/product.html (Dior Homme Intense)');
}

// Affiliate listing preview (dev/product-affiliate.html): Sauvage as if imported from
// the CJ feed. PREVIEW ONLY: example.com links and made-up example prices.
const sauvage = demoProducts.find((p) => p.title === 'Sauvage Eau de Parfum');
if (sauvage) {
  sauvage.metafields.samyo = {
    affiliate_offers: {
      value: sauvage.variants.map((v, i) => ({
        size: v.title, url: `https://example.com/cj-demo-link?size=${encodeURIComponent(v.title)}`,
        price: ['$95.00', '$120.00', '$165.00'][i] || '$99.00', in_stock: v.available, sku: `DEMO-${i + 1}`,
      })),
    },
    retailer: { value: 'FragranceX' },
    price_checked: { value: '2026-11-21' },
  };
  sauvage.description = '<p>Preview only: an imported product shows the description from the CJ feed here.</p>';
  const productTpl = JSON.parse(readFileSync(join(root, 'templates/product.json'), 'utf8'));
  const aScope = { product: sauvage, collection: null, template: { name: 'product' }, recommendations: { 'performed?': true, performed: true, products: demoProducts.filter((p) => p !== sauvage) } };
  const aHeader = await renderGroupScoped('header-group.json', aScope);
  const sec = productTpl.sections.main;
  const main = await renderSection(sec.type, 'main', {}, sec, {}, aScope);
  writeFileSync(join(root, 'dev/product-affiliate.html'), page('Sangyo affiliate product preview', `${aHeader}\n<main id="MainContent">${main}</main>\n${footer}`, false));
  console.log('wrote dev/product-affiliate.html (affiliate listing)');
}

const count = (fn) => demoProducts.filter(fn).length;
const brands = [...new Set(demoProducts.map((p) => p.vendor))];
const sizes = [...new Set(demoProducts.flatMap((p) => p.variants.map((v) => v.title)))].sort((a, b) => parseInt(a) - parseInt(b));
const demoCollection = {
  title: 'Shop all', url: 'collection.html', handle: 'all', description: '<p>Every designer perfume we carry, with its notes, so you know what it smells like before you buy.</p>',
  products: demoProducts, products_count: demoProducts.length, sort_by: 'best-selling', default_sort_by: 'best-selling',
  sort_options: [
    { name: 'Best selling', value: 'best-selling' }, { name: 'Alphabetically, A–Z', value: 'title-ascending' },
    { name: 'Price, low to high', value: 'price-ascending' }, { name: 'Price, high to low', value: 'price-descending' },
    { name: 'Newest', value: 'created-descending' },
  ],
  filters: [
    { label: 'Brand', type: 'list', active_values: [], values: brands.map((b) => ({ label: b, value: b, param_name: 'filter.p.vendor', count: count((p) => p.vendor === b), active: false })) },
    { label: 'Size', type: 'list', active_values: [], values: sizes.map((z) => ({ label: z, value: z, param_name: 'filter.v.option.size', count: count((p) => p.variants.some((v) => v.title === z)), active: false })) },
    { label: 'Availability', type: 'list', active_values: [], values: [{ label: 'In stock', value: '1', param_name: 'filter.v.availability', count: demoProducts.length, active: false }] },
    { label: 'Price', type: 'price_range', active_values: [], range_max: 1500000, min_value: { param_name: 'filter.v.price.gte', value: null }, max_value: { param_name: 'filter.v.price.lte', value: null } },
  ],
};
const cScope = { collection: demoCollection, template: { name: 'collection' } };
const cHeader = await renderGroupScoped('header-group.json', cScope);
const colTpl = JSON.parse(readFileSync(join(root, 'templates/collection.json'), 'utf8'));
const cParts = [];
for (const key of colTpl.order) {
  const sec = colTpl.sections[key];
  cParts.push(await renderSection(sec.type, key, {}, sec.blocks ? sec : { ...sec, blocks: {}, block_order: [] }, {}, cScope));
}
writeFileSync(join(root, 'dev/collection.html'), page('Sangyo collection preview', `${cHeader}\n<main id="MainContent">${cParts.join('\n')}</main>\n${footer}`, false));
console.log('wrote dev/collection.html');

async function renderGroupScoped(file, scope) {
  const group = JSON.parse(readFileSync(join(root, `sections/${file}`), 'utf8'));
  const out = [];
  for (const key of group.order) out.push(await renderSection(group.sections[key].type, key, {}, group.sections[key], {}, scope));
  return out.join('\n');
}

// ---------- Scent guide page (dev/scent-guide.html) ----------
{
  const gScope = { template: { name: 'page', suffix: 'scent-guide' }, page: { title: 'How to read a perfume' } };
  const gHeader = await renderGroupScoped('header-group.json', gScope);
  const gTpl = JSON.parse(readFileSync(join(root, 'templates/page.scent-guide.json'), 'utf8'));
  const gParts = [];
  for (const key of gTpl.order) gParts.push(await renderSection(gTpl.sections[key].type, key, {}, gTpl.sections[key], {}, gScope));
  writeFileSync(join(root, 'dev/scent-guide.html'), page('Sangyo scent guide preview', `${gHeader}\n<main id="MainContent">${gParts.join('\n')}</main>\n${footer}`, false));
  console.log('wrote dev/scent-guide.html');
}

// ---------- Find your scent quiz (dev/find-your-scent.html) ----------
// PREVIEW ONLY: example tags on the demo perfumes so the matching can be tried. In the
// store the owner tags each product (docs/QUIZ.md).
{
  const TAGS = {
    'Sauvage Eau de Parfum': ['fresh', 'spicy', 'aromatic', 'day', 'night', 'moderate', 'strong', 'hot', 'cool', 'men'],
    'Dior Homme Intense': ['floral', 'powdery', 'woody', 'night', 'moderate', 'cool', 'men'],
    'The One': ['spicy', 'warm', 'woody', 'night', 'moderate', 'cool', 'men'],
    'Stronger With You Intensely': ['sweet', 'gourmand', 'spicy', 'warm', 'night', 'strong', 'cool', 'men'],
  };
  demoProducts.forEach((p) => (p.tags = TAGS[p.title] || []));
  const qScope = { template: { name: 'page', suffix: 'find-your-scent' }, collections: { all: { products: demoProducts } } };
  const qHeader = await renderGroupScoped('header-group.json', qScope);
  const qTpl = JSON.parse(readFileSync(join(root, 'templates/page.find-your-scent.json'), 'utf8'));
  const qParts = [];
  for (const key of qTpl.order) qParts.push(await renderSection(qTpl.sections[key].type, key, {}, qTpl.sections[key], {}, qScope));
  writeFileSync(join(root, 'dev/find-your-scent.html'), page('Sangyo quiz preview', `${qHeader}\n<main id="MainContent">${qParts.join('\n')}</main>\n${footer}`.replace('<perfume-quiz', '<p style="position:fixed;right:8px;bottom:8px;z-index:200;font:11px sans-serif;background:#9b2c2c;color:#fff;padding:4px 8px;border-radius:4px">Example tags on demo perfumes</p><perfume-quiz'), false));
  console.log('wrote dev/find-your-scent.html');
}

// ---------- Fragrance profile page (dev/fragrance.html) ----------
// PREVIEW ONLY: an invented "Example Fragrance" so every discovery visual can be seen,
// including a long note list. Not a real perfume; every value is made up.
{
  const n = (name, art, description = '') => ({ name: { value: name }, art: { value: art }, description: { value: description }, image: { value: null } });
  const sc = (accord, score, explanation, notes) => ({ accord: { value: accord }, score: { value: score }, explanation: { value: explanation }, notes: { value: notes } });
  const example = {
    name: { value: 'Example Fragrance' }, brand: { value: 'Example House' }, concentration: { value: 'Eau de Parfum' },
    family: { value: 'Aromatic' }, tagline: { value: 'example: citrus, iris & woods' },
    description: { value: 'Example text: two or three sentences in Sangyó’s own words about what the perfume is like.' },
    palette_a: { value: '#DCE6EE' }, palette_b: { value: '#F3F0EB' },
    hero_image: { value: { src: '../assets/sample-bottle-clear.webp' } },
    characteristics_basis: { value: 'Example only, not an assessment' },
    characteristics: { value: [
      sc('Fresh', 4, 'Example: the bright, airy lift at the start.', [n('Bergamot', 'bergamot'), n('Mint', 'mint')]),
      sc('Aromatic', 3, 'Example: a herbal, clean side.', [n('Lavender', 'lavender')]),
      sc('Spicy', 3, 'Example: warmth without sweetness.', [n('Pepper', 'pepper'), n('Cardamom', 'cardamom')]),
      sc('Powdery', 2, 'Example: soft, cosmetic texture.', [n('Iris', 'iris')]),
      sc('Woody', 4, 'Example: the dry backbone of the dry-down.', [n('Cedar', 'cedar'), n('Vetiver', 'vetiver')]),
      sc('Amber', 2, 'Example: a warm glow late on.', [n('Amber', 'amber')]),
      sc('Musky', 2, 'Example: a clean skin-like finish.', [n('Musk', 'musk')]),
    ] },
    top_notes: { value: [n('Bergamot', 'bergamot', 'Example: bitter-bright citrus'), n('Lemon', 'lemon'), n('Grapefruit', 'grapefruit'), n('Mint', 'mint'), n('Pepper', 'pepper'), n('Apple', 'apple')] },
    middle_notes: { value: [n('Lavender', 'lavender'), n('Iris', 'iris'), n('Rose', 'rose'), n('Jasmine', 'jasmine'), n('Orange blossom', 'orange_blossom'), n('Cardamom', 'cardamom'), n('Cinnamon', 'cinnamon')] },
    base_notes: { value: [n('Cedar', 'cedar'), n('Vetiver', 'vetiver'), n('Amber', 'amber'), n('Musk', 'musk'), n('Vanilla', 'vanilla'), n('Tonka', 'tonka'), n('Patchouli', 'patchouli'), n('Tobacco', 'tobacco'), n('Mineral', 'mineral'), n('Orange', 'orange'), n('Cedar (Atlas)', 'cedar'), n('Vetiver (Haiti)', 'vetiver'), n('Musk (white)', 'musk')] },
    opening_text: { value: 'Example: bright citrus and a peppery spark.' },
    heart_text: { value: 'Example: lavender and a powdery iris come through.' },
    drydown_text: { value: 'Example: dry woods, amber and a clean musk.' },
    longevity_min_h: { value: 5 }, longevity_max_h: { value: 8 }, longevity_basis: { value: 'Example only' },
    projection: { value: 'Moderate' }, projection_basis: { value: 'Example only' },
    sillage: { value: 'Moderate' }, sillage_basis: { value: 'Example only' },
    day_night: { value: 'Day and night' }, wear_basis: { value: 'Example only' },
    climate_hot_day: { value: 'Good' }, climate_office: { value: 'Great' }, climate_rainy: { value: 'Great' }, climate_evening: { value: 'Careful' },
    wear_note: { value: 'Example: two sprays are plenty in the heat.' },
    occasions: { value: ['Everyday', 'Office', 'Casual'] },
    climate: { value: [
      { scenario: { value: 'Hot day' }, suitability: { value: 'Good' }, why: { value: 'Example: the fresh opening helps, but the woody base gets louder in the heat.' }, helps: { value: 'Fresh, citrus' }, apply: { value: 'Example: one spray, under clothing.' }, watch_out: { value: 'Example: crowded jeepneys at noon.' } },
      { scenario: { value: 'Office' }, suitability: { value: 'Great' }, why: { value: 'Example: clean and close in cool air-conditioning.' }, helps: { value: 'Aromatic, powdery' }, apply: { value: 'Example: two sprays before you leave home.' }, watch_out: { value: 'Example: small meeting rooms.' } },
      { scenario: { value: 'Rainy day' }, suitability: { value: 'Great' }, why: { value: 'Example: the woods and amber feel cosy in damp weather.' }, helps: { value: 'Woody, amber' }, apply: { value: 'Example: chest and neck.' }, watch_out: { value: '' } },
      { scenario: { value: 'Evening' }, suitability: { value: 'Careful' }, why: { value: 'Example: a bit plain for a night out; reach for something warmer.' }, helps: { value: '' }, apply: { value: '' }, watch_out: { value: 'Example: dressed-up dinners.' } },
    ] },
    occasion_fits: { value: [
      { occasion: { value: 'Everyday' }, fit: { value: 'Great' }, why: { value: 'Example: easy, clean, never too much.' } },
      { occasion: { value: 'Office' }, fit: { value: 'Great' }, why: { value: 'Example: polite at close range.' } },
      { occasion: { value: 'Date night' }, fit: { value: 'Not ideal' }, why: { value: 'Example: lacks warmth for an intimate evening.' } },
      { occasion: { value: 'Casual' }, fit: { value: 'Good' }, why: { value: 'Example: works with a T-shirt and jeans.' } },
    ] },
    brand_url: { value: 'https://example.com/brand' },
    offers: { value: [{ merchant: { value: 'Example Retailer' }, url: { value: 'https://example.com/shop' }, affiliate_url: { value: 'https://example.com/aff' }, is_affiliate_approved: { value: true }, price: { value: '$99.00' }, availability: { value: 'In stock' }, verified_on: { value: '2026-11-21' } }] },
    products: { value: [] },
  };
  const fScope = { metaobject: example, product: null, template: { name: 'metaobject' }, collections: { all: { products: demoProducts } } };
  const fHeader = await renderGroupScoped('header-group.json', fScope);
  const fTpl = JSON.parse(readFileSync(join(root, 'templates/metaobject/fragrance_profile.json'), 'utf8'));
  const fParts = [];
  for (const key of fTpl.order) {
    const sec = fTpl.sections[key];
    fParts.push(await renderSection(sec.type, key, {}, sec.blocks ? sec : { ...sec, blocks: {}, block_order: [] }, {}, fScope));
  }
  const banner = '<p style="position:fixed;right:8px;bottom:8px;z-index:200;font:11px sans-serif;background:#9b2c2c;color:#fff;padding:4px 8px;border-radius:4px">Example Fragrance: every value is made up for the preview</p>';
  writeFileSync(join(root, 'dev/fragrance.html'), page('Sangyo fragrance profile preview', `${fHeader}\n<main id="MainContent">${banner}${fParts.join('\n')}</main>\n${footer}`, false));
  console.log('wrote dev/fragrance.html (example profile)');
}

// ---------- A vs B page (dev/compare.html) ----------
// PREVIEW ONLY: two invented fragrances, every value made up.
{
  const n = (name, art) => ({ name: { value: name }, art: { value: art }, description: { value: '' }, image: { value: null } });
  const sc = (accord, score) => ({ accord: { value: accord }, score: { value: score }, explanation: { value: '' }, notes: { value: [] } });
  const make = (name, brand, img, notes, traits, lmin, lmax, proj, sill, family, climate, occ) => ({
    name: { value: name }, brand: { value: brand }, concentration: { value: 'Eau de Parfum' }, family: { value: family },
    hero_image: { value: { src: img } },
    top_notes: { value: notes[0].map(([a, b]) => n(a, b)) }, middle_notes: { value: notes[1].map(([a, b]) => n(a, b)) }, base_notes: { value: notes[2].map(([a, b]) => n(a, b)) },
    characteristics: { value: traits.map(([a, b]) => sc(a, b)) },
    longevity_min_h: { value: lmin }, longevity_max_h: { value: lmax }, projection: { value: proj }, sillage: { value: sill },
    climate_hot_day: { value: climate[0] }, climate_office: { value: climate[1] }, climate_rainy: { value: climate[2] }, climate_evening: { value: climate[3] },
    occasions: { value: occ }, products: { value: [] }, offers: { value: [] },
  });
  const one = make('Example One', 'Example House', '../assets/sample-bottle-clear.webp',
    [[['Bergamot', 'bergamot'], ['Pepper', 'pepper']], [['Lavender', 'lavender']], [['Amber', 'amber'], ['Cedar', 'cedar']]],
    [['Fresh', 4], ['Spicy', 3], ['Woody', 3]], 6, 9, 'Strong', 'Heavy', 'Aromatic', ['Good', 'Good', 'Great', 'Great'], ['Everyday', 'Date night']);
  const two = make('Example Two', 'Other Atelier', '../assets/sample-bottle-blue.webp',
    [[['Grapefruit', 'grapefruit'], ['Mint', 'mint']], [['Lavender', 'lavender'], ['Iris', 'iris']], [['Musk', 'musk'], ['Cedar', 'cedar']]],
    [['Fresh', 5], ['Powdery', 2], ['Musky', 3]], 4, 6, 'Moderate', 'Soft', 'Aromatic', ['Great', 'Great', 'Good', 'Careful'], ['Everyday', 'Office']);
  const cmp = { a: { value: one }, b: { value: two }, title: { value: '' }, verdict: { value: '<p>Example verdict: pick One for evenings and rain, Two for hot days and the office.</p>' } };
  const vScope = { metaobject: cmp, product: null, template: { name: 'metaobject' }, collections: { all: { products: demoProducts } } };
  const vHeader = await renderGroupScoped('header-group.json', vScope);
  const vTpl = JSON.parse(readFileSync(join(root, 'templates/metaobject/fragrance_comparison.json'), 'utf8'));
  const vParts = [];
  for (const key of vTpl.order) {
    const sec = vTpl.sections[key];
    vParts.push(await renderSection(sec.type, key, {}, sec.blocks ? sec : { ...sec, blocks: {}, block_order: [] }, {}, vScope));
  }
  const banner = '<p style="position:fixed;right:8px;bottom:8px;z-index:200;font:11px sans-serif;background:#9b2c2c;color:#fff;padding:4px 8px;border-radius:4px">Example comparison: both fragrances and every value are made up</p>';
  writeFileSync(join(root, 'dev/compare.html'), page('Sangyo comparison preview', `${vHeader}\n<main id="MainContent">${banner}${vParts.join('\n')}</main>\n${footer}`, false));
  console.log('wrote dev/compare.html');
}

// ---------- Journal (dev/journal.html, dev/article.html): example articles ----------
{
  const banner = '<p style="position:fixed;right:8px;bottom:8px;z-index:200;font:11px sans-serif;background:#9b2c2c;color:#fff;padding:4px 8px;border-radius:4px">Example Journal: articles made up for the preview</p>';
  const bScope = { blog: DEMO_BLOG, template: { name: 'blog' } };
  const bHeader = await renderGroupScoped('header-group.json', bScope);
  const bTpl = JSON.parse(readFileSync(join(root, 'templates/blog.json'), 'utf8'));
  const bParts = [];
  for (const key of bTpl.order) bParts.push(await renderSection(bTpl.sections[key].type, key, {}, { blocks: {}, block_order: [], ...bTpl.sections[key] }, {}, bScope));
  writeFileSync(join(root, 'dev/journal.html'), page('Sangyo journal preview', `${bHeader}\n<main id="MainContent">${banner}${bParts.join('\n')}</main>\n${footer}`, false));
  const aScope = { blog: DEMO_BLOG, article: DEMO_ARTICLES[0], template: { name: 'article' } };
  const aHeader = await renderGroupScoped('header-group.json', aScope);
  const aTpl = JSON.parse(readFileSync(join(root, 'templates/article.json'), 'utf8'));
  const aParts = [];
  for (const key of aTpl.order) aParts.push(await renderSection(aTpl.sections[key].type, key, {}, { blocks: {}, block_order: [], ...aTpl.sections[key] }, {}, aScope));
  writeFileSync(join(root, 'dev/article.html'), page('Sangyo article preview', `${aHeader}\n<main id="MainContent">${banner}${aParts.join('\n')}</main>\n${footer}`, false));
  console.log('wrote dev/journal.html, dev/article.html');
}

// ---------- Vial picker page (dev/vial-picker.html) ----------
// PREVIEW ONLY: proposed active rotation and recommended prices from the calculator.
// New fragrances without an owner-supplied photo have an empty image slot.
{
  if (!decantPricing) throw new Error('Generate dev/pricing/decant-preview.json before rendering the decant previews.');
  const SCENTS = decantPricing.products.map(p => [p.title, p.vendor, p.image, p.prices, p.handle]);
  let vVar = 8000;
  const vProducts = SCENTS.map(([title, vendor, img, prices, handle], i) => ({
    title, vendor, url: 'product.html', tags: [], handle,
    featured_media: img ? { id: 900 + i, alt: '', preview_image: { src: `../dev/shop-images/${img}` } } : null,
    variants: [
      { id: ++vVar, option1: '100 ml', price: 0, available: true },
      ...(prices || []).map((p, j) => ({ id: ++vVar, option1: `${[1, 2, 5, 10][j]} ml`, price: p * 100, available: true })),
    ],
  }));
  const vScope = { template: { name: 'page', suffix: 'decant-builder' }, collections: { all: { products: vProducts } }, cart: { currency: { iso_code: 'PHP' } } };
  const vHeader = await renderGroupScoped('header-group.json', vScope);
  const vTpl = JSON.parse(readFileSync(join(root, 'templates/page.decant-builder.json'), 'utf8'));
  for (const section of Object.values(vTpl.sections)) {
    for (const block of Object.values(section.blocks || {}).filter(b => b.type === 'set')) {
      const set = decantPricing.setMix.find(s => s.ml === Number(block.settings.size) && s.count === Number(block.settings.count));
      if (set) { block.settings.discount = set.discount; block.settings.badge = set.discount ? `${set.discount}% off` : ''; }
    }
  }
  const vParts = [];
  for (const key of vTpl.order) vParts.push(await renderSection(vTpl.sections[key].type, key, {}, vTpl.sections[key], {}, vScope));
  writeFileSync(join(root, 'dev/vial-picker.html'), page('Sangyo vial picker preview', `${vHeader}\n<main id="MainContent">${vParts.join('\n')}</main>\n${footer}`, false));
  console.log('wrote dev/vial-picker.html');
}

// ---------- Decant product page (dev/product-decant.html) ----------
// PREVIEW ONLY: Dior Homme Intense as a decant product (1, 2, 5, 10 ml at the
// dev/decant-pricing.html prices). The page should offer only 10 ml and link the
// smaller sizes to the vial picker.
{
  const homme = demoProducts.find((p) => p.title === 'Dior Homme Intense');
  if (homme) {
    let dv = 8800;
    const proposed = decantPricing.products.find(p => p.id === 'homme');
    const sizes = [1, 2, 5, 10].map((ml, i) => [`${ml} ml`, proposed.prices[i]]);
    const variants = sizes.map(([title, p]) => ({ id: ++dv, title, price: p * 100, available: true, options: [title], compare_at_price: null, featured_media: null }));
    const decant = { ...homme, handle: 'dior-homme-intense', variants, selected_or_first_available_variant: variants[0], price_min: Math.min(...proposed.prices)*100, price_varies: true, has_only_default_variant: false, options_with_values: [{ name: 'Size', values: sizes.map(([t]) => ({ name: t })) }], metafields: { ...homme.metafields, samyo: {} } };
    const dScope = { product: decant, collection: null, template: { name: 'product' }, collections: { all: { products: demoProducts } }, pages: { 'build-your-set': { url: 'vial-picker.html' } } };
    const dHeader = await renderGroupScoped('header-group.json', dScope);
    const productTpl = JSON.parse(readFileSync(join(root, 'templates/product.json'), 'utf8'));
    const main = await renderSection('main-product-perfume', 'main', {}, productTpl.sections.main, {}, dScope);
    // PREVIEW ONLY: an example FragranceX offer (example.com link, not a real CJ link).
    decant.metafields.samyo = { affiliate_offers: { value: [{ size: '100 ml', url: 'https://example.com/cj-link', price: '₱10,376.98', in_stock: true }] }, retailer: { value: 'FragranceX' }, price_checked: { value: '2026-11-22' } };
    const where = await renderSection('perfume-where-to-buy', 'where', {}, { blocks: {}, block_order: [], ...productTpl.sections.where }, {}, dScope);
    writeFileSync(join(root, 'dev/product-decant.html'), page('Sangyo decant product preview', `${dHeader}\n<main id="MainContent">${main}${where}</main>\n${footer}`, false));
    console.log('wrote dev/product-decant.html');
  }
}
