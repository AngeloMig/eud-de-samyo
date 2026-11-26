/*
  <perfume-cart-drawer> (snippets/perfume-cart-drawer.liquid)
  Opens from any [data-cart-drawer-open] link (the header Bag) and on the
  'perfume:cart-open' event (the showcase fires it after Add to bag). Renders the bag
  from /cart.js, changes quantities through /cart/change.js, and tells the rest of the
  theme (Dawn pub/sub cartUpdate + a 'cart:updated' event) so the Bag count follows.
  Closed: inert. Open: focus moves in, Tab stays inside, Escape and the scrim close it,
  and focus returns to whatever opened it.
  Decant sets (sections/perfume-vial-picker.liquid): vials added together carry the
  same "Set" line property (and hidden "_set" id). They show as one card, with each vial's price, the set's
  savings when a discount applies, and one Remove that takes out the whole set (no
  per-vial quantities, so a set can't be broken up).
  Free-delivery bar: what is left to the goal (data-ship-threshold, store currency,
  converted with Shopify.currency.rate on other currencies). Gift message: saved as
  the cart note through /cart/update.js, a moment after typing stops.
*/
(() => {
  if (customElements.get('perfume-cart-drawer')) return;

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const money = (cents, currency) => {
    try {
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: currency || 'PHP' }).format((cents || 0) / 100);
    } catch (e) {
      return ((cents || 0) / 100).toFixed(2);
    }
  };

  // Remove icon (a bin); the button carries the accessible name.
  const TRASH = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5l1-12.5M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/></svg>';
  const sized = (src, width) => {
    if (!src) return '';
    try {
      const u = new URL(src, location.href);
      if (/cdn\.shopify|\/cdn\/shop\//.test(u.href)) u.searchParams.set('width', width);
      return u.href;
    } catch (e) {
      return src;
    }
  };

  class PerfumeCartDrawer extends HTMLElement {
    connectedCallback() {
      // Live at the end of <body> so no section's stacking context can cover it.
      if (this.parentElement !== document.body) {
        document.body.appendChild(this);
        return;
      }
      this.panel = this.querySelector('[data-pcd-panel]');
      this.list = this.querySelector('[data-pcd-items]');
      this.empty = this.querySelector('[data-pcd-empty]');
      this.foot = this.querySelector('[data-pcd-foot]');
      this.count = this.querySelector('[data-pcd-count]');
      this.subtotal = this.querySelector('[data-pcd-subtotal]');
      this.status = this.querySelector('[data-pcd-status]');
      this.abort?.abort();
      this.abort = new AbortController();
      const signal = this.abort.signal;

      document.addEventListener(
        'click',
        (e) => {
          const opener = e.target.closest('[data-cart-drawer-open]');
          if (!opener) return;
          e.preventDefault();
          this.show(opener);
        },
        { signal }
      );
      document.addEventListener('perfume:cart-open', (e) => this.show(null, e.detail), { signal });
      const warm = (e) => {
        if (e.target.closest?.('[data-cart-drawer-open]')) this.prefetch();
      };
      document.addEventListener('pointerover', warm, { signal, passive: true });
      document.addEventListener('focusin', warm, { signal });
      document.addEventListener('touchstart', warm, { signal, passive: true });
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
      idle(() => this.prefetch());
      this.querySelectorAll('[data-pcd-close]').forEach((b) => b.addEventListener('click', () => this.hide(), { signal }));
      this.addEventListener('keydown', (e) => this.onKeydown(e), { signal });
      this.list.addEventListener('click', (e) => this.onListClick(e), { signal });
      this.ship = this.querySelector('[data-pcd-ship]');
      this.noteField = this.querySelector('[data-pcd-note]');
      this.noteStatus = this.querySelector('[data-pcd-note-status]');
      this.noteField?.addEventListener('input', () => {
        clearTimeout(this.noteTimer);
        if (this.noteStatus) this.noteStatus.textContent = '';
        this.noteTimer = setTimeout(() => this.saveNote(), 700);
      }, { signal });

      // Keep in step when something else changes the cart.
      if (typeof window.subscribe === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
        this.unsubscribe = window.subscribe(window.PUB_SUB_EVENTS.cartUpdate, (e) => {
          if (e?.source !== 'perfume-cart-drawer' && this.isOpen) this.load();
        });
      }
    }

    disconnectedCallback() {
      if (this.parentElement === document.body) return;
      this.abort?.abort();
      this.unsubscribe?.();
    }

    get isOpen() {
      return this.classList.contains('is-open');
    }

    async show(opener, added) {
      this.opener = opener || document.activeElement;
      this.newVariant = added?.variant_id || added?.id || null;
      // Items rise in only when the drawer opens, not on every quantity change.
      this.classList.add('is-entering');
      clearTimeout(this.enterTimer);
      this.enterTimer = setTimeout(() => this.classList.remove('is-entering'), 1400);
      // Open at once with the bag as last read (prefetched on load and on hover),
      // then refresh it in the background; never wait on the network to slide in.
      const fresh = this.load();
      if (!this.cart) await Promise.race([fresh, new Promise((r) => setTimeout(r, 250))]);
      this.inert = false;
      this.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => this.querySelector('.pcd__close')?.focus({ preventScroll: true }));
    }

    // Read the bag ahead of time so the first open already has the items.
    prefetch() {
      if (this.prefetched && Date.now() - this.prefetched < 15000) return;
      this.prefetched = Date.now();
      this.load();
    }

    hide() {
      if (!this.isOpen) return;
      this.classList.remove('is-open');
      this.inert = true;
      document.documentElement.style.overflow = '';
      if (this.opener && document.contains(this.opener)) this.opener.focus({ preventScroll: true });
    }

    onKeydown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.hide();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [...this.panel.querySelectorAll('a[href], button:not([disabled]), input, [tabindex="0"]')].filter(
        (el) => el.offsetParent !== null
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    async load() {
      const ticket = (this.loadTicket = (this.loadTicket || 0) + 1);
      try {
        const res = await fetch(`${this.dataset.cartUrl}.js`, { headers: { Accept: 'application/json' } });
        const cart = await res.json();
        if (ticket === this.loadTicket) this.render(cart); // a newer read wins
      } catch (e) {
        // Keep whatever is shown; the Bag link still goes to the cart page.
      }
    }

    render(cart) {
      const items = cart.items || [];
      // Same bag as shown: keep the rows (no flicker or replayed entrance).
      const sig = JSON.stringify([cart.total_price, cart.note, items.map((it) => [it.key, it.quantity, it.final_line_price])]);
      if (sig === this.sig && !this.newVariant) return;
      this.sig = sig;
      this.cart = cart;
      if (this.count) this.count.textContent = cart.item_count;
      this.empty.hidden = items.length > 0;
      this.foot.hidden = items.length === 0;
      this.subtotal.textContent = money(cart.total_price, cart.currency);
      this.renderShip(cart);
      if (this.noteField && document.activeElement !== this.noteField && typeof cart.note === 'string') {
        this.noteField.value = cart.note;
      }
      // Decant sets: group lines by their "Set" property, in cart order.
      const groups = [];
      const bySet = new Map();
      items.forEach((item) => {
        const props = item.properties || {};
        if (!props.Set) return groups.push({ item });
        const set = `${props.Set}|${props._set || ''}`;
        if (!bySet.has(set)) {
          const g = { set, lines: [] };
          bySet.set(set, g);
          groups.push(g);
        }
        bySet.get(set).lines.push(item);
      });
      this.list.innerHTML = groups.map((g, i) => (g.set ? this.setCard(g, i, cart) : this.itemRow(g.item, i, cart))).join('');
      this.newVariant = null;
    }

    itemRow(item, i, cart) {
      const variant = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
      const isNew = this.newVariant && Number(item.variant_id) === Number(this.newVariant);
      const img = sized(item.image || item.featured_image?.url, 240);
      const url = item.url || '#';
      return `<li class="pcd__item${isNew ? ' is-new' : ''}" style="--i:${i}" data-key="${esc(item.key)}" data-qty="${item.quantity}">
        <a class="pcd__media" href="${esc(url)}" tabindex="-1" aria-hidden="true">${img ? `<img src="${esc(img)}" alt="" loading="lazy" width="84" height="105">` : ''}</a>
        <div class="pcd__info">
          ${item.vendor ? `<p class="pcd__brand">${esc(item.vendor)}</p>` : ''}
          <a class="pcd__name" href="${esc(url)}">${esc(item.product_title)}</a>
          ${variant ? `<p class="pcd__variant">${esc(variant)}</p>` : ''}
          <div class="pcd__qty" role="group" aria-label="Quantity of ${esc(item.product_title)}">
            <button type="button" data-pcd-step="-1" aria-label="One fewer"${item.quantity <= 1 ? ' disabled' : ''}>−</button>
            <output aria-live="polite">${item.quantity}</output>
            <button type="button" data-pcd-step="1" aria-label="One more">+</button>
          </div>
        </div>
        <div class="pcd__side">
          <p class="pcd__price">${money(item.final_line_price, cart.currency)}</p>
          <button type="button" class="pcd__remove" data-pcd-remove aria-label="Remove ${esc(item.product_title)}">${TRASH}</button>
        </div>
      </li>`;
    }

    // Use Shopify's actual paid amounts for each vial, including partial discounts.
    setCard(g, i, cart) {
      const name = g.set.split('|')[0].replace(/\s*\([a-z0-9]+\)\s*$/i, '');
      const total = g.lines.reduce((a, l) => a + l.final_line_price, 0);
      const before = g.lines.reduce((a, l) => a + l.original_line_price, 0);
      const isNew = this.newVariant && g.lines.some((l) => Number(l.variant_id) === Number(this.newVariant));
      const count = g.lines.reduce((a, l) => a + l.quantity, 0);
      const size = parseFloat(g.lines[0]?.variant_title) || 0;
      const vialSrc = this.dataset[`vial-${size}`] || this.dataset['vial-5'] || ''; // data-vial-1 stays 'vial-1' (digit after the dash)
      const vialH = { 1: 46, 2: 64, 5: 84 }[size] || 84;
      const shown = Math.min(count, 6);
      const media = vialSrc
        ? `<span class="pcd__media pcd__set-media" style="--vh:${vialH}%" data-n="${shown}" aria-hidden="true">${Array.from({ length: shown }, () => `<img src="${esc(vialSrc)}" alt="" loading="lazy" width="40" height="160">`).join('')}</span>`
        : '<span class="pcd__media" aria-hidden="true"></span>';
      const vials = g.lines
        .map((l) => {
          const qty = l.quantity > 1 ? ` × ${l.quantity}` : '';
          const saved = Math.max(0, l.original_line_price - l.final_line_price);
          return `<li><span class="pcd__vial-name">${esc(l.product_title)}${qty}</span><span class="pcd__vial-pricing"><b>${money(l.final_line_price, cart.currency)}</b>${saved ? `<small>Save ${money(saved, cart.currency)}</small>` : ''}</span></li>`;
        })
        .join('');
      return `<li class="pcd__item pcd__set${isNew ? ' is-new' : ''}" style="--i:${i}" data-set="${esc(g.set)}" data-keys="${esc(g.lines.map((l) => l.key).join(','))}">
        ${media}
        <div class="pcd__info">
          <div class="pcd__set-top">
            <p class="pcd__brand">Decant set</p>
            ${before > total ? `<p class="pcd__save">You save ${money(before - total, cart.currency)}</p>` : ''}
          </div>
          <p class="pcd__name">${esc(name)}</p>
          <ul class="pcd__set-vials" role="list">${vials}</ul>
          <div class="pcd__set-foot">
            <p class="pcd__price">${before > total ? `<s>${money(before, cart.currency)}</s> ` : ''}${money(total, cart.currency)}</p>
            <button type="button" class="pcd__remove" data-pcd-remove-set aria-label="Remove set: ${esc(name)}">${TRASH}</button>
          </div>
        </div>
      </li>`;
    }

    renderShip(cart) {
      if (!this.ship) return;
      // The policy is denominated in PHP. Other presentment currencies are quoted
      // at checkout rather than incorrectly treating ₱10,000 as another currency.
      const goal = cart.currency === 'PHP' ? Math.round(Number(this.dataset.shipThreshold || 0) * 100) : 0;
      const items = (cart.items || []).length;
      this.ship.hidden = !goal || !items;
      if (!goal || !items) return;
      const total = cart.total_price || 0;
      const left = Math.max(0, goal - total);
      const done = left === 0;
      this.ship.style.setProperty('--p', Math.min(1, total / goal).toFixed(4));
      this.ship.classList.toggle('is-done', done);
      const text = this.ship.querySelector('[data-pcd-ship-text]');
      if (!text) return;
      if (done) text.textContent = this.dataset.shipDone;
      else {
        const [before, after = ''] = (this.dataset.shipText || '[amount]').split('[amount]');
        text.textContent = '';
        text.append(before);
        const b = document.createElement('b');
        b.textContent = money(left, cart.currency);
        text.append(b, after);
      }
    }

    async saveNote() {
      if (!this.noteField) return;
      try {
        const res = await fetch(`${this.dataset.updateUrl || '/cart/update'}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ note: this.noteField.value }),
        });
        if (!res.ok) throw new Error();
        if (this.noteStatus) this.noteStatus.textContent = 'Saved';
      } catch (e) {
        if (this.noteStatus) this.noteStatus.textContent = 'Could not save the message. Try again.';
      }
    }

    onListClick(e) {
      const li = e.target.closest('.pcd__item');
      if (!li) return;
      const step = e.target.closest('[data-pcd-step]');
      if (step) return this.change(li, Number(li.dataset.qty) + Number(step.dataset.pcdStep));
      if (e.target.closest('[data-pcd-remove]')) return this.change(li, 0);
      if (e.target.closest('[data-pcd-remove-set]')) return this.removeSet(li);
    }

    // Remove every vial of a set in one request.
    async removeSet(li) {
      const updates = {};
      (li.dataset.keys || '').split(',').filter(Boolean).forEach((k) => { updates[k] = 0; });
      li.classList.add('is-busy');
      try {
        const res = await fetch(`${this.dataset.updateUrl || '/cart/update'}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ updates }),
        });
        const cart = await res.json();
        if (!res.ok) throw new Error(cart.description || cart.message || 'Could not update the bag.');
        const name = li.querySelector('.pcd__name')?.textContent || 'Set';
        this.render(cart);
        this.status.textContent = `${name} removed.`;
        if (typeof window.publish === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
          window.publish(window.PUB_SUB_EVENTS.cartUpdate, { source: 'perfume-cart-drawer', cartData: cart });
        }
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
        if (!this.panel.contains(document.activeElement)) this.querySelector('.pcd__close')?.focus({ preventScroll: true });
      } catch (error) {
        li.classList.remove('is-busy');
        this.status.textContent = error.message;
      }
    }

    async change(li, quantity) {
      li.classList.add('is-busy');
      try {
        const res = await fetch(`${this.dataset.changeUrl}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ id: li.dataset.key, quantity }),
        });
        const cart = await res.json();
        if (!res.ok) throw new Error(cart.description || cart.message || 'Could not update the bag.');
        const name = li.querySelector('.pcd__name')?.textContent || 'Item';
        this.render(cart);
        this.status.textContent = quantity === 0 ? `${name} removed.` : `${name}: quantity ${quantity}.`;
        if (typeof window.publish === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
          window.publish(window.PUB_SUB_EVENTS.cartUpdate, { source: 'perfume-cart-drawer', cartData: cart });
        }
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
        // Keep focus in the drawer after the list is redrawn.
        if (!this.panel.contains(document.activeElement)) this.querySelector('.pcd__close')?.focus({ preventScroll: true });
      } catch (error) {
        li.classList.remove('is-busy');
        this.status.textContent = error.message;
      }
    }
  }

  customElements.define('perfume-cart-drawer', PerfumeCartDrawer);
})();
