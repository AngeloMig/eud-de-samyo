import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dev = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(dev, 'footer-new.html'), 'utf8');
const version = file => `${file}?v=${Math.round(statSync(join(dev, file)).mtimeMs)}`;
const ideas = [
  ['Atomiser engraving', 'A fine perfume spray rises as the name presses into the stone. The current direction, refined.'],
  ['Scent trails', 'Three delicate scent ribbons drift upward behind the lettering, like fragrance lifting from skin.'],
  ['Evaporation', 'The letters soften and lift into the air, then return. A fleeting trace, like the opening of a fragrance.'],
  ['Amber infusion', 'A warm amber tint fills the lettering from the base, then recedes like perfume in a bottle.'],
  ['Bottle-glass refraction', 'A narrow, translucent echo passes across the name, suggesting light through thick perfume glass.'],
  ['Blotter impression', 'An ivory scent-testing strip slides behind the name as the lettering presses into the paper.'],
  ['A drop of fragrance', 'One drop sends fine ripples across the surface beneath the signature. Calm, minimal, tactile.'],
  ['Top, heart, base', 'Three translucent impressions unfold in sequence: sage, rose, then amber. An abstract scent pyramid.'],
  ['Liquid signature', 'A fine amber meniscus flows beneath the name while the letters sway once, like liquid settling.'],
  ['Accent spritz', 'The final “ó” gives a tiny press and releases a precise spray above its accent. A small signature detail.'],
];
for (let i = 0; i < ideas.length; i++) {
  let html = source.replace('<title>Sangyó · Editorial footer</title>', `<title>Perfume hover ${i + 1} · ${ideas[i][0]}</title>`)
    .replace(/data-wordmark-motion="[^"]*"/g, 'data-wordmark-motion="none"')
    .replace(/data-wordmark-hover="[^"]*"/g, 'data-wordmark-hover="none"')
    .replace(/data-wordmark-mist="[^"]*"/g, 'data-wordmark-mist="false"')
    .replace('<body>', `<body data-hover-idea="${i + 1}">`)
    .replace('</head>', `<script>document.documentElement.dataset.hoverContext=new URLSearchParams(location.search).get('context')==='footer'?'footer':'wordmark';</script></head>`)
    .replace(/<div style="position:fixed;left:8px;bottom:8px;[\s\S]*?<\/div>/, '')
    .replace('</body>', `<link rel="stylesheet" href="${version('footer-hover.css')}"><script src="${version('footer-hover-study.js')}"></script></body>`);
  writeFileSync(join(dev, `footer-hover-idea-${i + 1}.html`), html);
}
const choices = ideas.map(([name], i) => `<button type="button" data-hover-choice="${i}" aria-pressed="false"><span>${String(i + 1).padStart(2, '0')}</span>${name}</button>`).join('');
writeFileSync(join(dev, 'footer-hover.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sangyó · 10 perfume hover ideas</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap"><link rel="stylesheet" href="${version('design-ideas.css')}"><link rel="stylesheet" href="${version('footer-hover.css')}"></head><body class="hover-review"><header class="studio-head"><h1>A trace of perfume · 10 hover ideas</h1><a href="footer-signature.html">Current signature</a></header><div class="studio-layout"><nav class="choices" aria-label="Perfume hover ideas">${choices}<p>My picks: 2 for quiet elegance, 6 for a tactile finish, or 10 for a distinctive detail.</p></nav><main class="workspace"><div class="preview-intro"><div><h2 id="hover-title"></h2><p id="hover-description"></p><div class="hover-toolbar" role="group" aria-label="Preview controls"><button type="button" data-play-hover>Try hover</button><button type="button" data-entrance>Replay entrance #5</button><button type="button" data-context="wordmark" aria-pressed="true">Signature only</button><button type="button" data-context="footer" aria-pressed="false">Full footer</button><button type="button" data-reduced aria-pressed="false">Reduced motion</button></div><p id="hover-live" class="hover-live" aria-live="polite"></p></div><div class="size-controls" role="group" aria-label="Preview width"><button type="button" data-size="desktop" aria-pressed="true">Desktop</button><button type="button" data-size="phone" aria-pressed="false">Phone</button></div></div><div class="frame-surround"><iframe title="Perfume hover preview"></iframe></div><p class="studio-foot">Every option keeps entrance #5. Hover over the name, or press Try hover on any device. Each demonstration settles after one short movement. These are local studies; your current footer stays as it is.</p></main></div><script type="application/json" id="hover-config">${JSON.stringify(ideas)}</script><script src="${version('footer-hover-gallery.js')}"></script></body></html>`);
console.log('wrote dev/footer-hover.html and 10 perfume hover studies');
