// Local-only perfume hover explorations. The selected Shopify treatment is untouched.
(() => {
  const params = new URLSearchParams(location.search);
  const idea = Number(document.body.dataset.hoverIdea);
  const footer = document.querySelector('perfume-footer');
  const wrap = footer?.querySelector('.pfo-signature');
  const wordmark = footer?.querySelector('[data-pfo-wordmark]');
  if (!wrap || !wordmark) return;
  const letters = [...wordmark.querySelectorAll('.pfo-wordmark__ch')];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => media.matches || params.get('motion') === 'reduce';
  document.documentElement.dataset.hoverReduced = String(reduced());
  const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
  let active = [];
  let temporary = [];
  let resetTimer;
  let entranceTimer;
  let sequence = 0;
  let ready = false;
  function report(message, state = 'rest') {
    document.body.dataset.hoverState = state;
    parent.postMessage({ kind: 'samyo-hover-state', message, reduced: reduced() }, location.origin);
  }
  function clean() {
    ++sequence;
    clearTimeout(resetTimer);
    active.forEach(animation => animation.cancel());
    active = [];
    temporary.forEach(el => el.remove());
    temporary = [];
    wrap.style.removeProperty('--pfo-pressed');
    document.body.dataset.hoverActive = '0';
  }
  function animate(el, frames, duration = 1500, delay = 0, easing = ease) {
    const animation = el.animate(frames, { duration, delay, easing, fill: 'both' });
    active.push(animation);
    return animation;
  }
  function add(el) { wrap.append(el); temporary.push(el); return el; }
  function art(markup) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 1000 300');
    el.setAttribute('preserveAspectRatio', 'none');
    el.setAttribute('aria-hidden', 'true');
    el.classList.add('hover-art');
    el.innerHTML = markup;
    return add(el);
  }
  function copy(color) {
    const el = wordmark.cloneNode(true);
    el.removeAttribute('data-pfo-wordmark');
    el.classList.remove('is-entering');
    el.classList.add('hover-copy');
    el.style.top = `${wordmark.offsetTop}px`;
    el.style.color = color;
    return add(el);
  }
  function droplets(accent = false, evaporate = false) {
    for (let i = 0; i < (accent ? 12 : 24); i++) {
      const cloud = !accent && i > 20;
      const dot = document.createElement('span');
      dot.className = `hover-dot${cloud ? ' hover-cloud' : ''}`;
      dot.setAttribute('aria-hidden', 'true');
      dot.style.left = `${accent ? 89 + (i % 3) * 0.8 : 13 + (i * 13 % 74)}%`;
      dot.style.top = `${accent ? 23 : 42 + i * 7 % 30}%`;
      if (evaporate) dot.style.background = '#807463';
      add(dot);
      const x = accent ? (i - 5.5) * 5 : 14 + (i % 5) * 8;
      const y = -25 - (i % 6) * 10;
      animate(dot, [
        { opacity: 0, transform: 'translate(0, 8px) scale(0.5)' },
        { opacity: cloud ? 0.22 : evaporate ? 0.22 : 0.7, offset: 0.2, transform: `translate(${x * 0.15}px, ${y * 0.1}px) scale(1)` },
        { opacity: 0, transform: `translate(${x}px, ${y}px) scale(${cloud ? 2.6 : 0.4})` },
      ], 1400 + i % 3 * 100, (accent ? 240 : 0) + i % 6 * 45);
    }
  }
  function press() { wrap.style.setProperty('--pfo-pressed', '1'); }
  async function play(demonstration = false) {
    if (!ready) return;
    clearTimeout(entranceTimer);
    footer.finishSignature();
    clean();
    if (reduced()) {
      // Static engraved feedback, with no plume, parallax or movement.
      press();
      report('Reduced motion: a still engraved finish. No spray or movement.', 'reduced');
      if (demonstration) resetTimer = setTimeout(reset, 2400);
      return;
    }
    const current = sequence;
    report('Playing perfume hover…', 'playing');
    switch (idea) {
      case 1:
        press();
        droplets();
        break;
      case 2: {
        const ribbons = art(`<g fill="none" stroke="#706c5c" stroke-width="1.1" opacity="0.48"><path d="M260 230 C210 180 350 150 295 108 S285 45 330 24"/><path d="M530 245 C600 190 475 152 535 110 S585 48 550 10"/><path d="M780 228 C830 170 735 140 782 98 S825 40 803 10"/></g>`);
        animate(ribbons, [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 0.7, transform: 'translateY(0)', offset: 0.35 },
          { opacity: 0, transform: 'translateY(-38px)' },
        ], 2200);
        animate(wordmark, [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)', offset: 0.45 }, { transform: 'translateY(0)' }], 2200);
        break;
      }
      case 3:
        letters.forEach((letter, i) => animate(letter, [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0.18, transform: 'translateY(-9px)', offset: 0.45 },
          { opacity: 1, transform: 'translateY(0)' },
        ], 1800, i * 70));
        droplets(false, true);
        break;
      case 4: {
        const amber = copy('#9b6037');
        animate(amber, [
          { clipPath: 'inset(100% -2% -12% -2%)', opacity: 0.3 },
          { clipPath: 'inset(-12% -2% -12% -2%)', opacity: 0.92 },
        ], 1800);
        break;
      }
      case 5: {
        const glass = copy('#fff8e9');
        glass.style.textShadow = '2px 1px 1px rgba(85,72,55,0.3)';
        animate(glass, [
          { clipPath: 'inset(-15% 100% -20% -15%)', transform: 'translateX(-3px)', opacity: 0 },
          { clipPath: 'inset(-15% 65% -20% 15%)', transform: 'translateX(3px)', opacity: 0.9, offset: 0.35 },
          { clipPath: 'inset(-15% -15% -20% 100%)', transform: 'translateX(0)', opacity: 0 },
        ], 2100);
        break;
      }
      case 6: {
        const paper = document.createElement('span');
        paper.className = 'hover-blotter';
        paper.setAttribute('aria-hidden', 'true');
        add(paper);
        animate(paper, [{ opacity: 0, transform: 'translateX(-24px) rotate(-2deg)' }, { opacity: 1, transform: 'translateX(0) rotate(0)' }], 1200);
        press();
        break;
      }
      case 7:
        for (let i = 0; i < 3; i++) {
          const ripple = art('<ellipse cx="770" cy="218" rx="170" ry="38" fill="none" stroke="#8b7a60" stroke-width="1"/>');
          ripple.style.transformOrigin = '77% 73%';
          animate(ripple, [
            { opacity: 0, transform: 'scale(0.12)' },
            { opacity: 0.65, transform: 'scale(0.35)', offset: 0.18 },
            { opacity: 0, transform: 'scale(2)' },
          ], 1900, i * 230);
        }
        break;
      case 8:
        ['#71795f', '#ad7f7b', '#a27140'].forEach((color, i) => {
          const note = copy(color);
          animate(note, [
            { opacity: 0, transform: 'translateY(10px)' },
            { opacity: 0.7, transform: 'translateY(-2px)', offset: 0.35 },
            { opacity: 0, transform: `translateY(${-14 - i * 4}px)` },
          ], 1200, i * 410);
        });
        break;
      case 9: {
        const liquid = art('<path d="M40 240 C210 245 210 220 350 234 S550 252 690 235 S850 220 960 235" fill="none" stroke="#a27140" stroke-width="1.8"/>');
        animate(liquid, [
          { clipPath: 'inset(0 100% 0 0)', opacity: 0, transform: 'translateY(4px)' },
          { clipPath: 'inset(0 0 0 0)', opacity: 0.85, transform: 'translateY(0)', offset: 0.65 },
          { clipPath: 'inset(0 0 0 0)', opacity: 0.6, transform: 'translateY(1px)' },
        ], 1800);
        letters.forEach((letter, i) => animate(letter, [
          { transform: 'translateY(0)' }, { transform: 'translateY(-3px)', offset: 0.45 }, { transform: 'translateY(0)' },
        ], 1400, i * 75));
        break;
      }
      case 10:
        animate(letters.at(-1), [
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(4px) scale(0.97)', offset: 0.2 },
          { transform: 'translateY(-2px) scale(1.01)', offset: 0.5 },
          { transform: 'translateY(0) scale(1)' },
        ], 1000);
        droplets(true);
        break;
    }
    document.body.dataset.hoverActive = String(active.length);
    if (demonstration) resetTimer = setTimeout(reset, 2900);
    await Promise.allSettled(active.map(animation => animation.finished));
    if (current !== sequence) return;
    document.body.dataset.hoverActive = '0';
    report('Hover finish settled. Move away to restore the ink, or try another idea.', 'held');
  }
  function reset() { clean(); report('Hover over the name, or press Try hover.', 'rest'); }
  function entrance(thenHover = false) {
    clearTimeout(entranceTimer);
    clean();
    footer.finishSignature();
    if (reduced()) { report('Reduced motion: signature stays still. Try hover shows a still finish.', 'reduced'); return; }
    footer.revealSignature();
    report('Entrance #5: prefix first, then the name.', 'entrance');
    entranceTimer = setTimeout(() => thenHover ? play(true) : report('Entrance finished. Hover over the name, or press Try hover.'), 1900);
  }
  wrap.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && ready && document.body.dataset.hoverState !== 'entrance') play(); });
  wrap.addEventListener('pointerleave', () => { if (ready && document.body.dataset.hoverState !== 'entrance') reset(); });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.kind !== 'samyo-hover-control') return;
    if (event.data.action === 'hover') play(true);
    if (event.data.action === 'entrance' && ready) entrance();
  });
  media.addEventListener('change', () => { document.documentElement.dataset.hoverReduced = String(reduced()); clearTimeout(entranceTimer); footer.finishSignature(); reset(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(entranceTimer); footer.finishSignature(); reset(); } });
  document.querySelector('.pfo-news')?.addEventListener('submit', event => { event.preventDefault(); report('Newsletter layout preview only.'); });
  const reportHeight = () => parent.postMessage({ kind: 'samyo-hover-height', height: document.body.scrollHeight }, location.origin);
  new ResizeObserver(reportHeight).observe(document.body);
  Promise.all([customElements.whenDefined('perfume-footer'), document.fonts.ready]).then(() => {
    ready = true;
    reportHeight();
    if (params.get('context') === 'footer' && !reduced()) {
      report('Scroll to the signature to see entrance #5, then try the hover.');
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { observer.disconnect(); entrance(true); }
      }, { threshold: 0.12 });
      observer.observe(wrap);
    } else entrance(true);
  }).catch(() => { clean(); report('Static signature shown.'); });
})();
