/* Cart page: decant sets stay whole (loaded by snippets/perfume-cart-drawer.liquid on
   the cart template only; Dawn's sections/main-cart-items.liquid is untouched).
   Vials added by the vial picker share a "Set" line property. On the cart page their
   quantity boxes are replaced by "Part of: <set>", and Remove on any of them removes
   the whole set in one request, then reloads the cart. Without JavaScript Dawn's
   normal rows work as before. */
(() => {
  const routes = window.routes || {};
  let sets = {};

  async function readCart() {
    const res = await fetch(`${routes.cart_url || '/cart'}.js`, { headers: { Accept: 'application/json' } });
    const cart = await res.json();
    sets = {};
    (cart.items || []).forEach((item, i) => {
      const set = item.properties && item.properties.Set;
      if (!set) return;
      (sets[set] = sets[set] || []).push({ key: item.key, index: i + 1 });
    });
  }

  function mark() {
    Object.entries(sets).forEach(([set, lines]) => {
      const name = set.replace(/\s*\([a-z0-9]+\)\s*$/i, '');
      lines.forEach((line) => {
        const row = document.getElementById(`CartItem-${line.index}`);
        if (!row || row.dataset.pfSet) return;
        row.dataset.pfSet = set;
        row.querySelectorAll('quantity-input').forEach((q) => { q.hidden = true; });
        const remove = row.querySelector('cart-remove-button');
        if (remove) {
          const note = document.createElement('p');
          note.className = 'pf-set-note';
          note.style.cssText = 'font-size:1.2rem;margin:0 0 .4rem;opacity:.75';
          note.textContent = `Part of: ${name}`;
          remove.parentElement.insertBefore(note, remove);
          remove.querySelector('a, button')?.setAttribute('aria-label', `Remove set: ${name}`);
        }
      });
    });
  }

  async function removeSet(set) {
    const updates = {};
    (sets[set] || []).forEach((l) => { updates[l.key] = 0; });
    const res = await fetch(`${routes.cart_update_url || '/cart/update'}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ updates }),
    });
    if (res.ok) location.reload();
  }

  // Capture phase: runs before Dawn's own remove handler, which would remove one vial.
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target.closest('cart-remove-button');
      const row = btn && btn.closest('[data-pf-set]');
      if (!row) return;
      e.preventDefault();
      e.stopPropagation();
      removeSet(row.dataset.pfSet);
    },
    true
  );

  async function run() {
    try {
      await readCart();
      mark();
    } catch (e) {
      // Leave Dawn's rows as they are.
    }
  }

  const start = () => {
    run();
    // Dawn redraws the rows after any cart change: mark them again.
    const box = document.getElementById('main-cart-items');
    let timer;
    if (box) new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(run, 150);
    }).observe(box, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
