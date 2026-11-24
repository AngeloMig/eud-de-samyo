// Build the wordmark studies from the current real footer, not a second mock logo.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dev = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(dev, 'footer-new.html'), 'utf8');
const version = file => `${file}?v=${Math.round(statSync(join(dev, file)).mtimeMs)}`;
const ideas = [
  ['Spritz reveal', 'A restrained spray of droplets introduces the lettering with a horizontal reveal.'],
  ['Letter rise', 'Each part of the signature rises from its baseline with a gentle stagger.'],
  ['Gentle breath', 'The whole wordmark expands slightly and settles once. No continuous looping.'],
  ['Scroll unveil', 'A vertical reveal when the signature enters view. Choose Full footer to try the scroll entrance.'],
  ['Prefix first · recommended', 'The small “eau de” arrives first; “sangyó” follows with a calm upward glide.'],
  ['Accent flourish', 'The final “ó” settles last with a tiny bounce, giving the accent a deliberate finish.'],
  ['Centre outward', 'The letters appear from the centre toward both edges, followed by the prefix.'],
  ['Perspective tilt', 'A very slight backward tilt settles flat into the final signature.'],
  ['Magnetic hover', 'The lettering responds subtly to a mouse pointer. Replay also shows a short demonstration for phones and keyboard users.'],
  ['Outline to ink', 'A fine outline turns into solid espresso lettering through a moving ink reveal.'],
];
for (let i = 0; i < 10; i++) {
  const setup = `<script>document.documentElement.dataset.motionContext=new URLSearchParams(location.search).get('context')==='footer'?'footer':'wordmark';</script>`;
  let html = source.replace('<title>Sangyó · Editorial footer</title>', `<title>Footer animation ${i + 1} · ${ideas[i][0]}</title>`);
  html = html.replace(/data-wordmark-motion="[^"]*"/g, 'data-wordmark-motion="none"').replace(/data-wordmark-hover="[^"]*"/g, 'data-wordmark-hover="none"').replace(/data-wordmark-mist="[^"]*"/g, 'data-wordmark-mist="false"');
  html = html.replace('</head>', `${setup}</head>`).replace('<body>', `<body data-motion-idea="${i + 1}">`);
  html = html.replace(/<div style="position:fixed;left:8px;bottom:8px;[\s\S]*?<\/div>/, '');
  html = html.replace('</body>', `<link rel="stylesheet" href="${version('footer-motion-preview.css')}"><script src="${version('footer-motion-study.js')}"></script></body>`);
  writeFileSync(join(dev, `footer-motion-idea-${i + 1}.html`), html);
}
const choices = ideas.map((idea, i) => `<button type="button" data-idea="${i}" aria-pressed="false"><span>${String(i + 1).padStart(2, '0')}</span>${idea[0]}</button>`).join('');
const config = JSON.stringify({ ideas }).replaceAll('</', '<\\/');
writeFileSync(join(dev, 'footer-motion.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sangyó · 10 footer animations</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap"><link rel="stylesheet" href="${version('design-ideas.css')}"><link rel="stylesheet" href="${version('footer-motion-preview.css')}"></head><body class="motion-review"><header class="studio-head"><h1>The signature · 10 footer animations</h1><a href="footer-new.html">Current footer</a></header><div class="studio-layout"><nav class="choices" aria-label="Choose a footer animation">${choices}<p>My pick: 5. A small introduction, then a confident signature.</p></nav><main class="workspace"><div class="preview-intro"><div><h2 id="idea-title"></h2><p id="idea-description"></p><div class="motion-toolbar" role="group" aria-label="Animation controls"><button type="button" data-replay>Replay animation</button><button type="button" data-context="wordmark" aria-pressed="true">Wordmark only</button><button type="button" data-context="footer" aria-pressed="false">Full footer</button><button type="button" data-reduced aria-pressed="false">Reduced motion</button></div><p class="motion-live" id="motion-live" aria-live="polite"></p></div><div class="size-controls" role="group" aria-label="Preview width"><button type="button" data-size="desktop" aria-pressed="true">Desktop</button><button type="button" data-size="phone" aria-pressed="false">Phone</button></div></div><div class="frame-surround"><iframe title="Footer animation preview"></iframe></div><p class="studio-foot">These are local animation studies using the actual footer lettering. Select an idea, then replay it. Full footer shows it in context. Reduced motion keeps the signature still. Idea 5 is now selected locally; these remain the original comparison studies.</p></main></div><script type="application/json" id="motion-config">${config}</script><script src="${version('footer-motion-preview.js')}"></script></body></html>`);
console.log('wrote dev/footer-motion.html and 10 footer animation studies');

// Selected signature: the production entrance and actual hover finish, with a
// local-only toggle so touch users can compare the two finishes.
let signature = source.replace('<title>Sangyó · Editorial footer</title>', '<title>Sangyó · Engraved signature</title>');
signature = signature.replace(/<main id="MainContent"[\s\S]*?<\/main>/, `<main id="MainContent" class="signature-review"><div><h1>A signature, with a trace of perfume.</h1><p>Idea 5 introduces the name. Hover for a soft perfume mist and a pressed-in finish.</p></div><div class="signature-controls"><button type="button" data-signature-replay>Replay entrance</button><button type="button" data-signature-pressed aria-pressed="false">Preview perfume hover</button><a href="footer-new.html">See full footer</a></div></main>`);
signature = signature.replace(/<div style="position:fixed;left:8px;bottom:8px;[\s\S]*?<\/div>/, '');
signature = signature.replace('</body>', `<link rel="stylesheet" href="${version('footer-signature-preview.css')}"><script src="${version('footer-signature-preview.js')}"></script></body>`);
writeFileSync(join(dev, 'footer-signature.html'), signature);
console.log('wrote dev/footer-signature.html');
