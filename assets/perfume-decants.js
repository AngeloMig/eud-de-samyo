/* Decants (sections/perfume-decants.liquid): choosing a size shows that size's
   bundles. Without this script every bundle stays visible. */
(() => {
  function init(root) {
    if (root.dataset.pdcInit) return;
    root.dataset.pdcInit = '1';
    const buttons = [...root.querySelectorAll('[data-pdc-size]')];
    const bundles = [...root.querySelectorAll('[data-pdc-bundle]')];
    if (!buttons.length || !bundles.length) return;

    function show(size, animate) {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pdcSize === size)));
      let any = false;
      bundles.forEach((li) => {
        const on = li.dataset.pdcBundle === size;
        li.hidden = !on;
        li.classList.remove('is-in');
        if (on) {
          any = true;
          if (animate) {
            void li.offsetWidth;
            li.classList.add('is-in');
          }
        }
      });
      // A size without bundles: show them all rather than an empty row.
      if (!any) bundles.forEach((li) => { li.hidden = false; });
    }

    buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.pdcSize, true)));
    root.classList.add('pdc-ready');
    const start = buttons.find((b) => b.getAttribute('aria-pressed') === 'true') || buttons[0];
    show(start.dataset.pdcSize, false);
  }

  const run = () => document.querySelectorAll('[data-pdc]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  // Theme editor: sections are re-rendered in place.
  document.addEventListener('shopify:section:load', (e) => {
    const root = e.target.querySelector('[data-pdc]');
    if (root) init(root);
  });
  document.addEventListener('shopify:block:select', (e) => {
    const size = e.target.closest('[data-pdc-size]') || e.target.closest('[data-pdc-bundle]');
    const root = e.target.closest('[data-pdc]');
    if (!size || !root) return;
    const value = size.dataset.pdcSize || size.dataset.pdcBundle;
    const btn = root.querySelector(`[data-pdc-size="${value}"]`);
    if (btn) btn.click();
  });
})();
