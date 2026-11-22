/*
  Product cards and rails (snippets/perfume-product-card.liquid,
  sections/perfume-product-rail.liquid).
  - Quick add: any [data-pcard-add] form adds in place (/cart/add.js), the button
    reads Adding… then Added ✓, the theme hears about it (Dawn cartUpdate +
    'cart:updated') and the cart drawer opens. Without JS the form posts normally.
  - <perfume-rail>: a row that swipes natively, drags with the mouse, and has
    arrows and a progress line; controls only show when the row overflows. With
    data-url it first loads Shopify's product recommendations into itself.
*/
(() => {
  if (window.__perfumeCards) return;
  window.__perfumeCards = true;

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest?.('[data-pcard-add]');
    if (!form) return;
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const label = form.querySelector('[data-pcard-label]');
    if (!button || button.disabled) return;
    const original = label?.textContent;
    button.disabled = true;
    button.classList.add('is-busy');
    if (label) label.textContent = 'Adding…';
    try {
      const res = await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.description || data.message || 'Could not add to bag.');
      button.classList.add('is-added');
      if (label) label.textContent = 'Added ✓';
      if (typeof window.publish === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
        window.publish(window.PUB_SUB_EVENTS.cartUpdate, { source: 'perfume-card', productVariantId: data.variant_id });
      }
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
      document.dispatchEvent(new CustomEvent('perfume:cart-open', { detail: data }));
    } catch (error) {
      if (label) label.textContent = 'Try again';
      button.title = error.message;
    }
    setTimeout(() => {
      button.disabled = false;
      button.classList.remove('is-busy', 'is-added');
      if (label) label.textContent = original;
    }, 1800);
  });

  if (customElements.get('perfume-rail')) return;

  class PerfumeRail extends HTMLElement {
    async connectedCallback() {
      if (this.dataset.url && !this.loaded) {
        this.loaded = true;
        try {
          const html = await (await fetch(this.dataset.url)).text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const fresh = doc.querySelector('perfume-rail');
          if (fresh && fresh.querySelector('[data-prail-list] > *')) this.innerHTML = fresh.innerHTML;
          else this.closest('.prail')?.setAttribute('hidden', '');
        } catch (e) {
          this.closest('.prail')?.setAttribute('hidden', '');
        }
      }
      this.setup();
    }

    disconnectedCallback() {
      this.abort?.abort();
    }

    setup() {
      this.abort?.abort();
      this.list = this.querySelector('[data-prail-list]');
      if (!this.list) return;
      this.controls = this.querySelector('[data-prail-controls]');
      this.prev = this.querySelector('[data-prail-prev]');
      this.next = this.querySelector('[data-prail-next]');
      this.abort = new AbortController();
      const signal = this.abort.signal;
      const step = () => {
        const item = this.list.firstElementChild;
        const gap = parseFloat(getComputedStyle(this.list).columnGap) || 0;
        return item ? item.getBoundingClientRect().width + gap : this.list.clientWidth;
      };
      this.prev?.addEventListener('click', () => this.list.scrollBy({ left: -step(), behavior: this.motion() }), { signal });
      this.next?.addEventListener('click', () => this.list.scrollBy({ left: step(), behavior: this.motion() }), { signal });
      let frame = 0;
      this.list.addEventListener('scroll', () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => this.sync());
      }, { passive: true, signal });
      new ResizeObserver(() => this.sync()).observe(this.list);
      this.bindDrag(signal, step);
      this.sync();
    }

    motion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    }

    sync() {
      const max = this.list.scrollWidth - this.list.clientWidth;
      const on = max > 2;
      if (this.controls) this.controls.hidden = !on;
      this.list.classList.toggle('is-draggable', on);
      if (this.prev) this.prev.disabled = this.list.scrollLeft <= 2;
      if (this.next) this.next.disabled = this.list.scrollLeft >= max - 2;
      const shown = this.list.clientWidth / Math.max(1, this.list.scrollWidth);
      const progress = on ? shown + (1 - shown) * (this.list.scrollLeft / max) : 1;
      this.style.setProperty('--prail-progress', progress.toFixed(3));
    }

    // Mouse only; touch swipes natively. Settles on the nearest card.
    bindDrag(signal, step) {
      let down = false;
      let moved = false;
      let startX = 0;
      let startLeft = 0;
      this.list.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0 || !this.list.classList.contains('is-draggable')) return;
        down = true;
        moved = false;
        startX = e.clientX;
        startLeft = this.list.scrollLeft;
      }, { signal });
      window.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) > 5) {
          moved = true;
          this.list.classList.add('is-dragging');
        }
        if (moved) this.list.scrollLeft = startLeft - dx;
      }, { signal });
      const end = (e) => {
        if (!down) return;
        down = false;
        if (!moved) return;
        this.list.classList.remove('is-dragging');
        const s = step();
        const dx = e.clientX - startX;
        let target = Math.round(this.list.scrollLeft / s);
        if (Math.abs(dx) > s * 0.15) target = dx < 0 ? Math.ceil(this.list.scrollLeft / s) : Math.floor(this.list.scrollLeft / s);
        this.list.scrollTo({ left: target * s, behavior: this.motion() });
      };
      window.addEventListener('pointerup', end, { signal });
      window.addEventListener('pointercancel', end, { signal });
      this.list.addEventListener('click', (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }
      }, { capture: true, signal });
      this.list.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
    }
  }

  customElements.define('perfume-rail', PerfumeRail);
})();
