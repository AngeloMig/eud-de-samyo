/*
  <perfume-cart-drawer> (snippets/perfume-cart-drawer.liquid)
  Opens from any [data-cart-drawer-open] link (the header Bag) and on the
  'perfume:cart-open' event (the showcase fires it after Add to bag). Renders the bag
  from /cart.js, changes quantities through /cart/change.js, and tells the rest of the
  theme (Dawn pub/sub cartUpdate + a 'cart:updated' event) so the Bag count follows.
  Closed: inert. Open: focus moves in, Tab stays inside, Escape and the scrim close it,
  and focus returns to whatever opened it.
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
      await this.load();
      this.inert = false;
      this.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => this.querySelector('.pcd__close')?.focus({ preventScroll: true }));
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
      try {
        const res = await fetch(`${this.dataset.cartUrl}.js`, { headers: { Accept: 'application/json' } });
        this.render(await res.json());
      } catch (e) {
        // Keep whatever is shown; the Bag link still goes to the cart page.
      }
    }

    render(cart) {
      const items = cart.items || [];
      this.cart = cart;
      if (this.count) this.count.textContent = cart.item_count;
      this.empty.hidden = items.length > 0;
      this.foot.hidden = items.length === 0;
      this.subtotal.textContent = money(cart.total_price, cart.currency);
      this.renderShip(cart);
      if (this.noteField && document.activeElement !== this.noteField && typeof cart.note === 'string') {
        this.noteField.value = cart.note;
      }
      this.list.innerHTML = items
        .map((item, i) => {
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
              <button type="button" class="pcd__remove" data-pcd-remove>Remove<span class="pf-visually-hidden"> ${esc(item.product_title)}</span></button>
            </div>
          </li>`;
        })
        .join('');
      this.newVariant = null;
    }

    renderShip(cart) {
      if (!this.ship) return;
      const rate = Number(window.Shopify?.currency?.rate) || 1;
      const goal = Math.round(Number(this.dataset.shipThreshold || 0) * 100 * rate);
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
