/*
  Why Samyó, Seal layout (sections/perfume-why.liquid).
  - Hovering or focusing a promise shows that promise's icon in the seal's centre,
    and leans that promise toward the seal.
  - Ring motion "Spins, faster as you scroll" / "Turns only as you scroll": the
    ring's extra rotation follows the section's position on screen (the slow spin
    itself is CSS). Only while the section is visible, one rAF per frame.
  Under reduced motion the ring stays still (the icon swap still works, without
  fading). Without JS the seal simply shows the centre word.
*/
(() => {
  if (window.__pfWhy) return;
  window.__pfWhy = true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setup = (section) => {
    if (section.__pfWhy) return;
    section.__pfWhy = true;

    const seal = section.querySelector('.pw-seal');
    if (!seal) return;

    // Promise -> centre icon
    const glyphs = [...seal.querySelectorAll('[data-pw-glyph]')];
    const stage = section.querySelector('.pw__stage');
    const items = [...section.querySelectorAll('[data-pw-i]')];
    let leaveTimer;
    const show = (index) => {
      clearTimeout(leaveTimer);
      seal.classList.toggle('has-active', index != null);
      stage?.classList.toggle('has-active', index != null);
      glyphs.forEach((g) => g.classList.toggle('is-on', g.dataset.pwGlyph === index));
      items.forEach((it) => it.classList.toggle('is-active', it.dataset.pwI === index));
    };
    items.forEach((item) => {
      const index = item.dataset.pwI;
      item.addEventListener('pointerenter', () => show(index));
      item.addEventListener('pointerleave', () => {
        leaveTimer = setTimeout(() => show(null), 120);
      });
      item.addEventListener('focusin', () => show(index));
      item.addEventListener('focusout', () => show(null));
    });

    // Ring follows the scroll
    const motion = section.dataset.ringMotion;
    if (motion !== 'scroll' && motion !== 'both') return;
    const spin = seal.querySelector('.pw-seal__spin');
    if (!spin) return;

    let visible = false;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (reduced.matches) {
        spin.style.transform = '';
        return;
      }
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the section's top enters at the bottom, 1 when its bottom leaves the top.
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      spin.style.transform = `rotate(${(progress * 200 - 100).toFixed(2)}deg)`;
    };
    const request = () => {
      if (visible && !frame) frame = requestAnimationFrame(update);
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        request();
      }).observe(section);
    } else {
      visible = true;
    }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    reduced.addEventListener?.('change', update);
    update();
  };

  const scan = (root = document) => root.querySelectorAll('.pw--seal').forEach(setup);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan());
  else scan();
  // Theme editor: sections are re-rendered in place.
  document.addEventListener('shopify:section:load', (e) => scan(e.target));
})();
