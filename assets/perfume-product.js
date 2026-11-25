/*
  <perfume-product> (sections/main-product-perfume.liquid)
  - The bottle carousel, after the High Spirits product page: slides carry
    data-offset (0 = chosen, 1-3 = waiting to its right, faded; 4 = hidden). It loops,
    and only moves when the shopper acts: arrows, a click on a faded bottle, arrow
    keys, or a swipe / mouse drag (the bottles follow the pointer).
  - Sizes: choosing an option finds the matching variant from the JSON in the section,
    then updates the price, stock, Add to bag, the form's variant id and the URL
    (?variant=). In "variants" mode choosing a bottle chooses its variant and the other
    way round; in "media" mode a size with its own image brings that image forward.
  - Add to bag: adds in place (/cart/add.js); the label rolls to Adding… and Added ✓,
    the theme hears about it and the cart drawer opens. Without JS the form posts.
  - Affiliate listings (data-affiliate): no Add to bag; choosing a size swaps the
    "Buy at FragranceX" link, price and stock to that size's offer.
*/
(() => {
  if (customElements.get('perfume-product')) return;

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class PerfumeProduct extends HTMLElement {
    connectedCallback() {
      this.slides = [...this.querySelectorAll('.pp-slide')];
      this.stage = this.querySelector('[data-pp-stage]');
      this.form = this.querySelector('[data-pp-form]');
      this.picker = this.querySelector('[data-pp-picker]');
      this.indexOut = this.querySelector('[data-pp-index]');
      this.mode = this.dataset.mode;
      this.active = Number(this.dataset.active) || 0;
      try {
        this.variants = JSON.parse(this.querySelector('[data-pp-variants]')?.textContent || '[]');
      } catch (e) {
        this.variants = [];
      }
      try {
        this.offers = JSON.parse(this.querySelector('[data-pp-offers]')?.textContent || 'null');
      } catch (e) {
        this.offers = null;
      }
      this.abort = new AbortController();
      const signal = this.abort.signal;

      this.querySelector('[data-pp-prev]')?.addEventListener('click', () => this.go(this.active - 1, true), { signal });
      this.querySelector('[data-pp-next]')?.addEventListener('click', () => this.go(this.active + 1, true), { signal });
      this.slides.forEach((slide, i) =>
        slide.addEventListener('click', () => !this.dragged && i !== this.active && this.go(i, true), { signal })
      );
      this.stage?.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') this.go(this.active - 1, true);
        if (e.key === 'ArrowRight') this.go(this.active + 1, true);
      }, { signal });
      this.bindDrag(signal);

      this.picker?.addEventListener('change', () => this.onOptions(true), { signal });
      this.bindSticky(signal);
      this.bindQuantity(signal);
      this.bindAdd(signal);
      this.markUnavailable();
    }

    disconnectedCallback() {
      this.abort?.abort();
    }

    // ---------- Carousel ----------
    go(index, fromUser) {
      const n = this.slides.length;
      if (n < 2) return;
      const next = ((index % n) + n) % n;
      if (next === this.active) return;
      const forward = (next - this.active + n) % n <= n / 2;
      this.slides.forEach((slide, i) => {
        const was = Number(slide.dataset.offset);
        let offset = (i - next + n) % n;
        if (offset > 4) offset = 4;
        slide.classList.remove('is-leaving', 'is-jump');
        // Going forward, the bottle that was chosen leaves to the left before it
        // re-enters on the far right; going back, one appears from the left.
        if (forward && was === 0 && offset !== 0) {
          slide.classList.add('is-leaving');
          setTimeout(() => {
            slide.classList.add('is-jump');
            slide.classList.remove('is-leaving');
            slide.dataset.offset = String(offset);
            requestAnimationFrame(() => requestAnimationFrame(() => slide.classList.remove('is-jump')));
          }, reduced() ? 0 : 450);
          return;
        }
        if (!forward && offset === 0 && was >= 3) {
          slide.classList.add('is-jump', 'is-leaving');
          void slide.offsetWidth;
          slide.classList.remove('is-jump', 'is-leaving');
        }
        slide.dataset.offset = String(offset);
      });
      this.slides.forEach((s, i) => (i === next ? s.setAttribute('aria-current', 'true') : s.removeAttribute('aria-current')));
      this.active = next;
      if (this.indexOut) this.indexOut.textContent = String(next + 1).padStart(2, '0');

      if (fromUser && this.mode === 'variants') {
        const v = this.variants.find((x) => String(x.id) === this.slides[next].dataset.variantId);
        if (v) {
          this.setOptions(v.options);
          this.apply(v);
        }
      }
    }

    // Swipe / mouse drag: the bottles follow the pointer, then step one way.
    bindDrag(signal) {
      if (!this.stage || this.slides.length < 2) return;
      let startX = 0;
      let dx = 0;
      let down = false;
      let frame = 0;
      const set = () => this.style.setProperty('--pp-drag', `${dx * 0.6}px`);
      this.stage.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        down = true;
        this.dragged = false;
        startX = e.clientX;
        dx = 0;
      }, { signal });
      window.addEventListener('pointermove', (e) => {
        if (!down) return;
        dx = e.clientX - startX;
        if (!this.dragged && Math.abs(dx) > 6) {
          this.dragged = true;
          this.classList.add('is-dragging');
        }
        if (this.dragged) {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(set);
        }
      }, { signal });
      const end = () => {
        if (!down) return;
        down = false;
        cancelAnimationFrame(frame);
        this.classList.remove('is-dragging');
        this.style.removeProperty('--pp-drag');
        if (this.dragged && Math.abs(dx) > 40) this.go(this.active + (dx < 0 ? 1 : -1), true);
        setTimeout(() => (this.dragged = false), 0);
      };
      window.addEventListener('pointerup', end, { signal });
      window.addEventListener('pointercancel', end, { signal });
      this.stage.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
    }

    // ---------- Product + Add to bag: bar at the bottom of the screen ----------
    bindSticky(signal) {
      const bar = this.querySelector('[data-pp-sticky]');
      const target = this.querySelector('.pp__buy');
      if (!bar || !target) return;
      const place = () => {}; // the bar sits at the bottom now (CSS); kept so callers stay simple
      const show = (on) => {
        bar.classList.toggle('is-shown', on);
        bar.inert = !on;
        if (on) place();
      };
      // A position check on scroll (an IntersectionObserver misses a jump straight past).
      let frame = 0;
      let shown = false;
      const check = () => {
        frame = 0;
        const on = target.getBoundingClientRect().bottom < 0;
        if (on !== shown) show((shown = on));
      };
      window.addEventListener('scroll', () => frame || (frame = requestAnimationFrame(check)), { passive: true, signal });
      window.addEventListener('resize', () => {
        place();
        check();
      }, { signal });
      check();
      bar.querySelector('[data-pp-sticky-add]')?.addEventListener('click', () => {
        const add = this.form?.querySelector('[data-pp-add]');
        if (this.form && add && !add.disabled) this.form.requestSubmit(add);
      }, { signal });
    }

    // ---------- Variants ----------
    selectedOptions() {
      if (!this.picker) return null;
      return [...this.picker.querySelectorAll('fieldset')].map((fs) => fs.querySelector('input:checked')?.value);
    }

    setOptions(options) {
      if (!this.picker || !options) return;
      const sets = [...this.picker.querySelectorAll('fieldset')];
      options.forEach((value, i) => {
        const input = [...(sets[i]?.querySelectorAll('input') || [])].find((x) => x.value === value);
        if (input) input.checked = true;
      });
    }

    onOptions() {
      const chosen = this.selectedOptions();
      const v = this.variants.find((x) => x.options.every((o, i) => o === chosen[i]));
      this.apply(v || null);
      if (!v) return;
      if (this.mode === 'variants') {
        const i = this.slides.findIndex((s) => s.dataset.variantId === String(v.id));
        if (i > -1) this.go(i, false);
      } else if (v.media) {
        const i = this.slides.findIndex((s) => s.dataset.mediaId === String(v.media));
        if (i > -1) this.go(i, false);
      }
    }

    offerFor(v) {
      if (!this.offers || !v) return null;
      return this.offers.find((o) => o.size === v.title || o.size === v.options?.[0]) || null;
    }

    applyOffer(v) {
      const offer = this.offerFor(v);
      const link = this.querySelector('[data-pp-aff-link]');
      const stock = this.querySelector('[data-pp-stock]');
      if (offer) {
        this.querySelectorAll('[data-pp-aff-link]').forEach((a) => (a.href = offer.url));
        this.querySelectorAll('[data-pp-price], [data-pp-aff-price], [data-pp-price-copy]').forEach((el) => (el.textContent = offer.price || ''));
      }
      if (v) this.querySelectorAll('[data-pp-sticky-variant]').forEach((el) => (el.textContent = v.title));
      this.showNudge(v);
      if (stock) {
        const known = offer && typeof offer.in_stock === 'boolean';
        stock.hidden = !known;
        if (known) {
          stock.classList.toggle('is-in', offer.in_stock);
          stock.textContent = offer.in_stock ? stock.dataset.in : stock.dataset.out;
        }
      }
      if (v && this.dataset.url) {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', v.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    // "Save more in a trio / six" line under the sizes: only for the chosen 1/2 ml vial.
    showNudge(v) {
      this.querySelectorAll('[data-pp-nudge]').forEach((el) => {
        el.hidden = !v || String(v.id) !== el.dataset.ppNudge;
      });
    }

    apply(v) {
      if (this.offers) return this.applyOffer(v);
      const price = this.querySelector('[data-pp-price]');
      const compare = this.querySelector('[data-pp-compare]');
      const addPrice = this.querySelector('[data-pp-add-price]');
      const stock = this.querySelector('[data-pp-stock]');
      const input = this.querySelector('[data-pp-variant-input]');
      const button = this.querySelector('[data-pp-add]');
      const label = this.querySelector('[data-pp-add-label]');
      const sr = this.querySelector('[data-pp-add-sr]');
      const available = !!v?.available;
      if (v) {
        if (price) price.textContent = v.price;
        if (addPrice) addPrice.textContent = v.price;
        if (compare) {
          compare.hidden = !v.compare;
          compare.textContent = v.compare || '';
        }
        if (input) input.value = v.id;
        this.querySelectorAll('[data-pp-price-copy]').forEach((el) => (el.textContent = v.price));
        this.querySelectorAll('[data-pp-sticky-variant]').forEach((el) => (el.textContent = v.title));
        this.showNudge(v);
        this.querySelectorAll('form input[name="id"]').forEach((x) => (x.value = v.id));
        if (this.dataset.url) {
          const url = new URL(window.location.href);
          url.searchParams.set('variant', v.id);
          window.history.replaceState({}, '', url.toString());
        }
      }
      if (stock) {
        stock.classList.toggle('is-in', available);
        stock.textContent = available ? stock.dataset.in : stock.dataset.out;
      }
      if (button) {
        const text = !v ? 'Unavailable' : available ? button.dataset.label : button.dataset.soldout;
        button.disabled = !available;
        if (label) label.textContent = text;
        if (sr) sr.textContent = text;
      }
      const sticky = this.querySelector('[data-pp-sticky-add]');
      if (sticky) {
        sticky.disabled = !available;
        const sl = sticky.querySelector('[data-pp-sticky-label]');
        if (sl) sl.textContent = available ? 'Add to bag' : !v ? 'Unavailable' : 'Sold out';
      }
    }

    // Strike through single-option values whose variant is sold out.
    markUnavailable() {
      if (!this.picker) return;
      const sets = [...this.picker.querySelectorAll('fieldset')];
      if (sets.length !== 1) return;
      sets[0].querySelectorAll('input').forEach((input) => {
        const v = this.variants.find((x) => x.options[0] === input.value);
        const offer = this.offerFor(v);
        const out = this.offers ? !offer || offer.in_stock === false : !v || !v.available;
        input.closest('.pp-pill')?.classList.toggle('is-unavailable', out);
      });
    }

    // ---------- Quantity and Add to bag ----------
    bindQuantity(signal) {
      const input = this.querySelector('[data-pp-qty-input]');
      if (!input) return;
      this.querySelectorAll('[data-pp-qty]').forEach((b) =>
        b.addEventListener('click', () => {
          const n = Math.max(1, (parseInt(input.value, 10) || 1) + Number(b.dataset.ppQty));
          input.value = n;
        }, { signal })
      );
    }

    bindAdd(signal) {
      if (!this.form) return;
      const button = this.form.querySelector('[data-pp-add]');
      const sr = this.form.querySelector('[data-pp-add-sr]');
      const status = this.form.querySelector('[data-pp-status]');
      this.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!button || button.disabled) return;
        button.disabled = true;
        button.classList.add('is-loading');
        if (sr) sr.textContent = button.dataset.adding;
        if (status) status.textContent = '';
        try {
          const res = await fetch(`${this.dataset.cartAdd || '/cart/add'}.js`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new FormData(this.form),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.description || data.message || 'Could not add to bag.');
          button.classList.remove('is-loading');
          button.classList.add('is-added');
          if (sr) sr.textContent = button.dataset.added;
          if (typeof window.publish === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
            window.publish(window.PUB_SUB_EVENTS.cartUpdate, { source: 'perfume-product', productVariantId: data.variant_id });
          }
          document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
          setTimeout(() => document.dispatchEvent(new CustomEvent('perfume:cart-open', { detail: data })), 450);
          setTimeout(() => {
            button.classList.remove('is-added');
            button.disabled = false;
            if (sr) sr.textContent = button.dataset.label;
          }, 2200);
        } catch (error) {
          button.classList.remove('is-loading');
          button.disabled = false;
          if (sr) sr.textContent = button.dataset.label;
          if (status) status.textContent = error.message;
        }
      }, { signal });
    }
  }

  customElements.define('perfume-product', PerfumeProduct);
})();
