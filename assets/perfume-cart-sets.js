/* Cart page: decant sets stay whole (loaded by snippets/perfume-cart-drawer.liquid on
   the cart template only; Dawn's sections/main-cart-items.liquid is untouched).
   Vials added by the vial picker share a "Set" line property (and a hidden "_set"
   id). On the cart page their quantity boxes are hidden, and Remove on any of them
   removes the whole set in one request, then reloads the cart. Without JavaScript Dawn's
   normal rows work as before. */
(() => {
  const routes = window.routes || {};
  let sets = {};

  async function readCart() {
    const res = await fetch(`${routes.cart_url || '/cart'}.js`, { headers: { Accept: 'application/json' } });
    const cart = await res.json();
    sets = {};
    (cart.items || []).forEach((item, i) => {
      const props = item.properties || {};
      if (!props.Set) return;
      const set = `${props.Set}|${props._set || ''}`;
      (sets[set] = sets[set] || []).push({ key: item.key, index: i + 1 });
    });
  }

  // Set vials: no quantity box (a set can't be split); Remove says it removes the set.
  // The set's name already shows under each vial ("Set: Try trio · 3 × 1 ml").
  function mark() {
    Object.entries(sets).forEach(([set, lines]) => {
      const name = set.split('|')[0].replace(/\s*\([a-z0-9]+\)\s*$/i, '');
      lines.forEach((line) => {
        const row = document.getElementById(`CartItem-${line.index}`);
        if (!row || row.dataset.pfSet) return;
        row.dataset.pfSet = set;
        row.querySelectorAll('quantity-input').forEach((q) => { q.style.display = 'none'; });
        row.querySelector('cart-remove-button a, cart-remove-button button')?.setAttribute('aria-label', `Remove set: ${name}`);
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
