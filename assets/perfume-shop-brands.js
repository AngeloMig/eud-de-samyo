/*
  Shop by brand, masonry layout (sections/perfume-shop-brands.liquid).
  - Marks the section ready (CSS then hides the tiles after "Tiles shown before
    Load more" and keeps the visible ones closed until they unveil).
  - When the grid comes into view, the visible tiles unveil one after another
    (curtain wipe + picture settling; CSS), 70ms apart.
  - "Load more" unveils the next batch the same way and counts down; it disappears
    when everything is shown.
  Without JS (or if anything fails) all tiles simply show. Reduced motion: no
  wipe or zoom (CSS), tiles appear at once.
*/
(() => {
  const init = (root) => {
    if (root.dataset.psbReady) return;
    root.dataset.psbReady = '1';
    const grid = root.querySelector('.psb__grid');
    const more = root.querySelector('[data-psb-more]');
    const btn = root.querySelector('[data-psb-more-btn]');
    const left = root.querySelector('[data-psb-left]');
    const step = Number(root.dataset.step) || 6;
    if (!grid) return;

    const unveil = (items) =>
      items.forEach((item, k) => {
        item.removeAttribute('data-later');
        item.style.setProperty('--k', k);
        item.classList.add('is-in');
      });

    root.classList.add('is-ready');
    if (more) more.hidden = false;

    const visible = () => [...grid.querySelectorAll('.psb__item:not([data-later])')];
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          unveil(visible());
          io.disconnect();
        },
        { threshold: 0.15 }
      );
      io.observe(grid);
    } else {
      unveil(visible());
    }

    btn?.addEventListener('click', () => {
      const next = [...grid.querySelectorAll('.psb__item[data-later]')].slice(0, step);
      unveil(next);
      const rest = grid.querySelectorAll('.psb__item[data-later]').length;
      if (!rest) more.remove();
      else if (left) left.textContent = `· ${rest} more`;
      next[0]?.querySelector('a')?.focus({ preventScroll: true });
    });
  };

  const boot = () => document.querySelectorAll('[data-psb]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
